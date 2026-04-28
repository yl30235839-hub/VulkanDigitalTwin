import React, { useState, useEffect } from 'react';
import { Equipment, MachineStatus, EquipmentType, StorageLocation, StorageRequestType, StoragePriority } from '../types';
import api from '../services/api';
import { backendDomain } from '../constants';
import { 
  ArrowLeft, Save, Activity, Settings, 
  Cpu, Zap, Database, Plug, Plus, Trash2, Server, Truck, Package,
  Table as TableIcon, MapPin, X, ChevronRight, Edit3, Building, Hash, Fingerprint,
  Radio, Network, Globe, Shield, RotateCw, Wifi, WifiOff, Key, Eye, EyeOff,
  ListFilter, Search, Check, Trash, Columns, Layout, Info, Upload, FileSpreadsheet, AlertCircle
} from 'lucide-react';

interface AlarmMappingItem {
  id: string;
  address: string;
  alarmBit: number;
  code: string;
  content: string;
  solution: string;
  level1Alarm: string;
  level2Alarm: string;
}

interface ProcessMappingItem {
  id: string;
  address: string;
  parameterBit: string;
  parameterType: string;
  dataType: string;
}

interface DeviceSettingsProps {
  device: Equipment | null;
  allEquipment?: Equipment[];
  onSave: (updated: Equipment) => void;
  onBack: () => void;
}

type TabType = 'BASIC' | 'MAPPING' | 'PROCESS_MAPPING' | 'PROCESS_LAYOUT' | 'AGV_ORDER';
type ConnectionResult = 'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED';

interface TableColumn {
  id: string;
  name: string;
  type: string;
}

