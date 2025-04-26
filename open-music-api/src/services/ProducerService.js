const amqp = require('amqplib');

class ProducerService {
  constructor() {
    this._connection = null;
    this._channel = null;
  }

  async init() {
    try {
      this._connection = await amqp.connect(process.env.RABBITMQ_SERVER);
      this._channel = await this._connection.createChannel();
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async sendMessage(queue, message) {
    try {
      await this._channel.assertQueue(queue, {
        durable: true,
      });

      await this._channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      console.log('Message sent to queue:', queue);
    } catch (error) {
      console.error('Error sending message to queue:', error);
      throw error;
    }
  }

  async closeConnection() {
    try {
      await this._channel.close();
      await this._connection.close();
      console.log('Closed RabbitMQ connection');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}

module.exports = ProducerService;