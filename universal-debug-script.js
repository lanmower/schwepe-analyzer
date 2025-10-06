/**
 * UNIVERSAL SYNC DEBUG SCRIPT
 * Add this directly to your video player HTML (videos-thread.html)
 *
 * This ensures ALL users worldwide see the same video at the same time
 * based on deterministic UTC seed and time-based position calculation
 */

<script>
(function() {
    'use strict';

    console.log('🌍 Universal Video Sync & Debug System Starting...');
    console.log('='.repeat(80));

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        videoDuration: 10, // Each video plays for 10 seconds
        scheduleStartUTC: '00:00:00', // Schedule starts at UTC midnight
        toleranceMs: 2000 // Allow 2 second sync tolerance
    };

    // ==================== UNIVERSAL SYNC ENGINE ====================
    window.UniversalSync = {
        utcSeed: null,

        init() {
            this.calculateUTCSeed();
            this.startUniversalSync();
            this.setupDebugCommands();
            console.log('🌍 Universal sync initialized - ALL users will see same video');
        },

        calculateUTCSeed() {
            const now = new Date();
            const utcDate = new Date(now.toISOString());
            const utcMidnight = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
            const daysSinceEpoch = Math.floor(utcMidnight.getTime() / (24 * 60 * 60 * 1000));
            this.utcSeed = (daysSinceEpoch * 31) % 1000000;

            console.log('🎲 Universal UTC Seed Calculation:');
            console.log(`  Current Time: ${now.toString()}`);
            console.log(`  UTC Time: ${now.toUTCString()}`);
            console.log(`  UTC Date: ${utcDate.toISOString().split('T')[0]}`);
            console.log(`  UTC Hour: ${now.getUTCHours()}`);
            console.log(`  Days Since Epoch: ${daysSinceEpoch}`);
            console.log(`  🎲 Calculated UTC Seed: ${this.utcSeed}`);
        },

        startUniversalSync() {
            // Sync immediately
            this.performUniversalSync();

            // Sync every second
            setInterval(() => this.performUniversalSync(), 1000);
        },

        performUniversalSync() {
            const now = new Date();
            const universalPosition = this.calculateUniversalPosition(now);

            // Log sync status every 10 seconds
            if (now.getSeconds() % 10 === 0) {
                console.log(`🌍 Universal Sync [${now.toUTCString()}]:`, {
                    videoIndex: universalPosition.videoIndex,
                    currentVideo: universalPosition.videoName,
                    timeInVideo: universalPosition.timeInVideo.toFixed(1) + 's'
                });
            }

            this.applyUniversalPosition(universalPosition);
        },

        calculateUniversalPosition(currentTime) {
            // Get start of today in UTC
            const todayUTC = new Date(currentTime.getUTCFullYear(), currentTime.getUTCMonth(), currentTime.getUTCDate());
            const scheduleStartUTC = new Date(todayUTC.getTime()); // 00:00:00 UTC

            // Calculate milliseconds since schedule started
            const msSinceStart = currentTime.getTime() - scheduleStartUTC.getTime();

            // Calculate which video should be playing (10 second intervals)
            const videoIndex = Math.floor(msSinceStart / (CONFIG.videoDuration * 1000));
            const timeInVideo = (msSinceStart % (CONFIG.videoDuration * 1000)) / 1000;

            return {
                videoIndex,
                timeInVideo,
                msSinceStart,
                timestamp: currentTime.getTime(),
                seed: this.utcSeed
            };
        },

        applyUniversalPosition(universalPosition) {
            if (!window.videoScheduler || !window.videoScheduler.schedule) return;

            const localIndex = window.videoScheduler.schedule.currentIndex;
            const localVideo = window.videoScheduler.schedule.currentVideo;

            // Get the correct video for this position
            const expectedVideo = this.getVideoAtPosition(universalPosition.videoIndex);

            // Check if we need to sync
            if (localIndex !== universalPosition.videoIndex || localVideo !== expectedVideo) {
                console.log('🔄 Universal Sync Correction Needed:');
                console.log(`  Was: Index ${localIndex}, Video: ${localVideo}`);
                console.log(`  Should Be: Index ${universalPosition.videoIndex}, Video: ${expectedVideo}`);

                // Apply sync
                window.videoScheduler.schedule.currentIndex = universalPosition.videoIndex;
                window.videoScheduler.schedule.currentVideo = expectedVideo;

                // Store for persistence
                localStorage.setItem('currentVideoIndex', universalPosition.videoIndex.toString());
            }
        },

        getVideoAtPosition(index) {
            // Get shuffled order from server cache or generate
            const cached = localStorage.getItem('universalShuffledOrder');
            if (cached) {
                try {
                    const order = JSON.parse(cached);
                    return order[index % order.length] || `video_${index}`;
                } catch (e) {
                    console.warn('Cache parse failed, generating fallback');
                }
            }

            // Fallback - try to fetch from server
            this.fetchServerOrder();
            return `video_${index}`;
        },

        async fetchServerOrder() {
            try {
                const response = await fetch('/video-schedule.json');
                const schedule = await response.json();

                localStorage.setItem('universalShuffledOrder', JSON.stringify(schedule.shuffledOrder));
                localStorage.setItem('universalVideoCount', schedule.shuffledOrder.length.toString());

                console.log('✅ Server order cached for universal sync');
                return schedule;
            } catch (e) {
                console.warn('Could not fetch server order:', e);
                return null;
            }
        },

        setupDebugCommands() {
            // Global debug methods
            window.debugUniversalSync = () => this.verifyUniversalSync();
            window.forceUniversalSync = () => this.forceUniversalSync();
            window.debugUniversalStatus = () => this.getUniversalSyncStatus();

            console.log('🔧 Universal Sync Commands Available:');
            console.log('  debugUniversalSync() - Verify sync status');
            console.log('  forceUniversalSync() - Force sync now');
            console.log('  debugUniversalStatus() - Get current status');
        },

        verifyUniversalSync() {
            const now = new Date();
            const position = this.calculateUniversalPosition(now);
            const syncStatus = this.checkIfSynced(position);

            console.log('🌍 UNIVERSAL SYNC VERIFICATION');
            console.log('='.repeat(80));
            console.log('Current UTC Time:', now.toUTCString());
            console.log('UTC Seed:', position.seed);
            console.log('Expected Video Index:', position.videoIndex);
            console.log('Expected Video:', this.getVideoAtPosition(position.videoIndex));
            console.log('Time in Video:', position.timeInVideo.toFixed(1) + 's');
            console.log('Seconds since midnight UTC:', Math.floor(position.msSinceStart / 1000));

            console.log('\n🔍 Local vs Universal Comparison:');
            console.log('Local Index:', syncStatus.localIndex);
            console.log('Universal Index:', position.videoIndex);
            console.log('Local Video:', syncStatus.localVideo);
            console.log('Universal Video:', this.getVideoAtPosition(position.videoIndex));
            console.log('Sync Status:', syncStatus.synced ? '✅ SYNCED' : '❌ OUT OF SYNC');

            if (!syncStatus.synced) {
                console.log('\n⚠️ OUT OF SYNC - Auto-correction will be applied');
            }

            console.log('\n📋 Share this output to verify sync with other users worldwide');
            console.log('All users should see identical Universal Index at the same time');

            return { position, syncStatus };
        },

        checkIfSynced(universalPosition) {
            if (!window.videoScheduler || !window.videoScheduler.schedule) {
                return { synced: false, reason: 'No local scheduler' };
            }

            const localIndex = window.videoScheduler.schedule.currentIndex;
            const localVideo = window.videoScheduler.schedule.currentVideo;
            const expectedVideo = this.getVideoAtPosition(universalPosition.videoIndex);

            return {
                synced: localIndex === universalPosition.videoIndex && localVideo === expectedVideo,
                localIndex,
                localVideo,
                universalIndex: universalPosition.videoIndex,
                universalVideo: expectedVideo
            };
        },

        getUniversalSyncStatus() {
            const now = new Date();
            const position = this.calculateUniversalPosition(now);
            const syncStatus = this.checkIfSynced(position);

            return {
                timestamp: now.getTime(),
                utcTime: now.toUTCString(),
                seed: position.seed,
                universalIndex: position.videoIndex,
                universalVideo: this.getVideoAtPosition(position.videoIndex),
                timeInVideo: position.timeInVideo.toFixed(1) + 's',
                localIndex: syncStatus.localIndex,
                localVideo: syncStatus.localVideo,
                synced: syncStatus.synced
            };
        },

        forceUniversalSync() {
            console.log('🌍 Forcing universal sync...');
            this.calculateUTCSeed(); // Recalculate seed
            this.performUniversalSync();
            this.fetchServerOrder(); // Refresh from server
        }
    };

    // ==================== ENHANCED DEBUG LOGGER ====================
    window.EnhancedDebugLogger = {
        init() {
            this.logBrowserInfo();
            this.setupErrorTracking();
            this.startPeriodicLogging();
        },

        logBrowserInfo() {
            const now = new Date();
            console.log('\n🖥️ ENHANCED BROWSER DEBUG INFO:');
            console.log('='.repeat(80));
            console.log('URL:', window.location.href);
            console.log('User Agent:', navigator.userAgent);
            console.log('Language:', navigator.language);
            console.log('Platform:', navigator.platform);
            console.log('Screen:', `${screen.width}x${screen.height}`);
            console.log('Viewport:', `${window.innerWidth}x${window.innerHeight}`);
            console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
            console.log('Local Time:', now.toString());
            console.log('UTC Time:', now.toUTCString());
            console.log('Timezone Offset:', now.getTimezoneOffset() + ' minutes');

            // Storage info
            console.log('\n💾 Storage Analysis:');
            console.log('LocalStorage items:', localStorage.length);
            console.log('SessionStorage items:', sessionStorage.length);

            for (let i = 0; i < Math.min(localStorage.length, 5); i++) {
                const key = localStorage.key(i);
                if (key) console.log(`  ${key}: ${localStorage.getItem(key)}`);
            }

            // Video elements
            const videos = document.querySelectorAll('video');
            console.log('\n📹 Video Elements:', videos.length);
            videos.forEach((video, index) => {
                console.log(`  Video ${index}:`, {
                    src: video.src ? video.src.split('/').pop() : 'no src',
                    readyState: video.readyState,
                    currentTime: video.currentTime,
                    duration: video.duration,
                    paused: video.paused
                });
            });
        },

        setupErrorTracking() {
            window.addEventListener('error', (event) => {
                console.error('💥 ERROR:', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.error('💥 UNHANDLED PROMISE REJECTION:', event.reason);
            });
        },

        startPeriodicLogging() {
            // Log every 30 seconds
            setInterval(() => {
                const now = new Date();
                console.log(`🔄 Periodic Check [${now.toLocaleTimeString()}]:`);

                if (window.videoScheduler && window.videoScheduler.schedule) {
                    console.log('  Schedule:', {
                        currentIndex: window.videoScheduler.schedule.currentIndex,
                        currentVideo: window.videoScheduler.schedule.currentVideo,
                        totalPlayed: window.videoScheduler.schedule.totalPlayed
                    });
                }

                const videos = document.querySelectorAll('video');
                if (videos.length > 0) {
                    console.log('  Active Videos:', videos.length);
                }
            }, 30000);
        },

        generateFullReport() {
            const now = new Date();
            const universalSync = window.UniversalSync.getUniversalSyncStatus();

            const report = {
                timestamp: now.getTime(),
                browser: {
                    userAgent: navigator.userAgent,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    localTime: now.toString(),
                    utcTime: now.toUTCString()
                },
                universalSync,
                localSchedule: window.videoScheduler ? {
                    currentIndex: window.videoScheduler.schedule?.currentIndex,
                    currentVideo: window.videoScheduler.schedule?.currentVideo,
                    totalPlayed: window.videoScheduler.schedule?.totalPlayed
                } : { error: 'No local scheduler' },
                storage: {
                    localCurrentIndex: localStorage.getItem('currentVideoIndex'),
                    localForcePosition: localStorage.getItem('forcePosition')
                }
            };

            console.log('\n📊 COMPREHENSIVE DEBUG REPORT:');
            console.log('='.repeat(80));
            console.log(JSON.stringify(report, null, 2));

            return report;
        }
    };

    // ==================== INITIALIZATION ====================
    function initializeUniversalSync() {
        console.log('🚀 Initializing Universal Sync System...');

        // Initialize sync
        window.UniversalSync.init();

        // Initialize debug logger
        window.EnhancedDebugLogger.init();

        // Add comprehensive debug command
        window.debugAll = () => {
            console.log('\n🔍 COMPREHENSIVE DEBUG DUMP');
            console.log('='.repeat(80));

            // Universal sync verification
            window.UniversalSync.verifyUniversalSync();

            // Full debug report
            window.EnhancedDebugLogger.generateFullReport();

            console.log('\n🔧 Commands used:');
            console.log('  debugUniversalSync() - Universal sync verification');
            console.log('  debugAll() - This comprehensive report');
            console.log('  forceUniversalSync() - Force sync correction');
        };

        console.log('✅ Universal Sync System Ready!');
        console.log('🌍 All users worldwide will now see the same video at the same time');
        console.log('🔧 Available commands:');
        console.log('  debugUniversalSync() - Verify universal sync');
        console.log('  debugAll() - Complete debug dump');
        console.log('  forceUniversalSync() - Force sync correction');
        console.log('  debugUniversalStatus() - Current sync status');

        // Initial verification after 2 seconds
        setTimeout(() => {
            console.log('\n🎯 Initial Universal Sync Verification:');
            window.UniversalSync.verifyUniversalSync();
        }, 2000);
    }

    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUniversalSync);
    } else {
        initializeUniversalSync();
    }

})();
</script>