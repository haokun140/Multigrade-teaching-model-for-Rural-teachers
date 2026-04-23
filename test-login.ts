import fetch from 'node-fetch';

// 测试登录
async function testLogin() {
  const loginData = {
    phone: '13800138000',
    password: '123456'
  };
  
  try {
    const response = await fetch('http://10.60.204.75:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    const result = await response.json();
    console.log('登录测试结果:', result);
    
    if (result.success) {
      console.log('登录成功！');
      console.log('Token:', result.data.token);
    } else {
      console.log('登录失败:', result.error);
    }
  } catch (error) {
    console.error('网络错误:', error);
  }
}

testLogin();
