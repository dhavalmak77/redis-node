import dotenv from 'dotenv';
import express from 'express';
import redis from 'redis';

dotenv.config();
const app = express();

const client = redis.createClient({
	url: 'redis://localhost',
	port: 6379
});

// Handle connection events
client.on('error', (error) => {
	console.error('Redis Client Error', error);
});

const connectRedis = async () => {
	try {
		await client.connect();
		console.log('Connected to Redis');
	} catch (error) {
		console.error('Error connecting to Redis', error);
	} finally {
		// await client.quit();
		// console.log('Disconnected from Redis');
	}
}

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.get('/publish-subscribe', async (req, res) => {
	try {
		await connectRedis();

		const publisher = client.duplicate();
		const subscriber = client.duplicate();

		await publisher.connect();
		await subscriber.connect();

		await subscriber.subscribe('pub-sub-channel', (message) => {
			console.log('Received message:', message);
		});
		await publisher.publish('pub-sub-channel', 'Hello from Redis');
		await publisher.publish('pub-sub-channel', 'Another message from Redis');
		await publisher.publish('pub-sub-channel', 'Final message from Redis');
		await publisher.publish('pub-sub-channel', 'Goodbye from Redis');

		new Promise((resolve) => setTimeout(resolve, 1000));

		await subscriber.unsubscribe('pub-sub-channel');

		await publisher.quit();
		await subscriber.quit();

		return res.send('Published and Subscribed to pub-sub-channel');
	} catch (error) {
		console.error('Error in publish-subscribe', error);
		return res.status(500).send('Error in publish-subscribe');
	} finally {
		await client.quit();
		console.log('Disconnected from Redis');
	}
});

app.get('/multi', async (req, res) => {
	try {
		await connectRedis();

		const multi = client.multi();

		for (let i = 1; i <= 50; i++) {
			multi.set(`key${i}`, `value${i}`);
		}

		const results = await multi.exec();

		return res.send({ message: 'Multi command executed successfully', results });
	} catch (error) {
		console.error('Error in publish-subscribe', error);
		return res.status(500).send('Error in publish-subscribe');
	} finally {
		await client.quit();
		console.log('Disconnected from Redis');
	}
});

const PORT = process.env.PORT;
app.listen(PORT, async () => {
	console.log(`Server is running on port ${PORT}`);
});