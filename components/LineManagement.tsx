import React, { useState } from 'react';
import { MOCK_LINES } from '../constants';
import { MachineStatus, ProductionLine, LineType, Equipment, EquipmentType } from '../types';
import api from '../services/api';
import { 
  PlayCircle, StopCircle, AlertTriangle, Settings, Plus, 
  Monitor, X, Layers, Building2, Save, RotateCw, MapPin, Tag, CheckCircle2, Upload, Download
} from 'lucide-react';

interface LineManagementProps {
  onViewEquipment: (lineId: string, lineData?: any) => void;
  onUpdateFactory?: (lines: ProductionLine[], equipment: Equipment[], info?: { code: string, floor: string }) => void;
  onResetFactory?: () => void;
  lines: ProductionLine[];
  equipmentList?: Equipment[];
  factoryInfo: { code: string, floor: string };
}

const LineManagement: React.FC<LineManagementProps> = ({ onViewEquipment, onUpdateFactory, onResetFactory, lines, equipmentList = [], factoryInfo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enteringLineId, setEnteringLineId] = useState<string | null>(null);
  const [newLineData, setNewLineData] = useState({ 
    name: '', 
    description: '', 
    category: 'Vulkan-A',
    lineType: LineType.NVIDIA 
  });
  
  // Local UI state for factory info inputs
  const [localFactoryInfo, setLocalFactoryInfo] = useState(factoryInfo);
  
  React.useEffect(() => {
    setLocalFactoryInfo(factoryInfo);
  }, [factoryInfo]);

  const [isSavingFactory, setIsSavingFactory] = useState(false);
  const [isCreatingLine, setIsCreatingLine] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const exportFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportClick = () => {
    exportFileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 調用指定的 API 地址加載工廠項目
      const response = await api.post('https://localhost:7044/api/Factory/LoadProject', {
        fileName: file.name
      });

      if (response.data.code === 200) {
        const { site, floor, lineSet } = response.data.data;
        
        // 映射產綫數據
        const mappedLines: ProductionLine[] = (lineSet || []).map((item: any) => {
          // 處理可能的嵌套結構
          const l = item.IManufacturingLine || item;
          return {
            id: l.sysName,
            factoryId: 'F1',
            name: l.lineName,
            description: l.description,
            category: l.line,
            lineType: l.typeString as LineType,
            status: MachineStatus.Stopped,
            outputPerHour: 0,
            targetOutput: 1000,
          };
        });

        // 更新狀態
        if (onUpdateFactory) {
          onUpdateFactory(mappedLines, [], { code: site || 'GL', floor: floor || '3F' });
        }
        setLocalFactoryInfo({ code: site || 'GL', floor: floor || '3F' });
        
        alert(response.data.message || '工廠項目已成功加載！');
      } else {
        alert(`加載失敗: ${response.data.message || '未知錯誤'}`);
      }
    } catch (error: any) {
      console.error('Load Project Error:', error);
      if (error.message === 'Network Error') {
        alert('通訊異常：無法連線至 https://localhost:7044。請確保後端服務已啟動並信任 SSL 憑證。');
      } else {
        alert(`加載過程發生錯誤: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExporting(true);
    try {
      // 調用指定的 API 地址進行工廠導出保存
      const response = await api.post('https://localhost:7044/api/Factory/SaveProject', {
        fileName: file.name
      });

      if (response.data.code === 200) {
        alert(response.data.message || '工廠信息已成功導出。');
      } else {
        alert(`導出失敗: ${response.data.code === 404 ? '找不到路徑' : response.data.message}`);
      }
    } catch (error: any) {
      console.error('Export Error:', error);
      if (error.message === 'Network Error') {
        alert('通訊異常：無法連線至 https://localhost:7044。請確保後端服務已啟動並信任 SSL 憑證。');
      } else {
        alert(`導出過程發生錯誤: ${error.message}`);
      }
    } finally {
      setIsExporting(false);
      if (exportFileInputRef.current) exportFileInputRef.current.value = '';
    }
  };

  const handleEnterLine = async (lineId: string) => {
    setEnteringLineId(lineId);
    try {
      const response = await api.post('https://localhost:7044/api/Line/EnterLine', {
        lineSystemName: lineId
      });

      if (response.data.code === 200) {
        const data = response.data.data;
        
        // 映射設備數據
        const mappedEquipment: Equipment[] = (data.equipmentSet || []).map((item: any) => {
          const e = item.IEquipment || item;
          
          // Normalize typeString to EquipmentType enum values
          let normalizedType = e.typeString as EquipmentType;
          const typeStr = (e.typeString || '').toLowerCase();
          const nameStr = (e.equipmentName || '').toLowerCase();
          
          if (typeStr.includes('checkin') || nameStr.includes('打卡')) {
            normalizedType = EquipmentType.CheckinEquipment;
          } else if (typeStr.includes('agv') || nameStr.includes('agv')) {
            normalizedType = EquipmentType.AGVCarEquipment;
          } else if (typeStr.includes('assembly') || nameStr.includes('組裝')) {
            normalizedType = EquipmentType.AssemblyEquipment;
          } else if (typeStr.includes('testing') || nameStr.includes('檢測')) {
            normalizedType = EquipmentType.TestingEquipment;
          } else if (typeStr.includes('watervapor') || nameStr.includes('水氣防')) {
            normalizedType = EquipmentType.WaterVaporEquipment;
          }

          return {
            id: e.sysName,
            lineId: lineId,
            name: e.equipmentName,
            type: normalizedType,
            description: e.description,
            status: MachineStatus.Stopped,
            temperature: 20,
            vibration: 0,
            lastMaintenance: new Date().toISOString().split('T')[0],
            sn: e.EquipmentSN,
            factoryArea: data.site || 'GL',
            floor: data.floor || '3F'
          };
        });

        // 更新全局設備列表
        if (onUpdateFactory) {
          // 只傳遞當前正在更新的產綫，避免 handleUpdateFactory 誤刪其他產綫的設備
          const currentLine = lines.find(l => l.id === lineId);
          onUpdateFactory(currentLine ? [currentLine] : [], mappedEquipment);
        }

        // 跳轉並傳遞產綫詳細數據
        onViewEquipment(lineId, data);
      } else {
        alert(`進入失敗: ${response.data.message || '未知錯誤'}`);
      }
    } catch (error: any) {
      console.error('Enter Line Error:', error);
      
      // 嘗試從 stack trace 中提取行號
      const stack = error.stack || '';
      const match = stack.match(/:(\d+):\d+/);
      const lineNumber = match ? match[1] : '未知';

      if (error.message === 'Network Error') {
        alert(`通訊異常 (報錯行號: ${lineNumber})：無法連線至 https://localhost:7044。請確保後端服務已啟動並信任 SSL 憑證。`);
      } else {
        alert(`進入過程發生錯誤 (報錯行號: ${lineNumber}): ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setEnteringLineId(null);
    }
  };

  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.Running: return 'bg-green-100 text-green-700 border-green-200';
      case MachineStatus.Stopped: return 'bg-red-100 text-red-700 border-red-200';
      case MachineStatus.Warning: return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100';
    }
  };

  const handleSaveFactory = async () => {
    setIsSavingFactory(true);
    try {
      // 調用指定的 API 地址，傳入 site (code) 與 floor
      const response = await api.post('https://localhost:7044/api/Factory/FactoryMaintenance', {
        site: localFactoryInfo.code,
        floor: localFactoryInfo.floor
      });

      if (response.data.code === 200) {
        if (onUpdateFactory) {
          onUpdateFactory(lines, equipmentList, localFactoryInfo);
        }
        alert(response.data.message || '工廠基礎信息已成功保存並更新。');
      } else {
        alert(`保存失敗: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Save Factory Error:', error);
      if (error.message === 'Network Error') {
        alert('通訊異常：無法連線至 https://localhost:7044。請確保後端服務已啟動並信任 SSL 憑證。');
      } else {
        alert(`保存過程發生錯誤: ${error.message}`);
      }
    } finally {
      setIsSavingFactory(false);
    }
  };

  const handleAddLine = async () => {
    if (!newLineData.name.trim()) return;
    
    setIsCreatingLine(true);
    try {
      // 調用指定的 API 地址進行產綫創建
      const response = await api.post('https://localhost:7044/api/Factory/CreateLine', {
        lineType: newLineData.lineType,
        lineName: newLineData.name,
        description: newLineData.description
      });

      // 根據最新的響應結構進行處理
      if (response.data.code === 200) {
        const sysName = response.data.data?.lineSystemName || `L${Math.floor(Math.random() * 10000)}`;
        
        // API 成功後，更新本地狀態顯示新產綫，使用返回的 lineSystemName 作為 ID
        const newLine: ProductionLine = {
          id: sysName,
          factoryId: 'F1',
          name: newLineData.name,
          description: newLineData.description,
          category: newLineData.category,
          lineType: newLineData.lineType,
          status: MachineStatus.Stopped,
          outputPerHour: 0,
          targetOutput: 1000,
        };

        if (onUpdateFactory) {
          onUpdateFactory([...lines, newLine], equipmentList);
        }
        setIsModalOpen(false);
        setNewLineData({ name: '', description: '', category: 'Vulkan-A', lineType: LineType.NVIDIA });
        
        alert(`${response.data.message || '產綫已成功創建'}\n系統分配名稱: ${sysName}`);
      } else {
        alert(`創建失敗: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Create Line Error:', error);
      if (error.message === 'Network Error') {
        alert('通訊異常：無法連線至 https://localhost:7044/api/Factory/CreateLine。請檢查後端服務是否運行正常。');
      } else {
        alert(`創建過程發生錯誤: ${error.message}`);
      }
    } finally {
      setIsCreatingLine(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Import/Export Buttons Section */}
      <div className="flex space-x-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".factory" 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={exportFileInputRef} 
          onChange={handleExportFileChange} 
          accept=".factory" 
          className="hidden" 
        />
        <button 
          onClick={handleUploadClick}
          disabled={isUploading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {isUploading ? (
            <RotateCw size={18} className="animate-spin mr-1.5" />
          ) : (
            <Upload size={18} className="mr-1.5" />
          )}
          導入本地工廠
        </button>
        <button 
          onClick={handleExportClick}
          disabled={isExporting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {isExporting ? (
            <RotateCw size={18} className="animate-spin mr-1.5" />
          ) : (
            <Download size={18} className="mr-1.5" />
          )}
          {isExporting ? '處理中...' : '導出本地工廠'}
        </button>
      </div>

      {/* Factory Information Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center mb-6 border-b border-slate-100 pb-3">
          <Building2 size={20} className="text-blue-600 mr-2" />
          <h3 className="text-lg font-bold text-slate-800">工廠基礎信息維護</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
              <MapPin size={12} className="mr-1" /> 廠區代碼 (Factory Code)
            </label>
            <input 
              type="text" 
              value={localFactoryInfo.code}
              onChange={(e) => setLocalFactoryInfo({...localFactoryInfo, code: e.target.value})}
              placeholder="例如: GL"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono transition-all"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
              <Layers size={12} className="mr-1" /> 所在樓層 (Floor)
            </label>
            <input 
              type="text" 
              value={localFactoryInfo.floor}
              onChange={(e) => setLocalFactoryInfo({...localFactoryInfo, floor: e.target.value})}
              placeholder="例如: 3F"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono transition-all"
            />
          </div>
          
          <button 
            onClick={handleSaveFactory}
            disabled={isSavingFactory}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSavingFactory ? (
              <RotateCw size={18} className="animate-spin mr-2" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            {isSavingFactory ? '保存中...' : '保存工廠信息'}
          </button>
        </div>
      </div>

      {/* Header for Lines */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h3 className="text-xl font-bold text-slate-800">產綫實例管理</h3>
          <p className="text-sm text-slate-500">當前監控範圍：{factoryInfo.code} 廠區 / {factoryInfo.floor}</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center shadow-lg transition-all active:scale-95"
          >
            <Plus size={18} className="mr-1.5" /> 新增產綫
          </button>
        </div>
      </div>

      {/* Lines Grid */}
      <div className="grid gap-6">
        {lines.map((line) => (
          <div key={line.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <Layers size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{line.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs font-mono text-slate-400">SYS_NAME: {line.id}</span>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{line.lineType || 'Standard'}</span>
                  </div>
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center ${getStatusColor(line.status)}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${line.status === MachineStatus.Running ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {line.status}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">當前時產 (Units/Hr)</p>
                <div className="text-2xl font-bold text-slate-800">{line.outputPerHour} <span className="text-sm font-normal text-slate-400">/ {line.targetOutput}</span></div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3">
                  <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${(line.outputPerHour/line.targetOutput)*100}%` }}></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">產線稼動率</p>
                <div className="text-2xl font-bold text-blue-600">{(line.outputPerHour/line.targetOutput*100).toFixed(1)}%</div>
                <p className="text-[10px] text-slate-400 mt-2">優於 85% 全球標準</p>
              </div>
              <div className="flex items-center justify-center">
                <button 
                  onClick={() => handleEnterLine(line.id)}
                  disabled={enteringLineId === line.id}
                  className="w-full md:w-auto px-8 py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center hover:bg-slate-900 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {enteringLineId === line.id ? (
                    <>
                      <RotateCw size={18} className="animate-spin mr-2" />
                      處理中...
                    </>
                  ) : (
                    <>
                      <Monitor size={18} className="mr-2" /> 進入設備管理
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">新增產綫實例</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">産綫名稱 *</label>
                <input 
                  type="text" 
                  value={newLineData.name} 
                  onChange={(e) => setNewLineData({...newLineData, name: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="例如: Assembly Line B" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                  <Tag size={14} className="mr-1.5 text-blue-500" /> 綫體類別 *
                </label>
                <select 
                  value={newLineData.lineType} 
                  onChange={(e) => setNewLineData({...newLineData, lineType: e.target.value as LineType})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={LineType.NVIDIA}>VKLine_NVIDIA</option>
                  <option value={LineType.APPLE}>VKLine_APPLE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                <textarea 
                  value={newLineData.description} 
                  onChange={(e) => setNewLineData({...newLineData, description: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="產線功能說明..." 
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isCreatingLine}
                className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleAddLine} 
                disabled={isCreatingLine}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center disabled:opacity-50"
              >
                {isCreatingLine ? (
                  <>
                    <RotateCw size={16} className="animate-spin mr-2" />
                    正在創建...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="mr-2" />
                    創建產綫
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LineManagement;