import fs from 'fs';

let content = fs.readFileSync('components/DeviceSettings.tsx', 'utf8');

// 1. Add selectedScheduleItem state
content = content.replace(
  /\/\/ Local Form State/,
  `// Schedule Layout State
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<string | null>(null);

  // Local Form State`
);

// 2. Change the mapping for schedule items to be selectable and drop the input/button
content = content.replace(
  /<div key=\{mapping\.id\} className="border border-slate-200 rounded-lg p-4 bg-white hover:border-indigo-300 transition-colors shadow-sm flex flex-col justify-between h-full">([\s\S]*?)<\/div>\n                      \}\)\)/,
  `<button 
                          key={mapping.id} 
                          onClick={() => setSelectedScheduleItem(mapping.id)}
                          className={\`text-left border rounded-lg p-4 transition-colors shadow-sm flex flex-col justify-between h-full \${
                            selectedScheduleItem === mapping.id
                              ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-white hover:border-indigo-300'
                          }\`}
                        >
                          <div className="flex items-start mb-2">
                            <div className={\`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs mr-3 shrink-0 \${
                               selectedScheduleItem === mapping.id
                                 ? 'bg-indigo-600 text-white border-indigo-700'
                                 : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                            }\`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className={\`text-sm font-medium \${selectedScheduleItem === mapping.id ? 'text-indigo-900' : 'text-slate-800'}\`}>排產任務節點</p>
                              <p className={\`text-xs font-mono mt-1 break-all \${selectedScheduleItem === mapping.id ? 'text-indigo-700' : 'text-slate-500'}\`}>地址: {mapping.address} | 位: {mapping.parameterBit}</p>
                            </div>
                          </div>
                        </button>
                      ))`
);

fs.writeFileSync('components/DeviceSettings.tsx', content);
console.log('Update script completed successfully.');
