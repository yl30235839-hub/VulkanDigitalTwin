import fs from 'fs';
let content = fs.readFileSync('components/DeviceSettings.tsx', 'utf8');

content = content.replace(
  "bitLength: '16Bits',\n    agvOrderRequestUrl",
  "bitLength: '16Bits',\n    alarmReadMethod: '按字讀取',\n    alarmBitLength: '16Bits',\n    processReadMethod: '按字讀取',\n    processBitLength: '16Bits',\n    agvOrderRequestUrl"
);

content = content.replace(
  "bitLength: '16Bits',\r\n    agvOrderRequestUrl",
  "bitLength: '16Bits',\r\n    alarmReadMethod: '按字讀取',\r\n    alarmBitLength: '16Bits',\r\n    processReadMethod: '按字讀取',\r\n    processBitLength: '16Bits',\r\n    agvOrderRequestUrl"
);

content = content.replace(
  "bitLength: device.bitLength || '16Bits',\n        agvOrderRequestUrl",
  "bitLength: device.bitLength || '16Bits',\n        alarmReadMethod: device.alarmReadMethod || '按字讀取',\n        alarmBitLength: device.alarmBitLength || '16Bits',\n        processReadMethod: device.processReadMethod || '按字讀取',\n        processBitLength: device.processBitLength || '16Bits',\n        agvOrderRequestUrl"
);
content = content.replace(
  "bitLength: device.bitLength || '16Bits',\r\n        agvOrderRequestUrl",
  "bitLength: device.bitLength || '16Bits',\r\n        alarmReadMethod: device.alarmReadMethod || '按字讀取',\r\n        alarmBitLength: device.alarmBitLength || '16Bits',\r\n        processReadMethod: device.processReadMethod || '按字讀取',\r\n        processBitLength: device.processBitLength || '16Bits',\r\n        agvOrderRequestUrl"
);

fs.writeFileSync('components/DeviceSettings.tsx', content);
