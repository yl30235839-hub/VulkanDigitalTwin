import React, { useState } from 'react';
import { MOCK_FACTORIES } from '../constants';
import { 
  MapPin, Users, Activity, BarChart3, 
  Building2, Layers, Save, CheckCircle, RotateCw 
} from 'lucide-react';

const FactoryManagement: React.FC = () => {
  const [factoryConfig, setFactoryConfig] = useState({
    code: 'GL',
    floor: '3F'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveConfig = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('工廠基礎信息已成功更新！');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">總工廠數</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{MOCK_FACTORIES.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <MapPin size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600 flex items-center font-medium">
            +1 New this year
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">平均稼動率</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">91.6%</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <Activity size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600 flex items-center font-medium">
            ↑ 2.1% vs last month
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">總產綫數</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">25</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-400 flex items-center font-medium">
            Across all regions
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">管理人員</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">142</h3>
            </div>
            <div className="p-3 bg-orange-100 rounded-full text-orange-600">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-400 flex items-center font-medium">
            Active staff
          </div>
        </div>
      </div>

      {/* Factory Information Section (New) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center bg-slate-50">
          <Building2 size={20} className="text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-slate-800">工廠環境信息維護</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                廠區代碼 (Factory Code)
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={factoryConfig.code}
                  onChange={(e) => setFactoryConfig({...factoryConfig, code: e.target.value})}
                  placeholder="如: GL, TW, US"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="flex-1 space-y-1 w-full">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                樓層 (Floor)
              </label>
              <div className="relative">
                <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={factoryConfig.floor}
                  onChange={(e) => setFactoryConfig({...factoryConfig, floor: e.target.value})}
                  placeholder="如: 3F, B1"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
            </div>
            <button 
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="flex items-center px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 h-[42px]"
            >
              {isSaving ? (
                <RotateCw size={18} className="animate-spin mr-2" />
              ) : (
                <Save size={18} className="mr-2" />
              )}
              {isSaving ? '保存中...' : '保存配置'}
            </button>
          </div>
          <p className="mt-3 text-[10px] text-slate-400 flex items-center">
            <CheckCircle size={10} className="mr-1 text-green-500" /> 
            此配置將應用於當前產線實例的全局標識與邏輯定位
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">工廠列表詳情</h3>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + 新增工廠
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">工廠代號</th>
                <th className="px-6 py-4 font-semibold">名稱</th>
                <th className="px-6 py-4 font-semibold">地點</th>
                <th className="px-6 py-4 font-semibold">負責人</th>
                <th className="px-6 py-4 font-semibold text-center">產綫數量</th>
                <th className="px-6 py-4 font-semibold text-center">效率指標</th>
                <th className="px-6 py-4 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {MOCK_FACTORIES.map((factory) => (
                <tr key={factory.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">#{factory.id}</td>
                  <td className="px-6 py-4 text-slate-800">{factory.name}</td>
                  <td className="px-6 py-4 text-slate-500 flex items-center">
                    <MapPin size={14} className="mr-1 text-slate-400" />
                    {factory.location}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs mr-2 font-bold text-slate-600">
                        {factory.manager.charAt(0)}
                      </div>
                      {factory.manager}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-mono">{factory.totalLines}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${factory.efficiency >= 90 ? 'bg-green-100 text-green-800' : 
                        factory.efficiency >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {factory.efficiency}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-900 font-medium text-sm">詳情</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FactoryManagement;