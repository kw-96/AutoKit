import mongoose from 'mongoose';

let mongod: any = null;

export async function connectMongo() {
  // 检查是否设置了环境变量
  const useMemoryDb = process.env.USE_MEMORY_DB === 'true' || !process.env.MONGODB_URI;
  let uri = process.env.MONGODB_URI || '';
  
  if (useMemoryDb) {
    // 直接使用内存数据库
    try {
      console.log('正在启动内存MongoDB数据库...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('已成功连接到内存MongoDB:', uri);
      return;
    } catch (err) {
      console.error('内存MongoDB启动失败:', err);
      throw err;
    }
  } else if (uri) {
    // 使用环境变量中的URI
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected:', uri);
      return;
    } catch (err) {
      console.warn(`连接到 ${uri} 失败，尝试启用内存数据库...`);
    }
  } else {
    // 尝试连接本地MongoDB
    try {
      uri = 'mongodb://localhost:27017/autokit';
      await mongoose.connect(uri);
      console.log('MongoDB connected:', uri);
      return;
    } catch (err) {
      console.warn('本地MongoDB连接失败，尝试启用内存数据库...');
    }
  }
  
  // 如果前面的连接都失败了，使用内存数据库作为后备
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('已启用内存MongoDB:', uri);
  } catch (err) {
    console.error('内存MongoDB启动失败:', err);
    throw err;
  }
}

export default mongoose; 