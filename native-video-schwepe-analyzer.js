#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NativeVideoSchwepeAnalyzer {
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
        console.log('🎬 Native Video Schwepe Analyzer - Direct Video Analysis');
        console.log('🔥 Analyzing videos directly for Schwepe-related content...\n');

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

            // Create analysis prompt
            const prompt = this.createAnalysisPrompt();

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
                max_tokens: 500,
                temperature: 0.3
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

    createAnalysisPrompt() {
        return `You are analyzing video files for "Schwepe" meme token content. Schwepe is a crypto meme token with these specific characteristics:

CORE VISUAL ELEMENTS:
- Colors: Dark gradients (#2c3e50, #34495e), bright accents (#667eea, #764ba2, #ff006e, #8338ec, #3a86ff, #f093fb), glowing neon (#00ff88, #ff4757)
- Key Emojis: 🚀💎🐸🔥⚡🎲🌙🎯🎪🦍📈🐂🐻 (especially 🐸 frogs)
- Crypto/Trading: 💰📊💪🤝🃏💊📝👁️⛓️🌐

THEMATIC ELEMENTS:
- "247420 energy" and "maximum degeneracy" vibes
- Crypto trading, meme coins, degen culture
- Frogs, pepe-style imagery, amphibians
- Moon missions, rockets, diamond hands
- Chaotic, energetic, meme-style visuals

TEXT ELEMENTS:
- Words: "schwepe", "247420", "degen", "ape", "strong hands", "diamond hands", "hodl", "to the moon"
- Crypto slang: WAGMI, NGMI, gm, gn, stonks, tendies

CRITICAL: SHINY SHADES ATTRIBUTE
- **SHINY SHADES ARE A KEY SCHWEPE ATTRIBUTE**
- Any character/person wearing shiny/reflective sunglasses, cool shades, or stylish glasses is considered a "secret Schwepe"
- This includes: dark sunglasses, reflective eyewear, laser eyes, glowing eyes, neon glasses, futuristic glasses, matrix-style glasses
- The shiny shades transformation makes someone part of the Schwepe meme ecosystem
- EVEN IF the video has no other Schwepe elements, shiny shades = automatic Schwepe relationship

ANALYSIS REQUIREMENTS:
1. Identify if this video is Schwepe-related (directly or laterally as a meme)
2. **PRIORITIZE shiny shades detection - if present, automatically SCHWEPE_RELATED: YES**
3. Rate confidence (1-10)
4. Explain reasoning, specifically mention if shiny shades are present
5. Consider lateral meme relationships - even if not explicitly "Schwepe", does it fit the degen crypto meme ecosystem?

RESPONSE FORMAT:
SCHWEPE_RELATED: [YES/NO/MAYBE]
CONFIDENCE: [1-10]
SHINY_SHADES: [YES/NO]
REASONING: [Detailed explanation of visual elements, themes, and meme relevance. If shiny shades are present, emphasize this as the key factor]`;
    }

    interpretAnalysis(analysis) {
        const lines = analysis.split('\n');
        const schwepeLine = lines.find(line => line.toLowerCase().includes('schwepe_related'));
        const shinyShadesLine = lines.find(line => line.toLowerCase().includes('shiny_shades'));

        // If shiny shades are detected, automatically mark as Schwepe
        if (shinyShadesLine && shinyShadesLine.split(':')[1]?.trim().toUpperCase() === 'YES') {
            return true;
        }

        if (!schwepeLine) return false;

        const value = schwepeLine.split(':')[1]?.trim().toUpperCase();
        return value === 'YES' || value === 'MAYBE';
    }

    extractConfidence(analysis) {
        const lines = analysis.split('\n');
        const confidenceLine = lines.find(line => line.toLowerCase().includes('confidence'));

        if (!confidenceLine) return 5;

        const value = confidenceLine.split(':')[1]?.trim();
        return parseInt(value) || 5;
    }

    async processVideos() {
        console.log('🔄 Processing video files with native video analysis...\n');

        const videoFiles = await this.getVideoFiles();

        if (videoFiles.length === 0) {
            console.log('📁 No video files found');
            return;
        }

        console.log(`📊 Found ${videoFiles.length} video files to analyze\n`);
        this.stats.total = videoFiles.length;

        // Process videos in batches to avoid API limits
        const batchSize = 3;
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

        // Check if shiny shades were detected
        const hasShinyShades = this.checkForShinyShades(result.analysis);

        if (result.isSchwepe) {
            this.stats.schwepe++;
            let message = `✅ 🎬 ${fileName} - SCHWEPE (confidence: ${result.confidence}/10)`;
            if (hasShinyShades) {
                message += ` 🕶️ SHINY SHADES`;
            }
            console.log(message);
        } else {
            this.stats.notSchwepe++;
            console.log(`🗑️  🎬 ${fileName} - NOT SCHWEPE (confidence: ${result.confidence}/10)`);

            // Move non-Schwepe videos to deleted folder
            this.moveNonSchwepeVideo(result.videoPath, fileName, result.analysis);
        }
    }

    checkForShinyShades(analysis) {
        const lines = analysis.split('\n');
        const shinyShadesLine = lines.find(line => line.toLowerCase().includes('shiny_shades'));
        return shinyShadesLine && shinyShadesLine.split(':')[1]?.trim().toUpperCase() === 'YES';
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
        console.log('📊 NATIVE VIDEO SCHWEPE ANALYSIS COMPLETE');
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
    const analyzer = new NativeVideoSchwepeAnalyzer();
    analyzer.run().catch(console.error);
}

export default NativeVideoSchwepeAnalyzer;