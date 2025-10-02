#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BalancedImageSchwepeAnalyzer {
    constructor() {
        this.apiEndpoint = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
        this.apiToken = process.env.ANTHROPIC_AUTH_TOKEN;
        this.imagesDir = path.join(__dirname, 'saved_images');
        this.deletedDir = path.join(__dirname, 'deleted_images');

        this.stats = {
            total: 0,
            schwepe: 0,
            notSchwepe: 0,
            errors: 0,
            deleted: []
        };
    }

    async init() {
        console.log('🐸 BALANCED Image Schwepe Analyzer - Smart Detection');
        console.log('🔥 Analyzing images with balanced Schwepe detection...\n');

        await fs.ensureDir(this.deletedDir);

        if (!this.apiToken) {
            throw new Error('ANTHROPIC_AUTH_TOKEN environment variable not found');
        }

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

            // Create balanced analysis prompt
            const prompt = this.createBalancedAnalysisPrompt();

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
                max_tokens: 800,
                temperature: 0.2
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

    createBalancedAnalysisPrompt() {
        return `You are analyzing images for "Schwepe" meme token content using BALANCED, ACCURATE detection.

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

EXAMPLES:
- Pepe the Frog = AUTOMATIC SCHWEPE ✅
- Yoda as Schwepe = MEME PARODY = SCHWEPE ✅
- AI-generated pink humanoid = CHARACTER ART = SCHWEPE ✅
- 3D-rendered Schwepe characters = AI-GENERATED SCHWEPE = SCHWEPE ✅
- Trader memes = CRYPTO/TRADING = SCHWEPE ✅
- Any character parody = MEME PARODY = SCHWEPE ✅
- Regular person + no meme elements = NOT SCHWEPE ❌

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

            console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(imageFiles.length/batchSize)}`);

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

        // Extract additional info from analysis
        const hasFrogs = this.checkForCharacteristic(result.analysis, 'FROGS_OR_AMPHIBIANS');
        const hasShinyShades = this.checkForCharacteristic(result.analysis, 'SHINY_SHADES');
        const hasSchwepeText = this.checkForCharacteristic(result.analysis, 'SCHWEPE_TEXT');
        const hasMemeIndicators = this.checkForCharacteristic(result.analysis, 'MEME_INDICATORS');

        if (result.isSchwepe) {
            this.stats.schwepe++;
            let message = `✅ ${fileName} - SCHWEPE (confidence: ${result.confidence}/10)`;
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
            console.log(`🗑️  ${fileName} - NOT SCHWEPE (confidence: ${result.confidence}/10)`);

            // Delete non-Schwepe images
            this.deleteNonSchwepeImage(result.imagePath, fileName, result.analysis);
        }
    }

    checkForCharacteristic(analysis, characteristic) {
        const lines = analysis.split('\n');
        const line = lines.find(line => line.toLowerCase().includes(characteristic.toLowerCase()));
        return line && line.split(':')[1]?.trim().toUpperCase() === 'YES';
    }

    async deleteNonSchwepeImage(imagePath, fileName, analysis) {
        try {
            // Move to deleted directory
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
        console.log('\n' + '='.repeat(70));
        console.log('📊 BALANCED IMAGE SCHWEPE ANALYSIS COMPLETE');
        console.log('='.repeat(70));
        console.log(`Total images analyzed: ${this.stats.total}`);
        console.log(`✅ Schwepe-related: ${this.stats.schwepe}`);
        console.log(`🗑️  Not Schwepe (deleted): ${this.stats.notSchwepe}`);
        console.log(`❌ Analysis errors: ${this.stats.errors}`);

        if (this.stats.deleted.length > 0) {
            console.log('\n🗑️  DELETED IMAGES:');
            this.stats.deleted.slice(-10).forEach(file => {
                console.log(`   • ${file}`);
            });
            if (this.stats.deleted.length > 10) {
                console.log(`   ... and ${this.stats.deleted.length - 10} more`);
            }
        }

        console.log(`\n📁 Deleted images moved to: ${this.deletedDir}`);
        console.log(`🎯 Schwepe retention rate: ${((this.stats.schwepe / this.stats.total) * 100).toFixed(1)}%`);
        console.log('='.repeat(70));
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
    const analyzer = new BalancedImageSchwepeAnalyzer();
    analyzer.run().catch(console.error);
}

export default BalancedImageSchwepeAnalyzer;