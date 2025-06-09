import mongoose from 'mongoose';

let mongod: any = null;

export async function connectMongo() {
  let uri = process.env.MONGODB_URI || '';
  if (!uri) {
    // 优先尝试本地MongoDB
    uri = 'mongodb://localhost:27017/autokit';
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected:', uri);
  } catch (err) {
    // 如果本地MongoDB连接失败，自动启用内存数据库
    console.warn('本地MongoDB连接失败，尝试启用内存数据库...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('已启用内存MongoDB:', uri);
  }
}

export default mongoose; 