import fs from 'fs';
const path = 'components/DeviceSettings.tsx';
let content = fs.readFileSync(path, 'utf-8');

const mappingInterface = `interface AlarmMappingItem {
  id: string;
  address: string;
  code: string;
  content: string;
  severity: 'Low' | 'Medium' | 'High';
}`;

if (!content.includes('interface AlarmMappingItem')) {
    content = content.replace(/interface\s+DeviceSettingsProps/, (m) => mappingInterface + "\n\n" + m);
}

const mappingState = `
  // Alarm Mapping States
  const [alarmMappings, setAlarmMappings] = useState<AlarmMappingItem[]>([
    { id: '1', address: 'D100.0', code: 'E001', content: '緊急停止觸發', severity: 'High' },
    { id: '2', address: 'D100.1', code: 'E002', content: '安全門未鎖定', severity: 'High' },
    { id: '3', address: 'D100.2', code: 'W001', content: '氣壓不足警告', severity: 'Medium' },
    { id: '4', address: 'D100.3', code: 'I001', content: '物料低位提示', severity: 'Low' },
  ]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);`;

if (!content.includes('alarmMappings')) {
    content = content.replace(/const\s+\[isTesting,\s+setIsTesting\]\s+=\s+useState\(false\);/, (match) => match + mappingState);
}

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

if (!content.includes('handleImportClick')) {
    content = content.replace(/const\s+handleTestConnection\s+=\s+async\s+\(\)\s+=>\s+\{/, (m) => mappingHandlers + "\n\n" + m);
}

fs.writeFileSync(path, content);
console.log('Robust script finish');
