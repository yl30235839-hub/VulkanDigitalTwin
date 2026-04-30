import fs from 'fs';
let content = fs.readFileSync('components/LineManagement.tsx', 'utf8');

const regex = /\n\s*\/\/\s*調用指定的 API.*\n\s*const response = await api\.post\([\s\S]*?\}\);/m;

const replacement = `
      // 原因分析：由於在 C# (ASP.NET Core) 等後端框架中，如果 API 參數未加上 [FromBody] 屬性，
      // 默認可能會嘗試從 Form Data 中綁定參數。當我們發送 application/json 的 { project: ... } 時，
      // 後端模型綁定可能無法識別，導致接收到的字符串為空。或者後端本身期望 FormData 格式。
      // 解決方案：為了兼容這兩種情況，將請求負載改為 FormData 格式，保證後端能正確解析名為 "project" 的參數。
      const formData = new FormData();
      formData.append('project', jsonString);
      
      // 調用指定的 API 地址加載工廠項目
      const response = await api.post(\`\${backendDomain}/api/Factory/LoadProject\`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });`;

content = content.replace(regex, replacement);

// Additionally clear file input value so that selecting the same file again works
const cleanRegex = /      \/\/ 解析其文檔内容/;
if(content.includes('      // 解析其文檔内容')) {
   content = content.replace(cleanRegex, `      if (event.target) event.target.value = '';\n      // 解析其文檔内容`);
}

fs.writeFileSync('components/LineManagement.tsx', content);
