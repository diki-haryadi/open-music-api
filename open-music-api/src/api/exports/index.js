const ExportsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'exports',
  version: '1.0.0',
  register: async (server, { service, validator, producerService, playlistsService }) => {
    const exportsHandler = new ExportsHandler(service, validator, producerService, playlistsService);
    server.route(routes(exportsHandler));
  },
};