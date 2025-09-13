import axios from 'axios';

const API_KEY = '00518dfeb820f44674f4361fd3301881'; // Replace with your key

export const uploadToImgBB = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', API_KEY);

  try {
    const response = await axios.post('https://api.imgbb.com/1/upload', formData);
    return response.data.data.url; // Returns the image URL
  } catch (error) {
    console.error('ImgBB upload error:', error);
    throw new Error('Failed to upload image');
  }
};