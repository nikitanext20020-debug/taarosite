import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const DECKS_DIR = path.join(__dirname, '../public/decks');

function walkDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.gif', '.webp', '.jpg', '.jpeg', '.png'].includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

async function main() {
  console.log('Walking decks directory:', DECKS_DIR);
  const files = walkDir(DECKS_DIR);
  console.log(`Found ${files.length} images to optimize.`);

  let count = 0;
  for (const file of files) {
    const ext = path.extname(file);
    const base = file.substring(0, file.length - ext.length);
    const targetFile = `${base}.avif`;

    // Skip if it's already an avif (should not happen based on ext filter, but just in case)
    if (ext === '.avif') continue;

    try {
      console.log(`Optimizing: ${path.basename(file)} -> avif`);
      // Use { animated: true } to preserve animations for GIFs if any
      await sharp(file, { animated: true })
        .avif({ quality: 65, effort: 2 }) // effort 2 is faster for bulk conversion
        .toFile(targetFile);

      if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 0) {
        fs.unlinkSync(file);
        count++;
      } else {
        console.error(`Failed to create valid AVIF for ${file}`);
      }
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
      // Fallback: try without animation parameter if it failed
      try {
        console.log(`Fallback (no animation): ${path.basename(file)}`);
        await sharp(file)
          .avif({ quality: 65 })
          .toFile(targetFile);
        if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 0) {
          fs.unlinkSync(file);
          count++;
        }
      } catch (e2) {
        console.error(`Fallback failed for ${file}:`, e2);
      }
    }
  }

  console.log(`Successfully optimized ${count} / ${files.length} images to AVIF.`);
}

main().catch(console.error);
