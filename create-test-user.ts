import bcrypt from 'bcryptjs';
import { userRepository } from './api/src/repositories/userRepository.js';

// 创建测试用户
async function createTestUser() {
  const phone = '13800138000';
  const name = '测试用户';
  const password = '123456';
  
  // 检查用户是否已存在
  const existingUser = userRepository.findByPhone(phone);
  if (existingUser) {
    console.log('用户已存在:', existingUser);
    return;
  }
  
  // 创建新用户
  const userId = Date.now().toString();
  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = userRepository.create(userId, phone, name, passwordHash);
  console.log('测试用户创建成功:', user);
  console.log('手机号:', phone);
  console.log('密码:', password);
}

createTestUser().catch(console.error);
