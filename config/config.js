const dotenv = require('dotenv');
dotenv.config();

const config = {
  PORT: process.env.PORT,
  CLOUD_NAME: process.env.CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

module.exports = config;
