class AuthenticationError extends Error {
  constructor(message) {
    super(message || 'Token maximum age exceeded');
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.message = message || 'Token maximum age exceeded';
  }
}

module.exports = AuthenticationError;