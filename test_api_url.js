const https = require('https');
https.get('https://site-agendamento-7vhl.vercel.app', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const jsFiles = data.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if(jsFiles) {
      https.get('https://site-agendamento-7vhl.vercel.app' + jsFiles[1], res2 => {
        let js = '';
        res2.on('data', chunk => js += chunk);
        res2.on('end', () => {
          const api = js.match(/https?:\/\/[^\s'"`]+/g);
          console.log(api ? api.filter(u => u.includes('api') || u.includes('render') || u.includes('railway')).slice(0,20) : 'no urls');
        });
      });
    }
  });
});
