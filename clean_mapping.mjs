import fs from 'fs';
const content = fs.readFileSync('components/DeviceSettings.tsx', 'utf-8');
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('const renderMappingInfo = () => ('));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('if (!device) return <div'));

const newMethod = `  const renderMappingInfo = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Database size={32} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-2">數據映射管理已清理</h3>
      <p className="text-sm text-slate-500 text-center max-w-md">
        現有的數據庫展示內容已清除，為後續的更新做準備。
      </p>
    </div>
  );

`;

lines.splice(startIdx, endIdx - startIdx, newMethod);
fs.writeFileSync('components/DeviceSettings.tsx', lines.join('\n'));
console.log('Replaced lines from', startIdx, 'to', endIdx);