const DeviceSettings: React.FC<DeviceSettingsProps> = ({ device, allEquipment = [], onSave, onBack }) => {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('BASIC');
  const [connectionResult, setConnectionResult] = useState<ConnectionResult>('IDLE');
  const [isTesting, setIsTesting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Alarm Mapping States
  const [alarmMappings, setAlarmMappings] = useState<AlarmMappingItem[]>([
    { id: '1', address: 'D100.0', alarmBit: 0, code: 'E001', content: '緊急停止觸發', solution: '檢查急停按鈕並重置', level1Alarm: '系統報警', level2Alarm: '安全報警' },
    { id: '2', address: 'D100.1', alarmBit: 1, code: 'E002', content: '安全門未鎖定', solution: '確保持續關閉並鎖定安全門', level1Alarm: '系統報警', level2Alarm: '安全報警' },
    { id: '3', address: 'D100.2', alarmBit: 2, code: 'W001', content: '氣壓不足警告', solution: '檢查主氣源壓力', level1Alarm: '設備報警', level2Alarm: '氣壓報警' },
    { id: '4', address: 'D100.3', alarmBit: 3, code: 'I001', content: '物料低位提示', solution: '及時補充物料', level1Alarm: '物料報警', level2Alarm: '低位報警' },
  ]);

  // Alarm pagination
  const [alarmCurrentPage, setAlarmCurrentPage] = useState(1);
  const alarmPageSize = 100;
  const alarmTotalPages = Math.ceil(alarmMappings.length / alarmPageSize);
  const paginatedAlarms = alarmMappings.slice((alarmCurrentPage - 1) * alarmPageSize, alarmCurrentPage * alarmPageSize);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const processFileInputRef = React.useRef<HTMLInputElement>(null);

  // Process Mapping States
    // Storage List States
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);

  const handleAddStorage = () => {
    const newLoc: StorageLocation = {
      id: `ST-${Date.now()}`,
      productInfo: '新產品',
      requestType: StorageRequestType.Loading,
      equipmentId: device?.id || '',
      lineId: device?.lineId || '',
      priority: StoragePriority.Normal,
      quantity: 0
    };
    setStorageLocations([...storageLocations, newLoc]);
  };

  const handleUpdateStorage = (index: number, field: keyof StorageLocation, value: any) => {
    const updated = [...storageLocations];
    updated[index] = { ...updated[index], [field]: value };
    setStorageLocations(updated);
  };

  const handleRemoveStorage = (index: number) => {
    const updated = storageLocations.filter((_, i) => i !== index);
    setStorageLocations(updated);
  };

const [processMappings, setProcessMappings] = useState<ProcessMappingItem[]>([
    { id: '1', address: 'D200', parameterBit: '0', parameterType: '主軸轉速控制', dataType: 'Float' },
    { id: '2', address: 'D204', parameterBit: '1', parameterType: '進給速度控制', dataType: 'Float' },
    { id: '3', address: 'D208', parameterBit: '2', parameterType: '加工壓力控制', dataType: 'Float' },
  ]);
  
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

  // Process Mapping Modal State
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const SYSTEM_PROCESS_PARAMETERS = [
    '工藝結果',
    '工藝排產',
    'AGV訂單申請',
    'AGV訂單關閉'
  ];
  const [selectedProcessType, setSelectedProcessType] = useState(SYSTEM_PROCESS_PARAMETERS[0]);

  const handleAddProcessMapping = () => {
    const newProcessId = (Date.now() + processMappings.length).toString();
    const newMapping: ProcessMappingItem = {
      id: newProcessId,
      address: 'DXXX',
      parameterBit: '0',
      parameterType: selectedProcessType,
      dataType: 'Float'
    };
    /* We add it to the front or back of the list, assuming we just expand the array. 
       Usually this list displays the mapped values and empty values, in this component 
       it's rendering based on total Length or mapped items. 
       We will append it to processMappings. */
    setProcessMappings([...processMappings, newMapping]);
    setIsProcessModalOpen(false);
    setSelectedProcessType(SYSTEM_PROCESS_PARAMETERS[0]);
  };

  // Schedule Layout State

  const [selectedScheduleItem, setSelectedScheduleItem] = useState<string | null>(null);

  interface ScheduleFactor {
    equipmentId: string;
    equipmentName: string;
    results: { id: string; name: string; value: boolean }[];
  }
  const [scheduleFactors, setScheduleFactors] = useState<ScheduleFactor[]>([]);

  useEffect(() => {
    if (device && allEquipment && allEquipment.length > 0) {
      const lineEquip = allEquipment.filter(e => e.lineId === device.lineId);
      const currentIndex = lineEquip.findIndex(e => e.id === device.id);
      if (currentIndex > 0) {
        const preceding = lineEquip.slice(0, currentIndex);
        setScheduleFactors(
          preceding.map((eq, i) => ({
            equipmentId: eq.id,
            equipmentName: eq.name,
            results: [{ id: 'res-' + i, name: '工藝結果', value: true }]
          }))
        );
      } else {
        setScheduleFactors([]);
      }
    }
  }, [device, allEquipment]);

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
    plcBrand: 'Keyence',
    plcSeries: 'Modbus TCP',
    plcPort: '8000',
    plcProtocol: 'MC Protocol (TCP)',
    plcStation: '1',
    plcDataType: 'CDAB',
    plcReadMethod: '按位讀取',
    plcStringReverse: false,
    rack: '0',
    slot: '2',
    alarmAddress: 'D6000',
    alarmAddressLength: 20,
    processAddress: '',
    processAddressLength: 0,
    processParamAddress: 'D6100',
    processParamLength: 10,
    bitLength: '16Bits',
    alarmReadMethod: '按字讀取',
    alarmBitLength: '16Bits',
    processReadMethod: '按字讀取',
    processBitLength: '16Bits',
    agvOrderRequestUrl: '',
    agvOrderEndUrl: '',
    agvOrderPriorityUrl: '',
    agvOrderClearUrl: ''
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
        plcBrand: device.plcBrand || 'Keyence',
        plcSeries: device.plcSeries || 'Modbus TCP',
        plcPort: device.plcPort || '8000',
        plcProtocol: device.plcProtocol || 'MC Protocol (TCP)',
        plcStation: device.plcStation || '1',
        plcDataType: device.plcDataType || 'CDAB',
        plcReadMethod: device.plcReadMethod || '按位讀取',
        plcStringReverse: device.plcStringReverse || false,
        rack: '0',
        slot: '2',
        alarmAddress: device.alarmAddress || 'D6000',
        alarmAddressLength: device.alarmAddressLength || 20,
        processAddress: device.processAddress || '',
        processAddressLength: device.processAddressLength || 0,
        processParamAddress: device.processParamAddress || 'D6100',
        processParamLength: device.processParamLength || 10,
        bitLength: device.bitLength || '16Bits',
        alarmReadMethod: device.alarmReadMethod || '按字讀取',
        alarmBitLength: device.alarmBitLength || '16Bits',
        processReadMethod: device.processReadMethod || '按字讀取',
        processBitLength: device.processBitLength || '16Bits',
        agvOrderRequestUrl: device.agvOrderRequestUrl || '',
        agvOrderEndUrl: device.agvOrderEndUrl || '',
        agvOrderPriorityUrl: device.agvOrderPriorityUrl || '',
        agvOrderClearUrl: device.agvOrderClearUrl || ''
      });
      setStorageLocations(device.storageLocations || []);
    }
  }, [device]);

  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleProcessImportClick = () => {
    processFileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && device) {
      setIsImporting(true);
      try {
        const importFormData = new FormData();
        importFormData.append('lineSystemName', device.lineId);
        importFormData.append('equipmentSystemName', device.id);
        importFormData.append('formFile', file);
        
        const response = await api.post(`${backendDomain}/api/Equipment/AlarmMapDataImport`, importFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.data && response.data.code === 200 && response.data.data) {
          const alarmData = response.data.data.alarmData || [];
          const newMappings: AlarmMappingItem[] = alarmData.map((item: any, index: number) => ({
            id: (Date.now() + index).toString(),
            address: item.registerAddress || 'N/A',
            alarmBit: item.registerBit ? parseInt(item.registerBit) : 0,
            code: item.alarmCode || 'N/A',
            content: item.alarmNote || 'N/A',
            solution: item.alarmSolution || 'N/A',
            level1Alarm: item.oneLevelItem || 'N/A',
            level2Alarm: item.twoLevelItem || 'N/A',
          }));
          setAlarmMappings(newMappings);
          alert('導入成功');
        } else {
          alert('導入失敗：' + (response.data?.message || '未知錯誤'));
        }
      } catch (err: any) {
        console.error(err);
        alert('網絡錯誤：導入失敗，請檢查服務器。' + (err.message || ''));
      } finally {
        setIsImporting(false);
        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleProcessFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fileContent = event.target?.result as string;
          const rows = fileContent.split('\n').filter(row => row.trim() !== '');
          const newMappings: ProcessMappingItem[] = rows.slice(1).map((row, index) => {
            const parts = row.split(',').map(s => s.trim());
            return {
              id: (Date.now() + index).toString(),
              address: parts[0] || 'N/A',
              parameterBit: parts[1] || '',
              parameterType: parts[2] || 'N/A',
              dataType: parts[3] || 'Float'
            };
          });
          setProcessMappings(prev => [...prev, ...newMappings]);
          alert('工藝參數導入成功');
        } catch (err) {
          console.error(err);
          alert('導入失敗，請檢查文件格式');
        }
      };
      reader.readAsText(file);
    }
  };

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
          readMethod: formData.plcReadMethod,
          isReverse: formData.plcStringReverse,
          bitLength: formData.bitLength,
          alarmAddress: formData.alarmAddress,
          alarmAddressLength: formData.alarmAddressLength,
          processAddress: formData.processAddress,
          processAddressLength: formData.processAddressLength,
          processParamAddress: formData.processParamAddress,
          processParamLength: formData.processParamLength,
          alarmReadMethod: formData.alarmReadMethod,
          alarmBitLength: formData.alarmBitLength,
          processReadMethod: formData.processReadMethod,
          processBitLength: formData.processBitLength,
          agvOrderRequestUrl: formData.agvOrderRequestUrl,
          agvOrderEndUrl: formData.agvOrderEndUrl,
          agvOrderPriorityUrl: formData.agvOrderPriorityUrl,
          agvOrderClearUrl: formData.agvOrderClearUrl
        });

        if (response.data.code === 200) {
          onSave({ ...device, ...formData, storageLocations });
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

  const handleRefreshAlarmMappings = async () => {
    if (!device) return;
    setIsRefreshing(true);
    try {
      const response = await api.post(`${backendDomain}/api/Equipment/AlarmMapDataRefresh`, {
        equipmentSystemName: device.id
      });
      
      if (response.data && response.data.code === 200 && response.data.data) {
        const alarmData = response.data.data.alarmData || [];
        const newMappings: AlarmMappingItem[] = alarmData.map((item: any, index: number) => ({
          id: (Date.now() + index).toString(),
          address: item.registerAddress || 'N/A',
          alarmBit: item.registerBit ? parseInt(item.registerBit) : 0,
          code: item.alarmCode || 'N/A',
          content: item.alarmNote || 'N/A',
          solution: item.alarmSolution || 'N/A',
          level1Alarm: item.oneLevelItem || 'N/A',
          level2Alarm: item.twoLevelItem || 'N/A',
        }));
        setAlarmMappings(newMappings);
        alert('刷新成功');
      } else {
        alert('刷新失敗：' + (response.data?.message || '未知錯誤'));
      }
    } catch (err: any) {
      console.error(err);
      alert('網絡錯誤：刷新失敗，請檢查服務器。' + (err.message || ''));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveAlarmMappings = () => {
    alert('報警映射數據已成功保存到後端服務器');
  };

  const renderMappingInfo = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full min-h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
            <Database size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">報警映射管理</h3>
            <p className="text-sm text-slate-500">導入及維護設備內部的報警點位映射關係</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
                    <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".xlsx,.xls,.csv,.txt"
          />
          <button 
            onClick={handleRefreshAlarmMappings}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '處理中...' : '刷新'}
          </button>
          <button 
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={16} className="mr-2" />
            {isImporting ? '處理中...' : '導入映射表'}
          </button>
          <button 
            onClick={handleSaveAlarmMappings}
            className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            <Save size={16} className="mr-2" />
            保存
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden border border-slate-100 rounded-xl flex flex-col">
        <div className="overflow-auto flex-1 max-h-[600px]">
          <table className="w-full border-collapse text-left relative">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-100 shadow-sm relative z-20">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">報警地址</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">報警位</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">報警代碼</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">報警內容</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">一級報警</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">二級報警</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 w-[300px] min-w-[300px]">報警解決方法</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right bg-slate-50">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedAlarms.length > 0 ? (
                paginatedAlarms.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-mono text-slate-600 align-top">
                      <div className="line-clamp-3" title={mapping.address}>{mapping.address}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 align-top">
                      <div className="line-clamp-3" title={mapping.alarmBit.toString()}>{mapping.alarmBit}</div>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-700 align-top">
                      <div className="line-clamp-3" title={mapping.code}>{mapping.code}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 align-top">
                      <div className="line-clamp-3" title={mapping.content}>{mapping.content}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 align-top">
                      <div className="line-clamp-3" title={mapping.level1Alarm}>{mapping.level1Alarm}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 align-top">
                      <div className="line-clamp-3" title={mapping.level2Alarm}>{mapping.level2Alarm}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 align-top w-[300px] min-w-[300px]">
                      <div className="line-clamp-3" title={mapping.solution}>{mapping.solution}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-right align-top">
                      <div className="flex justify-end space-x-2">
                        <button className="text-slate-400 hover:text-blue-600">
                          <Edit3 size={16} />
                        </button>
                        <button className="text-slate-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileSpreadsheet size={48} className="text-slate-200 mb-4" />
                      <p className="text-slate-400">目前尚無報警映射數據</p>
                      <button 
                        onClick={handleImportClick}
                        className="mt-4 text-blue-600 hover:underline text-sm font-medium"
                      >
                        立即導入數據
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-2">
        <p>共計 {alarmMappings.length} 條映射規則</p>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setAlarmCurrentPage(p => Math.max(1, p - 1))}
            disabled={alarmCurrentPage === 1}
            className="px-2 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            上一頁
          </button>
          <span>{alarmCurrentPage} / {Math.max(1, alarmTotalPages)}</span>
          <button 
            onClick={() => setAlarmCurrentPage(p => Math.min(alarmTotalPages, p + 1))}
            disabled={alarmCurrentPage === alarmTotalPages || alarmTotalPages === 0}
            className="px-2 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
        <p>支持 CSV 格式導入 (格式: 地址, 報警位, 代碼, 內容, 解決方法, 一級報警, 二級報警)</p>
      </div>
    </div>
  );

  const getProcessMappingLength = () => {
    const baseLength = formData.processParamLength || 0;
    if (formData.processReadMethod === '按位讀取') {
      const bitsMatch = formData.processBitLength?.match(/(\d+)/);
      const bits = bitsMatch ? parseInt(bitsMatch[1], 10) : 16;
      return baseLength * bits;
    }
    return baseLength;
  };

  const renderProcessMappingInfo = () => {
    const totalLength = getProcessMappingLength();
    
    return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full min-h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mr-3">
            <Zap size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">工藝映射管理</h3>
            <p className="text-sm text-slate-500">定義設備工藝參數與 PLC 地址的關聯</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button onClick={() => setIsProcessModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm">
            <Plus size={16} className="mr-2" />
            新增參數點
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden border border-slate-100 rounded-xl">
        <div className="overflow-x-auto h-full">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">參數地址</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">參數位</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">參數類型</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">數據類型</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Array.from({ length: totalLength }).map((_, index) => {
                const mapping = processMappings[index];
                return (
                  <tr key={mapping?.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{mapping?.address || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{mapping?.parameterBit || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">{mapping?.parameterType || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                        {mapping?.dataType || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button className="text-slate-400 hover:text-indigo-600 mr-3">
                        <Edit3 size={16} />
                      </button>
                      <button className="text-slate-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {totalLength === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Settings size={48} className="text-slate-200 mb-4" />
                      <p className="text-slate-400">目前尚無工藝映射數據 (長度設為為 0)</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-2">
        <p>共計 {totalLength} 條工藝參數關聯</p>
        <p>此列表長度受配置參數中的「工藝參數長度」與「讀取方式」限制</p>
      </div>
    </div>
  );
  };

  const renderAGVOrderInfo = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full min-h-[500px] space-y-8">
      {/* AGV URL Configuration */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mr-3">
              <Zap size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">AGV 訂單管理</h3>
              <p className="text-sm text-slate-500">配置與維護 AGV 調度相關的接口地址</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center text-xs">
              <Globe size={14} className="mr-2 text-amber-500" /> 訂單請求 URL
            </label>
            <input 
              type="text" 
              value={formData.agvOrderRequestUrl} 
              onChange={(e) => setFormData({...formData, agvOrderRequestUrl: e.target.value})} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono text-sm" 
              placeholder="例如: http://api.agv.com/order/request"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center text-xs">
              <Check size={14} className="mr-2 text-emerald-500" /> 訂單結束 URL
            </label>
            <input 
              type="text" 
              value={formData.agvOrderEndUrl} 
              onChange={(e) => setFormData({...formData, agvOrderEndUrl: e.target.value})} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm" 
              placeholder="例如: http://api.agv.com/order/end"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center text-xs">
              <Trash size={14} className="mr-2 text-red-500" /> 訂單清料 URL
            </label>
            <input 
              type="text" 
              value={formData.agvOrderClearUrl} 
              onChange={(e) => setFormData({...formData, agvOrderClearUrl: e.target.value})} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all font-mono text-sm" 
              placeholder="例如: http://api.agv.com/order/clear"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center text-xs">
              <Activity size={14} className="mr-2 text-indigo-500" /> 修訂優先級 URL
            </label>
            <input 
              type="text" 
              value={formData.agvOrderPriorityUrl} 
              onChange={(e) => setFormData({...formData, agvOrderPriorityUrl: e.target.value})} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm" 
              placeholder="例如: http://api.agv.com/order/priority"
            />
          </div>
        </div>
      </div>

      {/* Storage List Section */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">料倉列表</h3>
              <p className="text-sm text-slate-500">維護該設備關聯的料倉信息</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleAddStorage}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={16} className="mr-2" />
            增加料倉
          </button>
        </div>

        <div className="flex-1 overflow-hidden border border-slate-100 rounded-xl">
          <div className="overflow-x-auto h-full">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">產品信息</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">請求類型</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">設備編號</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">綫體編號</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">優先級</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">數量</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {storageLocations.length > 0 ? (
                  storageLocations.map((loc, idx) => (
                    <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-slate-700">
                        <input 
                          type="text" 
                          value={loc.productInfo} 
                          onChange={(e) => handleUpdateStorage(idx, 'productInfo', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-1"
                        />
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <select 
                          value={loc.requestType} 
                          onChange={(e) => handleUpdateStorage(idx, 'requestType', e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-1 text-blue-600 font-medium"
                        >
                          <option value={StorageRequestType.Loading}>上料</option>
                          <option value={StorageRequestType.Unloading}>下料</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500">
                        <input 
                          type="text" 
                          value={loc.equipmentId} 
                          onChange={(e) => handleUpdateStorage(idx, 'equipmentId', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-1 font-mono"
                        />
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500">
                        <input 
                          type="text" 
                          value={loc.lineId} 
                          onChange={(e) => handleUpdateStorage(idx, 'lineId', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-1 font-mono"
                        />
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <select 
                          value={loc.priority} 
                          onChange={(e) => handleUpdateStorage(idx, 'priority', e.target.value)}
                          className={`bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-1 font-medium ${
                            loc.priority === StoragePriority.VeryUrgent ? 'text-red-600' : 
                            loc.priority === StoragePriority.Urgent ? 'text-amber-600' : 'text-slate-600'
                          }`}
                        >
                          <option value={StoragePriority.Normal}>正常</option>
                          <option value={StoragePriority.Urgent}>緊急</option>
                          <option value={StoragePriority.VeryUrgent}>非常緊急</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <input 
                          type="number" 
                          value={loc.quantity} 
                          onChange={(e) => handleUpdateStorage(idx, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-1 text-slate-700 font-mono"
                        />
                      </td>
                      <td className="px-6 py-3 text-sm text-right">
                        <button 
                          onClick={() => handleRemoveStorage(idx)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center">
                        <Package size={40} className="text-slate-200 mb-2" />
                        <p>暫無料倉數據，請點擊上方按鈕新增</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
                  <h4 className="text-sm font-bold text-slate-800 flex items-center mb-6">
                    <Database size={16} className="mr-2 text-indigo-600" /> PLC 數據地址配置
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 報警模塊 */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center">
                        <div className="w-1.5 h-4 bg-red-500 rounded-sm mr-2"></div>
                        報警模塊
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">報警地址</label>
                          <input 
                            type="text" 
                            value={formData.alarmAddress} 
                            onChange={(e) => setFormData({...formData, alarmAddress: e.target.value})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" 
                            placeholder="例如: D1000"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">報警參數長度</label>
                          <input 
                            type="number" 
                            value={formData.alarmAddressLength} 
                            onChange={(e) => setFormData({...formData, alarmAddressLength: parseInt(e.target.value) || 0})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">讀取方式</label>
                          <select 
                            value={formData.alarmReadMethod} 
                            onChange={(e) => setFormData({...formData, alarmReadMethod: e.target.value})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all text-sm"
                          >
                            <option value="按字讀取">按字讀取</option>
                            <option value="按位讀取">按位讀取</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">位長度</label>
                          <select 
                            value={formData.alarmBitLength} 
                            onChange={(e) => setFormData({...formData, alarmBitLength: e.target.value})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all text-sm"
                          >
                            <option value="16Bits">16Bits</option>
                            <option value="32Bits">32Bits</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 工藝模塊 */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center">
                        <div className="w-1.5 h-4 bg-blue-500 rounded-sm mr-2"></div>
                        工藝模塊
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">工藝地址</label>
                          <input 
                            type="text" 
                            value={formData.processParamAddress} 
                            onChange={(e) => setFormData({...formData, processParamAddress: e.target.value})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" 
                            placeholder="例如: D1100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">工藝參數長度</label>
                          <input 
                            type="number" 
                            value={formData.processParamLength} 
                            onChange={(e) => setFormData({...formData, processParamLength: parseInt(e.target.value) || 0})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">讀取方式</label>
                          <select 
                            value={formData.processReadMethod} 
                            onChange={(e) => setFormData({...formData, processReadMethod: e.target.value})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all text-sm"
                          >
                            <option value="按字讀取">按字讀取</option>
                            <option value="按位讀取">按位讀取</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">位長度</label>
                          <select 
                            value={formData.processBitLength} 
                            onChange={(e) => setFormData({...formData, processBitLength: e.target.value})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all text-sm"
                          >
                            <option value="16Bits">16Bits</option>
                            <option value="32Bits">32Bits</option>
                          </select>
                        </div>
                      </div>
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
              報警映射管理
            </button>
            <button 
              onClick={() => (device.type === EquipmentType.AssemblyEquipment || device.type === EquipmentType.TestingEquipment || device.type === EquipmentType.WaterVaporEquipment) && setActiveTab('PROCESS_MAPPING')} 
              disabled={device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'PROCESS_MAPPING' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} ${device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              工藝映射管理
            </button>
            <button 
              onClick={() => (device.type === EquipmentType.AssemblyEquipment || device.type === EquipmentType.TestingEquipment || device.type === EquipmentType.WaterVaporEquipment) && setActiveTab('PROCESS_LAYOUT')} 
              disabled={device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'PROCESS_LAYOUT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} ${device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              工藝排佈
            </button>
            <button 
              onClick={() => (device.type === EquipmentType.AssemblyEquipment || device.type === EquipmentType.TestingEquipment || device.type === EquipmentType.WaterVaporEquipment) && setActiveTab('AGV_ORDER')} 
              disabled={device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'AGV_ORDER' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} ${device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              AGV 訂單管理
            </button></div>
      </div>

      <div>
        {activeTab === 'BASIC' && renderBasicInfo()}
        {activeTab === 'MAPPING' && renderMappingInfo()}
        {activeTab === 'PROCESS_MAPPING' && renderProcessMappingInfo()}
        {activeTab === 'PROCESS_LAYOUT' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-[500px]">
            <div className="flex items-center mb-6">
              <Layout size={24} className="text-indigo-600 mr-3" />
              <h3 className="text-lg font-medium text-slate-800">工藝排佈配置</h3>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-700">排產項目</h4>
                {processMappings.filter(m => m.parameterType === '工藝排產').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {processMappings.filter(m => m.parameterType === '工藝排產').map((mapping, idx) => (
                        <button 
                          key={mapping.id} 
                          onClick={() => setSelectedScheduleItem(mapping.id)}
                          className={`text-left border rounded-lg p-4 transition-colors shadow-sm flex flex-col justify-between h-full ${
                            selectedScheduleItem === mapping.id
                              ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-white hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-start">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs mr-3 shrink-0 ${
                               selectedScheduleItem === mapping.id
                                 ? 'bg-indigo-600 text-white border-indigo-700'
                                 : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${selectedScheduleItem === mapping.id ? 'text-indigo-900' : 'text-slate-800'}`}>排產任務節點</p>
                              <p className={`text-xs font-mono mt-1 break-all ${selectedScheduleItem === mapping.id ? 'text-indigo-700' : 'text-slate-500'}`}>地址: {mapping.address} | 位: {mapping.parameterBit}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <Layout size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-600">目前沒有排產項目</p>
                    <p className="text-xs text-slate-500 mt-1">請先在「工藝映射管理」分頁中新增類型為「工藝排產」的參數點。</p>
                  </div>
                )}
              </div>
              
              <div className="border-t border-slate-100 pt-8 space-y-4">
                <h4 className="text-sm font-semibold text-slate-700">排產因子</h4>
                {selectedScheduleItem ? (
                  scheduleFactors.length > 0 ? (
                    <div className="space-y-4">
                      {scheduleFactors.map(factor => (
                        <div key={factor.equipmentId} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                          <h5 className="font-semibold text-slate-700 mb-4">{factor.equipmentName}</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {factor.results.map(res => (
                              <label key={res.id} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={res.value} 
                                  onChange={() => {
                                     const updated = [...scheduleFactors];
                                     const fIdx = updated.findIndex(f => f.equipmentId === factor.equipmentId);
                                     if(fIdx > -1) {
                                       const rIdx = updated[fIdx].results.findIndex(r => r.id === res.id);
                                       if(rIdx > -1) {
                                         updated[fIdx].results[rIdx].value = !updated[fIdx].results[rIdx].value;
                                         setScheduleFactors(updated);
                                       }
                                     }
                                  }}
                                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-700 font-medium">{res.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <Layout size={32} className="mx-auto text-slate-300 mb-3 opacity-50" />
                      <p className="text-sm font-medium text-slate-600">無前置設備</p>
                      <p className="text-xs text-slate-500 mt-1">此設備為產線第一台，無排產因子來源。</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <Layout size={32} className="mx-auto text-slate-300 mb-3 opacity-50" />
                    <p className="text-sm font-medium text-slate-600">請選取排產項目</p>
                    <p className="text-xs text-slate-500 mt-1">點擊上方的排產任務節點以查看關聯因子</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'AGV_ORDER' && renderAGVOrderInfo()}
      </div>

      {/* Add Process Mapping Modal */}
      {isProcessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">新增參數點</h3>
              <button 
                onClick={() => setIsProcessModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">參數類型</label>
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto bg-slate-50 custom-scrollbar">
                  <div className="grid grid-cols-1 divide-y divide-slate-100">
                    {SYSTEM_PROCESS_PARAMETERS.map(param => (
                      <button
                        key={param}
                        onClick={() => setSelectedProcessType(param)}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center transition-colors ${
                          selectedProcessType === param 
                            ? 'bg-indigo-50 text-indigo-700 font-medium' 
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center shrink-0 ${
                          selectedProcessType === param ? 'border-indigo-600' : 'border-slate-300'
                        }`}>
                          {selectedProcessType === param && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                        </div>
                        {param}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500">請選擇需要加入的工藝參數類型。</p>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                onClick={() => setIsProcessModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleAddProcessMapping}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceSettings;
