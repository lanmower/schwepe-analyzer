/**
 * VIDEO DUPLICATION & AUDIO BLEED FIXES
 * Apply these fixes to the Schwelevision class to resolve:
 * 1. Videos playing twice
 * 2. Audio bleeding during static moments
 */

// Fix 1: Enhanced video cleanup function
window SchwelevisionFixes = {
    // Enhanced video stop function
    stopAllVideosCompletely() {
        if (!window.tv) return;

        console.log('🛑 COMPLETE VIDEO STOP - Fixing duplication');

        // Stop ALL video elements completely
        const allVideos = [
            window.tv.currentVideoElement,
            window.tv.nextVideoElement,
            window.tv.thirdVideoElement
        ];

        allVideos.forEach((video, index) => {
            if (!video) return;

            console.log(`  Stopping video ${index}: ${video.src ? video.src.split('/').pop() : 'no src'}`);

            // Complete stop sequence
            video.pause();
            video.currentTime = 0;
            video.volume = 0;
            video.muted = true;

            // Remove source completely
            video.src = '';
            video.load(); // Reset video element

            // Hide all videos
            video.style.display = 'none';
        });

        // Hide all video containers
        document.getElementById('currentVideo').style.display = 'none';
        document.getElementById('nextVideo').style.display = 'none';
        document.getElementById('thirdVideo').style.display = 'none';

        console.log('✅ All videos completely stopped');
    },

    // Enhanced audio cleanup
    stopAllAudioCompletely() {
        if (!window.tv || !window.tv.audioContext) return;

        console.log('🔇 COMPLETE AUDIO STOP - Fixing audio bleed');

        // Stop static noise completely
        if (window.tv.staticNoiseSource) {
            try {
                window.tv.staticNoiseSource.stop();
                window.tv.staticNoiseSource.disconnect();
            } catch (e) {
                // Source might already be stopped
            }
            window.tv.staticNoiseSource = null;
        }

        // Set all audio gains to 0
        if (window.tv.gainNode) {
            window.tv.gainNode.gain.value = 0;
        }
        if (window.tv.whineGain) {
            window.tv.whineGain.gain.value = 0;
        }
        if (window.tv.humGain) {
            window.tv.humGain.gain.value = 0;
        }
        if (window.tv.crackleGain) {
            window.tv.crackleGain.gain.value = 0;
        }

        console.log('✅ All audio completely stopped');
    },

    // Clear all pending timeouts
    clearAllTimeouts() {
        if (!window.tv) return;

        console.log('⏰ CLEARING ALL TIMEOUTS - Fixing conflicts');

        if (window.tv.scheduledPlayTimeout) {
            clearTimeout(window.tv.scheduledPlayTimeout);
            window.tv.scheduledPlayTimeout = null;
        }

        // Also clear any buffer monitoring intervals
        if (window.tv.bufferMonitorInterval) {
            clearInterval(window.tv.bufferMonitorInterval);
            window.tv.bufferMonitorInterval = null;
        }

        console.log('✅ All timeouts cleared');
    },

    // Enhanced static display
    showStaticCleanly() {
        console.log('📺 SHOWING STATIC CLEANLY - Fixing visual issues');

        // Stop everything first
        this.stopAllVideosCompletely();
        this.stopAllAudioCompletely();

        // Show static with fresh state
        const staticElement = document.querySelector('.tv-static');
        if (staticElement) {
            staticElement.classList.add('active', 'temporal-refresh');
        }

        // Start fresh static noise
        if (window.tv && window.tv.playStaticNoise) {
            window.tv.playStaticNoise();
        }

        console.log('✅ Static showing cleanly');
    },

    // Enhanced video transition
    transitionToVideoCleanly(videoElement, videoPath) {
        console.log('🎬 CLEAN VIDEO TRANSITION - Fixing duplication');

        // Complete cleanup first
        this.stopAllVideosCompletely();
        this.stopAllAudioCompletely();

        // Clear static
        const staticElement = document.querySelector('.tv-static');
        if (staticElement) {
            staticElement.classList.remove('active', 'temporal-refresh');
        }

        // Clear canvas
        if (window.tv && window.tv.noiseCtx) {
            window.tv.noiseCtx.clearRect(0, 0, window.tv.noiseCanvas.width, window.tv.noiseCanvas.height);
            window.tv.noiseCtx.fillStyle = '#000000';
            window.tv.noiseCtx.fillRect(0, 0, window.tv.noiseCanvas.width, window.tv.noiseCanvas.height);
        }

        // Show only current video
        const currentVideoEl = document.getElementById('currentVideo');
        currentVideoEl.style.display = 'block';

        // Load and play new video
        videoElement.src = videoPath;
        videoElement.volume = window.tv ? window.tv.volume / 100 : 0.5;
        videoElement.muted = false;
        videoElement.load();

        // Restore visual elements
        document.querySelector('.scan-lines').style.display = 'block';
        document.querySelector('.vignette').style.display = 'block';
        document.querySelector('.logo-overlay').style.display = 'block';

        console.log('✅ Clean video transition complete');
    },

    // Fix for double event listeners
    preventDuplicateVideoEnd() {
        if (!window.tv) return;

        console.log('🚫 PREVENTING DUPLICATE VIDEO END');

        // Store reference to prevent multiple calls
        if (window.tv._videoEndCalled) {
            console.log('⚠️ Video end already called, preventing duplicate');
            return false;
        }

        window.tv._videoEndCalled = true;

        // Clear flag after a delay
        setTimeout(() => {
            window.tv._videoEndCalled = false;
        }, 1000);

        return true;
    },

    // Comprehensive fix application
    applyAllFixes() {
        console.log('🔧 APPLYING ALL VIDEO DUPLICATION FIXES');
        console.log('='.repeat(60));

        // Override problematic methods
        if (window.tv) {
            // Store original methods
            const originalOnScheduledVideoEnd = window.tv.onScheduledVideoEnd.bind(window.tv);
            const originalPlayScheduledVideo = window.tv.playScheduledVideo.bind(window.tv);

            // Override onScheduledVideoEnd
            window.tv.onScheduledVideoEnd = function() {
                if (!SchwelevisionFixes.preventDuplicateVideoEnd()) {
                    return;
                }

                console.log('📺 FIXED: Scheduled video ended, moving to next');

                // Complete cleanup
                SchwelevisionFixes.clearAllTimeouts();
                SchwelevisionFixes.stopAllVideosCompletely();
                SchwelevisionFixes.stopAllAudioCompletely();

                // Increment index
                this.currentProgramIndex++;
                if (this.currentProgramIndex >= this.loopSchedule.length) {
                    this.currentProgramIndex = 0;
                }

                // Random static transition (20% chance)
                if (Math.random() < 0.2) {
                    console.log('📺 Fixed random static transition');
                    SchwelevisionFixes.showStaticCleanly();

                    setTimeout(() => {
                        this.startSynchronizedBroadcast();
                    }, 500);
                } else {
                    this.startSynchronizedBroadcast();
                }
            };

            // Override playScheduledVideo to remove duplicate timeout
            window.tv.playScheduledVideo = async function(seekTime = 0) {
                const currentSlot = this.loopSchedule[this.currentProgramIndex];
                const now = Date.now();
                const elapsedSinceEpoch = now - this.epochStart;
                const slotStartTime = this.epochStart + Math.floor(elapsedSinceEpoch / this.loopDuration) * this.loopDuration + currentSlot.offsetMs;
                const actualSeekTime = (now - slotStartTime) / 1000;

                if (!this.isVideoPreloaded) {
                    console.log('⚠️ Video not fully loaded, staying on static');

                    const checkInterval = setInterval(async () => {
                        if (this.isVideoPreloaded) {
                            clearInterval(checkInterval);
                            const newNow = Date.now();
                            const newElapsed = newNow - this.epochStart;
                            const newSlotStart = this.epochStart + Math.floor(newElapsed / this.loopDuration) * this.loopDuration + currentSlot.offsetMs;
                            const newSeekTime = (newNow - newSlotStart) / 1000;

                            if (newSeekTime < currentSlot.duration / 1000) {
                                console.log(`✅ Video loaded, joining at ${newSeekTime.toFixed(1)}s`);
                                await this.playScheduledVideo(newSeekTime);
                            } else {
                                console.log('⏭️ Video took too long to load, skipping to next');
                                this.currentProgramIndex++;
                                this.onScheduledVideoEnd();
                            }
                        }
                    }, 100);

                    // Remove the duplicate timeout that was causing issues
                    setTimeout(() => {
                        if (!this.isVideoPreloaded) {
                            clearInterval(checkInterval);
                            console.log('⏭️ Load timeout, skipping to next');
                            this.currentProgramIndex++;
                            this.onScheduledVideoEnd();
                        }
                    }, 10000);

                    return;
                }

                // Check if video is ready to play
                if (this.currentVideoElement.readyState < 2) {
                    console.log(`⚠️ Video not ready (readyState: ${this.currentVideoElement.readyState}), retrying...`);
                    this.isVideoPreloaded = false;
                    setTimeout(() => this.playScheduledVideo(actualSeekTime), 100);
                    return;
                }

                // Clean transition to video
                SchwelevisionFixes.transitionToVideoCleanly(this.currentVideoElement, this.currentVideoElement.src);

                if (actualSeekTime > 0 && actualSeekTime < currentSlot.duration / 1000) {
                    this.currentVideoElement.currentTime = actualSeekTime;
                    console.log(`⏩ Seeking to ${actualSeekTime.toFixed(1)}s to sync with schedule`);
                }

                await this.currentVideoElement.play();

                document.getElementById('loadingText').style.display = 'none';
                document.getElementById('nowPlaying').style.display = 'block';

                const remainingTime = currentSlot.duration - (actualSeekTime * 1000);

                // Store buffer monitor interval for cleanup
                this.bufferMonitorInterval = setInterval(() => {
                    if (!this.currentVideoElement.paused && this.currentVideoElement.readyState < 3) {
                        console.log('⚠️ Video buffering detected, pausing and showing static');
                        this.currentVideoElement.pause();
                        SchwelevisionFixes.showStaticCleanly();

                        const waitForBuffer = setInterval(() => {
                            if (this.currentVideoElement.readyState >= 3) {
                                clearInterval(waitForBuffer);
                                SchwelevisionFixes.transitionToVideoCleanly(this.currentVideoElement, this.currentVideoElement.src);
                                this.currentVideoElement.play();
                                console.log('✅ Buffering complete, resuming playback');
                            }
                        }, 100);
                    }
                }, 100);

                // Store video end flag
                this._videoEndCalled = false;

                // ONLY use the scheduled timeout, remove duplicate ended event
                const scheduledEndTimeout = remainingTime;
                setTimeout(() => {
                    this.onScheduledVideoEnd();
                }, scheduledEndTimeout);

                // Preload next video
                const nextIndex = (this.currentProgramIndex + 1) % this.loopSchedule.length;
                await this.preloadScheduledVideo(nextIndex);

                console.log(`📺 FIXED: Playing video with ${(remainingTime / 1000).toFixed(1)}s remaining`);
            };
        }

        console.log('✅ All video duplication fixes applied');
        console.log('🔧 New command available: diagnoseVideoDuplication()');
    }
};

// Auto-apply fixes after 2 seconds
setTimeout(() => {
    if (window.tv) {
        SchwelevisionFixes.applyAllFixes();
        console.log('🎉 Video duplication fixes auto-applied');
    } else {
        console.log('⚠️ TV instance not found, fixes not applied');
    }
}, 2000);

console.log('🛡️ Video Duplication Fixes loaded');
console.log('🔧 Manual fix available: SchwelevisionFixes.applyAllFixes()');