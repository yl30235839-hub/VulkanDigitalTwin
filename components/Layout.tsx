import React, { useState } from 'react';
import { 
  Box, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Layers
} from 'lucide-react';
import { PageView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  onLogout: () => void;
  userName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onLogout, userName = "Admin User" }) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    ...(userName === 'admin' ? [{ id: 'LINES' as PageView, label: '工廠管理', icon: Layers }] : []),
    { id: '3D_VIEW' as PageView, label: '產綫 3D 監控', icon: Box },
  ];

  const is3DMode = currentPage === '3D_VIEW';

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
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 group
                ${currentPage === item.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={24} className={`${collapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0`} />
              {!collapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {item.label}
                </div>
              )}
            </button>
          ))}
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