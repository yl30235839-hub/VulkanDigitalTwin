import React, { useState } from 'react';
import { 
  Box, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Layers,
  RotateCw
} from 'lucide-react';
import { PageView } from '../types';
import api from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: PageView;
  onNavigate: (page: PageView, data?: any) => void;
  onLogout: () => void;
  userName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onLogout, userName = "Admin User" }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoadingLines, setIsLoadingLines] = useState(false);

  const navItems = [
    ...(userName === 'admin' ? [{ id: 'LINES' as PageView, label: '工廠管理', icon: Layers }] : []),
    { id: '3D_VIEW' as PageView, label: '產綫 3D 監控', icon: Box },
  ];

  const is3DMode = currentPage === '3D_VIEW';

  const handleNavigation = async (page: PageView) => {
    if (page === 'LINES') {
      setIsLoadingLines(true);
      try {
        const response = await api.post(
          'https://localhost:7044/api/Navigation/NavigateManagement',
          {},
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        const resData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const code = resData.code !== undefined ? resData.code : resData.Code;
        const message = resData.message !== undefined ? resData.message : resData.Message;
        let dataPayload = resData.data !== undefined ? resData.data : resData.Data;
        
        if (typeof dataPayload === 'string') {
          try {
            dataPayload = JSON.parse(dataPayload);
          } catch (e) {
            console.error("Failed to parse dataPayload", e);
          }
        }

        if (code === 200) {
          // 成功處理 (Success Handling)：導航並傳遞數據
          onNavigate(page, dataPayload);
        } else if (code === 404) {
          // 錯誤處理 (Error Handling)：處理 404 失敗情況
          alert(`Error: ${message || '資源未找到 (404)'}`);
          onNavigate(page);
        } else {
          // 錯誤處理 (Error Handling)：其他非 200 情況
          alert(`Error: ${message || 'Unknown error'}`);
          onNavigate(page);
        }
      } catch (error: any) {
        // 錯誤處理 (Error Handling)：捕獲請求異常
        alert(`Network Error: ${error.message || '網絡請求異常'}`);
        onNavigate(page);
      } finally {
        // 無論成功或失敗，finally 塊中都必須重置 Loading 狀態
        setIsLoadingLines(false);
      }
    } else {
      onNavigate(page);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20 relative`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700 bg-slate-950">
          {!collapsed && <span className="text-xl font-bold tracking-wider text-blue-400">Vulkan Twin</span>}
          {collapsed && <span className="text-xl font-bold text-blue-400 mx-auto">V</span>}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isLoading = item.id === 'LINES' && isLoadingLines;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                disabled={isLoading}
                className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 group
                  ${currentPage === item.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isLoading ? (
                  <RotateCw size={24} className={`${collapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0 animate-spin`} />
                ) : (
                  <item.icon size={24} className={`${collapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0`} />
                )}
                {!collapsed && (
                  <span className="font-medium whitespace-nowrap">
                    {isLoading ? '處理中...' : item.label}
                  </span>
                )}
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {isLoading ? '處理中...' : item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {userName.charAt(0)}
            </div>
            {!collapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-slate-400">{userName === 'admin' ? 'System Admin' : 'User'}</p>
              </div>
            )}
            {!collapsed && (
              <button 
                onClick={onLogout}
                className="ml-auto p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 z-10">
          <h2 className="text-2xl font-bold text-slate-800">
            {currentPage === 'EQUIPMENT' ? '產綫管理' : (navItems.find(i => i.id === currentPage)?.label || 'Dashboard')}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <Activity size={16} className="mr-2" />
              System Operational
            </div>
            <span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto bg-slate-50 ${is3DMode ? 'p-0 flex flex-col' : 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;