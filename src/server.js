require('dotenv').config();
const Hapi = require('@hapi/hapi');
const songs = require('./api/songs');
const albums = require('./api/albums');
const users = require('./api/users');
const authentications = require('./api/authentications');
const playlists = require('./api/playlists');
const AuthenticationsService = require('./services/AuthenticationService');
const TokenManager = require('./services/TokenManager');
const SongsService = require('./services/SongsService');
const AlbumsService = require('./services/AlbumsService');
const UsersService = require('./services/UserService');
const PlaylistsService = require('./services/PlaylistsService');
const pool = require('./services/postgres/pool');
const Validator = require('./validator/validator');
const ClientError = require('./exceptions/ClientError');
const Jwt = require('@hapi/jwt');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([{
    plugin: Jwt,
  }]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.userId,
      },
    }),
  });

  server.auth.default('openmusic_jwt');

  await server.register([
    {
      plugin: songs,
      options: {
        service: new SongsService(),
        validator: Validator,
      },
    },
    {
      plugin: albums,
      options: {
        service: new AlbumsService(),
        validator: Validator,
      },
    },
    {
      plugin: users,
      options: {
        service: new UsersService(pool),
        validator: Validator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService: new AuthenticationsService(pool),
        usersService: new UsersService(pool),
        tokenManager: new TokenManager(),
        validator: Validator,
      },
    },
    {
      plugin: playlists,
      options: {
        service: new PlaylistsService(pool),
        validator: Validator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      // Handle client errors
      if (response instanceof ClientError) {
        return h.response({
          status: 'fail',
          message: response.message,
        }).code(response.statusCode);
      }

      // Handle server errors
      console.error(response);
      return h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      }).code(500);
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();