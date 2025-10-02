#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BalancedVideoSchwepeAnalyzer {
    constructor() {
        this.apiEndpoint = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
        this.apiToken = process.env.ANTHROPIC_AUTH_TOKEN;
        this.videosDir = path.join(__dirname, 'saved_videos');
        this.deletedDir = path.join(__dirname, 'deleted_media');

        this.stats = {
            total: 0,
            schwepe: 0,
            notSchwepe: 0,
            errors: 0,
            deleted: []
        };
    }

    async init() {
        console.log('🎬 BALANCED Video Schwepe Analyzer - Smart Detection');
        console.log('🔥 Analyzing videos with balanced Schwepe detection...\n');

        await fs.ensureDir(this.deletedDir);

        if (!this.apiToken) {
            throw new Error('ANTHROPIC_AUTH_TOKEN environment variable not found');
        }

        if (!await fs.pathExists(this.videosDir)) {
            throw new Error(`Videos directory not found: ${this.videosDir}`);
        }

        console.log(`📁 Videos directory: ✅ Found`);
    }

    async analyzeVideo(videoPath) {
        try {
            const fileName = path.basename(videoPath);
            console.log(`🎬 Analyzing: ${fileName}`);

            // Read and encode video
            const videoBuffer = await fs.readFile(videoPath);
            const base64Video = videoBuffer.toString('base64');
            const mimeType = `video/${path.extname(videoPath).substring(1).toLowerCase()}`;
            const videoData = `data:${mimeType};base64,${base64Video}`;

            // Create balanced analysis prompt
            const prompt = this.createBalancedAnalysisPrompt();

            // Call GLM-4.5V API with video
            const response = await axios.post(this.apiEndpoint, {
                model: 'glm-4.5v',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt
                            },
                            {
                                type: 'video_url',
                                video_url: {
                                    url: videoData
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.2
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            });

            const analysis = response.data.choices[0].message.content;
            const isSchwepe = this.interpretAnalysis(analysis);

            return {
                videoPath,
                isSchwepe,
                analysis,
                confidence: this.extractConfidence(analysis)
            };

        } catch (error) {
            console.error(`❌ Error analyzing video ${path.basename(videoPath)}:`, error.message);
            return {
                videoPath,
                isSchwepe: false,
                analysis: `Error: ${error.message}`,
                confidence: 0,
                error: true
            };
        }
    }

    createBalancedAnalysisPrompt() {
        return `You are analyzing videos for "Schwepe" meme token content using BALANCED, ACCURATE detection.

DEFINITE SCHWEPE CHARACTERISTICS (ANY of these = AUTOMATIC SCHWEPE):
🐸 **FROGS/AMPHIBIANS**: Any frog, toad, amphibian, frog-like characters = AUTOMATIC SCHWEPE
🕶️ **SHINY SHADES**: Any sunglasses, shades, cool eyewear = AUTOMATIC SCHWEPE
📝 **SCHWEPE TEXT**: "schwepe", "247420", "degen", "schweppay" text = AUTOMATIC SCHWEPE
🎨 **AI-GENERATED SCHWEPE CHARACTERS**: Any AI-generated or 3D-rendered Schwepe characters = AUTOMATIC SCHWEPE
🎭 **CHARACTER ART**: Any character art that resembles Schwepe (pink, humanoid, etc.) = AUTOMATIC SCHWEPE

STRONG SCHWEPE INDICATORS (ANY ONE of these = SCHWEPE):
🚀 **MEME PARODIES**: ANY recognizable character in meme format, parodies = SCHWEPE
💎 **CRYPTO/TRADING**: Any crypto, trading, stocks, finance themes = SCHWEPE
⚡ **MEME CULTURE**: Any internet meme, viral content, meme formats = SCHWEPE

CRITICAL SCHWEPE RULES:
1. ANY Schwepe characteristic = AUTOMATIC SCHWEPE ✅
2. ANY strong indicator = SCHWEPE ✅ (MEME PARODIES are key!)
3. Character parodies (Yoda, etc.) = SCHWEPE ✅
4. AI-generated/3D characters = SCHWEPE ✅
5. Pink humanoid characters = LIKELY SCHWEPE ✅
6. Meme formats = SCHWEPE ✅
7. When in doubt with character art = SCHWEPE ✅

SPECIFIC EXAMPLES:
- Pepe the Frog = AUTOMATIC SCHWEPE ✅
- Yoda as Schwepe = MEME PARODY = SCHWEPE ✅
- Trader memes = CRYPTO/TRADING = SCHWEPE ✅
- Any character parody = MEME PARODY = SCHWEPE ✅
- Timeline_1.mp4 (Pepe + sunglasses + crypto) = SCHWEPE ✅
- Generic person + no meme elements = NOT SCHWEPE ❌

RESPONSE FORMAT:
SCHWEPE_RELATED: [YES/NO]
CONFIDENCE: [1-10]
FROGS_OR_AMPHIBIANS: [YES/NO]
SHINY_SHADES: [YES/NO]
SCHWEPE_TEXT: [YES/NO]
MEME_INDICATORS: [YES/NO]
REASONING: [Explain clearly why this should or shouldn't be Schwepe]`;
    }

    interpretAnalysis(analysis) {
        const lines = analysis.split('\n');
        const schwepeLine = lines.find(line => line.toLowerCase().includes('schwepe_related'));

        if (!schwepeLine) return false;

        const value = schwepeLine.split(':')[1]?.trim().toUpperCase();
        return value === 'YES';
    }

    extractConfidence(analysis) {
        const lines = analysis.split('\n');
        const confidenceLine = lines.find(line => line.toLowerCase().includes('confidence'));

        if (!confidenceLine) return 5;

        const value = confidenceLine.split(':')[1]?.trim();
        return parseInt(value) || 5;
    }

    async processVideos() {
        console.log('🔄 Processing video files with balanced analysis...\n');

        const videoFiles = await this.getVideoFiles();

        if (videoFiles.length === 0) {
            console.log('📁 No video files found');
            return;
        }

        console.log(`📊 Found ${videoFiles.length} video files to analyze\n`);
        this.stats.total = videoFiles.length;

        // Process videos in batches to avoid API limits
        const batchSize = 2;
        for (let i = 0; i < videoFiles.length; i += batchSize) {
            const batch = videoFiles.slice(i, i + batchSize);

            console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(videoFiles.length/batchSize)}`);

            const results = await Promise.all(
                batch.map(videoPath => this.analyzeVideo(videoPath))
            );

            // Handle results
            for (const result of results) {
                this.handleAnalysisResult(result);
            }

            // Small delay between batches
            if (i + batchSize < videoFiles.length) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        this.printFinalStats();
    }

    handleAnalysisResult(result) {
        const fileName = path.basename(result.videoPath);

        if (result.error) {
            this.stats.errors++;
            console.log(`❌ 🎬 ${fileName} - Analysis failed`);
            return;
        }

        // Extract additional info from analysis
        const hasFrogs = this.checkForCharacteristic(result.analysis, 'FROGS_OR_AMPHIBIANS');
        const hasShinyShades = this.checkForCharacteristic(result.analysis, 'SHINY_SHADES');
        const hasSchwepeText = this.checkForCharacteristic(result.analysis, 'SCHWEPE_TEXT');
        const hasMemeIndicators = this.checkForCharacteristic(result.analysis, 'MEME_INDICATORS');

        if (result.isSchwepe) {
            this.stats.schwepe++;
            let message = `✅ 🎬 ${fileName} - SCHWEPE (confidence: ${result.confidence}/10)`;
            const attributes = [];
            if (hasFrogs) attributes.push('🐸 FROGS');
            if (hasShinyShades) attributes.push('🕶️ SHINY SHADES');
            if (hasSchwepeText) attributes.push('📝 SCHWEPE TEXT');
            if (hasMemeIndicators) attributes.push('😂 MEME');
            if (attributes.length > 0) {
                message += ` [${attributes.join(', ')}]`;
            }
            console.log(message);
        } else {
            this.stats.notSchwepe++;
            console.log(`🗑️  🎬 ${fileName} - NOT SCHWEPE (confidence: ${result.confidence}/10)`);

            // Move non-Schwepe videos to deleted folder
            this.moveNonSchwepeVideo(result.videoPath, fileName, result.analysis);
        }
    }

    checkForCharacteristic(analysis, characteristic) {
        const lines = analysis.split('\n');
        const line = lines.find(line => line.toLowerCase().includes(characteristic.toLowerCase()));
        return line && line.split(':')[1]?.trim().toUpperCase() === 'YES';
    }

    async moveNonSchwepeVideo(videoPath, fileName, analysis) {
        try {
            // Move to deleted directory
            const deletedPath = path.join(this.deletedDir, fileName);
            await fs.move(videoPath, deletedPath);

            this.stats.deleted.push(fileName);

            // Save analysis reason
            const analysisFile = path.join(this.deletedDir, `${fileName}.analysis.txt`);
            await fs.writeFile(analysisFile, `Deleted reason:\n${analysis}`);

            console.log(`   📁 Moved to deleted_media/`);

        } catch (error) {
            console.error(`   ❌ Failed to move ${fileName}:`, error.message);
        }
    }

    async getVideoFiles() {
        const files = await fs.readdir(this.videosDir);
        return files
            .filter(file => /\.(mp4|avi|mov|mkv|webm|flv|wmv|m4v|3gp|gif)$/i.test(file))
            .map(file => path.join(this.videosDir, file))
            .sort();
    }

    printFinalStats() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 BALANCED VIDEO SCHWEPE ANALYSIS COMPLETE');
        console.log('='.repeat(70));
        console.log(`Total videos analyzed: ${this.stats.total}`);
        console.log(`✅ Schwepe-related: ${this.stats.schwepe}`);
        console.log(`🗑️  Not Schwepe (deleted): ${this.stats.notSchwepe}`);
        console.log(`❌ Analysis errors: ${this.stats.errors}`);

        if (this.stats.deleted.length > 0) {
            console.log('\n🗑️  DELETED VIDEOS:');
            this.stats.deleted.slice(-10).forEach(file => {
                console.log(`   🎬 ${file}`);
            });
            if (this.stats.deleted.length > 10) {
                console.log(`   ... and ${this.stats.deleted.length - 10} more`);
            }
        }

        console.log(`\n📁 Deleted videos moved to: ${this.deletedDir}`);
        console.log(`🎯 Schwepe retention rate: ${((this.stats.schwepe / this.stats.total) * 100).toFixed(1)}%`);
        console.log('='.repeat(70));
    }

    async run() {
        try {
            await this.init();
            await this.processVideos();
        } catch (error) {
            console.error('💥 Fatal error:', error.message);
            process.exit(1);
        }
    }
}

// Run the analyzer
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new BalancedVideoSchwepeAnalyzer();
    analyzer.run().catch(console.error);
}

export default BalancedVideoSchwepeAnalyzer;