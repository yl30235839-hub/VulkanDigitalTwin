import fs from 'fs';

const filePath = 'components/DeviceSettings.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The script to add the AGV Order tab content rendering in the main return statement.
const matchStr = "{activeTab === 'PROCESS_LAYOUT' && (";
const searchIndex = content.lastIndexOf(matchStr);

if (searchIndex !== -1) {
    // Find the end of the block
    let openBraces = 0;
    let foundStart = false;
    let endIndex = -1;
    
    for (let i = searchIndex; i < content.length; i++) {
        if (content[i] === '{') {
            openBraces++;
            foundStart = true;
        } else if (content[i] === '}') {
            openBraces--;
            if (foundStart && openBraces === 0) {
                endIndex = i + 1;
                break;
            }
        }
    }
    
    if (endIndex !== -1) {
        const insert = "\n        {activeTab === 'AGV_ORDER' && renderAGVOrderInfo()}";
        content = content.slice(0, endIndex) + insert + content.slice(endIndex);
        fs.writeFileSync(filePath, content);
        console.log('Successfully inserted AGV order tab content rendering.');
    } else {
        console.error('Could not find the end of PROCESS_LAYOUT block.');
    }
} else {
    console.error('Could not find PROCESS_LAYOUT block.');
}
