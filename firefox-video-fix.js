/**
 * Firefox Video Loading Fix
 * Addresses readyState: 0 issues and loading timeouts
 */

window.FirefoxVideoFix = {
    // Check if running in Firefox
    isFirefox() {
        return navigator.userAgent.toLowerCase().includes('firefox');
    },

    // Enhanced video preloading for Firefox
    async preloadVideoFirefox(videoElement, videoUrl, timeout = 3000) {
        if (!this.isFirefox()) {
            return false; // Use original method for other browsers
        }

        console.log('🦊 Firefox video preload detected:', videoUrl);

        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;
            const checkInterval = 300; // Check every 300ms

            const checkReadyState = () => {
                attempts++;

                if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA
                    console.log(`✅ Firefox video ready after ${attempts} attempts (readyState: ${videoElement.readyState})`);
                    resolve(true);
                    return;
                }

                if (attempts >= maxAttempts) {
                    console.warn(`⚠️ Firefox video failed to load after ${maxAttempts} attempts (readyState: ${videoElement.readyState})`);
                    resolve(false);
                    return;
                }

                console.log(`🔄 Firefox video loading... attempt ${attempts}/${maxAttempts} (readyState: ${videoElement.readyState})`);
                setTimeout(checkReadyState, checkInterval);
            };

            // Start loading
            videoElement.src = videoUrl;
            videoElement.load();

            // Start checking after a brief delay
            setTimeout(checkReadyState, 100);
        });
    },

    // Firefox-compatible video creation
    createFirefoxVideoElement(videoUrl) {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous'; // Helps with CORS issues

        // Firefox-specific event handlers
        video.addEventListener('loadeddata', () => {
            console.log('🦊 Firefox video: loadeddata event');
        });

        video.addEventListener('canplay', () => {
            console.log('🦊 Firefox video: canplay event');
        });

        video.addEventListener('canplaythrough', () => {
            console.log('🦊 Firefox video: canplaythrough event');
        });

        video.addEventListener('error', (e) => {
            console.error('🦊 Firefox video error:', e);
        });

        return video;
    },

    // Fix for Firefox video scheduling
    fixFirefoxSchedule() {
        if (!this.isFirefox()) return;

        console.log('🦊 Applying Firefox video loading fixes');

        // Override video loading methods if they exist
        if (window.videoScheduler) {
            const originalPreloadMethod = window.videoScheduler.preloadScheduledVideo;

            window.videoScheduler.preloadScheduledVideo = async function(videoUrl) {
                if (FirefoxVideoFix.isFirefox()) {
                    console.log('🦊 Using Firefox-enhanced video preloading');

                    const video = FirefoxVideoFix.createFirefoxVideoElement(videoUrl);
                    const success = await FirefoxVideoFix.preloadVideoFirefox(video, videoUrl);

                    if (success) {
                        return video;
                    } else {
                        console.warn('🦊 Firefox video preload failed, using fallback');
                        // Return original method result as fallback
                        return originalPreloadMethod.call(this, videoUrl);
                    }
                } else {
                    return originalPreloadMethod.call(this, videoUrl);
                }
            };
        }

        // Increase timeout for Firefox
        if (window.VIDEO_LOAD_TIMEOUT) {
            window.VIDEO_LOAD_TIMEOUT = 5000; // Increase from 500ms to 5000ms
            console.log('🦊 Firefox video timeout increased to 5000ms');
        }
    },

    // Quick diagnostic for Firefox issues
    diagnoseFirefoxVideo() {
        if (!this.isFirefox()) {
            console.log('Not running in Firefox');
            return;
        }

        console.log('🦊 Firefox Video Diagnostic');
        console.log('='.repeat(40));

        const info = {
            userAgent: navigator.userAgent,
            firefoxVersion: navigator.userAgent.match(/Firefox\/(\d+)/)?.[1] || 'unknown',
            videoSupport: !!document.createElement('video').canPlayType,
            webmSupport: document.createElement('video').canPlayType('video/webm'),
            mp4Support: document.createElement('video').canPlayType('video/mp4'),
            movSupport: document.createElement('video').canPlayType('video/quicktime')
        };

        console.log('Firefox Version:', info.firefoxVersion);
        console.log('Video Support:', info.videoSupport);
        console.log('WebM Support:', info.webmSupport);
        console.log('MP4 Support:', info.mp4Support);
        console.log('MOV Support:', info.movSupport);

        // Check current video elements
        const videos = document.querySelectorAll('video');
        console.log('Video elements on page:', videos.length);

        videos.forEach((video, index) => {
            console.log(`Video ${index}:`, {
                src: video.src?.split('/').pop() || 'no src',
                readyState: video.readyState,
                networkState: video.networkState,
                buffered: video.buffered.length,
                currentTime: video.currentTime,
                duration: video.duration
            });
        });

        return info;
    }
};

// Auto-apply Firefox fixes
if (typeof window !== 'undefined') {
    if (window.FirefoxVideoFix.isFirefox()) {
        console.log('🦊 Firefox detected - applying video loading fixes');
        window.FirefoxVideoFix.fixFirefoxSchedule();
    }
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirefoxVideoFix;
}