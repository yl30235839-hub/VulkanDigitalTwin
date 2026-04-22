import fs from 'fs';
const path = 'components/DeviceSettings.tsx';
let content = fs.readFileSync(path, 'utf-8');
const lines = content.split('\n');

const mappingInterface = `interface AlarmMappingItem {
  id: string;
  address: string;
  code: string;
  content: string;
  severity: 'Low' | 'Medium' | 'High';
}
`;

const mappingState = `
  // Alarm Mapping States
  const [alarmMappings, setAlarmMappings] = useState<AlarmMappingItem[]>([
    { id: '1', address: 'D100.0', code: 'E001', content: '緊急停止觸發', severity: 'High' },
    { id: '2', address: 'D100.1', code: 'E002', content: '安全門未鎖定', severity: 'High' },
    { id: '3', address: 'D100.2', code: 'W001', content: '氣壓不足警告', severity: 'Medium' },
    { id: '4', address: 'D100.3', code: 'I001', content: '物料低位提示', severity: 'Low' },
  ]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);`;

const mappingHandlers = `
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
              code: parts[1] || 'N/A',
              content: parts[2] || 'N/A',
              severity: (parts[3] as any) || 'Low'
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

let resultLines = [...lines];

// 1. Interface
if (!content.includes('interface AlarmMappingItem')) {
    const idx = resultLines.findIndex(l => l.includes('interface DeviceSettingsProps'));
    if (idx !== -1) {
        resultLines.splice(idx, 0, mappingInterface);
        console.log('Interface added');
    }
}

// 2. State
if (!content.includes('alarmMappings')) {
    const idx = resultLines.findIndex(l => l.includes('const [isTesting, setIsTesting] = useState(false);'));
    if (idx !== -1) {
        resultLines.splice(idx + 1, 0, mappingState);
        console.log('State added');
    }
}

// 3. Handlers
if (!content.includes('handleImportClick')) {
    const idx = resultLines.findIndex(l => l.includes('const handleTestConnection = async () => {'));
    if (idx !== -1) {
        resultLines.splice(idx, 0, mappingHandlers);
        console.log('Handlers added');
    }
}

fs.writeFileSync(path, resultLines.join('\n'));
console.log('Done');
