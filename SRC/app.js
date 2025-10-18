const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000; // 서버를 실행할 포트

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Servers가 http://localhost:${PORT} 에서 실행 중.`);
});