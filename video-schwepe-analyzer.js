#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VideoSchwepeAnalyzer {
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
        console.log('🎬 Video Schwepe Analyzer - Processing Videos Only');
        console.log('🔥 Analyzing videos for Schwepe-related content...\n');

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

            // Get video metadata
            const fileSize = (await fs.stat(videoPath)).size;
            const extension = path.extname(videoPath);

            // Enhanced analysis prompt for videos
            const prompt = `You are analyzing video files for "Schwepe" meme token content. Based on the filename and metadata, determine if this video is likely Schwepe-related.

VIDEO INFORMATION:
- Filename: ${fileName}
- File Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB
- Format: ${extension}

SCHWEPE VIDEO CHARACTERISTICS (ANY ONE = SCHWEPE):
- **FROGS/AMPHIBIANS**: Any frog, toad, or amphibian references = AUTOMATIC Schwepe
- **SCHWEPE BRANDING**: "schwepe", "247420", "degen" in filename = AUTOMATIC Schwepe
- **SHINY SHADES**: References to sunglasses, shades, cool glasses = AUTOMATIC Schwepe
- **MEME CULTURE**: "meme", "funny", "based", "chad", "vibes" = Schwepe
- **CRYPTO/THEME**: "moon", "rocket", "diamond", "hands", "hodl", "ape" = Schwepe
- **CHAOTIC ENERGY**: "degen", "chaos", "wild", "crazy", "energy" = Schwepe

ANALYSIS FOCUS:
1. **ANY Schwepe characteristic = SCHWEPE_RELATED: YES**
2. Look for Schwepe-related keywords in filename
3. Consider lateral meme relationships - crypto meme ecosystem content qualifies
4. If it fits the meme/chaotic/degen culture, it's Schwepe

RESPONSE FORMAT:
SCHWEPE_RELATED: [YES/NO/MAYBE]
CONFIDENCE: [1-10]
SCHWEPE_KEYWORDS: [YES/NO]
MEME_VIBES: [YES/NO]
FILENAME_ANALYSIS: [List specific Schwepe keywords found in filename]
REASONING: [Explain why this video is or isn't Schwepe-related. Remember: ANY Schwepe characteristic = automatic YES]`;

            // Call GLM-4.5V API
            const response = await axios.post(this.apiEndpoint, {
                model: 'glm-4.5v',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt
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
                timeout: 30000
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

    interpretAnalysis(analysis) {
        const lines = analysis.split('\n');
        const schwepeLine = lines.find(line => line.toLowerCase().includes('schwepe_related'));
        const keywordsLine = lines.find(line => line.toLowerCase().includes('schwepe_keywords'));
        const memeVibesLine = lines.find(line => line.toLowerCase().includes('meme_vibes'));

        // Check for ANY Schwepe characteristics
        const hasKeywords = keywordsLine && keywordsLine.split(':')[1]?.trim().toUpperCase() === 'YES';
        const hasMemeVibes = memeVibesLine && memeVibesLine.split(':')[1]?.trim().toUpperCase() === 'YES';

        // **ANY Schwepe characteristic = automatic Schwepe**
        if (hasKeywords || hasMemeVibes) {
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
        console.log('🔄 Processing video files...\n');

        const videoFiles = await this.getVideoFiles();

        if (videoFiles.length === 0) {
            console.log('📁 No video files found');
            return;
        }

        console.log(`📊 Found ${videoFiles.length} video files to analyze\n`);
        this.stats.total = videoFiles.length;

        // Process in smaller batches for videos
        const batchSize = 5;
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
                await new Promise(resolve => setTimeout(resolve, 2000));
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

        // Check for specific Schwepe characteristics
        const hasKeywords = this.checkForCharacteristic(result.analysis, 'SCHWEPE_KEYWORDS');
        const hasMemeVibes = this.checkForCharacteristic(result.analysis, 'MEME_VIBES');

        if (result.isSchwepe) {
            this.stats.schwepe++;
            let message = `✅ 🎬 ${fileName} - SCHWEPE (confidence: ${result.confidence}/10)`;
            const attributes = [];
            if (hasKeywords) attributes.push('🔑 KEYWORDS');
            if (hasMemeVibes) attributes.push('😂 MEME VIBES');
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
        console.log('📊 VIDEO SCHWEPE ANALYSIS COMPLETE');
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
    const analyzer = new VideoSchwepeAnalyzer();
    analyzer.run().catch(console.error);
}

export default VideoSchwepeAnalyzer;