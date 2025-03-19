const routes = (handler) => [
  {
    method: 'POST',
    path: '/songs',
    handler: handler.postSongHandler,
    options: {
      auth: {
        mode: 'try',
      },
    },
  },
  {
    method: 'GET',
    path: '/songs',
    handler: handler.getSongsHandler,
    options: {
      auth: {
        mode: 'try',
      },
    },
  },
  {
    method: 'GET',
    path: '/songs/{id}',
    handler: handler.getSongByIdHandler,
    options: {
      auth: {
        mode: 'try',
      },
    },
  },
  {
    method: 'PUT',
    path: '/songs/{id}',
    handler: handler.putSongByIdHandler,
    options: {
      auth: {
        mode: 'try',
      },
    },
  },
  {
    method: 'DELETE',
    path: '/songs/{id}',
    handler: handler.deleteSongByIdHandler,
    options: {
      auth: {
        mode: 'try',
      },
    },
  },
];

module.exports = routes;