const autoBind = require('auto-bind');

class ExportsHandler {
  constructor(service, validator, producerService, playlistsService) {
    this._service = service;
    this._validator = validator;
    this._producerService = producerService;
    this._playlistsService = playlistsService;

    autoBind(this);
  }

  async postExportPlaylistHandler(request, h) {
    try {
      this._validator.validateExportPlaylistPayload(request.payload);
      const { playlistId } = request.params;
      const { id: credentialId } = request.auth.credentials;
      const { targetEmail } = request.payload;

      await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);

      const message = {
        playlistId,
        targetEmail,
      };

      await this._producerService.sendMessage('export:playlists', message);

      const response = h.response({
        status: 'success',
        message: 'Permintaan Anda sedang kami proses',
      });
      response.code(201);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportsHandler;