import fs from 'fs';

const filePath = 'components/DeviceSettings.tsx';
let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('Server,') && !content.includes('Truck,')) {
    content = content.replace('Server,', 'Server, Truck,');
    fs.writeFileSync(filePath, content);
    console.log('Added Truck to imports.');
} else {
    console.log('Truck already imported or Server not found.');
}
