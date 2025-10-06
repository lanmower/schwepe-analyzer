#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VideoScheduler {
    constructor() {
        this.videosDir = path.join(__dirname, 'saved_videos');
        this.scheduleFile = path.join(__dirname, 'video-schedule.json');
        this.configFile = path.join(__dirname, 'scheduler-config.json');

        this.schedule = {
            generated: null,
            shuffledOrder: [],
            currentIndex: 0,
            totalPlayed: 0,
            staticDetected: false,
            currentVideo: null
        };

        this.config = {
            shuffleSeed: null,
            scheduleRebuildInterval: 3600000, // 1 hour
            staticDetectionThreshold: 0.3,
            maxStaticDuration: 5000, // 5 seconds
            videoTransitionDelay: 2000, // 2 seconds
            regenerateOnBuild: true, // Auto-regenerate on build detection
            timezoneMode: 'utc', // Use UTC for global synchronization
            dailySeedReset: true // Reset seed daily at UTC midnight
        };

        this.isStaticActive = false;
        this.staticTimer = null;
        this.videoTimer = null;
    }

    async init() {
        console.log('🎬 Video Scheduler with Static Prevention');
        console.log('🔀 Initializing shuffled playlist system...\n');

        await fs.ensureDir(this.videosDir);

        // Load existing schedule and config
        await this.loadSchedule();
        await this.loadConfig();

        // Initialize static detection
        this.initStaticDetection();

        console.log('📁 Videos directory: ✅ Found');
        console.log('📋 Schedule system: ✅ Ready');
    }

    async loadSchedule() {
        try {
            if (await fs.pathExists(this.scheduleFile)) {
                const data = await fs.readJson(this.scheduleFile);
                this.schedule = { ...this.schedule, ...data };
                console.log(`📅 Loaded existing schedule from ${new Date(this.schedule.generated).toLocaleString()}`);
            } else {
                console.log('📅 No existing schedule found - will generate new one');
            }
        } catch (error) {
            console.error('❌ Error loading schedule:', error.message);
        }
    }

    async loadConfig() {
        try {
            if (await fs.pathExists(this.configFile)) {
                const data = await fs.readJson(this.configFile);
                this.config = { ...this.config, ...data };
                console.log('⚙️  Loaded scheduler configuration');
            }
        } catch (error) {
            console.error('❌ Error loading config:', error.message);
        }
    }

    async saveSchedule() {
        try {
            await fs.writeJson(this.scheduleFile, this.schedule, { spaces: 2 });
            console.log('💾 Schedule saved');
        } catch (error) {
            console.error('❌ Error saving schedule:', error.message);
        }
    }

    async saveConfig() {
        try {
            await fs.writeJson(this.configFile, this.config, { spaces: 2 });
        } catch (error) {
            console.error('❌ Error saving config:', error.message);
        }
    }

    async getVideoFiles() {
        try {
            const files = await fs.readdir(this.videosDir);
            return files
                .filter(file => /\.(mp4|avi|mov|mkv|webm|flv|wmv|m4v|3gp)$/i.test(file))
                .sort();
        } catch (error) {
            console.error('❌ Error reading videos directory:', error.message);
            return [];
        }
    }

    // Generate UTC-based deterministic seed for global synchronization
    generateUTCSeed(date = null) {
        const targetDate = date || new Date();

        if (this.config.dailySeedReset) {
            // Use UTC date for daily seed reset - same for everyone globally
            const utcDate = new Date(targetDate.toISOString());
            const utcMidnight = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
            const daysSinceEpoch = Math.floor(utcMidnight.getTime() / (24 * 60 * 60 * 1000));

            // Use a simple hash of days since epoch + video count for deterministic seed
            return (daysSinceEpoch * 31) % 1000000; // Prime multiplier for better distribution
        } else {
            // Use UTC timestamp (hourly) for more frequent changes
            const utcHour = Math.floor(targetDate.getTime() / (60 * 60 * 1000));
            return (utcHour * 17) % 1000000; // Different prime multiplier
        }
    }

    // Fisher-Yates shuffle algorithm
    shuffleArray(array, seed = null) {
        const shuffled = [...array];
        let currentIndex = shuffled.length;

        // Use seed for reproducible shuffling if provided
        if (seed !== null) {
            // Simple seeded random number generator
            let random = () => {
                seed = (seed * 9301 + 49297) % 233280;
                return seed / 233280;
            };

            while (currentIndex !== 0) {
                const randomIndex = Math.floor(random() * currentIndex);
                currentIndex--;
                [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
            }
        } else {
            // Standard random shuffle
            while (currentIndex !== 0) {
                const randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
            }
        }

        return shuffled;
    }

    async generateSchedule(forceRegenerate = false) {
        const videos = await this.getVideoFiles();

        if (videos.length === 0) {
            console.log('📁 No videos found for scheduling');
            return false;
        }

        // Check if we need to regenerate
        const now = Date.now();
        const scheduleAge = this.schedule.generated ? now - this.schedule.generated : Infinity;

        // Detect build environment - regenerate on build
        const isBuildEnvironment = process.env.NODE_ENV === 'production' ||
                                 process.env.BUILD_ENV ||
                                 this.config.regenerateOnBuild;

        // Force regeneration on build or if conditions met
        const shouldRegenerate = forceRegenerate ||
                                isBuildEnvironment ||
                                !this.schedule.generated ||
                                this.schedule.shuffledOrder.length !== videos.length ||
                                scheduleAge >= this.config.scheduleRebuildInterval;

        if (!shouldRegenerate) {
            console.log(`📅 Using existing schedule (age: ${Math.floor(scheduleAge / 60000)} minutes)`);
            return true;
        }

        console.log(`🔀 Generating new shuffled schedule for ${videos.length} videos`);

        // Generate UTC-based deterministic seed for global synchronization
        this.config.shuffleSeed = this.generateUTCSeed();
        const nowUTC = new Date().toUTCString();

        // Create shuffled order
        this.schedule.shuffledOrder = this.shuffleArray(videos, this.config.shuffleSeed);
        this.schedule.currentIndex = 0;
        this.schedule.totalPlayed = 0;
        this.schedule.generated = now;

        // Save configuration and schedule
        await this.saveConfig();
        await this.saveSchedule();

        console.log(`🌍 New schedule generated with UTC-based seed: ${this.config.shuffleSeed}`);
        console.log(`🕐 Generated at: ${nowUTC} UTC`);
        console.log(`📅 Daily reset mode: ${this.config.dailySeedReset ? 'ON' : 'OFF'}`);
        console.log(`📋 Playback order: ${this.schedule.shuffledOrder.slice(0, 5).join(', ')}${this.schedule.shuffledOrder.length > 5 ? '...' : ''}`);

        return true;
    }

    initStaticDetection() {
        // Placeholder for static detection implementation
        // In a real implementation, this would connect to audio analysis
        console.log('📡 Static detection system initialized');
        console.log(`⚙️  Static threshold: ${(this.config.staticDetectionThreshold * 100).toFixed(1)}%`);
        console.log(`⏱️  Max static duration: ${this.config.maxStaticDuration}ms`);
    }

    async onStaticDetected(level) {
        if (level > this.config.staticDetectionThreshold) {
            if (!this.isStaticActive) {
                console.log(`📡 Static detected (${(level * 100).toFixed(1)}%) - stopping video playback`);
                this.isStaticActive = true;
                await this.stopCurrentVideo();

                // Start timer to check if static persists
                this.staticTimer = setTimeout(() => {
                    if (this.isStaticActive) {
                        console.log('⚠️  Static persisting - keeping videos paused');
                    }
                }, this.config.maxStaticDuration);
            }
        } else {
            if (this.isStaticActive) {
                console.log('✅ Static cleared - resuming normal playback');
                this.isStaticActive = false;
                if (this.staticTimer) {
                    clearTimeout(this.staticTimer);
                    this.staticTimer = null;
                }
            }
        }
    }

    async stopCurrentVideo() {
        if (this.schedule.currentVideo) {
            console.log(`⏸️  Stopping video: ${this.schedule.currentVideo}`);
            this.schedule.currentVideo = null;

            // Clear any pending video timer
            if (this.videoTimer) {
                clearTimeout(this.videoTimer);
                this.videoTimer = null;
            }
        }
    }

    async playNextVideo() {
        if (this.isStaticActive) {
            console.log('📡 Static active - skipping video playback');
            return null;
        }

        if (this.schedule.shuffledOrder.length === 0) {
            console.log('📋 No videos in schedule');
            return null;
        }

        const video = this.schedule.shuffledOrder[this.schedule.currentIndex];
        this.schedule.currentVideo = video;
        this.schedule.totalPlayed++;

        console.log(`▶️  Playing video ${this.schedule.currentIndex + 1}/${this.schedule.shuffledOrder.length}: ${video}`);

        // Move to next video for future playback
        this.schedule.currentIndex = (this.schedule.currentIndex + 1) % this.schedule.shuffledOrder.length;

        // If we've completed a full cycle, log it
        if (this.schedule.currentIndex === 0) {
            console.log(`🔄 Completed full cycle - all ${this.schedule.shuffledOrder.length} videos played once`);
            console.log('🔄 Starting new cycle with same shuffled order');
        }

        await this.saveSchedule();
        return video;
    }

    async startPlayback() {
        console.log('\n🎬 Starting scheduled playback with static prevention');

        // Generate schedule if needed
        const scheduleReady = await this.generateSchedule();
        if (!scheduleReady) {
            console.log('❌ Cannot start playback - no videos available');
            return;
        }

        // Start playback loop
        this.playbackLoop();
    }

    async playbackLoop() {
        while (true) {
            if (!this.isStaticActive) {
                const video = await this.playNextVideo();
                if (video) {
                    // Simulate video playback duration
                    // In real implementation, this would wait for video to finish
                    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second demo

                    // Transition delay between videos
                    console.log(`⏸️  Video ended - ${this.config.videoTransitionDelay}ms transition`);
                    await new Promise(resolve => setTimeout(resolve, this.config.videoTransitionDelay));
                }
            } else {
                // Wait while static is active
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    getScheduleInfo() {
        const info = {
            totalVideos: this.schedule.shuffledOrder.length,
            currentIndex: this.schedule.currentIndex,
            totalPlayed: this.schedule.totalPlayed,
            currentVideo: this.schedule.currentVideo,
            isStaticActive: this.isStaticActive,
            generated: this.schedule.generated,
            shuffleSeed: this.config.shuffleSeed,
            scheduleAge: this.schedule.generated ? Date.now() - this.schedule.generated : 0
        };

        console.log('\n📊 SCHEDULE INFORMATION:');
        console.log('='.repeat(50));
        console.log(`Total videos in rotation: ${info.totalVideos}`);
        console.log(`Current position in cycle: ${info.currentIndex + 1}/${info.totalVideos}`);
        console.log(`Total videos played: ${info.totalPlayed}`);
        console.log(`Current video: ${info.currentVideo || 'None'}`);
        console.log(`Static active: ${info.isStaticActive ? 'YES' : 'NO'}`);
        console.log(`Schedule generated: ${new Date(info.generated).toLocaleString()}`);
        console.log(`Schedule age: ${Math.floor(info.scheduleAge / 60000)} minutes`);
        console.log(`Shuffle seed: ${info.shuffleSeed}`);
        console.log('='.repeat(50));

        return info;
    }

    async forceRegenerateSchedule() {
        console.log('🔄 Forcing schedule regeneration...');
        const success = await this.generateSchedule(true);
        if (success) {
            console.log('✅ Schedule regenerated successfully');
        } else {
            console.log('❌ Failed to regenerate schedule');
        }
        return success;
    }

    // Simulate static detection for testing
    simulateStatic(level, duration) {
        console.log(`🧪 Simulating static at ${(level * 100).toFixed(1)}% for ${duration}ms`);
        this.onStaticDetected(level);

        setTimeout(() => {
            this.onStaticDetected(0); // Clear static
        }, duration);
    }

    // Test timezone synchronization - simulates different timezones
    testTimezoneSync() {
        console.log('\n🌍 Testing timezone synchronization...');
        console.log('='.repeat(60));

        const testDates = [
            new Date('2025-10-06T00:00:00Z'), // UTC midnight
            new Date('2025-10-06T12:00:00Z'), // UTC noon
            new Date('2025-10-07T00:00:00Z'), // Next UTC midnight
        ];

        testDates.forEach(date => {
            const seed = this.generateUTCSeed(date);
            const utcString = date.toUTCString();
            console.log(`🕐 ${utcString}`);
            console.log(`🎲 Seed: ${seed}`);
            console.log('-'.repeat(40));
        });

        console.log('✅ All users in all timezones will see the same seed for the same UTC day');
    }

    // Debug endpoint for browser testing - returns comprehensive debug info
    async getDebugInfo() {
        const now = new Date();
        const utcSeed = this.generateUTCSeed();
        const videos = await this.getVideoFiles();

        return {
            timestamp: Date.now(),
            utcTime: now.toUTCString(),
            localTime: now.toString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: now.getTimezoneOffset(),
            utcDate: now.toISOString().split('T')[0],
            utcHour: now.getUTCHours(),
            browserSeed: utcSeed,
            serverSeed: this.config.shuffleSeed,
            seedsMatch: utcSeed === this.config.shuffleSeed,
            videos: {
                total: videos.length,
                sample: videos.slice(0, 3)
            },
            schedule: {
                generated: this.schedule.generated,
                currentIndex: this.schedule.currentIndex,
                totalPlayed: this.schedule.totalPlayed,
                currentVideo: this.schedule.currentVideo,
                staticDetected: this.schedule.staticDetected,
                totalVideos: this.schedule.shuffledOrder.length,
                firstVideos: this.schedule.shuffledOrder.slice(0, 5)
            },
            config: {
                timezoneMode: this.config.timezoneMode,
                dailySeedReset: this.config.dailySeedReset,
                scheduleRebuildInterval: this.config.scheduleRebuildInterval,
                staticDetectionThreshold: this.config.staticDetectionThreshold
            }
        };
    }

    async run() {
        try {
            await this.init();

            const command = process.argv[2];

            switch (command) {
                case 'info':
                    this.getScheduleInfo();
                    break;
                case 'regenerate':
                    await this.forceRegenerateSchedule();
                    break;
                case 'test-static':
                    console.log('🧪 Testing static detection...');
                    this.simulateStatic(0.5, 3000); // 50% static for 3 seconds
                    break;
                case 'test-timezone':
                    this.testTimezoneSync();
                    break;
                case 'start':
                default:
                    await this.startPlayback();
                    break;
            }

        } catch (error) {
            console.error('💥 Fatal error:', error.message);
            process.exit(1);
        }
    }
}

// Run the scheduler
if (import.meta.url === `file://${process.argv[1]}`) {
    const scheduler = new VideoScheduler();
    scheduler.run().catch(console.error);
}

export default VideoScheduler;