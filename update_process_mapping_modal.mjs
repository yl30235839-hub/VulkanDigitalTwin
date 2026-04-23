import fs from 'fs';

let content = fs.readFileSync('components/DeviceSettings.tsx', 'utf8');

const modalState = `  // Process Mapping Modal State
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const SYSTEM_PROCESS_PARAMETERS = [
    '主軸轉速控制',
    '進給速度控制',
    '加工壓力控制',
    '溫度控制',
    '濕度控制',
    '扭力控制',
    '張力控制',
    '流量控制',
    '液位控制',
    '濃度控制',
    '其他'
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
  };`;

content = content.replace('  // Local Form State', modalState + '\n\n  // Local Form State');

const modalUI = `
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
                <select
                  value={selectedProcessType}
                  onChange={(e) => setSelectedProcessType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {SYSTEM_PROCESS_PARAMETERS.map(param => (
                    <option key={param} value={param}>{param}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">請選擇需要映射的工藝參數類型。</p>
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
`;

content = content.replace(/    <\/div>\n  \);\n};\n\nexport default DeviceSettings;/g, modalUI);

content = content.replace(
  /<button className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm">/g,
  `<button onClick={() => setIsProcessModalOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm">`
);


fs.writeFileSync('components/DeviceSettings.tsx', content);
console.log('Update script completed successfully.');
