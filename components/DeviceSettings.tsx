import React, { useState, useEffect } from 'react';
import { Equipment, MachineStatus, EquipmentType } from '../types';
import api from '../services/api';
import { 
  ArrowLeft, Save, Activity, Settings, 
  Cpu, Zap, Database, Plug, Plus, Trash2, Server,
  Table as TableIcon, MapPin, X, ChevronRight, Edit3, Building, Hash, Fingerprint,
  Radio, Network, Globe, Shield, RotateCw, Wifi, WifiOff, Key, Eye, EyeOff,
  ListFilter, Search, Check, Trash, Columns, Layout, Info
} from 'lucide-react';

interface DeviceSettingsProps {
  device: Equipment | null;
  onSave: (updated: Equipment) => void;
  onBack: () => void;
}

type TabType = 'BASIC' | 'MAPPING' | 'PROCESS_LAYOUT';
type ConnectionResult = 'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED';

interface TableColumn {
  id: string;
  name: string;
  type: string;
}

const DeviceSettings: React.FC<DeviceSettingsProps> = ({ device, onSave, onBack }) => {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('BASIC');
  const [connectionResult, setConnectionResult] = useState<ConnectionResult>('IDLE');
  const [isTesting, setIsTesting] = useState(false);
  
  // Database Connection States
  const [dbConfig, setDbConfig] = useState({
    host: '10.20.30.15',
    port: '1433',
    username: 'sa',
    password: '',
    showPassword: false
  });
  const [dbConnecting, setDbConnecting] = useState(false);
  const [dbTables, setDbTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);

  // Table Editing States
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [editingRows, setEditingRows] = useState<any[]>([]);

  // New Table Modal State
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableColumns, setNewTableColumns] = useState<TableColumn[]>([
    { id: '1', name: 'id', type: 'INT' },
    { id: '2', name: 'timestamp', type: 'DATETIME' }
  ]);

  // Local Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: MachineStatus.Stopped,
    equipmentSN: '',
    sn: '',
    factoryArea: '',
    floor: '',
    fingerprintId: '1',
    ip: '192.168.1.100',
    plcBrand: 'Inovance',
    plcSeries: 'H5U',
    plcPort: '8000',
    plcProtocol: 'MC Protocol (TCP)',
    plcStation: '1',
    plcDataType: 'CDAB',
    plcStringReverse: false,
    rack: '0',
    slot: '2',
    alarmAddress: '',
    alarmAddressLength: 0,
    okCountAddress: '',
    ngCountAddress: '',
    rejectCountAddress: '',
    statusAddress: '',
    alarmEndAddress: '',
    processAddress: '',
    processAddressLength: 0
  });

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name,
        description: device.description || '',
        status: device.status,
        equipmentSN: device.equipmentSN || '',
        sn: device.sn || device.id,
        factoryArea: device.factoryArea || '',
        floor: device.floor || '',
        fingerprintId: device.fingerprintId || '1',
        ip: device.ip || '192.168.1.100',
        plcBrand: device.plcBrand || 'Inovance',
        plcSeries: device.plcSeries || 'H5U',
        plcPort: device.plcPort || '8000',
        plcProtocol: device.plcProtocol || 'MC Protocol (TCP)',
        plcStation: device.plcStation || '1',
        plcDataType: device.plcDataType || 'CDAB',
        plcStringReverse: device.plcStringReverse || false,
        rack: '0',
        slot: '2',
        alarmAddress: device.alarmAddress || '',
        alarmAddressLength: device.alarmAddressLength || 0,
        okCountAddress: device.okCountAddress || '',
        ngCountAddress: device.ngCountAddress || '',
        rejectCountAddress: device.rejectCountAddress || '',
        statusAddress: device.statusAddress || '',
        alarmEndAddress: device.alarmEndAddress || '',
        processAddress: device.processAddress || '',
        processAddressLength: device.processAddressLength || 0
      });
    }
  }, [device]);

  const handleTestConnection = async () => {
    if (!device) return;
    setIsTesting(true);
    setConnectionResult('TESTING');
    try {
      const response = await fetch('https://localhost:7044/api/Equipment/CommLinkTest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          equipmentType: device.type
        })
      });
      const result = await response.json();
      if (result.code === 200) {
        setConnectionResult('SUCCESS');
      } else {
        setConnectionResult('FAILED');
        alert(`測試失敗: ${result.message || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionResult('FAILED');
      alert('測試時發生網路錯誤，請稍後再試。');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!device) return;
    setSaving(true);
    
    try {
      if (device.type === EquipmentType.AssemblyEquipment || device.type === EquipmentType.TestingEquipment || device.type === EquipmentType.WaterVaporEquipment) {
        let endpoint = 'https://localhost:7044/api/Equipment/AEMaintenance';
        if (device.type === EquipmentType.TestingEquipment) {
          endpoint = 'https://localhost:7044/api/Equipment/TEMaintenance';
        } else if (device.type === EquipmentType.WaterVaporEquipment) {
          endpoint = 'https://localhost:7044/api/Equipment/WEMaintenance';
        }
        const response = await api.post(endpoint, {
          lineSystemName: device.lineId,
          equipmentSystemName: device.id,
          equipmentName: formData.name,
          description: formData.description,
          equipmentSN: formData.equipmentSN,
          plcBrand: formData.plcBrand,
          plcSeries: formData.plcSeries,
          plcIP: formData.ip,
          plcPort: parseInt(formData.plcPort) || 0,
          station: parseInt(formData.plcStation) || 0,
          dataType: formData.plcDataType,
          isReverse: formData.plcStringReverse,
          alarmAddress: formData.alarmAddress,
          alarmAddressLength: formData.alarmAddressLength,
          oKCapacityAdd: formData.okCountAddress,
          nGCapacityAdd: formData.ngCountAddress,
          throwCapacityAdd: formData.rejectCountAddress,
          statusAdd: formData.statusAddress,
          alarmEndSignAdd: formData.alarmEndAddress,
          processAddress: formData.processAddress,
          processAddressLength: formData.processAddressLength
        });

        if (response.data.code === 200) {
          onSave({ ...device, ...formData });
          alert(response.data.message || '設備配置與通訊參數已成功保存！');
        } else {
          alert(`保存失敗: ${response.data.message || '未知錯誤'}`);
        }
      } else if (device.type === EquipmentType.CheckinEquipment) {
        const response = await api.post('https://localhost:7044/api/Equipment/CEMaintenance', {
          lineSystemName: device.lineId,
          equipmentSystemName: device.id,
          equipmentName: formData.name,
          description: formData.description,
          equipmentSN: formData.equipmentSN,
          fingerIndex: parseInt(formData.fingerprintId) || 0
        });

        if (response.data.code === 200) {
          onSave({ ...device, ...formData });
          alert(response.data.message || '設備配置已成功保存！');
        } else {
          alert(`保存失敗: ${response.data.message || '未知錯誤'}`);
        }
      } else {
        // For other equipment types, keep existing behavior
        onSave({ ...device, ...formData });
        alert('設備配置已保存！');
      }
    } catch (error: any) {
      console.error('Save Equipment Error:', error);
      const errorMsg = error.response?.data?.message || error.message || '網絡錯誤，請檢查後端服務。';
      alert(`保存過程發生錯誤: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectDB = () => {
    setDbConnecting(true);
    setTimeout(() => {
      setDbConnecting(false);
      setDbTables(['Production_Output_Log', 'Machine_Errors_History', 'Sensor_Readings_Realtime', 'Employee_Shifts_Config', 'System_Audit_Log']);
      alert('數據庫連接成功！已獲取表信息列表。');
    }, 1200);
  };

  const handleSelectTable = (tableName: string) => {
    if (isEditingTable) {
      if (!window.confirm('當前正在編輯中，切換表將遺失未保存的更改，確定要繼續嗎？')) return;
      setIsEditingTable(false);
    }
    setSelectedTable(tableName);
    const mockRows = Array.from({ length: 8 }).map((_, i) => ({
      id: 1000 + i,
      timestamp: new Date().toLocaleString(),
      source_tag: `PLC_ADDR_${i * 10}`,
      value: (Math.random() * 100).toFixed(2),
      status: Math.random() > 0.1 ? 'VALID' : 'ERROR'
    }));
    setTableData(mockRows);
  };

  // --- New Table Modal Logic ---
  const handleAddColumn = () => {
    const newId = (newTableColumns.length + 1).toString();
    setNewTableColumns([...newTableColumns, { id: newId, name: '', type: 'VARCHAR' }]);
  };

  const handleDeleteColumn = (id: string) => {
    setNewTableColumns(newTableColumns.filter(col => col.id !== id));
  };

  const handleUpdateColumn = (id: string, field: keyof TableColumn, value: string) => {
    setNewTableColumns(newTableColumns.map(col => col.id === id ? { ...col, [field]: value } : col));
  };

  const handleSaveNewTable = () => {
    if (!newTableName.trim()) {
      alert('請輸入表名稱');
      return;
    }
    if (newTableColumns.some(col => !col.name.trim())) {
      alert('請填寫所有列的名稱');
      return;
    }
    setDbTables([...dbTables, newTableName.trim()]);
    setIsNewTableModalOpen(false);
    setNewTableName('');
    setNewTableColumns([{ id: '1', name: 'id', type: 'INT' }, { id: '2', name: 'timestamp', type: 'DATETIME' }]);
    alert(`數據表 ${newTableName} 結構已成功創建並寫入數據庫！`);
  };

  // --- Table Editing Logic ---
  const startEditing = () => {
    setEditingRows(JSON.parse(JSON.stringify(tableData)));
    setIsEditingTable(true);
  };

  const cancelEditing = () => {
    setIsEditingTable(false);
    setEditingRows([]);
  };

  const saveTableEdits = () => {
    setTableData(editingRows);
    setIsEditingTable(false);
    alert('數據表內容已成功提交保存！');
  };

  const addNewRow = () => {
    const newId = editingRows.length > 0 ? Math.max(...editingRows.map(r => r.id)) + 1 : 1000;
    const newRow = {
      id: newId,
      timestamp: new Date().toLocaleString(),
      source_tag: 'NEW_TAG',
      value: '0.00',
      status: 'VALID'
    };
    setEditingRows([newRow, ...editingRows]);
  };

  const deleteRow = (id: number) => {
    setEditingRows(editingRows.filter(r => r.id !== id));
  };

  const updateRowValue = (id: number, field: string, value: string) => {
    setEditingRows(editingRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const renderMappingInfo = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* DB Connection Card */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
            <h3 className="text-white font-bold flex items-center">
              <Database size={18} className="mr-2" /> 數據庫連接配置
            </h3>
            {dbTables.length > 0 && <span className="bg-green-400 w-2 h-2 rounded-full animate-pulse"></span>}
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Host IP 地址</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={dbConfig.host}
                  onChange={(e) => setDbConfig({...dbConfig, host: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">端口號</label>
              <input 
                type="text" 
                value={dbConfig.port}
                onChange={(e) => setDbConfig({...dbConfig, port: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">用戶名</label>
              <div className="relative">
                <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={dbConfig.username}
                  onChange={(e) => setDbConfig({...dbConfig, username: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">密碼</label>
              <div className="relative">
                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={dbConfig.showPassword ? 'text' : 'password'} 
                  value={dbConfig.password}
                  onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})}
                  className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="••••••••"
                />
                <button 
                  onClick={() => setDbConfig({...dbConfig, showPassword: !dbConfig.showPassword})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {dbConfig.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button 
              onClick={handleConnectDB}
              disabled={dbConnecting}
              className="w-full mt-4 flex items-center justify-center py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {dbConnecting ? <RotateCw size={18} className="animate-spin mr-2" /> : <Plug size={18} className="mr-2" />}
              {dbConnecting ? '連接中...' : '連接數據庫'}
            </button>
          </div>
        </div>

        {/* Table Information List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[300px]">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 flex items-center">
              <ListFilter size={16} className="mr-2" /> 表信息列表
            </h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsNewTableModalOpen(true)}
                title="新增數據表"
                className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                <Plus size={14} />
              </button>
              <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-500">{dbTables.length} TABLES</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {dbTables.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <TableIcon size={32} className="mb-2 opacity-20" />
                <p className="text-xs">請先連接數據庫以獲取表列表</p>
              </div>
            ) : (
              <div className="space-y-1">
                {dbTables.map(table => (
                  <button 
                    key={table}
                    onClick={() => handleSelectTable(table)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all group ${selectedTable === table ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                  >
                    <div className="flex items-center">
                      <TableIcon size={14} className={`mr-2 ${selectedTable === table ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                      {table}
                    </div>
                    {selectedTable === table && <ChevronRight size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Content Card */}
      <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-320px)] lg:h-auto">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg mr-3 transition-colors ${isEditingTable ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <TableIcon size={20} />
            </div>
            <div>
              <h3 className="text-md font-bold text-slate-800">表內容預覽 {isEditingTable && <span className="ml-2 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">編輯模式</span>}</h3>
              <p className="text-xs text-slate-500 font-mono">{selectedTable || '未選擇數據表'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedTable && !isEditingTable && (
              <button 
                onClick={startEditing}
                className="flex items-center px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
              >
                <Edit3 size={14} className="mr-1.5" /> 編輯數據
              </button>
            )}
            {isEditingTable && (
              <>
                <button 
                  onClick={addNewRow}
                  className="flex items-center px-4 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all shadow-sm"
                >
                  <Plus size={14} className="mr-1.5" /> 新增數據
                </button>
                <button 
                  onClick={saveTableEdits}
                  className="flex items-center px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100"
                >
                  <Check size={14} className="mr-1.5" /> 保存
                </button>
                <button 
                  onClick={cancelEditing}
                  className="flex items-center px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-100 transition-all"
                >
                  <X size={14} className="mr-1.5" /> 取消
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className={`flex-1 overflow-auto custom-scrollbar transition-colors ${isEditingTable ? 'bg-indigo-50/20' : 'bg-slate-50/30'}`}>
          {!selectedTable ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="opacity-20" />
              </div>
              <p className="text-md font-bold text-slate-500">尚無內容可顯示</p>
              <p className="text-sm max-w-xs mt-1">請從左側列表選擇一張表以讀取實時數據映射內容。</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">時間戳 (Timestamp)</th>
                  <th className="px-6 py-4">數據標籤 (Tag)</th>
                  <th className="px-6 py-4">讀值 (Value)</th>
                  <th className="px-6 py-4 text-center">狀態</th>
                  {isEditingTable && <th className="px-6 py-4 text-right w-20">操作</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(isEditingTable ? editingRows : tableData).map((row, idx) => (
                  <tr key={row.id} className={`hover:bg-indigo-50/50 transition-colors group animate-in slide-in-from-left-2 duration-300`}>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{row.id}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {isEditingTable ? (
                        <input 
                          type="text" 
                          value={row.timestamp} 
                          onChange={(e) => updateRowValue(row.id, 'timestamp', e.target.value)}
                          className="bg-transparent border-b border-transparent focus:border-indigo-400 outline-none w-full text-xs"
                        />
                      ) : row.timestamp}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-indigo-600">
                      {isEditingTable ? (
                        <input 
                          type="text" 
                          value={row.source_tag} 
                          onChange={(e) => updateRowValue(row.id, 'source_tag', e.target.value)}
                          className="bg-transparent border-b border-indigo-200 focus:border-indigo-600 outline-none w-full text-xs font-bold"
                        />
                      ) : row.source_tag}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      {isEditingTable ? (
                        <input 
                          type="text" 
                          value={row.value} 
                          onChange={(e) => updateRowValue(row.id, 'value', e.target.value)}
                          className="bg-transparent border-b border-indigo-200 focus:border-indigo-600 outline-none w-20 text-sm font-bold text-slate-900"
                        />
                      ) : row.value}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isEditingTable ? (
                        <select 
                          value={row.status}
                          onChange={(e) => updateRowValue(row.id, 'status', e.target.value)}
                          className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[10px] outline-none"
                        >
                          <option value="VALID">VALID</option>
                          <option value="ERROR">ERROR</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {row.status}
                        </span>
                      )}
                    </td>
                    {isEditingTable && (
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteRow(row.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="刪除此行"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {selectedTable && (
          <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400">總計：{(isEditingTable ? editingRows : tableData).length} 條紀錄</span>
            {!isEditingTable && <button className="text-[10px] font-bold text-indigo-600 hover:underline">導出映射 CSV</button>}
          </div>
        )}
      </div>

      {/* New Table Modal */}
      {isNewTableModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Layout size={20} />
                <h3 className="font-bold">創建新數據表結構</h3>
              </div>
              <button onClick={() => setIsNewTableModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <Database size={14} className="mr-2 text-indigo-600" /> 表名稱 (Table Name)
                </label>
                <input 
                  type="text" 
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  placeholder="e.g. Production_Quality_Log"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center">
                    <Columns size={14} className="mr-2 text-indigo-600" /> 列結構定義 (Columns)
                  </label>
                  <button 
                    onClick={handleAddColumn}
                    className="flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <Plus size={14} className="mr-1" /> 添加列
                  </button>
                </div>

                <div className="space-y-3">
                  {newTableColumns.map((col, index) => (
                    <div key={col.id} className="flex items-center space-x-3 group animate-in slide-in-from-right-2 duration-300">
                      <div className="text-[10px] font-bold text-slate-300 w-4">{index + 1}</div>
                      <input 
                        type="text"
                        value={col.name}
                        onChange={(e) => handleUpdateColumn(col.id, 'name', e.target.value)}
                        placeholder="列名"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                      />
                      <select 
                        value={col.type}
                        onChange={(e) => handleUpdateColumn(col.id, 'type', e.target.value)}
                        className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none bg-slate-50"
                      >
                        <option value="INT">INT</option>
                        <option value="VARCHAR">VARCHAR</option>
                        <option value="DATETIME">DATETIME</option>
                        <option value="FLOAT">FLOAT</option>
                        <option value="BOOLEAN">BOOLEAN</option>
                        <option value="TEXT">TEXT</option>
                      </select>
                      <button 
                        onClick={() => handleDeleteColumn(col.id)}
                        disabled={newTableColumns.length <= 1}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-4">
              <button 
                onClick={() => setIsNewTableModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700"
              >
                取消
              </button>
              <button 
                onClick={handleSaveNewTable}
                className="flex items-center px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                <Save size={18} className="mr-2" /> 保存數據表
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!device) return <div className="p-8 text-center text-red-500">Device not found</div>;

  const renderBasicInfo = () => {
    const isClockInDevice = device.type === EquipmentType.CheckinEquipment;
    const isStandardMachine = device.type === EquipmentType.AssemblyEquipment || device.type === EquipmentType.TestingEquipment || device.type === EquipmentType.WaterVaporEquipment;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center">
            <Server size={20} className="text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-slate-800">
              {isClockInDevice ? '打卡設備維護參數' : '設備基礎信息'}
            </h3>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {isClockInDevice ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center">
                    <Settings size={14} className="mr-1.5 text-blue-500" /> 打卡機名稱
                  </label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center">
                    <Shield size={14} className="mr-1.5 text-blue-500" /> 資產管制編號 (Equipment SN)
                  </label>
                  <input type="text" value={formData.equipmentSN} onChange={(e) => setFormData({...formData, equipmentSN: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono" placeholder="例如: ASSET-2024-001" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center">
                    <Fingerprint size={14} className="mr-1.5 text-blue-500" /> 指紋儀編號
                  </label>
                  <select value={formData.fingerprintId} onChange={(e) => setFormData({...formData, fingerprintId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => <option key={num} value={num.toString()}>{num === 0 ? '未指定 (0)' : num}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center">
                    <Info size={14} className="mr-1.5 text-blue-500" /> 備注説明
                  </label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="請輸入對該設備功能的說明性文字..." />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">設備名稱</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">資產管制編號 (Equipment SN)</label>
                  <input type="text" value={formData.equipmentSN} onChange={(e) => setFormData({...formData, equipmentSN: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" placeholder="例如: ASSET-2024-001" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">備註說明</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]" />
                </div>
              </>
            )}
          </div>
        </div>

        {isStandardMachine && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center">
              <Network size={20} className="text-indigo-600 mr-2" />
              <h3 className="text-lg font-bold text-slate-800">通訊信息 (PLC 連接配置)</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center"><Radio size={14} className="mr-1.5 text-indigo-500" /> PLC 品牌</label>
                  <select 
                    value={formData.plcBrand} 
                    onChange={(e) => {
                      const newBrand = e.target.value;
                      const newSeries = newBrand === 'Inovance' ? 'H5U' : 'Modbus TCP';
                      setFormData({...formData, plcBrand: newBrand, plcSeries: newSeries});
                    }} 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all"
                  >
                    <option value="Inovance">Inovance</option>
                    <option value="Keyence">Keyence</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center"><Radio size={14} className="mr-1.5 text-indigo-500" /> PLC 系列</label>
                  <select 
                    value={formData.plcSeries} 
                    onChange={(e) => setFormData({...formData, plcSeries: e.target.value})} 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all"
                  >
                    {formData.plcBrand === 'Inovance' ? (
                      <>
                        <option value="H5U">H5U</option>
                        <option value="H3U">H3U</option>
                      </>
                    ) : (
                      <option value="Modbus TCP">Modbus TCP</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center"><Globe size={14} className="mr-1.5 text-indigo-500" /> IP 地址</label>
                  <input type="text" value={formData.ip} onChange={(e) => setFormData({...formData, ip: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center"><Zap size={14} className="mr-1.5 text-indigo-500" /> 通訊端口</label>
                  <input type="text" value={formData.plcPort} onChange={(e) => setFormData({...formData, plcPort: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center"><Hash size={14} className="mr-1.5 text-indigo-500" /> 站號</label>
                  <input type="text" value={formData.plcStation} onChange={(e) => setFormData({...formData, plcStation: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder="PLC 站號" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center"><Columns size={14} className="mr-1.5 text-indigo-500" /> 數據類型</label>
                  <select value={formData.plcDataType} onChange={(e) => setFormData({...formData, plcDataType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all">
                    <option value="ABCD">ABCD</option>
                    <option value="BADC">BADC</option>
                    <option value="CDAB">CDAB</option>
                    <option value="DCBA">DCBA</option>
                  </select>
                </div>
                <div className="space-y-1 flex flex-col justify-end pb-2">
                  <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={formData.plcStringReverse}
                        onChange={(e) => setFormData({...formData, plcStringReverse: e.target.checked})}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${formData.plcStringReverse ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.plcStringReverse ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className="ml-3 text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">字符串顛倒</span>
                  </label>
                </div>
              </div>

              {(device.type === EquipmentType.AssemblyEquipment || device.type === EquipmentType.TestingEquipment || device.type === EquipmentType.WaterVaporEquipment) && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                    <Database size={16} className="mr-2 text-indigo-600" /> PLC 數據地址配置
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">報警地址</label>
                      <input 
                        type="text" 
                        value={formData.alarmAddress} 
                        onChange={(e) => setFormData({...formData, alarmAddress: e.target.value})} 
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                        placeholder="例如: D1000"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">報警地址長度</label>
                      <input 
                        type="number" 
                        value={formData.alarmAddressLength} 
                        onChange={(e) => setFormData({...formData, alarmAddressLength: parseInt(e.target.value) || 0})} 
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">OK計數地址</label>
                      <input 
                        type="text" 
                        value={formData.okCountAddress} 
                        onChange={(e) => setFormData({...formData, okCountAddress: e.target.value})} 
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                        placeholder="例如: D1100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">NG計數地址</label>
                      <input 
                        type="text" 
                        value={formData.ngCountAddress} 
                        onChange={(e) => setFormData({...formData, ngCountAddress: e.target.value})} 
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                        placeholder="例如: D1102"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">抛料數地址</label>
                      <input 
                        type="text" 
                        value={formData.rejectCountAddress} 
                        onChange={(e) => setFormData({...formData, rejectCountAddress: e.target.value})} 
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                        placeholder="例如: D1104"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">設備狀態地址</label>
                      <input 
                        type="text" 
                        value={formData.statusAddress} 
                        onChange={(e) => setFormData({...formData, statusAddress: e.target.value})} 
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                        placeholder="例如: D1106"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">報警結束地址</label>
                      <input 
                        type="text" 
                        value={formData.alarmEndAddress} 
                        onChange={(e) => setFormData({...formData, alarmEndAddress: e.target.value})} 
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                        placeholder="例如: D1108"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-8 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start">
                  <Activity size={18} className="text-indigo-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900">連接測試提示</h4>
                    <p className="text-xs text-indigo-700 mt-1">保存配置後，系統將自動嘗試與 PLC 建立握手連接。</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className={`flex items-center px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 shrink-0 ${connectionResult === 'SUCCESS' ? 'bg-green-600 text-white' : connectionResult === 'FAILED' ? 'bg-red-600 text-white' : isTesting ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {isTesting ? <RotateCw size={18} className="animate-spin mr-2" /> : <Zap size={18} className="mr-2" />}
                  {isTesting ? '處理中...' : '測試設備連線'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"><ArrowLeft size={24} /></button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">設備管理配置</h2>
            <div className="flex items-center text-sm text-slate-500 mt-1">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 mr-2">ID: {device.id}</span>
              <span className="flex items-center"><Cpu size={14} className="mr-1" /> {device.type}</span>
            </div>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50">
          {saving ? <span className="flex items-center"><RotateCw className="animate-spin mr-2" size={18} /> 處理中...</span> : <span className="flex items-center"><Save className="mr-2" size={18} /> 保存配置</span>}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-2">
         <div className="flex overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('BASIC')} className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'BASIC' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>基礎信息與通訊</button>
            <button 
              onClick={() => (device.type === EquipmentType.AssemblyEquipment || device.type === EquipmentType.TestingEquipment || device.type === EquipmentType.WaterVaporEquipment) && setActiveTab('MAPPING')} 
              disabled={device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'MAPPING' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} ${device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              數據映射管理
            </button>
            <button 
              onClick={() => (device.type === EquipmentType.AssemblyEquipment || device.type === EquipmentType.TestingEquipment || device.type === EquipmentType.WaterVaporEquipment) && setActiveTab('PROCESS_LAYOUT')} 
              disabled={device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'PROCESS_LAYOUT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} ${device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              工藝排佈
            </button>
         </div>
      </div>

      <div>
        {activeTab === 'BASIC' && renderBasicInfo()}
        {activeTab === 'MAPPING' && renderMappingInfo()}
        {activeTab === 'PROCESS_LAYOUT' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center mb-6">
              <Layout size={24} className="text-indigo-600 mr-3" />
              <h3 className="text-lg font-medium text-slate-800">工藝排佈配置</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">工藝地址</label>
                <input 
                  type="text" 
                  value={formData.processAddress} 
                  onChange={(e) => setFormData({...formData, processAddress: e.target.value})} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                  placeholder="例如: D1200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">工藝地址長度</label>
                <input 
                  type="number" 
                  value={formData.processAddressLength} 
                  onChange={(e) => setFormData({...formData, processAddressLength: parseInt(e.target.value) || 0})} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                />
              </div>
            </div>
            
            <div className="text-center text-slate-500 py-8 border-t border-slate-100">
              <p className="max-w-md mx-auto">此分頁用於對該設備的工藝進行自定義排佈，其他內容暫時為空。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceSettings;