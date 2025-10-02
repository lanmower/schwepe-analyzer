import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

const IMAGE_DIR = './saved_images';
const VIDEO_DIR = './saved_videos';
const CHECKSUM_DB = './master_checksums.json';

async function calculateFileHash(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    return hash;
  } catch (error) {
    console.error(`❌ Error calculating hash for ${filePath}:`, error.message);
    return null;
  }
}

async function scanDirectory(dirPath, fileType) {
  const files = [];

  if (!await fs.pathExists(dirPath)) {
    console.log(`📁 Directory ${dirPath} does not exist, skipping...`);
    return files;
  }

  const entries = await fs.readdir(dirPath);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = await fs.stat(fullPath);

    if (stat.isFile()) {
      console.log(`🔍 Scanning ${fileType}: ${entry}`);
      const hash = await calculateFileHash(fullPath);
      if (hash) {
        files.push({
          name: entry,
          path: fullPath,
          hash: hash,
          size: stat.size,
          type: fileType,
          created: stat.birthtime.toISOString()
        });
      }
    }
  }

  return files;
}

async function createMasterChecksumDatabase() {
  console.log('🔍 Creating master checksum database...');

  const imageFiles = await scanDirectory(IMAGE_DIR, 'image');
  const videoFiles = await scanDirectory(VIDEO_DIR, 'video');

  const allFiles = [...imageFiles, ...videoFiles];
  const hashDatabase = {};
  const duplicates = [];

  // Group files by hash to find duplicates
  for (const file of allFiles) {
    if (hashDatabase[file.hash]) {
      duplicates.push(file);
      hashDatabase[file.hash].duplicates.push(file);
    } else {
      hashDatabase[file.hash] = {
        ...file,
        duplicates: []
      };
    }
  }

  // Save master database
  await fs.writeJson(CHECKSUM_DB, hashDatabase, { spaces: 2 });

  console.log(`\n📊 Scan Results:`);
  console.log(`- Total files scanned: ${allFiles.length}`);
  console.log(`- Images: ${imageFiles.length}`);
  console.log(`- Videos: ${videoFiles.length}`);
  console.log(`- Unique files: ${Object.keys(hashDatabase).length}`);
  console.log(`- Duplicate files: ${duplicates.length}`);

  return { hashDatabase, duplicates };
}

async function cleanupDuplicates(duplicates) {
  console.log('\n🧹 Cleaning up duplicate files...');

  let cleanedCount = 0;
  let totalSizeSaved = 0;

  for (const duplicate of duplicates) {
    try {
      const stat = await fs.stat(duplicate.path);
      await fs.remove(duplicate.path);
      cleanedCount++;
      totalSizeSaved += stat.size;
      console.log(`🗑️ Removed duplicate: ${duplicate.name} (${formatBytes(stat.size)})`);
    } catch (error) {
      console.error(`❌ Error removing ${duplicate.name}:`, error.message);
    }
  }

  console.log(`\n✅ Cleanup complete:`);
  console.log(`- Files removed: ${cleanedCount}`);
  console.log(`- Space saved: ${formatBytes(totalSizeSaved)}`);

  return cleanedCount;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function createDeduplicationBotFiles() {
  console.log('\n🤖 Creating deduplication system for bot...');

  const checksumData = await fs.readJson(CHECKSUM_DB);
  const imageHashes = new Set();
  const videoHashes = new Set();

  // Separate hashes by type
  for (const hash in checksumData) {
    const file = checksumData[hash];
    if (file.type === 'image') {
      imageHashes.add(hash);
    } else if (file.type === 'video') {
      videoHashes.add(hash);
    }
  }

  // Save hash sets for bot
  await fs.writeJson('./image_hashes.json', {
    hashes: Array.from(imageHashes),
    lastUpdated: new Date().toISOString()
  }, { spaces: 2 });

  await fs.writeJson('./video_hashes.json', {
    hashes: Array.from(videoHashes),
    lastUpdated: new Date().toISOString()
  }, { spaces: 2 });

  console.log(`✅ Created deduplication files:`);
  console.log(`- Image hashes: ${imageHashes.size}`);
  console.log(`- Video hashes: ${videoHashes.size}`);
}

async function main() {
  console.log('🚀 Starting comprehensive file deduplication...\n');

  try {
    // Step 1: Create master checksum database
    const { hashDatabase, duplicates } = await createMasterChecksumDatabase();

    // Step 2: Clean up duplicates if any found
    if (duplicates.length > 0) {
      await cleanupDuplicates(duplicates);
    } else {
      console.log('\n✅ No duplicate files found!');
    }

    // Step 3: Create deduplication files for the bot
    await createDeduplicationBotFiles();

    console.log('\n🎉 Deduplication process completed successfully!');
    console.log('📁 Master checksum database saved to: master_checksums.json');
    console.log('🤖 Bot deduplication files updated and ready!');

  } catch (error) {
    console.error('❌ Deduplication process failed:', error);
    process.exit(1);
  }
}

main();