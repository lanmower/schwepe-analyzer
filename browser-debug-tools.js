/**
 * Browser Debug Tools for Video Scheduler
 * Copy and paste these functions into browser console to diagnose schedule issues
 */

window.VideoSchedulerDebug = {
    // Get current browser and timezone information
    getBrowserInfo() {
        console.log('🌍 BROWSER & TIMEZONE INFORMATION');
        console.log('='.repeat(60));

        const info = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            localTime: new Date().toString(),
            utcTime: new Date().toUTCString(),
            localISO: new Date().toISOString(),
            utcDate: new Date().toISOString().split('T')[0],
            utcHour: new Date().getUTCHours(),
            timestamp: Date.now(),
            performanceNow: performance.now()
        };

        console.log('User Agent:', info.userAgent);
        console.log('Language:', info.language);
        console.log('Timezone:', info.timezone);
        console.log('Timezone Offset (minutes):', info.timezoneOffset);
        console.log('Local Time:', info.localTime);
        console.log('UTC Time:', info.utcTime);
        console.log('Local ISO:', info.localISO);
        console.log('UTC Date:', info.utcDate);
        console.log('UTC Hour:', info.utcHour);
        console.log('Timestamp:', info.timestamp);
        console.log('Performance Now:', info.performanceNow);

        return info;
    },

    // Simulate UTC seed generation (matches server-side logic)
    generateUTCSeed(date = null) {
        const targetDate = date || new Date();

        // Use UTC date for daily seed reset - same for everyone globally
        const utcDate = new Date(targetDate.toISOString());
        const utcMidnight = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        const daysSinceEpoch = Math.floor(utcMidnight.getTime() / (24 * 60 * 60 * 1000));

        // Use a simple hash of days since epoch + video count for deterministic seed
        const seed = (daysSinceEpoch * 31) % 1000000;

        console.log(`🎲 UTC Seed Calculation:`);
        console.log(`  Target Date: ${targetDate.toISOString()}`);
        console.log(`  UTC Date: ${utcDate.toISOString()}`);
        console.log(`  UTC Midnight: ${utcMidnight.toISOString()}`);
        console.log(`  Days Since Epoch: ${daysSinceEpoch}`);
        console.log(`  Generated Seed: ${seed}`);

        return seed;
    },

    // Test timezone synchronization across different scenarios
    testTimezoneSync() {
        console.log('\n🌍 TESTING TIMEZONE SYNCHRONIZATION');
        console.log('='.repeat(60));

        const now = new Date();
        const testScenarios = [
            { name: 'Current Time', date: now },
            { name: 'UTC Midnight Today', date: new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) },
            { name: 'UTC Noon Today', date: new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0) },
            { name: 'UTC Midnight Tomorrow', date: new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) },
            { name: 'UTC Midnight Yesterday', date: new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1) }
        ];

        testScenarios.forEach(scenario => {
            const seed = this.generateUTCSeed(scenario.date);
            const utcString = scenario.date.toUTCString();
            const localString = scenario.date.toString();

            console.log(`\n🕐 ${scenario.name}:`);
            console.log(`  UTC: ${utcString}`);
            console.log(`  Local: ${localString}`);
            console.log(`  🎲 Seed: ${seed}`);
        });

        console.log('\n✅ All scenarios should produce identical seeds for the same UTC date');
    },

    // Check localStorage for schedule data
    checkLocalStorage() {
        console.log('\n💾 LOCAL STORAGE ANALYSIS');
        console.log('='.repeat(60));

        const storageKeys = [
            'video-schedule',
            'scheduler-config',
            'currentVideoIndex',
            'scheduleGenerated',
            'shuffleSeed'
        ];

        storageKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    const parsed = JSON.parse(value);
                    console.log(`📁 ${key}:`, parsed);
                } catch (e) {
                    console.log(`📁 ${key} (raw):`, value);
                }
            } else {
                console.log(`❌ ${key}: Not found`);
            }
        });

        // Check all localStorage keys
        console.log('\n🔍 All localStorage keys:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`  ${key}: ${typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value}`);
        }
    },

    // Check sessionStorage
    checkSessionStorage() {
        console.log('\n💾 SESSION STORAGE ANALYSIS');
        console.log('='.repeat(60));

        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            console.log(`📁 ${key}: ${typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value}`);
        }

        if (sessionStorage.length === 0) {
            console.log('❌ No sessionStorage data found');
        }
    },

    // Check cookies
    checkCookies() {
        console.log('\n🍪 COOKIE ANALYSIS');
        console.log('='.repeat(60));

        const cookies = document.cookie.split(';').filter(cookie => cookie.trim());

        if (cookies.length === 0) {
            console.log('❌ No cookies found');
        } else {
            cookies.forEach(cookie => {
                const [name, value] = cookie.trim().split('=');
                console.log(`🍪 ${name}: ${value}`);
            });
        }
    },

    // Test fetch to get schedule from server
    async fetchScheduleFromServer() {
        console.log('\n🌐 SERVER SCHEDULE FETCH');
        console.log('='.repeat(60));

        try {
            const response = await fetch('/video-schedule.json');
            const scheduleData = await response.json();

            console.log('✅ Server schedule fetched successfully:');
            console.log('  Generated:', new Date(scheduleData.generated).toUTCString());
            console.log('  Current Index:', scheduleData.currentIndex);
            console.log('  Total Played:', scheduleData.totalPlayed);
            console.log('  Current Video:', scheduleData.currentVideo);
            console.log('  Static Detected:', scheduleData.staticDetected);
            console.log('  Total Videos:', scheduleData.shuffledOrder.length);
            console.log('  First 5 videos:', scheduleData.shuffledOrder.slice(0, 5));

            return scheduleData;
        } catch (error) {
            console.error('❌ Failed to fetch schedule from server:', error);
            return null;
        }
    },

    // Test fetch to get config from server
    async fetchConfigFromServer() {
        console.log('\n⚙️ SERVER CONFIG FETCH');
        console.log('='.repeat(60));

        try {
            const response = await fetch('/scheduler-config.json');
            const configData = await response.json();

            console.log('✅ Server config fetched successfully:');
            console.log('  Shuffle Seed:', configData.shuffleSeed);
            console.log('  Timezone Mode:', configData.timezoneMode);
            console.log('  Daily Seed Reset:', configData.dailySeedReset);
            console.log('  Schedule Rebuild Interval:', configData.scheduleRebuildInterval);
            console.log('  Static Detection Threshold:', configData.staticDetectionThreshold);

            return configData;
        } catch (error) {
            console.error('❌ Failed to fetch config from server:', error);
            return null;
        }
    },

    // Full diagnostic report
    async runFullDiagnostic() {
        console.clear();
        console.log('🔍 VIDEO SCHEDULER FULL DIAGNOSTIC');
        console.log('='.repeat(80));
        console.log('Run this in browser console and share the output');
        console.log('='.repeat(80));

        // 1. Browser info
        const browserInfo = this.getBrowserInfo();

        // 2. UTC seed calculation
        const currentSeed = this.generateUTCSeed();

        // 3. Timezone sync test
        this.testTimezoneSync();

        // 4. Local storage check
        this.checkLocalStorage();

        // 5. Session storage check
        this.checkSessionStorage();

        // 6. Cookie check
        this.checkCookies();

        // 7. Server data (if available)
        const serverSchedule = await this.fetchScheduleFromServer();
        const serverConfig = await this.fetchConfigFromServer();

        // 8. Comparison analysis
        console.log('\n🔍 COMPARISON ANALYSIS');
        console.log('='.repeat(60));

        if (serverSchedule && serverConfig) {
            const browserSeed = currentSeed;
            const serverSeed = serverConfig.shuffleSeed;

            console.log(`Browser UTC Seed: ${browserSeed}`);
            console.log(`Server Shuffle Seed: ${serverSeed}`);
            console.log(`Seeds Match: ${browserSeed === serverSeed ? '✅ YES' : '❌ NO'}`);

            if (browserSeed !== serverSeed) {
                console.log('\n⚠️  SEED MISMATCH DETECTED!');
                console.log('This explains why different browsers show different clips.');
                console.log('Possible causes:');
                console.log('- Server using different UTC date calculation');
                console.log('- Schedule not properly synced');
                console.log('- Browser caching issues');
            }
        }

        // 9. Recommendations
        console.log('\n💡 RECOMMENDATIONS');
        console.log('='.repeat(60));

        if (serverSchedule && serverConfig) {
            console.log('✅ Server data available - compare seeds above');
        } else {
            console.log('❌ Server data not accessible - check server connectivity');
        }

        console.log('📋 Copy this entire output and share for diagnosis');
        console.log('🔄 Try refreshing the page and running again');
        console.log('🌐 Test in different browsers to compare results');

        return {
            browserInfo,
            currentSeed,
            serverSchedule,
            serverConfig
        };
    },

    // Quick check for immediate debugging
    quickCheck() {
        console.log('⚡ QUICK SCHEDULE CHECK');
        console.log('='.repeat(40));

        const info = this.getBrowserInfo();
        const seed = this.generateUTCSeed();

        console.log(`\n🎲 Your browser UTC seed: ${seed}`);
        console.log(`📅 Today (UTC): ${info.utcDate}`);
        console.log(`🕐 Current UTC hour: ${info.utcHour}`);
        console.log(`🌍 Your timezone: ${info.timezone}`);

        console.log('\n📋 Copy this output and share for quick diagnosis');
        return { info, seed };
    }
};

// Auto-expose helpful messages
console.log('🔧 Video Scheduler Debug Tools Loaded!');
console.log('💡 Available commands:');
console.log('  VideoSchedulerDebug.quickCheck() - Fast diagnosis');
console.log('  VideoSchedulerDebug.runFullDiagnostic() - Complete analysis');
console.log('  VideoSchedulerDebug.getBrowserInfo() - Browser details');
console.log('  VideoSchedulerDebug.testTimezoneSync() - Test UTC sync');
console.log('  VideoSchedulerDebug.checkLocalStorage() - Check stored data');