/**
 * Run this in Firefox console to fix video loading issues
 * Copy and paste this entire script into Firefox developer console
 */

console.log('🦊 Applying Firefox video loading fixes...');

// Increase video load timeout globally
if (typeof window !== 'undefined') {
    window.VIDEO_LOAD_TIMEOUT = 5000;
    console.log('✅ Video timeout increased to 5000ms');
}

// Override video loading methods
if (window.videoScheduler && window.videoScheduler.preloadScheduledVideo) {
    const originalMethod = window.videoScheduler.preloadScheduledVideo;

    window.videoScheduler.preloadScheduledVideo = async function(videoUrl) {
        console.log('🦊 Firefox enhanced video preload:', videoUrl.split('/').pop());

        const video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';

        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 15;

            const checkReady = () => {
                attempts++;

                if (video.readyState >= 3) {
                    console.log(`✅ Firefox video ready after ${attempts} attempts`);
                    resolve(video);
                    return;
                }

                if (attempts >= maxAttempts) {
                    console.warn(`⚠️ Firefox video failed after ${attempts} attempts`);
                    resolve(originalMethod.call(this, videoUrl));
                    return;
                }

                setTimeout(checkReady, 200);
            };

            video.src = videoUrl;
            video.load();
            setTimeout(checkReady, 100);
        });
    };

    console.log('✅ Firefox video loading method patched');
}

// Diagnostic info
const firefoxVersion = navigator.userAgent.match(/Firefox\/(\d+)/)?.[1] || 'unknown';
console.log(`🦊 Firefox version: ${firefoxVersion}`);

// Check video support
const testVideo = document.createElement('video');
console.log('📹 Video format support:');
console.log('  MP4:', testVideo.canPlayType('video/mp4'));
console.log('  WebM:', testVideo.canPlayType('video/webm'));
console.log('  MOV:', testVideo.canPlayType('video/quicktime'));

console.log('🎯 Firefox fixes applied! Try refreshing the page or letting videos load naturally.');
console.log('📋 If issues persist, check the console for readyState values and network errors.');