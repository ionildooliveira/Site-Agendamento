const fs = require('fs');
const { marked } = require('marked');

const markdown = fs.readFileSync('source_code.md', 'utf8');

const htmlContent = marked.parse(markdown);

const finalHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Código Fonte - Site Agendamento</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            color: #333;
        }
        pre {
            background-color: #f4f4f4;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            overflow-x: auto;
            page-break-inside: avoid;
        }
        code {
            font-family: Consolas, "Courier New", Courier, monospace;
            font-size: 14px;
        }
        h2 {
            border-bottom: 2px solid #ddd;
            padding-bottom: 5px;
            margin-top: 30px;
        }
        @media print {
            body { margin: 0; }
            h2 { page-break-after: avoid; }
            pre { page-break-inside: avoid; border: none; background: transparent; }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

fs.writeFileSync('codigo_fonte.html', finalHtml);
console.log('HTML gerado com sucesso em codigo_fonte.html');
