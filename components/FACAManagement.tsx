import React, { useState, useMemo, useEffect } from 'react';
import { FACAPendingItem } from '../types';
import { 
  ArrowLeft, FileWarning, Search, Filter, 
  Clock, Database, User, Save, CheckCircle, 
  ChevronRight, AlertCircle, Calendar, 
  CloudUpload, Trash2, Edit3, Tag,
  Activity, BarChart2, BookOpen, MousePointer2, Check,
  Wrench, ClipboardList, Square, CheckSquare,
  Package, PlusCircle, XCircle, Info, X, IdCard, Building2,
  MessageSquare, Sparkles
} from 'lucide-react';

interface FACALibrary {
  AlarmLevel1: string;
  PrimarCode: string;
  AlarmLevel2: string;
  SecondaryCode: string;
  AlarmLevel3: string;
  AlarmCode: string;
  FaultClassification: string;
  CategoryTag1: string;
  FaultDescription: string;
  CategoryTag2: string;
  FailureReason: string;
  FailureSolution: string;
  LongTermSolution: string;
}

interface FACASolution {
  id: string;
  category: string;
  description: string;
  reason: string;
  action: string;
  alarmCodeRef: string;
}

interface PartRecord {
  name: string;
  model: string;
  brand: string;
  quantity: string;
  changeTime: string;
  description: string;
  originalPart: {
    name: string;
    brand: string;
    model: string;
  };
}

const MOCK_FACA_SOLUTIONS: FACASolution[] = [
  { id: 'S-01', category: '電氣故障', alarmCodeRef: 'E-042', description: '電機電流瞬時峰值超過額定值', reason: '負載過重或抱閘未完全釋放', action: '檢查傳動機構潤滑，確認抱閘線圈電壓正常。' },
  { id: 'S-02', category: '機械故障', alarmCodeRef: 'E-042', description: '伺服軸移動阻力過大', reason: '導軌異物干擾或同步帶老化', action: '清理導軌並重新噴塗潤滑油，必要時更換同步帶。' },
  { id: 'S-03', category: '電器故障', alarmCodeRef: 'W-015', description: '壓力感應器數值偏低', reason: '泵體過濾網堵塞', action: '清洗切削液過濾網，檢查進液管路是否漏氣。' },
  { id: 'S-04', category: '軟體錯誤', alarmCodeRef: 'S-001', description: '急停迴路信號不穩定', reason: '安全繼電器觸點接觸不良', action: '更換安全繼電器，或加固急停按鈕接線端子。' },
];

const CLASSIFICATION_OPTIONS = {
  level1: ['機械故障', '電器故障', '軟體錯誤', '工藝問題', '人為操作', '其他'],
  level2: ['伺服系統', '傳感器', '機構件損壞', '通訊中斷', 'PLC邏輯', '視覺系統'],
  level3: ['電機過熱', '線纜老化', '支架斷裂', '參數丟失', '網路丟包', '對焦偏移'],
  tags: ['緊急修復', '零件更換', '週期保養', '性能優化', '軟體補丁', '操作培訓']
};

