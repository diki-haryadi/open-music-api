const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(service, validator, cacheService) {
    this._service = service;
    this._validator = validator;
    this._cacheService = cacheService;

    autoBind(this);
  }

  async postAlbumCoverHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;
    
    // Ensure content-length is included in headers for validation
    const headers = {
      ...cover.hapi.headers,
      'content-length': parseInt(cover.hapi.headers['content-length'] || 0, 10),
    };
    
    this._validator.validateAlbumCover(headers);

    const filename = await this._service.uploadAlbumCover(cover, id);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    const songs = await this._service.getSongsByAlbumId(id);

    return {
      status: 'success',
      data: {
        album: {
          ...album,
          songs,
        },
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postAlbumLikeHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.likeAlbum(userId, albumId);
    await this._cacheService.delete(`album:${albumId}:likes`);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menyukai album',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikeHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.unlikeAlbum(userId, albumId);
    await this._cacheService.delete(`album:${albumId}:likes`);

    return {
      status: 'success',
      message: 'Berhasil membatalkan like album',
    };
  }

  async getAlbumLikesHandler(request, h) {
    const { id: albumId } = request.params;
    try {
      const result = await this._cacheService.get(`album:${albumId}:likes`);
      const response = h.response({
        status: 'success',
        data: {
          likes: JSON.parse(result),
        },
      });
      response.header('X-Data-Source', 'cache');
      return response;
    } catch (error) {
      const likes = await this._service.getAlbumLikes(albumId);
      await this._cacheService.set(
        `album:${albumId}:likes`,
        JSON.stringify(likes),
      );
      const response = h.response({
        status: 'success',
        data: {
          likes,
        },
      });
      response.header('X-Data-Source', 'database');
      return response;
    }
  }
}

module.exports = AlbumsHandler;