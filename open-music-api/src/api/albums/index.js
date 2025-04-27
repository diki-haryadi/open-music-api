const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, { service, validator, cacheService }) => {
    const albumsHandler = new AlbumsHandler(service, validator, cacheService);
    server.route(routes(albumsHandler));
  },
};