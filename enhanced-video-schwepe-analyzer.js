#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

class EnhancedVideoSchwepeAnalyzer {
    constructor() {
        this.apiEndpoint = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
        this.apiToken = process.env.ANTHROPIC_AUTH_TOKEN;
        this.videosDir = path.join(__dirname, 'saved_videos');
        this.deletedDir = path.join(__dirname, 'deleted_media');
        this.tempFramesDir = path.join(__dirname, 'temp_frames');

        this.stats = {
            total: 0,
            schwepe: 0,
            notSchwepe: 0,
            errors: 0,
            deleted: []
        };
    }

    async init() {
        console.log('🎬 Enhanced Video Schwepe Analyzer - Visual Content Analysis');
        console.log('🔥 Analyzing video frames for Schwepe-related content...\n');

        await fs.ensureDir(this.deletedDir);
        await fs.ensureDir(this.tempFramesDir);

        if (!this.apiToken) {
            throw new Error('ANTHROPIC_AUTH_TOKEN environment variable not found');
        }

        if (!await fs.pathExists(this.videosDir)) {
            throw new Error(`Videos directory not found: ${this.videosDir}`);
        }

        console.log(`📁 Videos directory: ✅ Found`);
        console.log(`📁 Temp frames directory: ✅ Created`);
    }

    async extractFrames(videoPath, maxFrames = 3) {
        try {
            const fileName = path.basename(videoPath, path.extname(videoPath));
            const framePattern = path.join(this.tempFramesDir, `${fileName}_frame_%03d.jpg`);

            // Extract frames evenly throughout the video
            const command = `ffmpeg -i "${videoPath}" -vf "select=not(mod(n\\,${Math.floor(30/maxFrames)}))" -vsync vfr -frames:v ${maxFrames} -q:v 2 "${framePattern}" -y 2>/dev/null`;

            await execAsync(command);

            // Get the extracted frame files
            const frameFiles = await fs.readdir(this.tempFramesDir);
            const videoFrames = frameFiles
                .filter(file => file.includes(fileName) && file.includes('_frame_'))
                .slice(0, maxFrames)
                .map(file => path.join(this.tempFramesDir, file))
                .sort();

            return videoFrames;
        } catch (error) {
            console.error(`❌ Error extracting frames from ${path.basename(videoPath)}:`, error.message);
            return [];
        }
    }

    async cleanupFrames(frames) {
        for (const frame of frames) {
            try {
                await fs.remove(frame);
            } catch (error) {
                console.warn(`⚠️  Could not clean up frame ${frame}:`, error.message);
            }
        }
    }

    async analyzeVideoFrames(videoPath) {
        try {
            const fileName = path.basename(videoPath);
            console.log(`🎬 Analyzing: ${fileName}`);

            // Extract frames from video
            const frames = await this.extractFrames(videoPath);

            if (frames.length === 0) {
                throw new Error('No frames could be extracted');
            }

            console.log(`   📸 Extracted ${frames.length} frames for analysis`);

            // Analyze each frame
            const frameAnalyses = [];
            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];
                console.log(`   🔍 Analyzing frame ${i + 1}/${frames.length}`);

                const analysis = await this.analyzeFrame(frame, fileName, i + 1);
                frameAnalyses.push(analysis);

                // Small delay between API calls
                if (i < frames.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // Combine analyses to determine if video is Schwepe-related
            const combinedResult = this.combineFrameAnalyses(frameAnalyses, fileName);

            // Cleanup extracted frames
            await this.cleanupFrames(frames);

            return combinedResult;

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

    async analyzeFrame(framePath, videoFileName, frameNumber) {
        try {
            // Read and encode frame
            const frameBuffer = await fs.readFile(framePath);
            const base64Frame = frameBuffer.toString('base64');
            const frameData = `data:image/jpeg;base64,${base64Frame}`;

            // Create analysis prompt (same as image analyzer)
            const prompt = this.createAnalysisPrompt();

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
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: frameData
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
                timeout: 30000
            });

            const analysis = response.data.choices[0].message.content;
            const isSchwepe = this.interpretAnalysis(analysis);

            return {
                frameNumber,
                isSchwepe,
                analysis,
                confidence: this.extractConfidence(analysis)
            };

        } catch (error) {
            console.error(`❌ Error analyzing frame ${frameNumber}:`, error.message);
            return {
                frameNumber,
                isSchwepe: false,
                analysis: `Error: ${error.message}`,
                confidence: 0,
                error: true
            };
        }
    }

