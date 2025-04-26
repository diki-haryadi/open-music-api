const Joi = require('joi');

const ImageHeadersSchema = Joi.object({
  'content-type': Joi.string().valid(
    'image/apng',
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ).required(),
  'content-length': Joi.number().max(512000).required(),
}).unknown();

module.exports = { ImageHeadersSchema };