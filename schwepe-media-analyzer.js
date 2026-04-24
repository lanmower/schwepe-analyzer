#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SchwepeMediaAnalyzer {
    constructor() {
        this.apiEndpoint = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
        this.apiToken = process.env.ANTHROPIC_AUTH_TOKEN;
        this.imagesDir = path.join(__dirname, 'saved_images');
        this.videosDir = path.join(__dirname, 'saved_videos');
        this.deletedDir = path.join(__dirname, 'deleted_media');

        // Schwepe-specific criteria based on website analysis
        this.schwepeCriteria = {
            // Core visual elements
            primaryColors: ['#2c3e50', '#34495e', '#667eea', '#764ba2', '#ff006e', '#8338ec', '#3a86ff', '#f093fb'],
            accentColors: ['#00ff88', '#ff4757'],

            // Key emojis and symbols
            keyEmojis: ['🚀', '💎', '🐸', '🔥', '⚡', '🎲', '🌙', '🎯', '🎪', '🦍', '📈', '🐂', '🐻'],
            cryptoEmojis: ['💰', '📊', '💪', '🤝', '🃏', '💊', '📝', '👁️', '⛓️', '🌐'],
            animalEmojis: ['🐸', '🦍', '🏊‍♂️', '🐋', '🐬', '🦐'],

            // Theme indicators
            themes: [
                'degen', 'degeneracy', '247420', 'schwepe', 'meme token', 'crypto',
                'frog', 'pepe', 'toad', 'amphibian', 'maximum degeneracy',
                'moon', 'rocket', 'diamond', 'hands', 'tendies'
            ],

            // Visual styles
            visualStyles: [
                'dark gradient', 'glowing effects', 'neon', 'animated background',
                'chaotic', 'meme format', 'crypto chart', 'price action',
                'trading', 'stonks', 'bull market', 'bear market'
            ],

            // Text/typography elements
            textElements: [
                'schwepe', '247420', 'degen', 'ape', 'strong hands', 'diamond hands',
                'hodl', 'to the moon', 'WAGMI', 'NGMI', 'gm', 'gn'
            ],

            // Shiny shades - key attribute that makes someone a secret Schwepe
            shinyShades: [
                'sunglasses', 'shades', 'cool glasses', 'reflective sunglasses',
                'dark sunglasses', 'black sunglasses', 'stylish glasses',
                'laser eyes', 'glowing eyes', 'neon glasses', 'futuristic glasses',
                'matrix glasses', 'cyberpunk glasses', ' reflective eyewear'
            ]
        };

        this.stats = {
            total: 0,
            schwepe: 0,
            notSchwepe: 0,
            errors: 0,
            deleted: [],
            imagesProcessed: 0,
            videosProcessed: 0
        };
    }

    async init() {
        console.log('🐸🎬 Schwepe Media Analyzer v2.0 (Images + Videos)');
        console.log('🔥 Analyzing media for Schwepe-related content...\n');

        // Ensure directories exist
        await fs.ensureDir(this.deletedDir);

        if (!this.apiToken) {
            throw new Error('ANTHROPIC_AUTH_TOKEN environment variable not found');
        }

        // Check if directories exist
        const imagesExist = await fs.pathExists(this.imagesDir);
        const videosExist = await fs.pathExists(this.videosDir);

        if (!imagesExist && !videosExist) {
            throw new Error(`No media directories found: ${this.imagesDir} or ${this.videosDir}`);
        }

        console.log(`📁 Images directory: ${imagesExist ? '✅ Found' : '❌ Not found'}`);
        console.log(`🎬 Videos directory: ${videosExist ? '✅ Found' : '❌ Not found'}`);
    }

    async analyzeImage(imagePath) {
        try {
            console.log(`🖼️  Analyzing image: ${path.basename(imagePath)}`);

            // Read and encode image
            const imageBuffer = await fs.readFile(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = `image/${path.extname(imagePath).substring(1).toLowerCase()}`;
            const imageData = `data:${mimeType};base64,${base64Image}`;

            // Create analysis prompt
            const prompt = this.createImageAnalysisPrompt();

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
                                    url: imageData
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
                mediaPath: imagePath,
                mediaType: 'image',
                isSchwepe,
                analysis,
                confidence: this.extractConfidence(analysis)
            };

        } catch (error) {
            console.error(`❌ Error analyzing image ${path.basename(imagePath)}:`, error.message);
            return {
                mediaPath: imagePath,
                mediaType: 'image',
                isSchwepe: false,
                analysis: `Error: ${error.message}`,
                confidence: 0,
                error: true
            };
        }
    }

    async analyzeVideo(videoPath) {
        try {
            console.log(`🎬 Analyzing video: ${path.basename(videoPath)}`);

            // For video analysis, we analyze the filename and metadata since GLM-4.5V doesn't directly process video
            const fileName = path.basename(videoPath);
            const fileSize = (await fs.stat(videoPath)).size;
            const extension = path.extname(videoPath);

            // Create text-based analysis prompt for video
            const prompt = this.createVideoAnalysisPrompt(fileName, fileSize, extension);

            // Call GLM-4.5V API for text analysis
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
                mediaPath: videoPath,
                mediaType: 'video',
                isSchwepe,
                analysis,
                confidence: this.extractConfidence(analysis)
            };

        } catch (error) {
            console.error(`❌ Error analyzing video ${path.basename(videoPath)}:`, error.message);
            return {
                mediaPath: videoPath,
                mediaType: 'video',
                isSchwepe: false,
                analysis: `Error: ${error.message}`,
                confidence: 0,
                error: true
            };
        }
    }

    createImageAnalysisPrompt() {
        return `You are analyzing images for "Schwepe" meme token content. Schwepe is a crypto meme token with these specific characteristics:

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

SCHWEPE ATTRIBUTES (ANY ONE = SCHWEPE):
- **FROGS/AMPHIBIANS**: Any frog, toad, or amphibian character = AUTOMATIC Schwepe
- **SHINY SHADES**: Characters wearing sunglasses/reflective eyewear = AUTOMATIC Schwepe
- **SCHWEPE BRANDING**: "schwepe", "247420" text = AUTOMATIC Schwepe
- **MEME CULTURE**: Degen vibes, chaotic energy, meme formats = Schwepe
- **AESTHETIC**: Dark themes, neon colors, crypto culture themes = Schwepe
- **TEXT ELEMENTS**: "degen", "ape", "hodl", "tendies" = Schwepe

ANALYSIS REQUIREMENTS:
1. **ANY Schwepe characteristic = SCHWEPE_RELATED: YES**
2. Frogs are the core Schwepe identity - any frog = automatic Schwepe
3. Shiny shades are a key attribute = automatic Schwepe
4. Schwepe text/branding = automatic Schwepe
5. Rate confidence (1-10) based on strength and number of Schwepe elements
6. Consider lateral meme relationships - if it fits the meme ecosystem, it's Schwepe

RESPONSE FORMAT:
SCHWEPE_RELATED: [YES/NO/MAYBE]
CONFIDENCE: [1-10]
FROG_PRESENT: [YES/NO]
SHINY_SHADES: [YES/NO]
SCHWEPE_TEXT: [YES/NO]
MEME_VIBES: [YES/NO]
REASONING: [List all Schwepe attributes found. Remember: ANY Schwepe characteristic = automatic SCHWEPE_RELATED: YES. Frogs are core identity, shiny shades are key attribute.]`;
    }

    createVideoAnalysisPrompt(fileName, fileSize, extension) {
        return `You are analyzing video files for "Schwepe" meme token content. Based on the filename and metadata, determine if this video is likely Schwepe-related.

VIDEO INFORMATION:
- Filename: ${fileName}
- File Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB
- Format: ${extension}

SCHWEPE VIDEO CHARACTERISTICS:
- Names often contain: "schwepe", "247420", "degen", "ape", "frog", "pepe", "toad"
- Crypto themes: "moon", "rocket", "diamond", "hands", "hodl", "stonks"
- Meme-related terms: "meme", "funny", "based", "chad", "based"
- Visual elements from Schwepe aesthetic: dark themes, neon, crypto culture

ANALYSIS FOCUS:
1. Filename analysis - look for Schwepe-related keywords
2. Context clues - does this fit the degen crypto meme ecosystem?
3. Lateral meme relationships - even if not explicitly "Schwepe", is it related to the broader crypto meme culture?

RESPONSE FORMAT:
SCHWEPE_RELATED: [YES/NO/MAYBE]
CONFIDENCE: [1-10]
FILENAME_ANALYSIS: [Analysis of the filename and what it suggests]
REASONING: [Detailed explanation of why this video is or isn't Schwepe-related]`;
    }

    interpretAnalysis(analysis) {
        const lines = analysis.split('\n');
        const schwepeLine = lines.find(line => line.toLowerCase().includes('schwepe_related'));
        const frogLine = lines.find(line => line.toLowerCase().includes('frog_present'));
        const shinyShadesLine = lines.find(line => line.toLowerCase().includes('shiny_shades'));
        const schwepeTextLine = lines.find(line => line.toLowerCase().includes('schwepe_text'));
        const memeVibesLine = lines.find(line => line.toLowerCase().includes('meme_vibes'));

        // Check for ANY Schwepe characteristics
        const hasFrog = frogLine && frogLine.split(':')[1]?.trim().toUpperCase() === 'YES';
        const hasShinyShades = shinyShadesLine && shinyShadesLine.split(':')[1]?.trim().toUpperCase() === 'YES';
        const hasSchwepeText = schwepeTextLine && schwepeTextLine.split(':')[1]?.trim().toUpperCase() === 'YES';
        const hasMemeVibes = memeVibesLine && memeVibesLine.split(':')[1]?.trim().toUpperCase() === 'YES';

        // **ANY Schwepe characteristic = automatic Schwepe**
        if (hasFrog || hasShinyShades || hasSchwepeText || hasMemeVibes) {
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

    async processAllMedia() {
        console.log('🔄 Processing all media files...\n');

        // Get all image and video files
        const imageFiles = await this.getImageFiles();
        const videoFiles = await this.getVideoFiles();

        const allFiles = [
            ...imageFiles.map(file => ({ path: file, type: 'image' })),
            ...videoFiles.map(file => ({ path: file, type: 'video' }))
        ];

        if (allFiles.length === 0) {
            console.log('📁 No media files found');
            return;
        }

        console.log(`📊 Found ${allFiles.length} media files to analyze`);
        console.log(`   🖼️  Images: ${imageFiles.length}`);
        console.log(`   🎬 Videos: ${videoFiles.length}\n`);

        this.stats.total = allFiles.length;

        // Process in batches
        const batchSize = 3; // Smaller batch for videos
        for (let i = 0; i < allFiles.length; i += batchSize) {
            const batch = allFiles.slice(i, i + batchSize);

            console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allFiles.length/batchSize)}`);

            const results = await Promise.all(
                batch.map(async (file) => {
                    if (file.type === 'image') {
                        this.stats.imagesProcessed++;
                        return await this.analyzeImage(file.path);
                    } else {
                        this.stats.videosProcessed++;
                        return await this.analyzeVideo(file.path);
                    }
                })
            );

            // Handle results
            for (const result of results) {
                this.handleAnalysisResult(result);
            }

            // Small delay between batches
            if (i + batchSize < allFiles.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        this.printFinalStats();
    }

    handleAnalysisResult(result) {
        const fileName = path.basename(result.mediaPath);
        const icon = result.mediaType === 'video' ? '🎬' : '🖼️';

        if (result.error) {
            this.stats.errors++;
            console.log(`❌ ${icon} ${fileName} - Analysis failed`);
            return;
        }

        // Check for specific Schwepe characteristics (for images)
        const hasFrog = result.mediaType === 'image' && this.checkForCharacteristic(result.analysis, 'FROG_PRESENT');
        const hasShinyShades = result.mediaType === 'image' && this.checkForCharacteristic(result.analysis, 'SHINY_SHADES');
        const hasSchwepeText = result.mediaType === 'image' && this.checkForCharacteristic(result.analysis, 'SCHWEPE_TEXT');
        const hasMemeVibes = result.mediaType === 'image' && this.checkForCharacteristic(result.analysis, 'MEME_VIBES');

        if (result.isSchwepe) {
            this.stats.schwepe++;
            let message = `✅ ${icon} ${fileName} - SCHWEPE (confidence: ${result.confidence}/10)`;
            const attributes = [];
            if (hasFrog) attributes.push('🐸 FROG');
            if (hasShinyShades) attributes.push('🕶️ SHINY SHADES');
            if (hasSchwepeText) attributes.push('📝 SCHWEPE TEXT');
            if (hasMemeVibes) attributes.push('😂 MEME VIBES');
            if (attributes.length > 0) {
                message += ` [${attributes.join(', ')}]`;
            }
            console.log(message);
        } else {
            this.stats.notSchwepe++;
            console.log(`🗑️  ${icon} ${fileName} - NOT SCHWEPE (confidence: ${result.confidence}/10)`);

            // Move non-Schwepe media to deleted folder
            this.moveNonSchwepeMedia(result.mediaPath, fileName, result.analysis);
        }
    }

    checkForCharacteristic(analysis, characteristic) {
        const lines = analysis.split('\n');
        const line = lines.find(line => line.toLowerCase().includes(characteristic.toLowerCase()));
        return line && line.split(':')[1]?.trim().toUpperCase() === 'YES';
    }

    async moveNonSchwepeMedia(mediaPath, fileName, analysis) {
        try {
            // Move to deleted directory
            const deletedPath = path.join(this.deletedDir, fileName);
            await fs.move(mediaPath, deletedPath);

            this.stats.deleted.push(fileName);

            // Save analysis reason
            const analysisFile = path.join(this.deletedDir, `${fileName}.analysis.txt`);
            await fs.writeFile(analysisFile, `Deleted reason:\n${analysis}`);

            console.log(`   📁 Moved to deleted_media/`);

        } catch (error) {
            console.error(`   ❌ Failed to move ${fileName}:`, error.message);
        }
    }

    async getImageFiles() {
        if (!await fs.pathExists(this.imagesDir)) return [];

        const files = await fs.readdir(this.imagesDir);
        return files
            .filter(file => /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(file))
            .map(file => path.join(this.imagesDir, file))
            .sort();
    }

    async getVideoFiles() {
        if (!await fs.pathExists(this.videosDir)) return [];

        const files = await fs.readdir(this.videosDir);
        return files
            .filter(file => /\.(mp4|avi|mov|mkv|webm|flv|wmv|m4v|3gp)$/i.test(file))
            .map(file => path.join(this.videosDir, file))
            .sort();
    }

    printFinalStats() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 SCHWEPE MEDIA ANALYSIS COMPLETE');
        console.log('='.repeat(70));
        console.log(`Total media analyzed: ${this.stats.total}`);
        console.log(`✅ Schwepe-related: ${this.stats.schwepe}`);
        console.log(`🗑️  Not Schwepe (deleted): ${this.stats.notSchwepe}`);
        console.log(`❌ Analysis errors: ${this.stats.errors}`);
        console.log(`🖼️  Images processed: ${this.stats.imagesProcessed}`);
        console.log(`🎬 Videos processed: ${this.stats.videosProcessed}`);

        if (this.stats.deleted.length > 0) {
            console.log('\n🗑️  DELETED MEDIA:');
            this.stats.deleted.slice(-10).forEach(file => {
                const icon = file.includes('.') && ['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(file.split('.').pop().toLowerCase()) ? '🎬' : '🖼️';
                console.log(`   ${icon} ${file}`);
            });
            if (this.stats.deleted.length > 10) {
                console.log(`   ... and ${this.stats.deleted.length - 10} more`);
            }
        }

        console.log(`\n📁 Deleted media moved to: ${this.deletedDir}`);
        console.log(`🎯 Schwepe retention rate: ${((this.stats.schwepe / this.stats.total) * 100).toFixed(1)}%`);
        console.log('='.repeat(70));
    }

    async run() {
        try {
            await this.init();
            await this.processAllMedia();
        } catch (error) {
            console.error('💥 Fatal error:', error.message);
            process.exit(1);
        }
    }
}

// Run the analyzer
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new SchwepeMediaAnalyzer();
    analyzer.run().catch(console.error);
}

export default SchwepeMediaAnalyzer;