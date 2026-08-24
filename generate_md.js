const fs = require('fs');
const path = require('path');

const EXCLUDED_DIRS = ['.git', 'node_modules', 'build', 'dist', 'public', '.env', '.DS_Store'];
const ALLOWED_EXTS = ['.js', '.jsx', '.json', '.sql', '.css', '.html', '.bat', '.env.example'];

function shouldProcess(fileOrDir) {
  for (const exclude of EXCLUDED_DIRS) {
    if (fileOrDir.includes(exclude) || fileOrDir === exclude) return false;
  }
  return true;
}

function traverseDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!shouldProcess(file)) continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (shouldProcess(filePath)) {
         traverseDir(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (ALLOWED_EXTS.includes(ext)) {
        if (!file.includes('package-lock.json')) {
            fileList.push(filePath);
        }
      }
    }
  }
  return fileList;
}

const rootDir = __dirname;
let allFiles = traverseDir(rootDir);

let markdown = '# Código Fonte - Site Agendamento\n\n';

for (const file of allFiles) {
  if (file === __filename || file.endsWith('source_code.md')) continue;
  
  let content = '';
  try {
    content = fs.readFileSync(file, 'utf-8');
  } catch (e) {
    continue;
  }
  const relativePath = path.relative(rootDir, file);
  
  markdown += `## ${relativePath}\n\n`;
  let lang = path.extname(file).replace('.', '');
  if (lang === 'jsx') lang = 'jsx';
  if (lang === 'js') lang = 'javascript';
  markdown += '```' + lang + '\n';
  markdown += content + '\n';
  markdown += '```\n\n';
}

fs.writeFileSync('source_code.md', markdown);
console.log('Source code written to source_code.md, total files: ' + (allFiles.length - 1));
