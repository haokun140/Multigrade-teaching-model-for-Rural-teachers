import { initDatabase } from './init.js';

// 全局数据库实例
let dbInstance: ReturnType<typeof initDatabase> | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = initDatabase();
  }
  return dbInstance;
}
