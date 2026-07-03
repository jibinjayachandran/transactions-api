// test-redis.ts
import redis from './src/lib/redis';

async function testConnection() {
  await redis.set('test-key', 'hello from node');
  const value = await redis.get('test-key');
  console.log('Value from Redis:', value);
  await redis.quit();
}

testConnection();