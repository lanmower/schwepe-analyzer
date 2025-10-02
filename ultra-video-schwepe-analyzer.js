#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UltraVideoSchwepeAnalyzer {
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
        console.log('🎬 ULTRA Video Schwepe Analyzer - Maximum Inclusive Detection');
        console.log('🔥 Analyzing videos with ULTRA-inclusive Schwepe detection...\n');

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

            // Create ULTRA-inclusive analysis prompt
            const prompt = this.createUltraAnalysisPrompt();

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
                temperature: 0.1
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

    createUltraAnalysisPrompt() {
        return `You are analyzing videos for "Schwepe" meme token content using ULTRA-MAXIMUM INCLUSIVE detection.

CRITICAL SCHWEPE CHARACTERISTICS (ANY OF THESE = 100% AUTOMATIC SCHWEPE):
🐸 **FROGS/AMPHIBIANS**: ANY frog, toad, amphibian, frog-like characters, green characters = AUTOMATIC SCHWEPE
🕶️ **SHINY SHADES**: ANY sunglasses, shades, glasses, cool eyewear, reflective lenses = AUTOMATIC SCHWEPE
📝 **SCHWEPE TEXT**: ANY "schwepe", "247420", "degen", "schweppay" text = AUTOMATIC SCHWEPE
🚀 **MEME FORMAT**: ANY parody, meme template, internet culture reference = AUTOMATIC SCHWEPE
💎 **CRYPTO THEME**: ANY crypto, trading, meme coin elements = AUTOMATIC SCHWEPE
⚡ **ENERGY/VIBES**: ANY chaotic, energetic, funny, meme content = AUTOMATIC SCHWEPE

ULTRA-MAXIMUM INCLUSIVITY RULES:
1. If you see ANY characters that could be frog-like = SCHWEPE
2. If you see ANY eyewear/sunglasses = SCHWEPE
3. If you see ANY meme format or parody = SCHWEPE
4. If you see ANY crypto/trading elements = SCHWEPE
5. If you see ANY chaotic/funny content = SCHWEPE
6. If there's ANY doubt WHATSOEVER = SCHWEPE
7. WHEN IN DOUBT, ALWAYS SAY SCHWEPE
8. BE MAXIMUM INCLUSIVE - This is for meme content!

SPECIFIC EXAMPLES THAT MUST BE SCHWEPE:
- Pepe the Frog = AUTOMATIC SCHWEPE
- Any character with sunglasses = AUTOMATIC SCHWEPE
- SpongeBob parodies = AUTOMATIC SCHWEPE
- Videos with "[247 420]" text = AUTOMATIC SCHWEPE
- "SCHWEPPAY" text = AUTOMATIC SCHWEPE

RESPONSE FORMAT:
SCHWEPE_RELATED: [YES/NO]
CONFIDENCE: [1-10]
FROGS_OR_AMPHIBIANS: [YES/NO]
SHINY_SHADES: [YES/NO]
MEME_FORMAT: [YES/NO]
CRYPTO_ELEMENTS: [YES/NO]
ENERGY_VIBES: [YES/NO]
REASONING: [Explain why this MUST be considered Schwepe. Be very specific.]`;
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
        console.log('🔄 Processing video files with ULTRA-inclusive analysis...\n');

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
        const hasMemeFormat = this.checkForCharacteristic(result.analysis, 'MEME_FORMAT');
        const hasCryptoElements = this.checkForCharacteristic(result.analysis, 'CRYPTO_ELEMENTS');
        const hasEnergyVibes = this.checkForCharacteristic(result.analysis, 'ENERGY_VIBES');

        if (result.isSchwepe) {
            this.stats.schwepe++;
            let message = `✅ 🎬 ${fileName} - SCHWEPE (confidence: ${result.confidence}/10)`;
            const attributes = [];
            if (hasFrogs) attributes.push('🐸 FROGS');
            if (hasShinyShades) attributes.push('🕶️ SHINY SHADES');
            if (hasMemeFormat) attributes.push('😂 MEME');
            if (hasCryptoElements) attributes.push('💎 CRYPTO');
            if (hasEnergyVibes) attributes.push('⚡ ENERGY');
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
        console.log('\n' + '='.repeat(80));
        console.log('📊 ULTRA VIDEO SCHWEPE ANALYSIS COMPLETE');
        console.log('='.repeat(80));
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
        console.log('='.repeat(80));
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
    const analyzer = new UltraVideoSchwepeAnalyzer();
    analyzer.run().catch(console.error);
}

export default UltraVideoSchwepeAnalyzer;