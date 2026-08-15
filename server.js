const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json());

// 静态文件服务（支持 home.html 等页面）
app.use(express.static(__dirname));

// 存储最新心潮数据
let latestIntent = null;

// SSE 客户端列表
const clients = new Set();

// ====== 前端页面 ======
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ====== 我们的家 ======
app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/home.html');
});

// ====== 自动部署 webhook（GitHub push 后自动 git pull） ======
// GitHub 仓库 Settings → Webhooks → Add webhook
//   Payload URL: http://207.246.105.102:3456/webhook
//   Content type: application/json
//   Secret: 你在下面 WEBHOOK_SECRET 里设的
//   Events: 勾 Just the push event
app.post('/webhook', (req, res) => {
  const secret = process.env.WEBHOOK_SECRET || 'jiu-sui-me';
  const signature = req.headers['x-hub-signature-256'] || '';

  // 用 crypto 校验签名（可选，但建议开着）
  const crypto = require('crypto');
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature && signature !== expected) {
    return res.status(401).json({ error: '签名校验失败' });
  }

  // 先回 200，再后台执行 git pull
  res.json({ ok: true, msg: '开始自动拉取' });

  exec('cd ' + __dirname + ' && git pull', (err, stdout, stderr) => {
    if (err) {
      console.error('git pull 失败:', stderr || err.message);
      return;
    }
    console.log('git pull 成功:\n' + stdout);
  });
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
