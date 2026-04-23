import fs from 'fs';

let content = fs.readFileSync('components/DeviceSettings.tsx', 'utf8');

const regex = /        \{activeTab === 'AGV_ORDER' && renderAGVOrderInfo\(\)\}\n      <\/div>\n    <\/div>\n  \);\n\};\n\nexport default DeviceSettings;/;

const replacement = `        {activeTab === 'AGV_ORDER' && renderAGVOrderInfo()}
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
                <select
                  value={selectedProcessType}
                  onChange={(e) => setSelectedProcessType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {SYSTEM_PROCESS_PARAMETERS.map(param => (
                    <option key={param} value={param}>{param}</option>
                  ))}
                </select>
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

export default DeviceSettings;`;

content = content.replace(regex, replacement);

fs.writeFileSync('components/DeviceSettings.tsx', content);
console.log('Done!');
