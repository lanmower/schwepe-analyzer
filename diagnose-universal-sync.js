/**
 * DIAGNOSE EXISTING UNIVERSAL SYNC
 * This script helps diagnose why the existing universal sync isn't working
 *
 * Add this to your video player page to debug the existing system
 */

<script>
(function() {
    'use strict';

    console.log('🔍 DIAGNOSING EXISTING UNIVERSAL SYNC');
    console.log('='.repeat(80));

    function diagnoseExistingSync() {
        const now = new Date();

        // 1. Check existing video scheduler
        console.log('1️⃣ Existing Video Scheduler Check:');
        if (window.videoScheduler) {
            console.log('✅ Video scheduler found');
            console.log('  Current Index:', window.videoScheduler.schedule?.currentIndex);
            console.log('  Current Video:', window.videoScheduler.schedule?.currentVideo);
            console.log('  Total Played:', window.videoScheduler.schedule?.totalPlayed);
            console.log('  Static Detected:', window.videoScheduler.schedule?.staticDetected);
        } else {
            console.log('❌ No video scheduler found');
        }

        // 2. Check server schedule
        console.log('\n2️⃣ Server Schedule Check:');
        fetch('/video-schedule.json')
            .then(response => response.json())
            .then(schedule => {
                console.log('✅ Server schedule fetched');
                console.log('  Generated:', new Date(schedule.generated).toUTCString());
                console.log('  Current Index:', schedule.currentIndex);
                console.log('  Current Video:', schedule.currentVideo);
                console.log('  Total Videos:', schedule.shuffledOrder.length);
                console.log('  First 3 videos:', schedule.shuffledOrder.slice(0, 3));

                // Check if we should be at a different position
                checkExpectedPosition(schedule, now);
            })
            .catch(e => console.log('❌ Failed to fetch server schedule:', e));

        // 3. Check server config
        console.log('\n3️⃣ Server Config Check:');
        fetch('/scheduler-config.json')
            .then(response => response.json())
            .then(config => {
                console.log('✅ Server config fetched');
                console.log('  Shuffle Seed:', config.shuffleSeed);
                console.log('  Timezone Mode:', config.timezoneMode);
                console.log('  Daily Seed Reset:', config.dailySeedReset);

                // Calculate expected seed
                const expectedSeed = calculateExpectedUTCSeed(now);
                console.log('  Expected UTC Seed:', expectedSeed);
                console.log('  Seeds Match:', expectedSeed === config.shuffleSeed ? '✅ YES' : '❌ NO');
            })
            .catch(e => console.log('❌ Failed to fetch server config:', e));

        // 4. Check browser timezone/UTC
        console.log('\n4️⃣ Browser Timezone/UTC Check:');
        console.log('  Local Time:', now.toString());
        console.log('  UTC Time:', now.toUTCString());
        console.log('  Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
        console.log('  UTC Date:', now.toISOString().split('T')[0]);
        console.log('  UTC Hour:', now.getUTCHours());

        // 5. Check localStorage
        console.log('\n5️⃣ Local Storage Check:');
        console.log('  currentVideoIndex:', localStorage.getItem('currentVideoIndex'));
        console.log('  forcePosition:', localStorage.getItem('forcePosition'));
        console.log('  Any schedule data:', localStorage.getItem('video-schedule') ? 'Yes' : 'No');

        // 6. Check video elements
        console.log('\n6️⃣ Video Elements Check:');
        const videos = document.querySelectorAll('video');
        console.log('  Video count:', videos.length);
        videos.forEach((video, index) => {
            console.log(`  Video ${index}:`, {
                src: video.src ? video.src.split('/').pop() : 'no src',
                readyState: video.readyState,
                currentTime: video.currentTime,
                paused: video.paused
            });
        });
    }

    function calculateExpectedUTCSeed(date) {
        const targetDate = date || new Date();
        const utcDate = new Date(targetDate.toISOString());
        const utcMidnight = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        const daysSinceEpoch = Math.floor(utcMidnight.getTime() / (24 * 60 * 60 * 1000));
        return (daysSinceEpoch * 31) % 1000000;
    }

    function checkExpectedPosition(schedule, now) {
        console.log('\n🎯 Expected Position Analysis:');

        // Calculate where we should be based on time
        const generatedTime = new Date(schedule.generated);
        const msSinceGenerated = now.getTime() - generatedTime.getTime();

        // Assuming 10 seconds per video (adjust if different)
        const videoDuration = 10000; // 10 seconds in ms
        const expectedIndex = Math.floor(msSinceGenerated / videoDuration) % schedule.shuffledOrder.length;
        const expectedVideo = schedule.shuffledOrder[expectedIndex];

        console.log('  Schedule Generated:', generatedTime.toUTCString());
        console.log('  Time Since Generated:', Math.floor(msSinceGenerated / 1000) + 's');
        console.log('  Expected Index:', expectedIndex);
        console.log('  Expected Video:', expectedVideo);

        // Compare with actual
        const actualIndex = window.videoScheduler?.schedule?.currentIndex;
        const actualVideo = window.videoScheduler?.schedule?.currentVideo;

        console.log('  Actual Index:', actualIndex);
        console.log('  Actual Video:', actualVideo);

        if (expectedIndex !== actualIndex || expectedVideo !== actualVideo) {
            console.log('⚠️ POSITION MISMATCH DETECTED!');
            console.log('  This explains why different browsers show different videos');
            console.log('  Possible causes:');
            console.log('  - Each browser tracking position independently');
            console.log('  - Server schedule not being followed correctly');
            console.log('  - Time-based calculation vs manual advancement conflict');
        } else {
            console.log('✅ Position matches expected');
        }
    }

    function quickDiagnosis() {
        console.log('⚡ QUICK DIAGNOSIS:');
        console.log('='.repeat(40));

        const now = new Date();
        const expectedSeed = calculateExpectedUTCSeed(now);

        console.log('Browser UTC Seed:', expectedSeed);
        console.log('Local Time:', now.toString());
        console.log('UTC Time:', now.toUTCString());
        console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

        if (window.videoScheduler) {
            console.log('Current Index:', window.videoScheduler.schedule?.currentIndex);
            console.log('Current Video:', window.videoScheduler.schedule?.currentVideo);
        }

        console.log('\n📋 Share this output for diagnosis');
    }

    // Auto-run diagnosis
    diagnoseExistingSync();

    // Add global methods
    window.diagnoseSync = diagnoseExistingSync;
    window.quickDiagnosis = quickDiagnosis;

    console.log('\n🔧 Diagnosis methods available:');
    console.log('  diagnoseSync() - Full diagnosis');
    console.log('  quickDiagnosis() - Quick check');

})();
</script>