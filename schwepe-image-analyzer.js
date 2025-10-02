#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SchwepeImageAnalyzer {
    constructor() {
        this.apiEndpoint = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
        this.apiToken = process.env.ANTHROPIC_AUTH_TOKEN;
        this.imagesDir = path.join(__dirname, 'saved_images');
        this.deletedDir = path.join(__dirname, 'deleted_images');

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
            deleted: []
        };
    }

    async init() {
        console.log('🐸 Schwepe Image Analyzer v1.0');
        console.log('🔥 Analyzing images for Schwepe-related content...\n');

        // Ensure directories exist
        await fs.ensureDir(this.deletedDir);

        if (!this.apiToken) {
            throw new Error('ANTHROPIC_AUTH_TOKEN environment variable not found');
        }

        // Check if images directory exists
        if (!await fs.pathExists(this.imagesDir)) {
            throw new Error(`Images directory not found: ${this.imagesDir}`);
        }
    }

    async analyzeImage(imagePath) {
        try {
            console.log(`🔍 Analyzing: ${path.basename(imagePath)}`);

            // Read and encode image
            const imageBuffer = await fs.readFile(imagePath);
            const base64Image = imageBuffer.toString('base64');
            const mimeType = `image/${path.extname(imagePath).substring(1).toLowerCase()}`;
            const imageData = `data:${mimeType};base64,${base64Image}`;

            // Create analysis prompt with Schwepe criteria
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
                imagePath,
                isSchwepe,
                analysis,
                confidence: this.extractConfidence(analysis)
            };

        } catch (error) {
            console.error(`❌ Error analyzing ${path.basename(imagePath)}:`, error.message);
            return {
                imagePath,
                isSchwepe: false,
                analysis: `Error: ${error.message}`,
                confidence: 0,
                error: true
            };
        }
    }

    createAnalysisPrompt() {
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

CRITICAL: SHINY SHADES ATTRIBUTE
- **SHINY SHADES ARE A KEY SCHWEPE ATTRIBUTE**
- Any character/person wearing shiny/reflective sunglasses, cool shades, or stylish glasses is considered a "secret Schwepe"
- This includes: dark sunglasses, reflective eyewear, laser eyes, glowing eyes, neon glasses, futuristic glasses, matrix-style glasses
- The shiny shades transformation makes someone part of the Schwepe meme ecosystem
- EVEN IF the image has no other Schwepe elements, shiny shades = automatic Schwepe relationship

ANALYSIS REQUIREMENTS:
1. Identify if this image is Schwepe-related (directly or laterally as a meme)
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

    async processImages() {
        const imageFiles = await this.getImageFiles();

        if (imageFiles.length === 0) {
            console.log('📁 No images found in', this.imagesDir);
            return;
        }

        console.log(`📊 Found ${imageFiles.length} images to analyze\n`);
        this.stats.total = imageFiles.length;

        // Process images in batches to avoid API limits
        const batchSize = 5;
        for (let i = 0; i < imageFiles.length; i += batchSize) {
            const batch = imageFiles.slice(i, i + batchSize);

            console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageFiles.length/batchSize)}`);

            const results = await Promise.all(
                batch.map(imagePath => this.analyzeImage(imagePath))
            );

            // Handle results
            for (const result of results) {
                this.handleAnalysisResult(result);
            }

            // Small delay between batches
            if (i + batchSize < imageFiles.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        this.printFinalStats();
    }

    handleAnalysisResult(result) {
        const fileName = path.basename(result.imagePath);

        if (result.error) {
            this.stats.errors++;
            console.log(`❌ ${fileName} - Analysis failed`);
            return;
        }

        // Check if shiny shades were detected
        const hasShinyShades = this.checkForShinyShades(result.analysis);

        if (result.isSchwepe) {
            this.stats.schwepe++;
            let message = `✅ ${fileName} - SCHWEPE (confidence: ${result.confidence}/10)`;
            if (hasShinyShades) {
                message += ` 🕶️ SHINY SHADES`;
            }
            console.log(message);
        } else {
            this.stats.notSchwepe++;
            console.log(`🗑️  ${fileName} - NOT SCHWEPE (confidence: ${result.confidence}/10)`);

            // Delete non-Schwepe images
            this.deleteNonSchwepeImage(result.imagePath, fileName, result.analysis);
        }
    }

    checkForShinyShades(analysis) {
        const lines = analysis.split('\n');
        const shinyShadesLine = lines.find(line => line.toLowerCase().includes('shiny_shades'));
        return shinyShadesLine && shinyShadesLine.split(':')[1]?.trim().toUpperCase() === 'YES';
    }

    async deleteNonSchwepeImage(imagePath, fileName, analysis) {
        try {
            // Move to deleted directory instead of permanent deletion
            const deletedPath = path.join(this.deletedDir, fileName);
            await fs.move(imagePath, deletedPath);

            this.stats.deleted.push(fileName);

            // Save analysis reason
            const analysisFile = path.join(this.deletedDir, `${fileName}.analysis.txt`);
            await fs.writeFile(analysisFile, `Deleted reason:\n${analysis}`);

            console.log(`   📁 Moved to deleted_images/`);

        } catch (error) {
            console.error(`   ❌ Failed to delete ${fileName}:`, error.message);
        }
    }

    async getImageFiles() {
        const files = await fs.readdir(this.imagesDir);
        return files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => path.join(this.imagesDir, file))
            .sort();
    }

    printFinalStats() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 SCHWEPE IMAGE ANALYSIS COMPLETE');
        console.log('='.repeat(60));
        console.log(`Total images analyzed: ${this.stats.total}`);
        console.log(`✅ Schwepe-related: ${this.stats.schwepe}`);
        console.log(`🗑️  Not Schwepe (deleted): ${this.stats.notSchwepe}`);
        console.log(`❌ Analysis errors: ${this.stats.errors}`);

        if (this.stats.deleted.length > 0) {
            console.log('\n🗑️  DELETED IMAGES:');
            this.stats.deleted.forEach(file => console.log(`   • ${file}`));
        }

        console.log(`\n📁 Deleted images moved to: ${this.deletedDir}`);
        console.log(`\n🎯 Schwepe retention rate: ${((this.stats.schwepe / this.stats.total) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));
    }

    async run() {
        try {
            await this.init();
            await this.processImages();
        } catch (error) {
            console.error('💥 Fatal error:', error.message);
            process.exit(1);
        }
    }
}

// Run the analyzer
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new SchwepeImageAnalyzer();
    analyzer.run().catch(console.error);
}

export default SchwepeImageAnalyzer;