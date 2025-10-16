/**
 * Utilidades para Cloudinary
 * Autor: Alexander Echeverria
 * Ubicacion: app/utils/cloudinaryHelper.js
 */

const { cloudinary } = require('../config/cloudinary');

const deleteImage = async (publicId) => {
  try {
    if (!publicId) return { success: false, message: 'No public ID provided' };
    
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: result.result === 'ok', message: result.result };
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error);
    return { success: false, message: error.message };
  }
};

const uploadImage = async (filePath, folder = 'farmacia-elizabeth') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Error subiendo imagen a Cloudinary:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

const getOptimizedUrl = (publicId, width = 800, height = 800) => {
  if (!publicId) return null;
  
  return cloudinary.url(publicId, {
    width: width,
    height: height,
    crop: 'limit',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

module.exports = {
  deleteImage,
  uploadImage,
  getOptimizedUrl
};