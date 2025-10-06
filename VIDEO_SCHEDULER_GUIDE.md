# Video Scheduler with Static Prevention

## Overview
The Video Scheduler creates a shuffled playlist system that ensures each video plays once before any repeats, with automatic static detection that pauses all videos during interference. The schedule persists between runs and only regenerates when manually triggered or after the configured interval.

## Key Features

### 🎲 **No Repetition Shuffling**
- Each video plays exactly once before any video repeats
- Uses Fisher-Yates shuffle algorithm for true randomization
- Persistent shuffle seed ensures reproducible schedules
- Full cycle completion tracking

### 📡 **Static Detection & Prevention**
- Automatically detects audio static/interference
- Immediately stops video playback during static
- Prevents video playback until static clears
- Configurable static threshold and timeout

### 💾 **Persistent Scheduling**
- Schedule saved to `video-schedule.json`
- Configuration saved to `scheduler-config.json`
- Survives server restarts and crashes
- Only changes when manually triggered

### 🔄 **Smart Regeneration**
- Automatic regeneration after time interval (default: 1 hour)
- Manual regeneration available
- Preserves current playback position during regeneration

## Usage

### Start Scheduled Playback
```bash
npm run schedule:start
```

### View Schedule Information
```bash
npm run schedule:info
```

### Force Schedule Regeneration
```bash
npm run schedule:regenerate
```

### Test Static Detection
```bash
npm run schedule:test-static
```

## Configuration

### Default Settings
```json
{
  "shuffleSeed": 123456,
  "scheduleRebuildInterval": 3600000,
  "staticDetectionThreshold": 0.3,
  "maxStaticDuration": 5000,
  "videoTransitionDelay": 2000
}
```

### Settings Explained
- **shuffleSeed**: Seed for reproducible shuffling (auto-generated)
- **scheduleRebuildInterval**: Time before auto-regeneration (milliseconds)
- **staticDetectionThreshold**: Static level to trigger video stop (0.0-1.0)
- **maxStaticDuration**: Maximum time to wait for static to clear (milliseconds)
- **videoTransitionDelay**: Delay between videos (milliseconds)

## File Structure

```
video-scheduler.js          # Main scheduler application
video-schedule.json         # Current schedule state
scheduler-config.json       # Scheduler configuration
saved_videos/              # Video files directory
```

## Schedule Information

The scheduler tracks:
- Total videos in rotation
- Current position in cycle
- Total videos played since start
- Currently playing video
- Static detection status
- Schedule generation time and age
- Shuffle seed for reproducibility

## Static Detection System

### How It Works
1. **Detection**: Monitors audio for static/interference
2. **Threshold**: Activates when static level exceeds threshold (default: 30%)
3. **Stoppage**: Immediately stops current video playback
4. **Persistence**: Keeps videos paused until static clears
5. **Timeout**: Maximum wait time before continuing (default: 5 seconds)

### Static Response Flow
```
Static Detected → Stop Current Video → Wait for Clear → Resume Playback
```

## Shuffling Algorithm

### Fisher-Yates Implementation
```javascript
shuffleArray(array, seed) {
    const shuffled = [...array];
    let currentIndex = shuffled.length;

    while (currentIndex !== 0) {
        const randomIndex = Math.floor(random() * currentIndex);
        currentIndex--;
        [shuffled[currentIndex], shuffled[randomIndex]] =
        [shuffled[randomIndex], shuffled[currentIndex]];
    }

    return shuffled;
}
```

### No Repetition Guarantee
- Each video appears exactly once in the shuffled order
- Complete cycle must finish before any video can repeat
- Position tracking prevents premature repeats
- Cycle completion logging for monitoring

## Schedule Persistence

### Saved Data
```json
{
  "generated": 1728234567890,
  "shuffledOrder": ["video1.mp4", "video3.mp4", "video2.mp4"],
  "currentIndex": 1,
  "totalPlayed": 5,
  "staticDetected": false,
  "currentVideo": "video3.mp4"
}
```

### Recovery Behavior
- **Server Restart**: Resumes from exact position in schedule
- **Crash Recovery**: Maintains place in current cycle
- **Manual Regeneration**: Can preserve or reset position

## Integration with Media Downloader

The scheduler automatically detects new videos:
- Scans `saved_videos/` directory for available videos
- Updates schedule when new videos are added
- Handles video removal gracefully
- Maintains shuffle consistency

## Monitoring and Debugging

### Real-time Status
```bash
📊 SCHEDULE INFORMATION:
==================================================
Total videos in rotation: 15
Current position in cycle: 8/15
Total videos played: 23
Current video: pepe-meme.mp4
Static active: NO
Schedule generated: 10/6/2025, 8:30:15 AM
Schedule age: 45 minutes
Shuffle seed: 742891
==================================================
```

### Static Detection Testing
```bash
🧪 Simulating static at 50.0% for 3000ms
📡 Static detected (50.0%) - stopping video playback
⏸️  Stopping video: current-video.mp4
✅ Static cleared - resuming normal playback
```

## Advanced Usage

### Custom Configuration
Edit `scheduler-config.json` to customize behavior:
```json
{
  "scheduleRebuildInterval": 7200000,  // 2 hours
  "staticDetectionThreshold": 0.4,     // 40% static
  "videoTransitionDelay": 3000         // 3 second transitions
}
```

### Integration with Other Systems
The scheduler can be integrated with:
- **Stream overlays**: Display current video info
- **API endpoints**: Remote schedule control
- **Database backends**: Multi-server synchronization
- **Monitoring systems**: Alert on static detection

## Troubleshooting

### Common Issues

**Videos not playing:**
- Check if static detection is active
- Verify video files exist in `saved_videos/`
- Check schedule regeneration status

**Schedule regenerating too often:**
- Increase `scheduleRebuildInterval` in config
- Check for system clock issues

**Static detection too sensitive:**
- Increase `staticDetectionThreshold`
- Check audio input configuration

### Logs and Debugging
- Scheduler provides detailed console output
- Check `video-schedule.json` for current state
- Use `npm run schedule:info` for current status

## Performance Considerations

### Memory Usage
- Schedule file is small (< 1KB for 1000 videos)
- Video list loaded on demand
- Static detection runs continuously

### CPU Usage
- Shuffling algorithm O(n) complexity
- Static detection monitoring minimal impact
- Schedule persistence lightweight

## Security Notes

- Schedule files contain only video names and positions
- No sensitive data stored in configuration
- Static detection only monitors audio levels
- File system access limited to configured directories

## Future Enhancements

### Planned Features
- Web-based schedule management interface
- API endpoints for remote control
- Advanced static pattern detection
- Multiple schedule profiles
- Integration with streaming platforms

### Extensibility
The scheduler is designed to be extended with:
- Custom static detection algorithms
- Additional video sources
- Alternative shuffling methods
- Integration with external systems