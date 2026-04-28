import fs from 'fs';

let content = fs.readFileSync('components/DeviceSettings.tsx', 'utf8');

const regex = /                <\/div>\s*\)\}\s*className="w-full px-4 py-2\.5[\s\S]*?onChange=\{\(e\) => setFormData\(\{\.\.\.formData, bitLength: e\.target\.value\}\s*<div className="mt-8 flex flex-col md:flex-row items-center gap-4">/;

const match = content.match(regex);
if (match) {
  content = content.replace(regex, '                </div>\n              )}\n              <div className="mt-8 flex flex-col md:flex-row items-center gap-4">');
  fs.writeFileSync('components/DeviceSettings.tsx', content);
  console.log("SUCCESS");
} else {
  console.log("REGEX FAILED");
}
