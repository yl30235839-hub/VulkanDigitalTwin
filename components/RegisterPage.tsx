import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  User, IdCard, Building2, Briefcase, GraduationCap, 
  Lock, ArrowLeft, CheckCircle, 
  Fingerprint, Scan, ShieldCheck, Info, Eye, EyeOff,
  UserCheck, Zap, Monitor, Settings, CheckSquare, Square,
  X, LockKeyhole, RefreshCw
} from 'lucide-react';

interface RegisterPageProps {
  onBack: () => void;
  initialData?: any;
  isEdit?: boolean;
  onSave?: (data: any) => void;
  onSuccess?: (users: any[]) => void;
  isModal?: boolean;
  lineSystemName?: string;
  equipmentSystemName?: string;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ 
  onBack, 
  initialData, 
  isEdit = false, 
  onSave,
  onSuccess,
  isModal = false,
  lineSystemName = '',
  equipmentSystemName = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    department: '',
    position: '機構',
    techLevel: '1級(Level C)',
    permission: '操作員',
    password: '',
    extraPermissions: {
      keyPersonnel: false,
      mobilePersonnel: false,
      hostSoftware: false,
      equipmentOp: false
    }
  });

  // Fingerprint Registration State 1
  const [isRegisteringFinger, setIsRegisteringFinger] = useState(false);
  const [isVerifyingFinger, setIsVerifyingFinger] = useState(false);
  const [isFingerRegistered, setIsFingerRegistered] = useState(false);
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);
  const [fingerprintStatus, setFingerprintStatus] = useState('等待登記...');

  // Fingerprint Registration State 2
  const [isRegisteringFinger2, setIsRegisteringFinger2] = useState(false);
  const [isVerifyingFinger2, setIsVerifyingFinger2] = useState(false);
  const [isFingerRegistered2, setIsFingerRegistered2] = useState(false);
  const [fingerprintImage2, setFingerprintImage2] = useState<string | null>(null);
  const [fingerprintStatus2, setFingerprintStatus2] = useState('等待登記2...');

  /**
   * Enablement Logic Update:
   * 1. If hasFingerprint1 is true (already registered), module 1 is DISABLED (enable = false).
   * 2. If hasFingerprint1 is false (not registered), module 1 is ENABLED (enable = true).
   */
  const isFinger1Enabled = !isEdit || (initialData?.hasFingerprint1 === false);
  const isFinger2Enabled = !isEdit || (initialData?.hasFingerprint2 === false);

  // Initialize data if in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        name: initialData.name || '',
        employeeId: initialData.employeeId || '',
        department: initialData.department || '',
        position: initialData.position || '機構',
        techLevel: initialData.techLevel || '1級(Level C)',
        permission: initialData.permission || '操作員',
        password: '••••••••', // Don't show actual password for security
        extraPermissions: {
          keyPersonnel: initialData.extraPermissions?.keyPersonnel || false,
          mobilePersonnel: initialData.extraPermissions?.mobilePersonnel || false,
          hostSoftware: initialData.extraPermissions?.hostSoftware || false,
          equipmentOp: initialData.extraPermissions?.equipmentOp || false
        }
      });
      
      // Setup Initial Biometrics View
      if (initialData.hasFingerprint1) {
        setIsFingerRegistered(true);
        setFingerprintStatus('指紋1已錄入 (模塊已鎖定)');
        setFingerprintImage('https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=200&h=200');
      } else {
        setFingerprintStatus('待錄入指紋1...');
      }

      if (initialData.hasFingerprint2) {
        setIsFingerRegistered2(true);
        setFingerprintStatus2('指紋2已錄入 (模塊已鎖定)');
        setFingerprintImage2('https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=200&h=200');
      } else {
        setFingerprintStatus2('待錄入指紋2...');
      }
    }
  }, [isEdit, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare request body according to API specification
      const requestBody = {
        userName: formData.name,
        userID: formData.employeeId,
        department: formData.department,
        userJobName: formData.position,
        permissions: formData.permission,
        userLevel: formData.techLevel,
        userPassword: formData.password,
        extraPermissions: {
          keyPersonnel: formData.extraPermissions.keyPersonnel,
          mobilePersonnel: formData.extraPermissions.mobilePersonnel,
          hostSoftware: formData.extraPermissions.hostSoftware,
          equipmentOp: formData.extraPermissions.equipmentOp
        }
      };

      // Call API
      const response = await api.post('https://localhost:7044/api/CheckIn/AddUser', requestBody);
      const { code, message, data } = response.data;

      if (code === 200) {
        // Success handling
        if (isEdit && onSave) {
          onSave(formData);
        } else {
          alert('註冊成功！請使用新賬號登入。');
          if (onSuccess && Array.isArray(data)) {
            onSuccess(data);
          }
        }
        onBack();
      } else {
        // Error handling from API
        alert(`註冊失敗: ${message || '未知錯誤'} (代碼: ${code})`);
      }
    } catch (error: any) {
      // Error handling for request exceptions
      const errorMsg = error.response?.data?.message || error.message || '網絡錯誤';
      alert(`請求異常: ${errorMsg}`);
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };

  const toggleExtraPermission = (key: keyof typeof formData.extraPermissions) => {
    setFormData({
      ...formData,
      extraPermissions: {
        ...formData.extraPermissions,
        [key]: !formData.extraPermissions[key]
      }
    });
  };

  // Logic for Fingerprint 1
  const startFingerprintRegistration = async () => {
    if (!isFinger1Enabled) return;
    setIsRegisteringFinger(true);
    setIsFingerRegistered(false);
    setFingerprintImage(null);
    setFingerprintStatus('開始采集指紋1，請準備...');

    try {
      for (let count = 1; count <= 3; count++) {
        setFingerprintStatus(`正在采集指紋1 (第 ${count} 次)，請按下手指...`);
        
        const response = await api.post('https://localhost:7044/api/CheckIn/ABFingerRegister', {
          lineSystemName: lineSystemName,
          equipmentSystemName: equipmentSystemName,
          fingerNo: 'A',
          count: count
        });
        
        const { code, message, data } = response.data;
        
        if (code === 200) {
          if (data?.image) {
            setFingerprintImage(`data:image/png;base64,${data.image}`);
          }
          
          if (count < 3) {
            setFingerprintStatus(`第 ${count} 次采集成功，請抬起手指並準備第 ${count + 1} 次按壓...`);
            // 稍微延遲一下，讓用戶有時間反應
            await new Promise(resolve => setTimeout(resolve, 1500));
          } else {
            setIsFingerRegistered(true);
            setFingerprintStatus('指紋1登記成功！');
          }
        } else {
          throw new Error(message || `第 ${count} 次采集失敗`);
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || '網絡錯誤';
      alert(`指紋登記失敗: ${errorMsg}`);
      setFingerprintStatus(`登記失敗: ${errorMsg}`);
    } finally {
      setIsRegisteringFinger(false);
    }
  };

  const verifyFingerprint = async () => {
    if (!isFingerRegistered || !isFinger1Enabled) return;
    setIsVerifyingFinger(true);
    setFingerprintStatus('正在驗證指紋1，請按下手指...');
    
    try {
      const response = await api.post('https://localhost:7044/api/CheckIn/ABFingerVerify', {
        lineSystemName: lineSystemName,
        equipmentSystemName: equipmentSystemName,
        fingerNo: 'A'
      });
      
      const { code, message, data } = response.data;
      
      if (code === 200) {
        if (data?.image) {
          setFingerprintImage(`data:image/png;base64,${data.image}`);
        }
        const matchScore = data?.result !== undefined ? (data.result * 100).toFixed(1) : '0.0';
        setFingerprintStatus(`指紋驗證通過！匹配度：${matchScore}%`);
      } else {
        alert(`驗證失敗: ${message || '未知錯誤'} (代碼: ${code})`);
        setFingerprintStatus(`驗證失敗: ${message}`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || '網絡錯誤';
      alert(`驗證異常: ${errorMsg}`);
      setFingerprintStatus(`驗證異常: ${errorMsg}`);
    } finally {
      setIsVerifyingFinger(false);
    }
  };

  // Logic for Fingerprint 2
  const startFingerprintRegistration2 = async () => {
    if (!isFinger2Enabled) return;
    setIsRegisteringFinger2(true);
    setIsFingerRegistered2(false);
    setFingerprintImage2(null);
    setFingerprintStatus2('開始采集指紋2，請準備...');

    try {
      for (let count = 1; count <= 3; count++) {
        setFingerprintStatus2(`正在采集指紋2 (第 ${count} 次)，請按下手指...`);
        
        const response = await api.post('https://localhost:7044/api/CheckIn/ABFingerRegister', {
          lineSystemName: lineSystemName,
          equipmentSystemName: equipmentSystemName,
          fingerNo: 'B',
          count: count
        });
        
        const { code, message, data } = response.data;
        
        if (code === 200) {
          if (data?.image) {
            setFingerprintImage2(`data:image/png;base64,${data.image}`);
          }
          
          if (count < 3) {
            setFingerprintStatus2(`第 ${count} 次采集成功，請抬起手指並準備第 ${count + 1} 次按壓...`);
            await new Promise(resolve => setTimeout(resolve, 1500));
          } else {
            setIsFingerRegistered2(true);
            setFingerprintStatus2('指紋2登記成功！');
          }
        } else {
          throw new Error(message || `第 ${count} 次采集失敗`);
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || '網絡錯誤';
      alert(`指紋登記2失敗: ${errorMsg}`);
      setFingerprintStatus2(`登記失敗: ${errorMsg}`);
    } finally {
      setIsRegisteringFinger2(false);
    }
  };

  const verifyFingerprint2 = async () => {
    if (!isFingerRegistered2 || !isFinger2Enabled) return;
    setIsVerifyingFinger2(true);
    setFingerprintStatus2('正在驗證指紋2，請按下手指...');
    
    try {
      const response = await api.post('https://localhost:7044/api/CheckIn/ABFingerVerify', {
        lineSystemName: lineSystemName,
        equipmentSystemName: equipmentSystemName,
        fingerNo: 'B'
      });
      
      const { code, message, data } = response.data;
      
      if (code === 200) {
        if (data?.image) {
          setFingerprintImage2(`data:image/png;base64,${data.image}`);
        }
        const matchScore = data?.result !== undefined ? (data.result * 100).toFixed(1) : '0.0';
        setFingerprintStatus2(`指紋驗證通過！匹配度：${matchScore}%`);
      } else {
        alert(`驗證失敗: ${message || '未知錯誤'} (代碼: ${code})`);
        setFingerprintStatus2(`驗證失敗: ${message}`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || '網絡錯誤';
      alert(`驗證異常: ${errorMsg}`);
      setFingerprintStatus2(`驗證異常: ${errorMsg}`);
    } finally {
      setIsVerifyingFinger2(false);
    }
  };

  const extraPermsList = [
    { id: 'keyPersonnel', label: '關鍵人力', icon: UserCheck },
    { id: 'mobilePersonnel', label: '機動人力', icon: Zap },
    { id: 'hostSoftware', label: '上位機軟件', icon: Monitor },
    { id: 'equipmentOp', label: '設備操作權限', icon: Settings },
  ];

  const mainContainerClass = isModal 
    ? "bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl" 
    : "bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-300";

  return (
    <div className={isModal ? "" : "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4"}>
      <div className={mainContainerClass}>
        {/* Header */}
        <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{isEdit ? '用戶信息編輯' : '新用戶註冊'}</h2>
            <p className="text-blue-100 text-[10px] mt-0.5">
              {isEdit ? `正在修改員工 ${formData.employeeId} 的基礎資料與權限配置` : '請填寫以下信息完成 MES 系統賬號註冊'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Building2 size={24} className="opacity-30" />
            {isModal && (
              <button 
                onClick={onBack}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors ml-2"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Left Column - Text Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center uppercase tracking-wide">
                    <User size={12} className="mr-1.5 text-blue-500" /> 姓名
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    placeholder="真實姓名"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center uppercase tracking-wide">
                    <IdCard size={12} className="mr-1.5 text-blue-500" /> 工號
                  </label>
                  <input
                    required
                    type="text"
                    disabled={isEdit}
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-mono ${isEdit ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
                    placeholder="Employee ID"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center uppercase tracking-wide">
                    <Building2 size={12} className="mr-1.5 text-blue-500" /> 部門
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    placeholder="部門名稱"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center uppercase tracking-wide">
                      <Briefcase size={12} className="mr-1.5 text-blue-500" /> 崗位
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm transition-all"
                    >
                      <option value="機構">機構</option>
                      <option value="電控">電控</option>
                      <option value="視覺">視覺</option>
                      <option value="導入">導入</option>
                      <option value="工程師">工程師</option>
                      <option value="高級工程師">高級工程師</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center uppercase tracking-wide">
                      <GraduationCap size={12} className="mr-1.5 text-blue-500" /> 技術等級
                    </label>
                    <select
                      value={formData.techLevel}
                      onChange={(e) => setFormData({...formData, techLevel: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm transition-all"
                    >
                      <option value="1級(Level C)">1級(Level C)</option>
                      <option value="2級(Level B)">2級(Level B)</option>
                      <option value="3級(Level A)">3級(Level A)</option>
                      <option value="開發">開發</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center uppercase tracking-wide">
                    <Lock size={12} className="mr-1.5 text-blue-500" /> {isEdit ? '重置密碼 (留空則不修改)' : '登入密碼'}
                  </label>
                  <div className="relative">
                    <input
                      required={!isEdit}
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                      placeholder={isEdit ? "••••••••" : "請設置登入密碼"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Biometrics with Conditional Enablement */}
            <div className="flex flex-col space-y-4">
              {/* Biometrics 1 - Enablement controlled by hasFingerprint1 (True -> Disabled, False -> Enabled) */}
              <div className={`bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center shadow-sm w-2/3 mx-auto transition-all relative
                ${!isFinger1Enabled ? 'opacity-50 grayscale pointer-events-none' : 'ring-1 ring-blue-100'}`}>
                
                {!isFinger1Enabled && (
                  <div className="absolute top-2 right-2 flex items-center text-slate-500" title="數據已鎖定">
                    <LockKeyhole size={12} />
                    <span className="text-[8px] ml-1 font-bold">已錄入</span>
                  </div>
                )}

                <h3 className="text-xs font-bold text-slate-800 self-start mb-2.5 flex items-center">
                  <Fingerprint size={14} className="mr-1.5 text-blue-600" /> 生物信息登記1
                </h3>
                
                <div className="w-20 h-20 bg-white rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group mb-2.5">
                  {fingerprintImage ? (
                    <img src={fingerprintImage} alt="Fingerprint" className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <Fingerprint size={32} className={`text-slate-200 ${isRegisteringFinger ? 'animate-pulse text-blue-300' : ''}`} />
                  )}
                  {isRegisteringFinger && (
                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-blue-400 absolute animate-[bounce_2s_infinite]"></div>
                    </div>
                  )}
                </div>

                <div className="w-full bg-slate-900 text-green-400 p-2 rounded-lg font-mono text-[9px] h-9 flex items-center mb-2.5 border border-slate-800 shadow-inner overflow-hidden">
                  <div className="flex items-start">
                    <span className="mr-1.5">{"$>"}</span>
                    <span className="truncate">{fingerprintStatus}</span>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={startFingerprintRegistration}
                    disabled={isRegisteringFinger || !isFinger1Enabled}
                    className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all shadow-sm
                      ${(isRegisteringFinger || !isFinger1Enabled) ? 'bg-slate-200 text-slate-400 border-slate-200' : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                  >
                    <Scan size={12} className="mr-1" /> {isRegisteringFinger ? '處理中...' : (isFingerRegistered ? '重新登記' : '登記1')}
                  </button>
                  <button
                    type="button"
                    onClick={verifyFingerprint}
                    disabled={!isFingerRegistered || isRegisteringFinger || isVerifyingFinger || !isFinger1Enabled}
                    className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all shadow-sm
                      ${(!isFingerRegistered || isRegisteringFinger || isVerifyingFinger || !isFinger1Enabled) ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    <ShieldCheck size={12} className="mr-1" /> {isVerifyingFinger ? '處理中...' : '驗證1'}
                  </button>
                </div>
              </div>

              {/* Biometrics 2 - Enablement controlled by hasFingerprint2 (True -> Disabled, False -> Enabled) */}
              <div className={`bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center shadow-sm w-2/3 mx-auto transition-all relative
                ${!isFinger2Enabled ? 'opacity-50 grayscale pointer-events-none' : 'ring-1 ring-indigo-100'}`}>
                
                {!isFinger2Enabled && (
                  <div className="absolute top-2 right-2 flex items-center text-slate-500" title="數據已鎖定">
                    <LockKeyhole size={12} />
                    <span className="text-[8px] ml-1 font-bold">已錄入</span>
                  </div>
                )}

                <h3 className="text-xs font-bold text-slate-800 self-start mb-2.5 flex items-center">
                  <Fingerprint size={14} className="mr-1.5 text-indigo-600" /> 生物信息登記2
                </h3>
                
                <div className="w-20 h-20 bg-white rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group mb-2.5">
                  {fingerprintImage2 ? (
                    <img src={fingerprintImage2} alt="Fingerprint 2" className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <Fingerprint size={32} className={`text-slate-200 ${isRegisteringFinger2 ? 'animate-pulse text-indigo-300' : ''}`} />
                  )}
                  {isRegisteringFinger2 && (
                    <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-indigo-400 absolute animate-[bounce_2s_infinite]"></div>
                    </div>
                  )}
                </div>

                <div className="w-full bg-slate-900 text-indigo-400 p-2 rounded-lg font-mono text-[9px] h-9 flex items-center mb-2.5 border border-slate-800 shadow-inner overflow-hidden">
                  <div className="flex items-start">
                    <span className="mr-1.5">{"$>"}</span>
                    <span className="truncate">{fingerprintStatus2}</span>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={startFingerprintRegistration2}
                    disabled={isRegisteringFinger2 || !isFinger2Enabled}
                    className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all shadow-sm
                      ${(isRegisteringFinger2 || !isFinger2Enabled) ? 'bg-slate-200 text-slate-400 border-slate-200' : 'bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50'}`}
                  >
                    <Scan size={12} className="mr-1" /> {isRegisteringFinger2 ? '處理中...' : (isFingerRegistered2 ? '重新登記' : '登記2')}
                  </button>
                  <button
                    type="button"
                    onClick={verifyFingerprint2}
                    disabled={!isFingerRegistered2 || isRegisteringFinger2 || isVerifyingFinger2 || !isFinger2Enabled}
                    className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all shadow-sm
                      ${(!isFingerRegistered2 || isRegisteringFinger2 || isVerifyingFinger2 || !isFinger2Enabled) ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    <ShieldCheck size={12} className="mr-1" /> {isVerifyingFinger2 ? '處理中...' : '驗證2'}
                  </button>
                </div>
              </div>
            </div>

            {/* Permission (Full Width) */}
            <div className="md:col-span-2 space-y-2.5 pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center uppercase tracking-wide">
                <UserCheck size={12} className="mr-1.5 text-blue-500" /> 操作權限級別
              </label>
              <div className="flex flex-wrap gap-6">
                {['操作員', '工程師', '管理員'].map((perm) => (
                  <label key={perm} className="flex items-center cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="radio"
                        name="permission"
                        className="sr-only"
                        checked={formData.permission === perm}
                        onChange={() => setFormData({...formData, permission: perm})}
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.permission === perm ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-slate-400'}`}>
                        {formData.permission === perm && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                    </div>
                    <span className={`ml-2 text-xs font-bold ${formData.permission === perm ? 'text-blue-700' : 'text-slate-600'}`}>
                      {perm}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Extra Permissions (Multi-select) */}
            <div className="md:col-span-2 space-y-2.5 pt-2">
              <label className="text-xs font-bold text-slate-700 flex items-center uppercase tracking-wide">
                <Zap size={12} className="mr-1.5 text-blue-500" /> 附加功能權限
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {extraPermsList.map((perm) => {
                  const isActive = formData.extraPermissions[perm.id as keyof typeof formData.extraPermissions];
                  return (
                    <button
                      key={perm.id}
                      type="button"
                      onClick={() => toggleExtraPermission(perm.id as keyof typeof formData.extraPermissions)}
                      className={`flex items-center p-2 rounded-lg border transition-all text-left ${
                        isActive 
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <div className={`p-1 rounded-md mr-2 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <perm.icon size={11} />
                      </div>
                      <span className="text-[10px] font-bold leading-tight">{perm.label}</span>
                      <div className="ml-auto">
                        {isActive ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} className="opacity-20" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buttons (Full Width) */}
            <div className="md:col-span-2 flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 flex items-center justify-center py-2.5 px-4 border border-slate-300 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 outline-none"
              >
                <ArrowLeft size={16} className="mr-2" /> {isEdit ? '取消編輯' : '返回'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-[2] flex items-center justify-center bg-blue-600 text-white py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    處理中...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" /> {isEdit ? '保存修改內容' : '完成註冊申請'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        {!isModal && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 flex items-center justify-center">
              <Info size={11} className="mr-1.5" /> 提示：賬號申請提交後需經由系統管理員審核。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;