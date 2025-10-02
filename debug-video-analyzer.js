#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugVideoAnalysis(videoPath) {
    console.log('🔍 DEBUG: Analyzing specific video that was incorrectly deleted');
    console.log(`📁 Video: ${path.basename(videoPath)}`);
    console.log('='.repeat(80));

    try {
        // Read and encode video
        const videoBuffer = await fs.readFile(videoPath);
        const base64Video = videoBuffer.toString('base64');
        const mimeType = `video/${path.extname(videoPath).substring(1).toLowerCase()}`;
        const videoData = `data:${mimeType};base64,${base64Video}`;

        // Create enhanced analysis prompt with more detailed reasoning
        const prompt = `You are debugging why this video was incorrectly marked as "Not Schwepe". Please analyze this video VERY carefully for "Schwepe" meme token content.

CRITICAL SCHWEPE CHARACTERISTICS (ANY OF THESE = SCHWEPE):
🐸 **FROGS/AMPHIBIANS**: Any frog, toad, or amphibian references = AUTOMATIC SCHWEPE
🕶️ **SHINY SHADES**: Any character wearing sunglasses, shades, cool glasses = AUTOMATIC SCHWEPE
📝 **SCHWEPE BRANDING**: "schwepe", "247420", "degen" visible = AUTOMATIC SCHWEPE
🚀 **MEME CULTURE**: "meme", "funny", "based", "chad", "vibes" = SCHWEPE
💎 **CRYPTO/THEME**: "moon", "rocket", "diamond", "hands", "hodl", "ape" = SCHWEPE
⚡ **CHAOTIC ENERGY**: "degen", "chaos", "wild", "crazy", "energy" = SCHWEPE

ENHANCED ANALYSIS REQUIREMENTS:
1. Look for ANY Schwepe characteristic, no matter how subtle
2. If the video has frogs, amphibians, or shiny shades - AUTOMATIC SCHWEPE
3. Consider lateral meme relationships - crypto ecosystem content qualifies
4. Check for animated characters, meme formats, internet culture references
5. Look for visual style: dark gradients, neon colors, chaotic/energetic vibes
6. If it fits meme/chaotic/degen culture AT ALL, it's Schwepe

VERY IMPORTANT: Be INCLUSIVE rather than exclusive. If there's ANY doubt, mark as SCHWEPE.

RESPONSE FORMAT:
SCHWEPE_RELATED: [YES/NO]
CONFIDENCE: [1-10]
FROGS_FOUND: [YES/NO]
SHINY_SHADES: [YES/NO]
MEME_ELEMENTS: [YES/NO]
VISUAL_STYLE: [Describe what you see]
REASONING: [Explain in detail why this should or shouldn't be considered Schwepe. Be very specific about visual elements.]`;

        console.log('📡 Sending to API for analysis...');

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
            max_tokens: 800,
            temperature: 0.2
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.ANTHROPIC_AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        const analysis = response.data.choices[0].message.content;

        console.log('\n📊 ANALYSIS RESULT:');
        console.log('='.repeat(80));
        console.log(analysis);
        console.log('='.repeat(80));

        // Extract key information
        const lines = analysis.split('\n');
        const schwepeLine = lines.find(line => line.toLowerCase().includes('schwepe_related'));
        const frogsLine = lines.find(line => line.toLowerCase().includes('frogs_found'));
        const shadesLine = lines.find(line => line.toLowerCase().includes('shiny_shades'));
        const memeLine = lines.find(line => line.toLowerCase().includes('meme_elements'));

        console.log('\n🎯 QUICK SUMMARY:');
        console.log(`Schwepe Related: ${schwepeLine?.split(':')[1]?.trim() || 'Unknown'}`);
        console.log(`Frogs Found: ${frogsLine?.split(':')[1]?.trim() || 'Unknown'}`);
        console.log(`Shiny Shades: ${shadesLine?.split(':')[1]?.trim() || 'Unknown'}`);
        console.log(`Meme Elements: ${memeLine?.split(':')[1]?.trim() || 'Unknown'}`);

        const isSchwepe = schwepeLine && schwepeLine.split(':')[1]?.trim().toUpperCase() === 'YES';

        if (isSchwepe) {
            console.log('\n✅ VERDICT: This IS Schwepe content - should be KEPT');
        } else {
            console.log('\n❌ VERDICT: This was marked as NOT Schwepe - investigating why...');
            console.log('\n🔍 Possible reasons for incorrect deletion:');
            console.log('1. API may have missed subtle Schwepe characteristics');
            console.log('2. Video might require multiple frames for proper analysis');
            console.log('3. Schwepe elements might be more lateral/subtle');
            console.log('4. Analysis prompt might need adjustment for inclusivity');
        }

    } catch (error) {
        console.error('❌ Error during debug analysis:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.status, error.response.data);
        }
    }
}

// Run the debug analysis
const videoPath = '/mnt/c/dev/mux/saved_videos/2025-10-02T07-48-21-619Z_grok-video-0c1fc063-8c27-459a-a447-1384dc55fa62.mp4';
debugVideoAnalysis(videoPath).catch(console.error);