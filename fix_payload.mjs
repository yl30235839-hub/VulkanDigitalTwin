import fs from 'fs';

let content = fs.readFileSync('components/DeviceSettings.tsx', 'utf8');

const regex = /processParamLength: formData\.processParamLength,\s*agvOrderRequestUrl: formData\.agvOrderRequestUrl,/;
const repl = "processParamLength: formData.processParamLength,\n          alarmReadMethod: formData.alarmReadMethod,\n          alarmBitLength: formData.alarmBitLength,\n          processReadMethod: formData.processReadMethod,\n          processBitLength: formData.processBitLength,\n          agvOrderRequestUrl: formData.agvOrderRequestUrl,";

content = content.replace(regex, repl);
fs.writeFileSync('components/DeviceSettings.tsx', content);
console.log("Success payload fix");
