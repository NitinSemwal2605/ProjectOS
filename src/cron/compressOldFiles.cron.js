import cron from 'node-cron';
import File from '../models/File.js';
import {
  compressAndReupload,
  deleteFromCloudinary,
} from '../utils/cloudinary.utils.js';


const getResourceType = (mimeType = '') => {
  if (mimeType.startsWith('image')) return 'image';
  if (mimeType.startsWith('video')) return 'video';
  return 'raw';
};

export const compressOldFiles = async () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Old Files Not deleted, Compressed.
  const files = await File.find({
    createdAt: { $lt: oneMonthAgo },
    deletedAt: null,
    isCompressed: { $ne: true },
  });

  if (files.length === 0) {
    console.log('[Cron] No file Found.. Skipping.');
    return;
  }

  console.log(`[Cron] Found ${files.length} file(s) to process.`);

  let compressed = 0;
  let skipped = 0;

  for (const file of files) {
    const resourceType = getResourceType(file.mimeType);

    if (resourceType === 'raw') {
      file.isCompressed = true;
      await file.save();
      skipped++;
      continue;
    }

    try {
      // Re-upload with compression
      const compressedResult = await compressAndReupload(
        file.url,
        resourceType,
      );

      // Delete the old Files
      const oldPublicId = file.storageName;
      await deleteFromCloudinary(oldPublicId, resourceType);

      // Update Records
      file.storageName = compressedResult.public_id;
      file.url = compressedResult.secure_url;
      file.size = compressedResult.bytes;
      file.isCompressed = true;
      await file.save();

      compressed++;
      console.log("Now the File is Compressed :", file.url);
    } catch (error) {
      console.error(
        `[Cron] Failed to Compress ${file.originalName}:`,
        error.message,
      );
    }
  }

  console.log(
    `[Cron] Done. Compressed: ${compressed}, Skipped (raw): ${skipped}, Failed: ${files.length - compressed - skipped}`,
  );
};

export const startCompressionCron = () => {
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Starting old-file compression job...');
    await compressOldFiles();
  });

  console.log('[Cron] File Compression cron scheduled (daily at 2:00 AM).');
};