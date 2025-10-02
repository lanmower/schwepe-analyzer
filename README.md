# Schwepe Analyzer

AI-powered media content analyzer for detecting Schwepe meme tokens in images and videos. Uses advanced machine learning to identify Schwepe-related content with high accuracy.

## Features

- 🔍 **Accurate Detection**: Advanced AI-powered analysis for Schwepe meme content
- 🖼️ **Image Analysis**: Comprehensive image scanning for Schwepe characteristics
- 🎬 **Video Analysis**: Frame-by-frame video content analysis
- 🐸 **Smart Recognition**: Detects frogs, amphibians, shiny shades, and meme parodies
- 🤖 **AI-Generated Content**: Identifies AI-generated Schwepe characters and art
- 📊 **Confidence Scoring**: Provides confidence ratings for all detections
- 📁 **Auto-Organization**: Automatically moves non-Schwepe content to deleted folders
- 📝 **Analysis Reports**: Generates detailed analysis reports for deleted items
- ⚡ **Batch Processing**: Efficient processing of multiple files in batches

## Supported Content Types

### Definite Schwepe Characteristics
- 🐸 **Frogs/Amphibians**: Any frog, toad, amphibian, frog-like characters
- 🕶️ **Shiny Shades**: Any sunglasses, shades, cool eyewear
- 📝 **Schwepe Text**: "schwepe", "247420", "degen", "schweppay" text
- 🎨 **AI-Generated Characters**: Any AI-generated or 3D-rendered Schwepe characters
- 🎭 **Character Art**: Character art resembling Schwepe (pink, humanoid, etc.)

### Strong Schwepe Indicators
- 🚀 **Meme Parodies**: Any recognizable character in meme format, parodies
- 💎 **Crypto/Trading**: Crypto, trading, stocks, finance themes
- ⚡ **Meme Culture**: Internet memes, viral content, meme formats

## Installation

```bash
npm install -g schwepe-analyzer
```

Or for local development:

```bash
npm install
```

## Usage

### CLI Commands

```bash
# Analyze images
npm run analyze:images

# Analyze videos
npm run analyze:videos

# Analyze both images and videos simultaneously
npm run analyze:all
```

### Direct Usage

```bash
# Run image analyzer
node balanced-image-schwepe-analyzer.js

# Run video analyzer
node balanced-video-schwepe-analyzer.js
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   # Create .env file
   cp .env.example .env

   # Add your API token
   ANTHROPIC_AUTH_TOKEN=your_token_here
   ```

3. **Prepare directories**:
   - Place images in `saved_images/` directory
   - Place videos in `saved_videos/` directory

4. **Run analysis**:
   ```bash
   npm run analyze:all
   ```

## Output

### Results
- ✅ **Schwepe Content**: Kept in original directories
- 🗑️ **Non-Schwepe Content**: Moved to `deleted_images/` or `deleted_media/`
- 📝 **Analysis Reports**: Detailed reports saved for deleted items

### Directory Structure
```
saved_images/           # Original images (Schwepe content kept here)
saved_videos/           # Original videos (Schwepe content kept here)
deleted_images/         # Non-Schwepe images moved here
deleted_media/          # Non-Schwepe videos moved here
```

## API Integration

The analyzer uses GLM-4.5V API for content analysis. You'll need:

1. API token from your provider
2. Set `ANTHROPIC_AUTH_TOKEN` environment variable
3. Configure API endpoint in analyzer files if needed

## Configuration

### Environment Variables
- `ANTHROPIC_AUTH_TOKEN`: Your API token for content analysis
- `IMAGE_SAVE_PATH`: Path to save images (default: ./saved_images)

### Customization
You can modify the detection prompts in analyzer files to adjust sensitivity:
- `balanced-image-schwepe-analyzer.js`
- `balanced-video-schwepe-analyzer.js`

## Examples

### Detected Schwepe Content
- Pepe the Frog images
- Yoda meme parodies
- Trader memes with crypto themes
- AI-generated pink humanoid characters
- Content with "schwepe" or related text

### Non-Schwepe Content
- Regular photos without meme elements
- Generic 3D renders without meme context
- Standard character art without parody elements

## Batch Processing

The analyzers process files in batches to avoid API limits:
- **Images**: 5 files per batch with 2-second delays
- **Videos**: 2 files per batch with 3-second delays

## Requirements

- Node.js >= 18.0.0
- API token for GLM-4.5V or compatible service
- Sufficient disk space for media files

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:
- Create an issue on GitHub
- Check analysis reports in deleted folders for detection details

---

**Disclaimer**: This tool is designed for meme content analysis and should be used responsibly.