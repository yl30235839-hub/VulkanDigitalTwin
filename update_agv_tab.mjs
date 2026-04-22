import fs from 'fs';

const filePath = 'components/DeviceSettings.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update TabType
content = content.replace(
    /type TabType = 'BASIC' \| 'MAPPING' \| 'PROCESS_MAPPING' \| 'PROCESS_LAYOUT';/,
    "type TabType = 'BASIC' | 'MAPPING' | 'PROCESS_MAPPING' | 'PROCESS_LAYOUT' | 'AGV_ORDER';"
);

// 2. Add Tab Button
const tabButtonSearch = `className={\`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap \${activeTab === 'PROCESS_LAYOUT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} \${device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment ? 'opacity-30 cursor-not-allowed' : ''}\`}
            >
              工藝排佈
            </button>`;

if (content.includes(tabButtonSearch)) {
    const agvTabButton = `
            <button 
              onClick={() => (device.type === EquipmentType.AssemblyEquipment || device.type === EquipmentType.TestingEquipment || device.type === EquipmentType.WaterVaporEquipment) && setActiveTab('AGV_ORDER')} 
              disabled={device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment}
              className={\`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap \${activeTab === 'AGV_ORDER' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} \${device.type !== EquipmentType.AssemblyEquipment && device.type !== EquipmentType.TestingEquipment && device.type !== EquipmentType.WaterVaporEquipment ? 'opacity-30 cursor-not-allowed' : ''}\`}
            >
              AGV 訂單管理
            </button>`;
    content = content.replace(tabButtonSearch, tabButtonSearch + agvTabButton);
}

// 3. Add Tab Content
const processLayoutContent = `{activeTab === 'PROCESS_LAYOUT' && (
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
        )}`;

if (content.includes(processLayoutContent)) {
    content = content.replace(processLayoutContent, processLayoutContent + "\n        {activeTab === 'AGV_ORDER' && renderAGVOrderInfo()}");
}

fs.writeFileSync(filePath, content);
console.log('Update successful');
