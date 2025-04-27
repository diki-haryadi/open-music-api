const amqp = require('amqplib');

class ProducerService {
  constructor() {
    this._connection = null;
    this._channel = null;
    this._retryCount = 0;
    this._maxRetries = 5;
    this._retryDelay = 5000; // 5 seconds
  }

  async init() {
    while (this._retryCount < this._maxRetries) {
      try {
        this._connection = await amqp.connect(process.env.RABBITMQ_SERVER);
        this._channel = await this._connection.createChannel();
        
        // Reset retry count on successful connection
        this._retryCount = 0;
        console.log('Connected to RabbitMQ');

        // Setup connection error handlers
        this._connection.on('error', (err) => {
          console.error('RabbitMQ connection error:', err);
          this._reconnect();
        });

        this._connection.on('close', () => {
          console.log('RabbitMQ connection closed, attempting to reconnect...');
          this._reconnect();
        });

        return;
      } catch (error) {
        console.error(`Failed to connect to RabbitMQ (attempt ${this._retryCount + 1}/${this._maxRetries}):`, error);
        this._retryCount++;
        
        if (this._retryCount === this._maxRetries) {
          throw new Error('Max retry attempts reached. Could not connect to RabbitMQ.');
        }

        await new Promise(resolve => setTimeout(resolve, this._retryDelay));
      }
    }
  }

  async _reconnect() {
    if (this._reconnecting) return;
    this._reconnecting = true;

    try {
      if (this._channel) {
        try {
          await this._channel.close();
        } catch (err) {
          console.warn('Error closing channel:', err);
        }
      }
      if (this._connection) {
        try {
          await this._connection.close();
        } catch (err) {
          console.warn('Error closing connection:', err);
        }
      }

      await this.init();
    } finally {
      this._reconnecting = false;
    }
  }

  async sendMessage(queue, message, retryCount = 0) {
    try {
      if (!this._channel || !this._connection) {
        await this.init();
      }

      await this._channel.assertQueue(queue, {
        durable: true,
      });

      await this._channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      console.log('Message sent to queue:', queue);
    } catch (error) {
      console.error('Error sending message to queue:', error);
      
      if (retryCount < 3) {
        console.log(`Retrying send message (attempt ${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.sendMessage(queue, message, retryCount + 1);
      }
      
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