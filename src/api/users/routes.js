const routes = (handler) => [
  {
    method: 'POST',
    path: '/users',
    handler: handler.postUserHandler,
    options: {
      auth: {
        mode: 'try',
      },
    },
  }
];

module.exports = routes;