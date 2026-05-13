import fs from 'fs';

let content = fs.readFileSync('components/DeviceSettings.tsx', 'utf8');

const regexEdit = /const startProcessMappingEdit = \(\) => \{\n\s*setTempProcessMappings\(\[\.\.\.processMappings\]\);\n\s*setIsProcessMappingEditing\(true\);\n\s*\};\n\s*const saveProcessMappingEdit = \(\) => \{\n\s*const newProcessMappings = tempProcessMappings\.map\(\(item, idx\) => \(\{\n\s*\.\.\.item,\n\s*address: processMappings\[idx\]\?\.address \|\| item\.address,\n\s*parameterBit: processMappings\[idx\]\?\.parameterBit \|\| item\.parameterBit,\n\s*\}\)\);\n\s*setProcessMappings\(newProcessMappings\);\n\s*setIsProcessMappingEditing\(false\);\n\s*\};/;

const replacementEdit = `const startProcessMappingEdit = () => {
    const baseLength = formData.processParamLength || 0;
    let totalLength = baseLength;
    if (formData.processReadMethod === '按位讀取') {
      const bitsMatch = formData.processBitLength?.match(/(\\d+)/);
      const bits = bitsMatch ? parseInt(bitsMatch[1], 10) : 16;
      totalLength = baseLength * bits;
    }

    const newTemp = Array.from({ length: totalLength }).map((_, i) => {
      if (processMappings[i]) return processMappings[i];
      let autoAddress = '-';
      let autoBit = '-';
      if (formData.processReadMethod === '按字讀取' && formData.processParamAddress) {
         const match = formData.processParamAddress.match(/^([A-Za-z]+)(\\d+)$/);
         if (match) {
           const prefix = match[1];
           const startNum = parseInt(match[2], 10);
           autoAddress = prefix + (startNum + i);
           autoBit = '0';
         }
      }
      return {
        id: \`empty-\${Date.now()}-\${i}\`,
        name: '',
        description: '',
        function: '',
        channelNumber: '',
        address: autoAddress,
        parameterBit: autoBit,
        parameterType: '',
        dataType: ''
      } as ProcessMappingItem;
    });
    setTempProcessMappings(newTemp);
    setIsProcessMappingEditing(true);
  };
  
  const saveProcessMappingEdit = () => {
    const newProcessMappings = tempProcessMappings.map((item, idx) => {
      let autoAddress = processMappings[idx]?.address || item.address || '-';
      let autoBit = processMappings[idx]?.parameterBit || item.parameterBit || '-';

      if (formData.processReadMethod === '按字讀取' && formData.processParamAddress) {
         const match = formData.processParamAddress.match(/^([A-Za-z]+)(\\d+)$/);
         if (match) {
           const prefix = match[1];
           const startNum = parseInt(match[2], 10);
           autoAddress = prefix + (startNum + idx);
           autoBit = '0';
         }
      }

      return {
        ...item,
        address: autoAddress,
        parameterBit: autoBit,
      };
    });
    setProcessMappings(newProcessMappings);
    setIsProcessMappingEditing(false);
  };`;

content = content.replace(regexEdit, replacementEdit);

fs.writeFileSync('components/DeviceSettings.tsx', content);
console.log("Updated edit mode logic");
