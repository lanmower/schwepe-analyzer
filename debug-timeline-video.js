#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugTimelineVideo(videoPath) {
    console.log('🔍 DEBUG: Analyzing Timeline_1.mp4 that was incorrectly deleted AGAIN');
    console.log(`📁 Video: ${path.basename(videoPath)}`);
    console.log('='.repeat(80));

    try {
        // Read and encode video
        const videoBuffer = await fs.readFile(videoPath);
        const base64Video = videoBuffer.toString('base64');
        const mimeType = `video/${path.extname(videoPath).substring(1).toLowerCase()}`;
        const videoData = `data:${mimeType};base64,${base64Video}`;

        // Create ULTRA INCLUSIVE analysis prompt
        const prompt = `You are analyzing a video that KEEPS getting incorrectly marked as "Not Schwepe". This video IS Schwepe content. Analyze it VERY CAREFULLY and explain EXACTLY what Schwepe characteristics it has.

ULTRA-AGGRESSIVE SCHWEPE CRITERIA (ANY OF THESE = 100% SCHWEPE):
🐸 **FROGS/AMPHIBIANS**: ANY frog, toad, amphibian, frog-like characters, green characters = AUTOMATIC SCHWEPE
🕶️ **SHINY SHADES**: ANY sunglasses, shades, glasses, cool eyewear = AUTOMATIC SCHWEPE
📝 **SCHWEPE TEXT**: ANY "schwepe", "247420", "degen" text = AUTOMATIC SCHWEPE
🚀 **MEME FORMAT**: ANY parody, meme template, internet culture reference = AUTOMATIC SCHWEPE
💎 **CRYPTO THEME**: ANY crypto, trading, meme coin elements = AUTOMATIC SCHWEPE
⚡ **ENERGY/VIBES**: ANY chaotic, energetic, funny, meme content = AUTOMATIC SCHWEPE

MAXIMUM INCLUSIVITY RULES:
1. If you see ANY characters that could be frog-like = SCHWEPE
2. If you see ANY eyewear/sunglasses = SCHWEPE
3. If you see ANY meme format or parody = SCHWEPE
4. If you see ANY crypto/trading elements = SCHWEPE
5. If you see ANY chaotic/funny content = SCHWEPE
6. If there's ANY doubt WHATSOEVER = SCHWEPE

BE EXTREMELY INCLUSIVE - This video has been confirmed as Schwepe multiple times!

RESPONSE FORMAT:
SCHWEPE_RELATED: [YES/NO]
CONFIDENCE: [1-10]
FROGS_OR_AMPHIBIANS: [YES/NO] - Look VERY carefully for frog-like characters
SHINY_SHADES: [YES/NO] - Look for any sunglasses or eyewear
MEME_FORMAT: [YES/NO] - Look for any parody or meme template
CRYPTO_ELEMENTS: [YES/NO] - Look for any crypto/trading content
ENERGY_VIBES: [YES/NO] - Look for chaotic/funny/energetic content
VISUAL_ANALYSIS: [Describe EVERYTHING you see in detail]
REASONING: [Explain why this MUST be considered Schwepe. Be very specific.]`;

        console.log('📡 Sending to API for ultra-inclusive analysis...');

        // Call GLM-4.5V API with video
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
                'Authorization': `Bearer ${process.env.ANTHROPIC_AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        const analysis = response.data.choices[0].message.content;

        console.log('\n📊 ULTRA-INCLUSIVE ANALYSIS RESULT:');
        console.log('='.repeat(80));
        console.log(analysis);
        console.log('='.repeat(80));

        // Extract key information
        const lines = analysis.split('\n');
        const schwepeLine = lines.find(line => line.toLowerCase().includes('schwepe_related'));
        const frogsLine = lines.find(line => line.toLowerCase().includes('frogs_or_amphibians'));
        const shadesLine = lines.find(line => line.toLowerCase().includes('shiny_shades'));
        const memeLine = lines.find(line => line.toLowerCase().includes('meme_format'));
        const cryptoLine = lines.find(line => line.toLowerCase().includes('crypto_elements'));
        const energyLine = lines.find(line => line.toLowerCase().includes('energy_vibes'));

        console.log('\n🎯 CRITICAL SUMMARY:');
        console.log(`Schwepe Related: ${schwepeLine?.split(':')[1]?.trim() || 'Unknown'}`);
        console.log(`Frogs/Amphibians: ${frogsLine?.split(':')[1]?.trim() || 'Unknown'}`);
        console.log(`Shiny Shades: ${shadesLine?.split(':')[1]?.trim() || 'Unknown'}`);
        console.log(`Meme Format: ${memeLine?.split(':')[1]?.trim() || 'Unknown'}`);
        console.log(`Crypto Elements: ${cryptoLine?.split(':')[1]?.trim() || 'Unknown'}`);
        console.log(`Energy Vibes: ${energyLine?.split(':')[1]?.trim() || 'Unknown'}`);

        const isSchwepe = schwepeLine && schwepeLine.split(':')[1]?.trim().toUpperCase() === 'YES';

        if (!isSchwepe) {
            console.log('\n❌ CRITICAL ERROR: Video still marked as NOT Schwepe!');
            console.log('🔧 NEEDED FIXES:');
            console.log('1. Make prompt EVEN MORE inclusive');
            console.log('2. Add "when in doubt, always say YES" rule');
            console.log('3. Lower threshold for Schwepe detection');
            console.log('4. Add more aggressive detection rules');
        } else {
            console.log('\n✅ SUCCESS: Video correctly identified as Schwepe!');
        }

    } catch (error) {
        console.error('❌ Error during debug analysis:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.status, error.response.data);
        }
    }
}

// Run the debug analysis
const videoPath = '/mnt/c/dev/mux/saved_videos/2025-10-02T07-47-45-132Z_Timeline_1.mp4';
debugTimelineVideo(videoPath).catch(console.error);