const formatNow = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${mm}:${ss}`;
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  return dateStr.split(/[T ]/)[0];
};

const formatDisplayTime = (timeStr: string) => {
  if (!timeStr) return '';
  const parts = timeStr.split(/[T ]/);
  if (parts.length > 1) {
    return parts[1].split('.')[0];
  }
  return timeStr;
};

const formatInputTime = (timeStr: string) => {
  if (!timeStr) return '';
  const parts = timeStr.split(/[T ]/);
  let timePart = parts.length > 1 ? parts[1] : timeStr;
  return timePart.split('.')[0];
};

interface FACAManagementProps {
  onBack: () => void;
  pendingItems: FACAPendingItem[];
  setPendingItems: React.Dispatch<React.SetStateAction<FACAPendingItem[]>>;
  currentUsername: string;
  personnelList: any[];
}

const FACAManagement: React.FC<FACAManagementProps> = ({ onBack, pendingItems, setPendingItems, currentUsername, personnelList }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedSolutionId, setAppliedSolutionId] = useState<string | null>(null);
  const [isOtherFault, setIsOtherFault] = useState(false);
  
  // Find current user info
  const currentUser = useMemo(() => {
    return personnelList.find(p => p.name === currentUsername || p.employeeId === currentUsername) || {
      name: currentUsername || '張工程師',
      employeeId: 'V1024',
      department: '工程部'
    };
  }, [currentUsername, personnelList]);

  // Modal State
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);
  const [partsRecord, setPartsRecord] = useState<PartRecord | null>(null);
  const [tempPartsRecord, setTempPartsRecord] = useState<PartRecord>({
    name: '',
    model: '',
    brand: '',
    quantity: '1',
    changeTime: formatNow(),
    description: '',
    originalPart: {
      name: '',
      brand: '',
      model: ''
    }
  });

  const selectedItem = pendingItems.find(i => i.id === selectedId);

  // Form State
  const [facaForm, setFacaForm] = useState({
    handlerName: currentUser.name,
    handlerId: currentUser.employeeId,
    handlerDept: currentUser.department,
    repairStart: '',
    repairEnd: '',
    cat1: '',
    cat2: '',
    cat3: '',
    tag1: '',
    tag2: '',
    faDetail: '',
    caDetail: ''
  });

  // Update form when currentUser changes
  useEffect(() => {
    setFacaForm(prev => ({
      ...prev,
      handlerName: currentUser.name,
      handlerId: currentUser.employeeId,
      handlerDept: currentUser.department,
    }));
  }, [currentUser]);

  const [facaLibraryData, setFacaLibraryData] = useState<FACALibrary[]>([]);
  const [isLoadingFaca, setIsLoadingFaca] = useState(false);

  const cat3Options = useMemo(() => {
    const options = facaLibraryData.map(item => item.AlarmLevel3).filter(Boolean);
    return Array.from(new Set(options));
  }, [facaLibraryData]);

  const tag1Options = useMemo(() => {
    if (!facaForm.cat3) return [];
    const filtered = facaLibraryData.filter(item => item.AlarmLevel3 === facaForm.cat3);
    const options = filtered.map(item => item.CategoryTag1).filter(Boolean);
    return Array.from(new Set(options));
  }, [facaLibraryData, facaForm.cat3]);

  const tag2Options = useMemo(() => {
    if (!facaForm.cat3 || !facaForm.tag1) return [];
    const filtered = facaLibraryData.filter(item => 
      item.AlarmLevel3 === facaForm.cat3 && 
      item.CategoryTag1 === facaForm.tag1
    );
    const options = filtered.map(item => item.CategoryTag2).filter(Boolean);
    return Array.from(new Set(options));
  }, [facaLibraryData, facaForm.cat3, facaForm.tag1]);

  const filteredSolutions = useMemo(() => {
    if (!facaForm.cat3 || !facaForm.tag1 || !facaForm.tag2) return [];
    
    const filtered = facaLibraryData.filter(item => 
      item.AlarmLevel3 === facaForm.cat3 && 
      item.CategoryTag1 === facaForm.tag1 &&
      item.CategoryTag2 === facaForm.tag2
    );
    
    return filtered.map((item, index) => ({
      id: `S-${item.AlarmCode}-${index}`,
      category: item.FaultClassification || '',
      description: item.FaultDescription || '',
      reason: item.FailureReason || '',
      action: item.FailureSolution || '',
      alarmCodeRef: item.AlarmCode || ''
    }));
  }, [facaLibraryData, facaForm.cat3, facaForm.tag1, facaForm.tag2]);

  const handleSelectItem = async (item: FACAPendingItem) => {
    if (isLoadingFaca) return;
    
    setSelectedId(item.id);
    setAppliedSolutionId(null);
    setIsOtherFault(false);
    setPartsRecord(null);
    
    setFacaForm(prev => ({
      ...prev,
      repairStart: formatInputTime(item.startTime),
      repairEnd: formatInputTime(item.endTime),
      faDetail: '',
      caDetail: '',
      cat1: '',
      cat2: '',
      cat3: '',
      tag1: '',
      tag2: ''
    }));

    setIsLoadingFaca(true);
    try {
      const response = await fetch('https://localhost:7044/api/FACA/ClickAlarm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ alarmCode: item.alarmCode })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.code === 200 && result.data && result.data.fACALibrary) {
        const library: FACALibrary[] = result.data.fACALibrary;
        setFacaLibraryData(library);
        
        if (library.length > 0) {
          const firstItem = library[0];
          setFacaForm(prev => ({
            ...prev,
            cat1: firstItem.AlarmLevel1 || '',
            cat2: firstItem.AlarmLevel2 || '',
            cat3: '',
            tag1: '',
            tag2: ''
          }));
        }
      } else {
        throw new Error(result.message || '獲取 FACA 數據失敗');
      }
    } catch (error) {
      console.error('Error fetching FACA library:', error);
      alert(`獲取 FACA 數據失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      setFacaLibraryData([]);
    } finally {
      setIsLoadingFaca(false);
    }
  };

  const applySolution = (solution: FACASolution) => {
    setAppliedSolutionId(solution.id);
    setIsOtherFault(false);
    setFacaForm(prev => ({
      ...prev,
      faDetail: solution.reason,
      caDetail: solution.action
    }));
  };

  const handleToggleOtherFault = () => {
    const newValue = !isOtherFault;
    setIsOtherFault(newValue);
    if (newValue) {
      setAppliedSolutionId(null); 
    }
  };

  const openPartsModal = () => {
    setTempPartsRecord({
      name: partsRecord?.name || '',
      model: partsRecord?.model || '',
      brand: partsRecord?.brand || '',
      quantity: partsRecord?.quantity || '1',
      changeTime: partsRecord?.changeTime || formatNow(),
      description: partsRecord?.description || '',
      originalPart: {
        name: partsRecord?.originalPart?.name || '',
        brand: partsRecord?.originalPart?.brand || '',
        model: partsRecord?.originalPart?.model || ''
      }
    });
    setIsPartsModalOpen(true);
  };

  const confirmPartsRecord = () => {
    setPartsRecord(tempPartsRecord);
    setIsPartsModalOpen(false);
  };

  const cancelPartsRecord = () => {
    setIsPartsModalOpen(false);
  };

  const handleSubmitFACA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      
      // 更新邏輯：從待處理列表中刪除對應的項目
      const updatedPendingItems = pendingItems.filter(item => item.id !== selectedId);
      setPendingItems(updatedPendingItems);
      
      alert(`FACA 分析項目 ${selectedId} 已成功上傳雲端並標記為處理完成！`);
      setSelectedId(null);
    }, 1500);
  };

  const isInputsDisabled = !isOtherFault;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">FACA 故障分析管理</h2>
            <p className="text-sm text-slate-500 mt-1">針對設備停機異常進行失效分析與改善追蹤</p>
          </div>
        </div>
        <button 
          onClick={() => alert('正在同步所有已上傳 FACA 數據...')}
          className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
        >
          <CloudUpload size={18} className="mr-2" /> 同步雲端歷史紀錄
        </button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)] overflow-hidden">
        {/* Left: Pending List */}
        <div className="w-1/3 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center">
              <Clock size={18} className="mr-2 text-red-500" /> 待處理列表
            </h3>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{pendingItems.length} 條異常</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 custom-scrollbar">
            {pendingItems.length > 0 ? (
              pendingItems.map(item => (
                <button 
                  key={item.id} 
                  disabled={isLoadingFaca && selectedId === item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-md ${selectedId === item.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02]' : 'bg-white border-slate-100 text-slate-600'} ${(isLoadingFaca && selectedId === item.id) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${selectedId === item.id ? 'bg-blue-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {item.alarmCode}
                    </span>
                    <span className={`text-[10px] ${selectedId === item.id ? 'text-blue-100' : 'text-slate-400'} font-mono`}>{formatDisplayDate(item.date)}</span>
                  </div>
                  <h4 className={`font-bold text-sm ${selectedId === item.id ? 'text-white' : 'text-slate-800'}`}>
                    {item.machineName}
                    {isLoadingFaca && selectedId === item.id && <span className="ml-2 text-xs text-blue-200">處理中...</span>}
                  </h4>
                  <p className={`text-xs mt-1 truncate ${selectedId === item.id ? 'text-blue-100' : 'text-slate-500'}`}>{item.alarmContent}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2 text-[10px]">
                      <Clock size={12} />
                      <span>{formatDisplayTime(item.startTime)} - {formatDisplayTime(item.endTime)}</span>
                    </div>
                    <ChevronRight size={14} className={selectedId === item.id ? 'text-white' : 'text-slate-300'} />
                  </div>
                </button>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-full">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600">所有異常已處理完成</p>
                  <p className="text-xs mt-1">目前沒有待分析的 FACA 項目</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Analysis Form */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {selectedId ? (
            <form onSubmit={handleSubmitFACA} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 border-b border-slate-200 bg-white shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                      <FileWarning size={22} className="mr-2 text-blue-600" /> FACA 錄入內容
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">分析編號: <span className="font-mono font-bold text-blue-600">{selectedId}</span></p>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    {isSubmitting ? <Activity className="animate-spin mr-2" size={18} /> : <CloudUpload size={18} className="mr-2" />}
                    提交 FACA 分析
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar min-h-0">
                {/* Section 1: Basic Fault Info & Handler Info */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">故障代碼</label>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-blue-700 font-bold">
                      {selectedItem?.alarmCode}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">設備名稱</label>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 font-bold">
                      {selectedItem?.machineName}
                    </div>
                  </div>
                  
                  {/* 故障描述控件 - 自動生成且唯讀 */}
                  <div className="col-span-2 space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare size={14} className="mr-1.5 text-blue-500" /> 
                        故障描述 (故障代碼 {selectedItem?.alarmCode} 自動關聯內容)
                      </div>
                      <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded flex items-center">
                        <Sparkles size={10} className="mr-1" /> 系統自動帶出
                      </span>
                    </label>
                    <div className="w-full p-4 border border-blue-100 rounded-xl bg-blue-50/30 text-sm text-slate-600 italic leading-relaxed shadow-inner">
                      {selectedItem?.alarmContent || "無對應故障代碼描述信息"}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">處理人名稱</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={facaForm.handlerName}
                        onChange={(e) => setFacaForm({...facaForm, handlerName: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="輸入處理人名稱"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">處理人工號</label>
                    <div className="relative">
                      <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={facaForm.handlerId}
                        onChange={(e) => setFacaForm({...facaForm, handlerId: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                        placeholder="輸入處理人工號 (如: V1234)"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">處理人部門</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={facaForm.handlerDept}
                        onChange={(e) => setFacaForm({...facaForm, handlerDept: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="輸入處理人所在部門"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Time Management */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                    <h4 className="text-sm font-bold text-red-700 mb-4 flex items-center">
                      <Clock size={16} className="mr-2" /> 故障時間段
                    </h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <span className="text-[10px] text-red-400 font-bold uppercase">開始</span>
                        <div className="text-lg font-mono font-bold text-red-800">{selectedItem?.startTime}</div>
                      </div>
                      <div className="w-8 h-[2px] bg-red-200"></div>
                      <div className="flex-1">
                        <span className="text-[10px] text-red-400 font-bold uppercase">結束</span>
                        <div className="text-lg font-mono font-bold text-red-800">{selectedItem?.endTime}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                    <h4 className="text-sm font-bold text-green-700 mb-4 flex items-center">
                      <Activity size={16} className="mr-2" /> 維修時間段 (人工作業)
                    </h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <span className="text-[10px] text-green-400 font-bold uppercase">維修開始</span>
                        <input type="time" value={facaForm.repairStart} onChange={(e) => setFacaForm({...facaForm, repairStart: e.target.value})} className="w-full bg-transparent text-lg font-mono font-bold text-green-800 focus:ring-0 border-none p-0 outline-none" />
                      </div>
                      <div className="w-8 h-[2px] bg-green-200"></div>
                      <div className="flex-1">
                        <span className="text-[10px] text-green-400 font-bold uppercase">維修結束</span>
                        <input type="time" value={facaForm.repairEnd} onChange={(e) => setFacaForm({...facaForm, repairEnd: e.target.value})} className="w-full bg-transparent text-lg font-mono font-bold text-green-800 focus:ring-0 border-none p-0 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Classification */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center">
                      <Tag size={18} className="mr-2 text-blue-600" /> 異常分類體系
                    </h4>
                    <span className="text-[10px] text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded flex items-center">
                      <Info size={10} className="mr-1" /> 自動解析模式
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">一級分類 (自動)</label>
                      <select 
                        disabled 
                        value={facaForm.cat1} 
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                      >
                        <option value={facaForm.cat1}>{facaForm.cat1}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">二級分類 (自動)</label>
                      <select 
                        disabled 
                        value={facaForm.cat2} 
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                      >
                        <option value={facaForm.cat2}>{facaForm.cat2}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">三級分類</label>
                      <select 
                        value={facaForm.cat3} 
                        onChange={(e) => setFacaForm({...facaForm, cat3: e.target.value, tag1: '', tag2: ''})} 
                        className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      >
                        <option value="">請選擇三級分類</option>
                        {cat3Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase flex items-center">
                        <BarChart2 size={12} className="mr-1" /> 分類標籤 1
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {tag1Options.length > 0 ? tag1Options.map(tag => (
                          <button 
                            key={tag} 
                            type="button" 
                            onClick={() => setFacaForm({...facaForm, tag1: tag, tag2: ''})}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${facaForm.tag1 === tag ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                          >
                            {tag}
                          </button>
                        )) : <span className="text-xs text-slate-400">請先選擇三級分類</span>}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase flex items-center">
                        <BarChart2 size={12} className="mr-1" /> 分類標籤 2
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {tag2Options.length > 0 ? tag2Options.map(tag => (
                          <button 
                            key={tag} 
                            type="button" 
                            onClick={() => setFacaForm({...facaForm, tag2: tag})}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${facaForm.tag2 === tag ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                          >
                            {tag}
                          </button>
                        )) : <span className="text-xs text-slate-400">請先選擇分類標籤 1</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- EXPERT KNOWLEDGE LIST --- */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center">
                      <BookOpen size={18} className="mr-2 text-indigo-600" /> 專家知識庫 / 標準 FACA 方案
                    </h4>
                    <span className="text-[10px] text-slate-400 italic">基於報警代碼 {selectedItem?.alarmCode} 自動檢索</span>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                          <th className="px-4 py-3">故障分類</th>
                          <th className="px-4 py-3">現象描述</th>
                          <th className="px-4 py-3">原因分析</th>
                          <th className="px-4 py-3">處理方法</th>
                          <th className="px-4 py-3 text-right">引用</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSolutions.length > 0 ? (
                          filteredSolutions.map((sol) => (
                            <tr key={sol.id} className={`text-[11px] group transition-colors ${appliedSolutionId === sol.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                                  {sol.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-700 font-medium">{sol.description}</td>
                              <td className="px-4 py-3 text-slate-500 italic">{sol.reason}</td>
                              <td className="px-4 py-3 text-slate-600 leading-relaxed">{sol.action}</td>
                              <td className="px-4 py-3 text-right">
                                <button 
                                  type="button"
                                  onClick={() => applySolution(sol)}
                                  className={`p-1.5 rounded-lg transition-all ${appliedSolutionId === sol.id ? 'bg-green-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
                                >
                                  {appliedSolutionId === sol.id ? <Check size={14} /> : <MousePointer2 size={14} />}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                              暫無符合此報警代碼的標準方案。
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* --- SPLIT: FA & CA ANALYSIS --- */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <div 
                        onClick={handleToggleOtherFault}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isOtherFault ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}
                      >
                        {isOtherFault ? <Check size={12} strokeWidth={4} /> : null}
                      </div>
                      <span className={`text-xs font-bold ${isOtherFault ? 'text-blue-600' : 'text-slate-500'}`}>其他故障 (開放自定義編輯)</span>
                    </label>

                    {/* 更換零件按鈕 */}
                    <div className="flex items-center space-x-3">
                      {partsRecord && (
                        <span className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded flex items-center font-bold">
                          <Check size={10} className="mr-1" /> 已錄入零件: {partsRecord.name}
                        </span>
                      )}
                      <button 
                        type="button"
                        onClick={openPartsModal}
                        className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${partsRecord ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        <Package size={14} className="mr-2" />
                        更換零件
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                      <Search size={14} className="mr-1.5 text-blue-500" /> FA 故障分析 (Failure Analysis)
                      {isInputsDisabled && <span className="ml-2 text-[10px] text-amber-500 bg-amber-50 px-1.5 rounded flex items-center"><XCircle size={10} className="mr-1" /> 已鎖定</span>}
                    </label>
                    <textarea 
                      disabled={isInputsDisabled}
                      value={facaForm.faDetail}
                      onChange={(e) => setFacaForm({...facaForm, faDetail: e.target.value})}
                      className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[120px] shadow-inner transition-all ${isInputsDisabled ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300'}`}
                      placeholder={isInputsDisabled ? "當前為鎖定狀態，如需編輯請勾選「其他故障」" : "請輸入詳細的失效分析內容..."}
                    ></textarea>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                      <Wrench size={14} className="mr-1.5 text-green-500" /> CA 故障處理 (Corrective Action)
                      {isInputsDisabled && <span className="ml-2 text-[10px] text-amber-500 bg-amber-50 px-1.5 rounded flex items-center"><XCircle size={10} className="mr-1" /> 已鎖定</span>}
                    </label>
                    <textarea 
                      disabled={isInputsDisabled}
                      value={facaForm.caDetail}
                      onChange={(e) => setFacaForm({...facaForm, caDetail: e.target.value})}
                      className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm min-h-[120px] shadow-inner transition-all ${isInputsDisabled ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300'}`}
                      placeholder={isInputsDisabled ? "當前為鎖定狀態，如需編輯請勾選「其他故障」" : "請輸入採取的糾正措施、修復過程與預防建議..."}
                    ></textarea>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="p-8 bg-slate-50 rounded-full">
                <FileWarning size={64} className="text-slate-200" />
              </div>
              <p className="text-lg font-medium">請從左側列表中選擇一個待處理的異常項目</p>
              <p className="text-sm">錄入 FACA 將有助於減少重複故障並優化生產效率</p>
            </div>
          )}
        </div>
      </div>

      {/* 零件更換記錄窗口 */}
      {isPartsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-orange-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <Package size={20} />
                <h3 className="font-bold">零件更換記錄</h3>
              </div>
              <button onClick={cancelPartsRecord} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">品名</label>
                  <input 
                    type="text" 
                    value={tempPartsRecord.name}
                    onChange={(e) => setTempPartsRecord({...tempPartsRecord, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="如: 伺服電機"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">型號</label>
                  <input 
                    type="text" 
                    value={tempPartsRecord.model}
                    onChange={(e) => setTempPartsRecord({...tempPartsRecord, model: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                    placeholder="如: MSMD042G1V"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">品牌</label>
                  <input 
                    type="text" 
                    value={tempPartsRecord.brand}
                    onChange={(e) => setTempPartsRecord({...tempPartsRecord, brand: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="如: Panasonic"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">數量</label>
                  <input 
                    type="text" 
                    value={tempPartsRecord.quantity}
                    onChange={(e) => setTempPartsRecord({...tempPartsRecord, quantity: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="1"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">更換時間 (XXXX/XX/XX XX:XX:XX)</label>
                  <input 
                    type="text" 
                    value={tempPartsRecord.changeTime}
                    onChange={(e) => setTempPartsRecord({...tempPartsRecord, changeTime: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">描述</label>
                  <textarea 
                    value={tempPartsRecord.description}
                    onChange={(e) => setTempPartsRecord({...tempPartsRecord, description: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none min-h-[60px] resize-none"
                    placeholder="請描述零件更換的原因或狀況..."
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-600 flex items-center">
                  <Trash2 size={14} className="mr-2" /> 原物料模塊 (更換前零件)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">品名</label>
                    <input 
                      type="text" 
                      value={tempPartsRecord.originalPart.name}
                      onChange={(e) => setTempPartsRecord({...tempPartsRecord, originalPart: {...tempPartsRecord.originalPart, name: e.target.value}})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">品牌</label>
                    <input 
                      type="text" 
                      value={tempPartsRecord.originalPart.brand}
                      onChange={(e) => setTempPartsRecord({...tempPartsRecord, originalPart: {...tempPartsRecord.originalPart, brand: e.target.value}})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">型號</label>
                    <input 
                      type="text" 
                      value={tempPartsRecord.originalPart.model}
                      onChange={(e) => setTempPartsRecord({...tempPartsRecord, originalPart: {...tempPartsRecord.originalPart, model: e.target.value}})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 outline-none font-mono bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-4 shrink-0">
              <button 
                onClick={cancelPartsRecord}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={confirmPartsRecord}
                className="flex items-center px-8 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95"
              >
                <Check size={18} className="mr-2" /> 確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FACAManagement;