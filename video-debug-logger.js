/**
 * Video Scheduler Debug Logger
 * Adds comprehensive debug logging to video player pages
 *
 * Usage: Add this script to video player pages or include via <script src="video-debug-logger.js"></script>
 */

window.VideoDebugLogger = {
    init() {
        this.logStartupInfo();
        this.setupPeriodicLogging();
        this.setupErrorTracking();
        this.logVideoState();
    },

    logStartupInfo() {
        console.log('🔍 VIDEO SCHEDULER DEBUG LOGGER STARTED');
        console.log('='.repeat(80));

        const now = new Date();
        const info = {
            timestamp: Date.now(),
            localTime: now.toString(),
            utcTime: now.toUTCString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: now.getTimezoneOffset(),
            utcDate: now.toISOString().split('T')[0],
            utcHour: now.getUTCHours(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            screen: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            online: navigator.onLine,
            cookieEnabled: navigator.cookieEnabled,
            localStorage: this.getStorageInfo(localStorage),
            sessionStorage: this.getStorageInfo(sessionStorage)
        };

        console.log('🌍 BROWSER & TIMEZONE INFORMATION:');
        console.log('  Timestamp:', info.timestamp);
        console.log('  Local Time:', info.localTime);
        console.log('  UTC Time:', info.utcTime);
        console.log('  Timezone:', info.timezone);
        console.log('  Timezone Offset:', info.timezoneOffset);
        console.log('  UTC Date:', info.utcDate);
        console.log('  UTC Hour:', info.utcHour);

        console.log('🖥️  SYSTEM INFORMATION:');
        console.log('  User Agent:', info.userAgent);
        console.log('  URL:', info.url);
        console.log('  Screen:', info.screen);
        console.log('  Viewport:', info.viewport);
        console.log('  Online:', info.online);

        console.log('💾 STORAGE INFORMATION:');
        console.log('  Local Storage:', info.localStorage);
        console.log('  Session Storage:', info.sessionStorage);

        // Calculate UTC seed (matches server logic)
        const utcDate = new Date(now.toISOString());
        const utcMidnight = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        const daysSinceEpoch = Math.floor(utcMidnight.getTime() / (24 * 60 * 60 * 1000));
        const utcSeed = (daysSinceEpoch * 31) % 1000000;

        console.log('🎲 SCHEDULE CALCULATION:');
        console.log('  UTC Date:', utcDate.toISOString());
        console.log('  UTC Midnight:', utcMidnight.toISOString());
        console.log('  Days Since Epoch:', daysSinceEpoch);
        console.log('  Calculated UTC Seed:', utcSeed);

        // Store for comparison
        this.debugInfo = info;
        this.utcSeed = utcSeed;

        return info;
    },

    getStorageInfo(storage) {
        const info = { count: 0, keys: [] };
        try {
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key) {
                    info.count++;
                    info.keys.push(key);
                }
            }
        } catch (e) {
            info.error = e.message;
        }
        return info;
    },

    setupPeriodicLogging() {
        // Log schedule state every 30 seconds
        setInterval(() => {
            this.logCurrentState();
        }, 30000);

        // Log video state every 10 seconds
        setInterval(() => {
            this.logVideoState();
        }, 10000);
    },

    setupErrorTracking() {
        // Catch and log errors
        window.addEventListener('error', (event) => {
            console.error('💥 ERROR:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('💥 UNHANDLED PROMISE REJECTION:', {
                reason: event.reason,
                stack: event.reason?.stack
            });
        });
    },

    logCurrentState() {
        const now = new Date();
        console.log(`🔄 SCHEDULE STATE UPDATE [${now.toLocaleTimeString()}]`);

        if (window.videoScheduler) {
            console.log('  Video Scheduler:', {
                currentIndex: window.videoScheduler.schedule?.currentIndex,
                currentVideo: window.videoScheduler.schedule?.currentVideo,
                totalPlayed: window.videoScheduler.schedule?.totalPlayed,
                staticDetected: window.videoScheduler.schedule?.staticDetected,
                isStaticActive: window.videoScheduler.isStaticActive
            });
        }

        if (window.currentVideoIndex !== undefined) {
            console.log('  Current Video Index:', window.currentVideoIndex);
        }

        console.log('  Stored Index (localStorage):', localStorage.getItem('currentVideoIndex'));
        console.log('  Stored Index (sessionStorage):', sessionStorage.getItem('currentVideoIndex'));
    },

    logVideoState() {
        const videos = document.querySelectorAll('video');
        if (videos.length === 0) return;

        console.log(`📹 VIDEO STATE [${new Date().toLocaleTimeString()}]`);

        videos.forEach((video, index) => {
            const state = {
                index,
                src: video.src ? video.src.split('/').pop() : 'no src',
                readyState: video.readyState,
                networkState: video.networkState,
                currentTime: video.currentTime,
                duration: video.duration,
                paused: video.paused,
                ended: video.ended,
                muted: video.muted,
                volume: video.volume,
                buffered: video.buffered.length,
                error: video.error ? video.error.message : 'none'
            };

            console.log(`  Video ${index}:`, state);
        });
    },

    // Generate comprehensive report
    generateFullReport() {
        const report = {
            timestamp: Date.now(),
            startup: this.debugInfo,
            currentSchedule: this.getCurrentScheduleInfo(),
            videoElements: this.getVideoElementsInfo(),
            storage: {
                localStorage: this.getAllStorage(localStorage),
                sessionStorage: this.getAllStorage(sessionStorage)
            },
            utcSeed: this.utcSeed,
            network: {
                online: navigator.onLine,
                connection: navigator.connection ? {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt
                } : 'unknown'
            }
        };

        console.log('📊 COMPREHENSIVE DEBUG REPORT:');
        console.log('='.repeat(80));
        console.log(JSON.stringify(report, null, 2));

        return report;
    },

    getCurrentScheduleInfo() {
        if (window.videoScheduler && window.videoScheduler.schedule) {
            return {
                generated: window.videoScheduler.schedule.generated,
                currentIndex: window.videoScheduler.schedule.currentIndex,
                totalPlayed: window.videoScheduler.schedule.totalPlayed,
                currentVideo: window.videoScheduler.schedule.currentVideo,
                staticDetected: window.videoScheduler.schedule.staticDetected,
                totalVideos: window.videoScheduler.schedule.shuffledOrder?.length || 0
            };
        }
        return { error: 'Video scheduler not found' };
    },

    getVideoElementsInfo() {
        const videos = document.querySelectorAll('video');
        return Array.from(videos).map((video, index) => ({
            index,
            src: video.src,
            readyState: video.readyState,
            networkState: video.networkState,
            currentTime: video.currentTime,
            duration: video.duration,
            paused: video.paused,
            ended: video.ended,
            muted: video.muted,
            volume: video.volume,
            buffered: video.buffered.length,
            error: video.error?.message
        }));
    },

    getAllStorage(storage) {
        const data = {};
        try {
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key) {
                    data[key] = storage.getItem(key);
                }
            }
        } catch (e) {
            data.error = e.message;
        }
        return data;
    },

    // Method to get server data if available
    async fetchServerSchedule() {
        try {
            const response = await fetch('/video-schedule.json');
            const schedule = await response.json();
            console.log('🌐 SERVER SCHEDULE DATA:');
            console.log('  Generated:', new Date(schedule.generated).toUTCString());
            console.log('  Current Index:', schedule.currentIndex);
            console.log('  Current Video:', schedule.currentVideo);
            console.log('  Total Videos:', schedule.shuffledOrder.length);
            console.log('  First 3 Videos:', schedule.shuffledOrder.slice(0, 3));
            return schedule;
        } catch (e) {
            console.log('❌ Could not fetch server schedule:', e.message);
            return null;
        }
    },

    async fetchServerConfig() {
        try {
            const response = await fetch('/scheduler-config.json');
            const config = await response.json();
            console.log('⚙️ SERVER CONFIG DATA:');
            console.log('  Shuffle Seed:', config.shuffleSeed);
            console.log('  Timezone Mode:', config.timezoneMode);
            console.log('  Daily Reset:', config.dailySeedReset);
            console.log('  Seeds Match:', this.utcSeed === config.shuffleSeed ? '✅ YES' : '❌ NO');
            return config;
        } catch (e) {
            console.log('❌ Could not fetch server config:', e.message);
            return null;
        }
    }
};

// Auto-initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.VideoDebugLogger.init();
    });
} else {
    window.VideoDebugLogger.init();
}

// Add global convenience methods
window.debugLog = () => window.VideoDebugLogger.generateFullReport();
window.debugSchedule = () => window.VideoDebugLogger.getCurrentScheduleInfo();
window.debugVideos = () => window.VideoDebugLogger.getVideoElementsInfo();
window.debugServer = async () => {
    const schedule = await window.VideoDebugLogger.fetchServerSchedule();
    const config = await window.VideoDebugLogger.fetchServerConfig();
    return { schedule, config };
};

console.log('🔧 Video Debug Logger loaded. Use debugLog(), debugSchedule(), debugVideos(), or debugServer() for detailed info.');