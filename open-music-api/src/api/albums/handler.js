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
    
    // Ensure cover exists
    if (!cover) {
        throw new Error('No file uploaded');
    }
    
    // Validate file headers if needed
    this._validator.validateAlbumCover(cover.hapi.headers);

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
    await this._cacheService.delete(`album:${albumId}`);

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    try {
      const result = await this._cacheService.get(`album:${id}`);
      const response = h.response({
        status: 'success',
        data: {
          album: JSON.parse(result),
        },
      });
      response.header('X-Data-Source', 'cache');
      return response;
    } catch (error) {
      const album = await this._service.getAlbumById(id);
      const songs = await this._service.getSongsByAlbumId(id);
      const albumData = {
        ...album,
        songs,
      };
      await this._cacheService.set(
        `album:${id}`,
        JSON.stringify(albumData),
        1800
      );
      const response = h.response({
        status: 'success',
        data: {
          album: albumData,
        },
      });
      response.header('X-Data-Source', 'database');
      return response;
    }
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);
    await this._cacheService.delete(`album:${id}`);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);
    await this._cacheService.delete(`album:${id}`);

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