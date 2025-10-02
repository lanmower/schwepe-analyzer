#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugFalsePositive(imagePath) {
    console.log('🔍 DEBUG: Analyzing image that was INCORRECTLY kept as Schwepe');
    console.log(`📁 Image: ${path.basename(imagePath)}`);
    console.log('='.repeat(80));

    try {
        // Read and encode image
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = `image/${path.extname(imagePath).substring(1).toLowerCase()}`;
        const imageData = `data:${mimeType};base64,${base64Image}`;

        // Create balanced analysis prompt
        const prompt = `You are analyzing an image that was INCORRECTLY identified as "Schwepe" content. This image is NOT Schwepe-related. Analyze it carefully and explain why it should NOT be considered Schwepe.

SCHWEPE CHARACTERISTICS (MUST have at least ONE of these):
🐸 **FROGS/AMPHIBIANS**: Any frog, toad, amphibian, frog-like characters
🕶️ **SHINY SHADES**: Any sunglasses, shades, glasses, cool eyewear
📝 **SCHWEPE TEXT**: Any "schwepe", "247420", "degen", "schweppay" text
🚀 **MEME FORMAT**: Any parody, meme template, internet culture reference
💎 **CRYPTO THEME**: Any crypto, trading, meme coin elements
⚡ **ENERGY/VIBES**: Any chaotic, energetic, funny, meme content

CRITICAL: Be objective and accurate. If the image does NOT contain clear Schwepe characteristics, mark it as NOT SCHWEPE.

ANALYSIS REQUIREMENTS:
1. Look for ACTUAL frogs, amphibians, or frog-like characters
2. Look for REAL sunglasses or shiny eyewear
3. Look for EXPLICIT Schwepe-related text
4. Look for GENUINE meme formats or crypto content
5. Don't over-analyze or stretch interpretations
6. Be precise - if it's not clearly Schwepe, it's NOT Schwepe

RESPONSE FORMAT:
SCHWEPE_RELATED: [YES/NO]
CONFIDENCE: [1-10]
FROGS_OR_AMPHIBIANS: [YES/NO] - Are there actual frogs?
SHINY_SHADES: [YES/NO] - Are there actual sunglasses?
MEME_FORMAT: [YES/NO] - Is this a genuine meme format?
CRYPTO_ELEMENTS: [YES/NO] - Are there crypto elements?
ENERGY_VIBES: [YES/NO] - Is there meme/chaotic energy?
VISUAL_ANALYSIS: [Describe exactly what you see]
REASONING: [Explain clearly why this should or shouldn't be Schwepe]`;

        console.log('📡 Sending to API for balanced analysis...');

        // Call GLM-4.5V API
        const response = await axios.post('https://api.z.ai/api/coding/paas/v4/chat/completions', {
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
                'Authorization': `Bearer ${process.env.ANTHROPIC_AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        const analysis = response.data.choices[0].message.content;

        console.log('\n📊 BALANCED ANALYSIS RESULT:');
        console.log('='.repeat(80));
        console.log(analysis);
        console.log('='.repeat(80));

        // Extract key information
        const lines = analysis.split('\n');
        const schwepeLine = lines.find(line => line.toLowerCase().includes('schwepe_related'));

        const isSchwepe = schwepeLine && schwepeLine.split(':')[1]?.trim().toUpperCase() === 'YES';

        if (isSchwepe) {
            console.log('\n❌ PROBLEM: Analysis still says this is Schwepe!');
            console.log('🔧 NEEDED FIXES:');
            console.log('1. Ultra-inclusive prompt is TOO permissive');
            console.log('2. Need to balance inclusivity with accuracy');
            console.log('3. Need stricter criteria for false positives');
        } else {
            console.log('\n✅ CORRECT: Analysis correctly identifies this as NOT Schwepe');
            console.log('🔧 SOLUTION: Need to use this balanced approach instead of ultra-inclusive');
        }

    } catch (error) {
        console.error('❌ Error during debug analysis:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.status, error.response.data);
        }
    }
}

// Run the debug analysis
const imagePath = '/mnt/c/dev/mux/saved_images/2025-10-02T07-41-20-862Z_00071-1578091732.jpeg';
debugFalsePositive(imagePath).catch(console.error);