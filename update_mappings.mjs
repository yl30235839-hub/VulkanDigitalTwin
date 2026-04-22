import fs from 'fs';

const path = 'components/DeviceSettings.tsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Add Interface
if (!content.includes('interface AlarmMappingItem')) {
  content = content.replace(
    "} from 'lucide-react';",
    "} from 'lucide-react';\n\ninterface AlarmMappingItem {\n  id: string;\n  address: string;\n  code: string;\n  content: string;\n  severity: 'Low' | 'Medium' | 'High';\n}"
  );
}

// 2. Add State
if (!content.includes('alarmMappings')) {
  content = content.replace(
    'const [tableData, setTableData] = useState<any[]>([]);',
    `const [tableData, setTableData] = useState<any[]>([]);

  // Alarm Mapping States
  const [alarmMappings, setAlarmMappings] = useState<AlarmMappingItem[]>([
    { id: '1', address: 'D100.0', code: 'E001', content: '緊急停止觸發', severity: 'High' },
    { id: '2', address: 'D100.1', code: 'E002', content: '安全門未鎖定', severity: 'High' },
    { id: '3', address: 'D100.2', code: 'W001', content: '氣壓不足警告', severity: 'Medium' },
    { id: '4', address: 'D100.3', code: 'I001', content: '物料低位提示', severity: 'Low' },
  ]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);`
  );
}

// 3. Add Handlers (after useEffect)
if (!content.includes('handleImportClick')) {
  const handlerCode = `
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          // Simple CSV parsing for demonstration (assuming: address,code,content,severity)
          const rows = content.split('\\n').filter(row => row.trim() !== '');
          const newMappings: AlarmMappingItem[] = rows.slice(1).map((row, index) => {
            const parts = row.split(',').map(s => s.trim());
            return {
              id: (alarmMappings.length + index + 1).toString(),
              address: parts[0] || 'N/A',
              code: parts[1] || 'N/A',
              content: parts[2] || 'N/A',
              severity: (parts[3] as any) || 'Low'
            };
          });
          setAlarmMappings([...alarmMappings, ...newMappings]);
          alert('導入成功');
        } catch (err) {
          console.error(err);
          alert('導入失敗，請檢查文件格式');
        }
      };
      reader.readAsText(file);
    }
  };
`;
  content = content.replace('}, [device]);', '}, [device]);' + handlerCode);
}

fs.writeFileSync(path, content);
console.log('Script finish');
