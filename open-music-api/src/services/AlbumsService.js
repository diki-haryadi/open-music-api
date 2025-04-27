const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../exceptions/InvariantError');
const NotFoundError = require('../exceptions/NotFoundError');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
    this._tableName = 'albums';
    this._likesTableName = 'user_album_likes';
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async uploadAlbumCover(cover, albumId) {
    const fs = require('fs');
    const path = require('path');
    const { pipeline } = require('stream/promises');
    const StorageConfig = require('../config/storage');

    const filename = `album-${nanoid(16)}${path.extname(cover.hapi.filename)}`;
    const fileLocation = `${StorageConfig.baseUrl}/uploads/images/${filename}`;
    const filePath = path.resolve(StorageConfig.uploadPath, filename);

    // Ensure upload directory exists
    await fs.promises.mkdir(StorageConfig.uploadPath, { recursive: true });

    // Create write stream and pipe the file data
    const fileStream = fs.createWriteStream(filePath);
    await pipeline(cover, fileStream);

    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
      values: [fileLocation, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      // Clean up uploaded file if album not found
      await fs.promises.unlink(filePath);
      throw new NotFoundError('Album tidak ditemukan');
    }

    return filename;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT id, name, year, cover_url FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return result.rows[0];
  }

  async getSongsByAlbumId(id) {
    const query = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async likeAlbum(userId, albumId) {
    await this.getAlbumById(albumId);

    const id = `like-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3)',
      values: [id, userId, albumId],
    };

    try {
      await this._pool.query(query);
    } catch (error) {
      if (error.code === '23505') {
        throw new InvariantError('Anda sudah menyukai album ini');
      }
      throw error;
    }
  }

  async unlikeAlbum(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal membatalkan like. Like tidak ditemukan');
    }
  }

  async getAlbumLikes(albumId) {
    const query = {
      text: 'SELECT COUNT(*) as likes FROM user_album_likes WHERE album_id = $1',
      values: [albumId],
    };

    const result = await this._pool.query(query);
    return parseInt(result.rows[0].likes, 10);
  }
}

module.exports = AlbumsService;