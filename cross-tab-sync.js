/**
 * Cross-Tab Synchronization for Video Scheduler
 * Keeps multiple browser tabs perfectly synchronized
 */

window.CrossTabSync = {
    channel: null,
    isMaster: false,
    syncInterval: null,
    lastSyncTime: 0,

    init() {
        this.setupBroadcastChannel();
        this.determineMasterTab();
        this.startSyncLoop();
        this.setupEventListeners();
        console.log('🔗 Cross-tab sync initialized');
    },

    setupBroadcastChannel() {
        // Use BroadcastChannel for cross-tab communication
        if ('BroadcastChannel' in window) {
            this.channel = new BroadcastChannel('video-scheduler-sync');
            this.channel.onmessage = (event) => this.handleSyncMessage(event.data);
            console.log('📡 Broadcast channel established');
        } else {
            // Fallback to localStorage events for older browsers
            window.addEventListener('storage', (event) => {
                if (event.key === 'video-scheduler-sync') {
                    this.handleSyncMessage(JSON.parse(event.newValue));
                }
            });
            console.log('📡 Using localStorage fallback for sync');
        }
    },

    determineMasterTab() {
        // First tab to claim master status wins
        const masterClaim = localStorage.getItem('video-scheduler-master');
        const now = Date.now();

        if (!masterClaim || (now - parseInt(masterClaim)) > 5000) {
            // No master or master is stale - become master
            this.isMaster = true;
            localStorage.setItem('video-scheduler-master', now.toString());
            console.log('👑 This tab is now the master');
        } else {
            this.isMaster = false;
            console.log('👤 This tab is a follower');
        }
    },

    startSyncLoop() {
        // Sync every 5 seconds
        this.syncInterval = setInterval(() => {
            this.performSync();
        }, 5000);

        // Also sync immediately on key events
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Sync when video changes
        if (window.videoScheduler) {
            const originalAdvanceVideo = window.videoScheduler.advanceToNextVideo;
            if (originalAdvanceVideo) {
                window.videoScheduler.advanceToNextVideo = (...args) => {
                    const result = originalAdvanceVideo.apply(window.videoScheduler, args);
                    this.broadcastSync();
                    return result;
                };
            }
        }

        // Sync on window focus/visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.requestSync();
            }
        });

        window.addEventListener('focus', () => {
            this.requestSync();
        });
    },

    handleSyncMessage(data) {
        if (data.type === 'sync-broadcast') {
            this.applySyncData(data.payload);
        } else if (data.type === 'sync-request') {
            if (this.isMaster) {
                this.broadcastSync();
            }
        } else if (data.type === 'master-claim') {
            if (!this.isMaster) {
                console.log('📡 Master tab updated');
            }
        }
    },

    performSync() {
        if (this.isMaster) {
            this.broadcastSync();
        } else {
            this.requestSync();
        }
    },

    broadcastSync() {
        if (!this.isMaster) return;

        const syncData = this.getSyncData();
        const message = {
            type: 'sync-broadcast',
            payload: syncData,
            timestamp: Date.now(),
            tabId: this.getTabId()
        };

        if (this.channel) {
            this.channel.postMessage(message);
        } else {
            // Fallback to localStorage
            localStorage.setItem('video-scheduler-sync', JSON.stringify(message));
        }

        this.lastSyncTime = Date.now();
        console.log('📡 Sync broadcast sent');
    },

    requestSync() {
        if (this.isMaster) return;

        const message = {
            type: 'sync-request',
            timestamp: Date.now(),
            tabId: this.getTabId()
        };

        if (this.channel) {
            this.channel.postMessage(message);
        } else {
            localStorage.setItem('video-scheduler-sync', JSON.stringify(message));
        }

        console.log('📨 Sync request sent');
    },

    getSyncData() {
        const data = {
            currentIndex: 0,
            currentVideo: null,
            totalPlayed: 0,
            staticDetected: false,
            timestamp: Date.now()
        };

        if (window.videoScheduler && window.videoScheduler.schedule) {
            data.currentIndex = window.videoScheduler.schedule.currentIndex;
            data.currentVideo = window.videoScheduler.schedule.currentVideo;
            data.totalPlayed = window.videoScheduler.schedule.totalPlayed;
            data.staticDetected = window.videoScheduler.schedule.staticDetected;
        }

        // Add browser debug info
        if (window.browserDebugInfo) {
            data.debugInfo = window.browserDebugInfo;
        }

        return data;
    },

    applySyncData(syncData) {
        if (!syncData || syncData.tabId === this.getTabId()) return;

        console.log('🔄 Applying sync data from tab', syncData.tabId);

        if (window.videoScheduler && window.videoScheduler.schedule) {
            // Only apply sync if data is newer
            if (syncData.timestamp > this.lastSyncTime) {
                window.videoScheduler.schedule.currentIndex = syncData.currentIndex;
                window.videoScheduler.schedule.currentVideo = syncData.currentVideo;
                window.videoScheduler.schedule.totalPlayed = syncData.totalPlayed;
                window.videoScheduler.schedule.staticDetected = syncData.staticDetected;

                // Store in localStorage for persistence
                localStorage.setItem('currentVideoIndex', syncData.currentIndex.toString());
                localStorage.setItem('totalPlayed', syncData.totalPlayed.toString());

                console.log('✅ Sync applied:', {
                    currentIndex: syncData.currentIndex,
                    currentVideo: syncData.currentVideo
                });

                this.lastSyncTime = syncData.timestamp;
            }
        }
    },

    getTabId() {
        // Generate a unique ID for this tab
        if (!this.tabId) {
            this.tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.tabId;
    },

    // Force immediate sync across all tabs
    forceSync() {
        console.log('🔄 Forcing immediate sync across all tabs');
        this.determineMasterTab(); // Re-determine master
        this.broadcastSync();
    },

    // Get sync status
    getSyncStatus() {
        return {
            isMaster: this.isMaster,
            tabId: this.getTabId(),
            lastSyncTime: this.lastSyncTime,
            channelType: this.channel ? 'BroadcastChannel' : 'LocalStorage'
        };
    },

    // Cleanup
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        if (this.channel) {
            this.channel.close();
        }
        if (this.isMaster) {
            localStorage.removeItem('video-scheduler-master');
        }
        console.log('🔗 Cross-tab sync destroyed');
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    // Initialize after page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.CrossTabSync.init();
        });
    } else {
        window.CrossTabSync.init();
    }

    // Add global methods
    window.forceSync = () => window.CrossTabSync.forceSync();
    window.syncStatus = () => window.CrossTabSync.getSyncStatus();

    console.log('🔗 Cross-tab sync loaded. Use forceSync() to sync all tabs, syncStatus() to check status.');
}