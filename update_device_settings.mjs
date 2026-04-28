import fs from 'fs';

let content = fs.readFileSync('components/DeviceSettings.tsx', 'utf8');

// 1. Add import for backendDomain
if (!content.includes('import { backendDomain }')) {
  content = content.replace(
    "import api from '../services/api';",
    "import api from '../services/api';\nimport { backendDomain } from '../constants';"
  );
}

// 2. State for importing
const stateCode = `  const [isImporting, setIsImporting] = useState(false);`;
content = content.replace(
  "const [isTesting, setIsTesting] = useState(false);",
  "const [isTesting, setIsTesting] = useState(false);\n" + stateCode
);

// 3. handleFileChange
const handleFileChangeOld = `  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fileContent = event.target?.result as string;
          const rows = fileContent.split('\\n').filter(row => row.trim() !== '');
          const newMappings: AlarmMappingItem[] = rows.slice(1).map((row, index) => {
            const parts = row.split(',').map(s => s.trim());
            return {
              id: (Date.now() + index).toString(),
              address: parts[0] || 'N/A',
              alarmBit: parseInt(parts[1]) || 0,
              code: parts[2] || 'N/A',
              content: parts[3] || 'N/A',
              solution: parts[4] || 'N/A',
              level1Alarm: parts[5] || 'N/A',
              level2Alarm: parts[6] || 'N/A',
            };
          });
          setAlarmMappings(prev => [...prev, ...newMappings]);
          alert('導入成功');
        } catch (err) {
          console.error(err);
          alert('導入失敗，請檢查文件格式');
        }
      };
      reader.readAsText(file);
    }
  };`;

const handleFileChangeNew = `  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && device) {
      setIsImporting(true);
      try {
        const response = await api.post(\`\${backendDomain}/api/Line/EnterLine\`, {
          lineSystemName: device.lineId,
          equipmentSystemName: device.name,
          filePath: file.name
        });
        
        if (response.data && response.data.code === 200 && response.data.data) {
          const alarmData = response.data.data.alarmData || [];
          const newMappings: AlarmMappingItem[] = alarmData.map((item: any, index: number) => ({
            id: (Date.now() + index).toString(),
            address: item.RegisterAddress || 'N/A',
            alarmBit: item.RegisterBit ? parseInt(item.RegisterBit) : 0,
            code: item.AlarmCode || 'N/A',
            content: item.AlarmNote || 'N/A',
            solution: item.AlarmSolution || 'N/A',
            level1Alarm: item.OneLevelItem || 'N/A',
            level2Alarm: item.TwoLevelItem || 'N/A',
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
  };`;

content = content.replace(handleFileChangeOld, handleFileChangeNew);

// 4. Update the input accept and the button state
const acceptOld = `          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".csv,.txt"
          />`;
const acceptNew = `          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".xlsx,.xls,.csv,.txt"
          />`;
content = content.replace(acceptOld, acceptNew);

const buttonOld = `          <button 
            onClick={handleImportClick}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 rounded-lg text-sm font-medium transition-all"
          >
            <Upload size={16} className="mr-2" />
            導入映射表
          </button>`;
const buttonNew = `          <button 
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={16} className="mr-2" />
            {isImporting ? '處理中...' : '導入映射表'}
          </button>`;
content = content.replace(buttonOld, buttonNew);


fs.writeFileSync('components/DeviceSettings.tsx', content);
console.log('Update Finished');
