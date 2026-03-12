import React, { useState } from 'react';
import { KeyRound, User, Lock, ArrowRight } from 'lucide-react';
import api from '../services/api';

interface LoginPageProps {
  onLogin: (username: string) => void;
  onGoToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGoToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // 1. Hardcoded admin login check
    if (username === 'admin' && password === 'Fx123456.') {
      try {
        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        localStorage.setItem('mes_token', 'admin_token_bypass');
        onLogin(username);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. API-based login for other credentials
    try {
      const response = await api.post('https://localhost:7044/api/Login/LoginSystem', {
        userID: username,
        userPassword: password
      });

      const { code, message, data } = response.data;

      if (data && data.result === 1) {
        // Success Handling
        localStorage.setItem('mes_token', `token_${username}`);
        onLogin(username);
      } else {
        // Failure Handling (result === 0)
        setError(message || '賬號或密碼錯誤，要求用戶重新輸入。');
      }
    } catch (err: any) {
      // Error Handling
      console.error('Login API Error:', err);
      if (err.message === 'Network Error') {
        setError('網絡錯誤：無法連接至 https://localhost:7044。請確保服務已啟動。');
      } else {
        setError(err.response?.data?.message || '登入系統發生異常，請稍後再試。');
      }
    } finally {
      // Reset Loading State
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[500px]">
        
        {/* Left Side - Visual */}
        <div className="hidden md:flex w-1/2 bg-blue-600 p-8 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-2">Vulkan Digital Twin</h1>
            <p className="text-blue-200">下一代數字孿生管理系統</p>
          </div>
          <div className="relative z-10 text-blue-100 text-sm">
            <p className="mb-2">✓ 實時監控</p>
            <p className="mb-2">✓ 3D 可視化</p>
            <p>✓ 預測性維護</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-bold text-slate-800">歡迎回來</h2>
            <p className="text-slate-500 mt-2">請輸入您的賬號密碼以登入系統</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">賬號</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 block w-full rounded-lg border border-slate-300 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 transition-all outline-none"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">密碼</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full rounded-lg border border-slate-300 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? '處理中...' : (
                  <>
                    登入系統 <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-400">
            © 2024 Vulkan Systems. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;