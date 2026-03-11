import React, { useState } from 'react';
import { MachineStatus, Equipment, EquipmentType } from '../types';
import api from '../services/api';
import { 
  Thermometer, Activity, Wrench, Clock, Settings, Filter, 
  Database, Table as TableIcon, Plus, Trash2, Cpu, 
  Search, Key, List, X, GripVertical, Building, MapPin, Hash,
  Save, RotateCw, Network, ClipboardList, Layers, Monitor, Info, Edit3
} from 'lucide-react';

interface EquipmentManagementProps {
  lineId?: string | null;
  lineData?: any;
  equipmentList: Equipment[];
  onAddEquipment: (equip: Equipment) => void;
  onMaintainDevice?: (deviceId: string) => void;
}

const EquipmentManagement: React.FC<EquipmentManagementProps> = ({ lineId, lineData, equipmentList, onAddEquipment, onMaintainDevice }) => {
  const [activeTab, setActiveTab] = useState<'STATUS' | 'DATABASE'>('STATUS');
  
  // Production Line Maintenance State
  const [lineInfo, setLineInfo] = useState({
    name: lineData?.lineName || 'Assembly Line A-01',
    hostIp: lineData?.lineIP || '10.55.120.42',
    station: lineData?.station || 'Final Assembly',
    model: lineData?.productName || 'Vulkan-X Pro',
    phase: lineData?.phaseName || 'Mass Production (MP)',
    process: lineData?.process || 'SMT-AOI-FA',
    phmOrder: lineData?.phmBillNo || 'PHM-2024-00892',
    lineCategory: lineData?.line || 'Main Stream',
    description: lineData?.description || '核心組裝產綫，配備雙臂協作機器人與視覺掃描模組。'
  });

  // Update lineInfo when lineData changes
  React.useEffect(() => {
    if (lineData) {
      setLineInfo({
        name: lineData.lineName || '',
        hostIp: lineData.lineIP || '',
        station: lineData.station || '',
        model: lineData.productName || '',
        phase: lineData.phaseName || '',
        process: lineData.process || '',
        phmOrder: lineData.phmBillNo || '',
        lineCategory: lineData.line || '',
        description: lineData.description || ''
      });
    }
  }, [lineData]);

  const [isSavingLine, setIsSavingLine] = useState(false);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);

  // Modal State for Adding Equipment
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEquipData, setNewEquipData] = useState({
    type: EquipmentType.AssemblyEquipment,
    name: '',
    description: '',
    factoryArea: '',
    floor: '',
    sn: ''
  });

  const activeEquipmentList = lineId 
    ? equipmentList.filter(e => e.lineId === lineId) 
    : equipmentList;

  const handleSaveLineInfo = async () => {
    setIsSavingLine(true);
    try {
      const response = await api.post('https://localhost:7044/api/Line/LineMaintenance', {
        lineName: lineInfo.name,
        description: lineInfo.description,
        lineIP: lineInfo.hostIp,
        station: lineInfo.station,
        productName: lineInfo.model,
        phaseName: lineInfo.phase,
        phmBillNo: lineInfo.phmOrder,
        process: lineInfo.process,
        line: lineInfo.lineCategory
      });

      if (response.data.code === 200) {
        alert(response.data.message || '產綫環境配置信息已成功更新！');
      } else {
        alert(`保存失敗: ${response.data.message || '未知錯誤'}`);
      }
    } catch (error: any) {
      console.error('Save Line Info Error:', error);
      if (error.message === 'Network Error') {
        alert('通訊異常：無法連線至 https://localhost:7044。請確保後端服務已啟動並信任 SSL 憑證。');
      } else {
        alert(`保存過程發生錯誤: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setIsSavingLine(false);
    }
  };

  const handleAddEquipment = async () => {
    if (!newEquipData.name.trim()) {
      alert("請輸入設備名稱");
      return;
    }

    setIsAddingEquipment(true);
    try {
      // 獲取枚舉的英文鍵名 (例如: 'AssemblyEquipment') 而非顯示值 (例如: '組裝設備')
      const equipmentTypeKey = Object.entries(EquipmentType).find(([_, value]) => value === newEquipData.type)?.[0] || newEquipData.type;

      // 調用指定的 API 地址進行設備新增
      const response = await api.post('https://localhost:7044/api/Line/CreateEquipment', {
        equipmentType: equipmentTypeKey,
        equipmentName: newEquipData.name,
        description: newEquipData.description
      });

      if (response.data.code === 200) {
        const sysName = response.data.data?.equipmentSystemName || `E${Math.floor(Math.random() * 10000)}`;
        
        const newEquip: Equipment = {
          id: sysName,
          lineId: lineId || 'L1',
          name: newEquipData.name,
          type: newEquipData.type,
          description: newEquipData.description,
          status: MachineStatus.Stopped,
          temperature: 20,
          vibration: 0,
          lastMaintenance: new Date().toISOString().split('T')[0],
          factoryArea: newEquipData.factoryArea,
          floor: newEquipData.floor,
          sn: newEquipData.sn || sysName,
          fingerprintId: '1'
        };
        
        onAddEquipment(newEquip);
        setIsAddModalOpen(false);
        setNewEquipData({ type: EquipmentType.AssemblyEquipment, name: '', description: '', factoryArea: '', floor: '', sn: '' });
        alert(response.data.message || '設備已成功新增');
      } else {
        alert(`新增失敗: ${response.data.message || '未知錯誤'}`);
      }
    } catch (error: any) {
      console.error('Add Equipment Error:', error);
      if (error.message === 'Network Error') {
        alert('通訊異常：無法連線至 https://localhost:7044。請確保後端服務已啟動並信任 SSL 憑證。');
      } else {
        alert(`新增過程發生錯誤: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setIsAddingEquipment(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('STATUS')}
          className={`flex items-center px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'STATUS' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Cpu size={18} className="mr-2" />
          產綫設備概覽
        </button>
      </div>

      <div className="animate-in fade-in duration-300 space-y-8">
        {/* Production Line Maintenance Section */}
        {activeTab === 'STATUS' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center text-slate-800">
                <Settings size={20} className="text-blue-600 mr-2" />
                <h3 className="font-bold">產綫信息維護</h3>
              </div>
              <button 
                onClick={handleSaveLineInfo}
                disabled={isSavingLine}
                className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSavingLine ? <RotateCw size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                {isSavingLine ? '處理中...' : '保存產綫配置'}
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <Layers size={12} className="mr-1 text-blue-500" /> 綫體名稱
                  </label>
                  <input 
                    type="text" 
                    value={lineInfo.name} 
                    onChange={(e) => setLineInfo({...lineInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <Monitor size={12} className="mr-1 text-blue-500" /> 主機 IP
                  </label>
                  <input 
                    type="text" 
                    value={lineInfo.hostIp} 
                    onChange={(e) => setLineInfo({...lineInfo, hostIp: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <MapPin size={12} className="mr-1 text-blue-500" /> 工站
                  </label>
                  <input 
                    type="text" 
                    value={lineInfo.station} 
                    onChange={(e) => setLineInfo({...lineInfo, station: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <Hash size={12} className="mr-1 text-blue-500" /> 機種
                  </label>
                  <input 
                    type="text" 
                    value={lineInfo.model} 
                    onChange={(e) => setLineInfo({...lineInfo, model: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <Activity size={12} className="mr-1 text-blue-500" /> 階段
                  </label>
                  <input 
                    type="text" 
                    value={lineInfo.phase} 
                    onChange={(e) => setLineInfo({...lineInfo, phase: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <Wrench size={12} className="mr-1 text-blue-500" /> 製程
                  </label>
                  <input 
                    type="text" 
                    value={lineInfo.process} 
                    onChange={(e) => setLineInfo({...lineInfo, process: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <ClipboardList size={12} className="mr-1 text-blue-500" /> PHM執行單號
                  </label>
                  <input 
                    type="text" 
                    value={lineInfo.phmOrder} 
                    onChange={(e) => setLineInfo({...lineInfo, phmOrder: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <Network size={12} className="mr-1 text-blue-500" /> 綫別
                  </label>
                  <input 
                    type="text" 
                    value={lineInfo.lineCategory} 
                    onChange={(e) => setLineInfo({...lineInfo, lineCategory: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 space-y-1 pt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                    <Info size={12} className="mr-1 text-blue-500" /> 描述
                  </label>
                  <textarea 
                    value={lineInfo.description} 
                    onChange={(e) => setLineInfo({...lineInfo, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">產綫設備詳情</h2>
            {lineId && <p className="text-sm text-slate-500 mt-1">當前產綫: <span className="font-mono font-bold text-blue-600">{lineId}</span></p>}
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center shadow-sm transition-colors"
          >
            <Plus size={16} className="mr-2" /> 新增設備實例
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
          {activeEquipmentList.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
              目前暫無設備。
            </div>
          ) : (
            activeEquipmentList.map((equip) => (
              <div key={equip.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${equip.status === MachineStatus.Running ? 'bg-green-500 animate-pulse' : equip.status === MachineStatus.Warning ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                    <h3 className="font-bold text-slate-800">{equip.name}</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">#{equip.id}</span>
                </div>
                
                <div className="p-5">
                  <div className="flex items-center mb-4">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100 font-medium">
                      {equip.type}
                    </span>
                    {equip.sn && <span className="ml-2 text-xs text-slate-400 font-mono">SN: {equip.sn}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-slate-500">
                        <Thermometer size={14} className="mr-1" /> 溫度
                      </div>
                      <div className="text-xl font-bold text-slate-800">{equip.temperature}°C</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-slate-500">
                        <Activity size={14} className="mr-1" /> 震動
                      </div>
                      <div className="text-xl font-bold text-slate-800">{equip.vibration} mm/s</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-100">
                    <div className="flex items-center text-slate-500">
                      <Clock size={14} className="mr-1.5" />
                      維護: {equip.lastMaintenance}
                    </div>
                    <button 
                      onClick={() => onMaintainDevice && onMaintainDevice(equip.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-xs uppercase tracking-wide hover:underline"
                    >
                      <Settings size={14} className="mr-1" /> 維護設備
                    </button>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 w-0 group-hover:w-full transition-all duration-300"></div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Equipment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">新增設備實例</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">設備類型 *</label>
                <select
                  value={newEquipData.type}
                  onChange={(e) => setNewEquipData({...newEquipData, type: e.target.value as EquipmentType})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={EquipmentType.AssemblyEquipment}>{EquipmentType.AssemblyEquipment}</option>
                  <option value={EquipmentType.WaterVaporEquipment}>{EquipmentType.WaterVaporEquipment}</option>
                  <option value={EquipmentType.TestingEquipment}>{EquipmentType.TestingEquipment}</option>
                  <option value={EquipmentType.AGVCarEquipment}>{EquipmentType.AGVCarEquipment}</option>
                  <option value={EquipmentType.CheckinEquipment}>{EquipmentType.CheckinEquipment}</option>
                </select>
              </div>

              {/* 設備名稱與描述表單 */}
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">設備名稱 *</label>
                  <input
                    type="text"
                    value={newEquipData.name}
                    onChange={(e) => setNewEquipData({...newEquipData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="請輸入設備自定義名稱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                    <Edit3 size={14} className="mr-1.5 text-blue-500" /> 設備描述
                  </label>
                  <textarea
                    value={newEquipData.description}
                    onChange={(e) => setNewEquipData({...newEquipData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
                    placeholder="請輸入對該設備功能的說明性文字..."
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                disabled={isAddingEquipment}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-50"
              >
                取消
              </button>
              <button 
                onClick={handleAddEquipment} 
                disabled={isAddingEquipment}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center disabled:opacity-50"
              >
                {isAddingEquipment ? (
                  <>
                    <RotateCw size={14} className="animate-spin mr-2" />
                    處理中...
                  </>
                ) : (
                  '新增設備'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagement;