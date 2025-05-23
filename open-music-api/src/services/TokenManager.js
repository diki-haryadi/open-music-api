const Jwt = require('@hapi/jwt');
const InvariantError = require('../exceptions/InvariantError');

class TokenManager {
  generateAccessToken(payload) {
    return Jwt.token.generate(payload, process.env.ACCESS_TOKEN_KEY);
  }

  generateRefreshToken(payload) {
    return Jwt.token.generate(payload, process.env.REFRESH_TOKEN_KEY);
  }

  verifyRefreshToken(refreshToken) {
    try {
      const artifacts = Jwt.token.decode(refreshToken);
      Jwt.token.verify(artifacts, process.env.REFRESH_TOKEN_KEY);
      const { payload } = artifacts.decoded;
      return payload;
    } catch (error) {
      throw new InvariantError('Refresh token tidak valid');
    }
  }
}

module.exports = TokenManager;