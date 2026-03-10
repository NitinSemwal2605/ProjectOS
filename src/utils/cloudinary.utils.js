import cloudinary from '../config/cloudinary.js';


export const uploadToCloudinary = async (file, folder = 'chat_attachments') => {
  try {
    // Automatically Detect File Type
    const options = {
      folder,
      resource_type: 'auto',
    };

    const result = await cloudinary.uploader.upload(file, options);
    return result;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};


export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log(`Cloudinary Delete [${publicId}]:`, result.result);
    return result;
  } catch (error) {
    console.error(`Cloudinary Delete Error [${publicId}]:`, error.message);
    return null;
  }
};


export const compressAndReupload = async (url, resourceType = 'image') => {
  try {
    const options = {
      resource_type: resourceType,
      quality: 'auto:low',
      fetch_format: 'auto',
      folder: 'chat_attachments_compressed',
    };

    const result = await cloudinary.uploader.upload(url, options);
    return result;
  } catch (error) {
    console.error('Cloudinary Compress Error:', error.message);
    throw error;
  }
};
