import fs from 'fs';
let content = fs.readFileSync('components/DeviceSettings.tsx', 'utf8');

const strToFind1 = `)} \n                        className="w-full px-4 py-2.5`;
const strToFind2 = `)} \r\n                        className="w-full px-4 py-2.5`;
const strToFind3 = `)} \n                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" `;

let startIdx = content.indexOf(strToFind1);
if (startIdx === -1) startIdx = content.indexOf(strToFind2);
if (startIdx === -1) startIdx = content.indexOf(`)} \n                        className="w-full`);
if (startIdx === -1) startIdx = content.indexOf(`)} \r\n                        className="w-full`);


console.log("Start text index:", startIdx);

if (startIdx !== -1) {
  const endMarker = '              <div className="mt-8 flex flex-col md:flex-row items-center gap-4">';
  const endIdx = content.indexOf(endMarker, startIdx);
  if (endIdx !== -1) {
    const toRemove = content.substring(startIdx, endIdx);
    content = content.replace(toRemove, '');
    fs.writeFileSync('components/DeviceSettings.tsx', content);
    console.log("Success");
  } else {
    console.log("End marker not found");
  }
} else {
  console.log("Start marker not found");
}

