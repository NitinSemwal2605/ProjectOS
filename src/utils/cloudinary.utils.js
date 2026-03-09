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