    createAnalysisPrompt() {
        return `You are analyzing video frames for "Schwepe" meme token content. Schwepe is a crypto meme token with these specific characteristics:

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
- EVEN IF the image has no other Schwepe elements, shiny shades = automatic Schwepe relationship

ANALYSIS REQUIREMENTS:
1. Identify if this video frame is Schwepe-related (directly or laterally as a meme)
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

    combineFrameAnalyses(frameAnalyses, videoFileName) {
        if (frameAnalyses.length === 0) {
            return {
                videoPath: path.join(this.videosDir, videoFileName),
                isSchwepe: false,
                analysis: 'No frames analyzed',
                confidence: 0,
                error: true
            };
        }

        // If ANY frame is Schwepe-related, the video is considered Schwepe
        const schwepeFrames = frameAnalyses.filter(f => f.isSchwepe);
        const isSchwepe = schwepeFrames.length > 0;

        // Calculate average confidence
        const avgConfidence = Math.round(
            frameAnalyses.reduce((sum, f) => sum + f.confidence, 0) / frameAnalyses.length
        );

        // Combine reasoning from all frames
        const combinedReasoning = frameAnalyses.map(f =>
            `Frame ${f.frameNumber}: ${f.analysis.split('REASONING:')[1]?.trim() || f.analysis}`
        ).join('\n\n');

        return {
            videoPath: path.join(this.videosDir, videoFileName),
            isSchwepe,
            analysis: combinedReasoning,
            confidence: avgConfidence,
            schwepeFrames: schwepeFrames.length,
            totalFrames: frameAnalyses.length
        };
    }

    async processVideos() {
        console.log('🔄 Processing video files with visual analysis...\n');

        const videoFiles = await this.getVideoFiles();

        if (videoFiles.length === 0) {
            console.log('📁 No video files found');
            return;
        }

        console.log(`📊 Found ${videoFiles.length} video files to analyze\n`);
        this.stats.total = videoFiles.length;

        // Process videos one at a time due to frame extraction
        for (let i = 0; i < videoFiles.length; i++) {
            const videoPath = videoFiles[i];
            console.log(`\n🔄 Processing video ${i + 1}/${videoFiles.length}`);

            const result = await this.analyzeVideoFrames(videoPath);
            this.handleAnalysisResult(result);

            // Small delay between videos
            if (i < videoFiles.length - 1) {
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

        if (result.isSchwepe) {
            this.stats.schwepe++;
            let message = `✅ 🎬 ${fileName} - SCHWEPE (confidence: ${result.confidence}/10)`;
            if (result.schwepeFrames) {
                message += ` [${result.schwepeFrames}/${result.totalFrames} frames detected]`;
            }
            console.log(message);
        } else {
            this.stats.notSchwepe++;
            console.log(`🗑️  🎬 ${fileName} - NOT SCHWEPE (confidence: ${result.confidence}/10)`);

            // Move non-Schwepe videos to deleted folder
            this.moveNonSchwepeVideo(result.videoPath, fileName, result.analysis);
        }
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
        console.log('📊 ENHANCED VIDEO SCHWEPE ANALYSIS COMPLETE');
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
    const analyzer = new EnhancedVideoSchwepeAnalyzer();
    analyzer.run().catch(console.error);
}

export default EnhancedVideoSchwepeAnalyzer;