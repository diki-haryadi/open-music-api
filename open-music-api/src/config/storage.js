const path = require('path');

const StorageConfig = {
  uploadPath: path.resolve(__dirname, '../../uploads/images'),
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
};

module.exports = StorageConfig;