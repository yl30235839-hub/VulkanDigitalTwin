import fs from 'fs';

let content = fs.readFileSync('components/DeviceSettings.tsx', 'utf8');

// fix draggable and drop preventDefault
content = content.replace(
  /draggable=\{isProcessMappingEditing && displayMapping \? true : undefined\}/g,
  'draggable={isProcessMappingEditing && !!displayMapping ? true : false}'
);

content = content.replace(
  /onDrop=\{\(\) => isProcessMappingEditing && handleDropProcess\(index\)\}/g,
  'onDrop={(e) => { e.preventDefault(); if (isProcessMappingEditing) handleDropProcess(index); }}'
);

// Optional: fix the swap vs insert logic? Wait, standard drag and drop list is insert. But in a fixed length array with empty slots, maybe they just want to swap if they drop on an empty slot?
// No, insert is fine, because when dragging down, items shift up. It's standard.

// Wait, the prompt says "可以拖動的部分僅爲“參數名稱”、“參數描述”、“參數功能”、“上料流道編號”、“參數類型”、“數據類型”；表示上述信息為綁定狀態；"
// To make only those parts draggable, and keep Address and ParameterBit fixed, we should apply draggable to a wrapper DIV inside those TDs or we just let the TR be draggable but explain it?
// Actually, if we apply draggable={...} to the whole TR, the browser ghosts the whole TR. Is that the issue? 
// The prompt is likely just reiterating that the "Address" and "Parameter Bit" columns do not move. They are "bound" to the row index, not to the data. Our logic already ensures this! But just in case, maybe they don't want the visual ghost to include those two cells? That's not possible without complex HTML5 drag images, which is overkill. They just want the LOGICAL behavior (which we implemented).

fs.writeFileSync('components/DeviceSettings.tsx', content);
console.log("Fixed drag and drop UI issues");
