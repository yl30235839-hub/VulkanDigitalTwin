import fs from 'fs';

let content = fs.readFileSync('components/DeviceSettings.tsx', 'utf8');

const regexMap = /\{Array\.from\(\{ length: totalLength \}\)\.map\(\(\_, index\) => \{\n\s*const baseMapping = processMappings\[index\];\n\s*const displayMapping = isProcessMappingEditing \? tempProcessMappings\[index\] : baseMapping;\n\s*return \(\n\s*<tr/;

const replacementMap = `{Array.from({ length: totalLength }).map((_, index) => {
                const baseMapping = processMappings[index];
                const displayMapping = isProcessMappingEditing ? tempProcessMappings[index] : baseMapping;
                
                let autoAddress = baseMapping?.address || '-';
                let autoBit = baseMapping?.parameterBit || '-';

                if (formData.processReadMethod === '按字讀取' && formData.processParamAddress) {
                   const match = formData.processParamAddress.match(/^([A-Za-z]+)(\\d+)$/);
                   if (match) {
                     const prefix = match[1];
                     const startNum = parseInt(match[2], 10);
                     autoAddress = baseMapping?.address || (prefix + (startNum + index));
                     autoBit = baseMapping?.parameterBit || '0';
                   }
                }
                
                return (
                  <tr`;

content = content.replace(regexMap, replacementMap);

// Replace the td values
content = content.replace(
  /<td className="px-6 py-4 text-sm font-mono text-slate-600 bg-slate-50\/50">\{baseMapping\?\.address \|\| '-'\}<\/td>/,
  '<td className="px-6 py-4 text-sm font-mono text-slate-600 bg-slate-50/50">{autoAddress}</td>'
);

content = content.replace(
  /<td className="px-6 py-4 text-sm text-slate-500 bg-slate-50\/50">\{baseMapping\?\.parameterBit \|\| '-'\}<\/td>/,
  '<td className="px-6 py-4 text-sm text-slate-500 bg-slate-50/50">{autoBit}</td>'
);

// We need to fix saveProcessMappingEdit so that it doesn't try to inherit address using processMappings[idx]?.address if it wasn't there before, except that's fine. Wait, previously, `saveProcessMappingEdit` does:
// address: processMappings[idx]?.address || item.address
// If undefined, it took `item.address`.
// But wait, if we only visually generate autoAddress, when editing the map dragging values out of position, does it preserve autoAddress? The instructions say "拖動項目時...'參數地址'和'參數位'保持不變".
// In the current logic:
// `address: processMappings[idx]?.address || item.address`
// `processMappings[idx]` might be undefined or have no address.
// If we are to ensure the new saved processMappings inherit the dynamically generated address for that row, maybe we should update `saveProcessMappingEdit` as well!

fs.writeFileSync('components/DeviceSettings.tsx', content);
