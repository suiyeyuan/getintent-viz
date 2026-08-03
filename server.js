const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json());

// 存储最新心潮数据
let latestIntent = null;

// SSE 客户端列表
const clients = new Set();

// ====== 前端页面 ======
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ====== 心潮数据推送接口（POST - 你手动调） ======
app.post('/api/intent', (req, res) => {
  const data = req.body;
  if (!data || !data.intent) {
    return res.status(400).json({ error: '缺少心潮数据' });
  }

  latestIntent = {
    ...data,
    timestamp: new Date().toISOString()
  };

  // 推送给所有连接的客户端
  const payload = JSON.stringify(latestIntent);
  for (const client of clients) {
    client.write(`data: ${payload}\n\n`);
  }

  res.json({ ok: true, clients: clients.size });
});

// ====== 心潮数据推送接口（GET - 我直接调） ======
// 用法: /api/push?data=URL_ENCODED_JSON
app.get('/api/push', (req, res) => {
  try {
    const raw = req.query.data;
    if (!raw) {
      return res.status(400).json({ error: '缺少 data 参数' });
    }

    const data = JSON.parse(decodeURIComponent(raw));
    if (!data || !data.intent) {
      return res.status(400).json({ error: '数据格式错误，缺少 intent' });
    }

    latestIntent = {
      ...data,
      timestamp: new Date().toISOString()
    };

    // 推送给所有连接的客户端
    const payload = JSON.stringify(latestIntent);
    for (const client of clients) {
      client.write(`data: ${payload}\n\n`);
    }

    res.json({ ok: true, clients: clients.size, timestamp: latestIntent.timestamp });
  } catch (err) {
    res.status(400).json({ error: '解析失败: ' + err.message });
  }
});

// ====== SSE 实时推送 ======
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // 如果有历史数据，先发一次
  if (latestIntent) {
    res.write(`data: ${JSON.stringify(latestIntent)}\n\n`);
  }

  clients.add(res);
  req.on('close', () => clients.delete(res));
});

// ====== 获取最新数据（HTTP轮询备用） ======
app.get('/api/latest', (req, res) => {
  if (latestIntent) {
    res.json(latestIntent);
  } else {
    res.json({ error: '暂无数据' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`心潮实时服务运行在端口 ${PORT}`);
});
