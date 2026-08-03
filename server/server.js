const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'xinchao-default-token';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 内存存储最新心潮数据
let latestIntent = {
  intent: { key: '—', value: 0, label: '等待中…' },
  topDrives: [],
  thoughtPool: { flash: [], obsessions: [] },
  fatigue: -1,
  satisfiedDrives: [],
  updatedAt: null
};

// 前端轮询 GET
app.get('/api/intent', (req, res) => {
  res.json(latestIntent);
});

// 久推送数据 POST
app.post('/api/intent', (req, res) => {
  const token = req.headers['authorization'];
  if (token !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  latestIntent = {
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json({ ok: true });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`心潮服务运行在 http://0.0.0.0:${PORT}`);
});
