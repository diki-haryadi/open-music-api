require('dotenv').config();
const amqp = require('amqplib');
const PlaylistsService = require('./services/PlaylistsService');
const MailSender = require('./services/MailSender');
const pool = require('./services/postgres/pool');
const SongsService = require('./services/SongsService');

const init = async () => {
  const playlistsService = new PlaylistsService(pool, new SongsService());
  const mailSender = new MailSender();

  const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
  const channel = await connection.createChannel();

  const queue = 'export:playlists';
  await channel.assertQueue(queue, {
    durable: true,
  });

  channel.consume(queue, async (message) => {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());

      const playlist = await playlistsService.getPlaylistById(playlistId);
      const songs = await playlistsService.getSongsFromPlaylist(playlistId);
      const playlistWithSongs = {
        playlist: {
          ...playlist,
          songs,
        },
      };

      const result = await mailSender.sendEmail(
        targetEmail,
        'Export Playlist',
        JSON.stringify(playlistWithSongs),
      );

      console.log('Export playlist success:', result);
      channel.ack(message);
    } catch (error) {
      console.error('Error processing message:', error);
      channel.reject(message, false);
    }
  });

  console.log('Consumer service is running');
};

init();