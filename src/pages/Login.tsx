import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Phone, Lock, Send } from 'lucide-react';
import { api } from '../api';
import { useAuthStore } from '../store';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [useCode, setUseCode] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const sendCode = async () => {
    if (!phone.match(/^\d{11}$/)) {
      setError('请输入正确的11位手机号');
      return;
    }

    setCodeLoading(true);
    try {
      const response = await api.sendVerificationCode(phone);
      if (response.success) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(timer);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } else {
        setError(response.error || '发送失败');
      }
    } catch (e) {
      setError('网络错误，请稍后重试');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = useCode ? { phone, code } : { phone, password };
      const response = await api.login(data);
      
      if (response.success && response.data) {
        login(response.data.user, response.data.token);
        navigate(response.data.user.schoolId ? '/' : '/school/setup');
      } else {
        setError(response.error || '登录失败');
      }
    } catch (e) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">欢迎回来</h1>
          <p className="text-gray-600 mt-2">登录您的复式教育备课系统</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              手机号
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入11位手机号"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                maxLength={11}
                required
              />
            </div>
          </div>

          {useCode ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                验证码
              </label>
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="请输入验证码"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      maxLength={6}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={codeLoading || countdown > 0}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}s` : (
                      <>
                        <Send className="w-4 h-4 mr-1" />
                        发送
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setUseCode(!useCode)}
            className="text-blue-600 text-sm hover:text-blue-700 transition-colors"
          >
            {useCode ? '使用密码登录' : '使用验证码登录'}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            还没有账号？{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
