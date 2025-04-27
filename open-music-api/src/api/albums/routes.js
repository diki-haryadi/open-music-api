const { options } = require("joi");
const Path = require('path');
// Add these debug logs before creating the route
console.log('Current directory (__dirname):', __dirname);
console.log('Resolved uploads path:', Path.join(__dirname, '../../uploads'));
console.log('Absolute uploads path:', Path.resolve(__dirname, '../../../uploads'));

const routes = (handler) => [
  {
    // add triger delete cache  if album added
    method: 'POST',
    path: '/albums',
    handler: handler.postAlbumHandler,
    options: {
        auth: 'openmusic_jwt',
    },
  },
  {
    // Kriteria 4 : Menerapkan Server-Side Cache
// Menerapkan server-side cache pada jumlah yang menyukai sebuah album (GET /albums/{id}/likes).
// Cache harus bertahan selama 30 menit.
// Respons yang dihasilkan dari cache harus memiliki custom header properti X-Data-Source bernilai “cache”.
// Cache harus dihapus setiap kali ada perubahan jumlah like pada album dengan id tertentu.
// Memory caching engine wajib menggunakan Redis atau Memurai (Windows).
// Nilai host server Redis wajib menggunakan environment variable REDIS_SERVER
    method: 'GET',
    path: '/albums/{id}',
    handler: handler.getAlbumByIdHandler,
    options: {
        auth: 'openmusic_jwt',
    },
  },
  {
    method: 'PUT',
    path: '/albums/{id}',
    handler: handler.putAlbumByIdHandler,
    options: {
        auth: 'openmusic_jwt',
    },
  },
  {
    method: 'DELETE',
    path: '/albums/{id}',
    handler: handler.deleteAlbumByIdHandler,
    options: {
        auth: 'openmusic_jwt',
    },
  },
  {
    method: 'POST',
    path: '/albums/{id}/likes',
    handler: handler.postAlbumLikeHandler,
    options: {
      auth: 'openmusic_jwt',
    }
  },
  {
    method: 'DELETE',
    path: '/albums/{id}/likes',
    handler: handler.deleteAlbumLikeHandler,
    options: {
      auth: 'openmusic_jwt',
    }
  },
  {
    method: 'GET',
    path: '/albums/{id}/likes',
    handler: handler.getAlbumLikesHandler,
    options: {
        auth: 'openmusic_jwt',
    },
  },
  {
    method: 'POST',
    path: '/albums/{id}/covers',
    handler: handler.postAlbumCoverHandler,
    options: {
      auth: 'openmusic_jwt',
      payload: {
        maxBytes: 1024 * 1024 * 10,
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
        parse: true
      },
    },
  },
  {
    method: 'GET',
    path: '/uploads/{param*}',
    handler: {
      directory: {
        path: Path.join(__dirname, '../../../uploads'),
        listing: false,
        index: false
      }
    },
    options: {
      auth: false // Public access to uploaded files - no authentication required
    }
  }
];

module.exports = routes;