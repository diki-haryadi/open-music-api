class AuthenticationsHandler {
  constructor(authenticationsService, usersService, tokenManager, validator) {
    this._authenticationsService = authenticationsService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    this.postAuthenticationHandler = this.postAuthenticationHandler.bind(this);
    this.putAuthenticationHandler = this.putAuthenticationHandler.bind(this);
    this.deleteAuthenticationHandler = this.deleteAuthenticationHandler.bind(this);
  }

  async postAuthenticationHandler(request, h) {
    try {
      this._validator.validatePostAuthenticationPayload(request.payload);

      const { username, password } = request.payload;
      const id = await this._usersService.verifyUserCredential(username, password);

      const accessToken = this._tokenManager.generateAccessToken({ userId: id });
      const refreshToken = this._tokenManager.generateRefreshToken({ userId: id });

      await this._authenticationsService.addRefreshToken(refreshToken);

      const response = h.response({
        status: 'success',
        data: {
          accessToken,
          refreshToken,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error.name === 'AuthenticationError' || error.message === 'Invalid token structure') {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(401);
        return response;
      }
      throw error;
    }
  }

  async putAuthenticationHandler(request) {
    try {
      this._validator.validatePutAuthenticationPayload(request.payload);

      const { refreshToken } = request.payload;
      await this._authenticationsService.verifyRefreshToken(refreshToken);
      const { id } = this._tokenManager.verifyRefreshToken(refreshToken);

      const accessToken = this._tokenManager.generateAccessToken({ id });
      return {
        status: 'success',
        data: {
          accessToken,
        },
      };
    } catch (error) {
      if (error.name === 'AuthenticationError') {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(401);
        return response;
      }
      throw error;
    }
  }

  async deleteAuthenticationHandler(request) {
    try {
      this._validator.validateDeleteAuthenticationPayload(request.payload);

      const { refreshToken } = request.payload;
      await this._authenticationsService.verifyRefreshToken(refreshToken);
      await this._authenticationsService.deleteRefreshToken(refreshToken);

      return {
        status: 'success',
        message: 'Refresh token berhasil dihapus',
      };
    } catch (error) {
      if (error.name === 'AuthenticationError') {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(401);
        return response;
      }
      throw error;
    }
  }
}

module.exports = AuthenticationsHandler;