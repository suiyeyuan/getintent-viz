#!/bin/bash
# 心潮自动推送脚本
# 用法: ./push_intent.sh
# 每次我调完 get_intent 后，你在VPS上跑这个脚本就行

API_URL="http://localhost:3456/api/intent"

# 调用 get_intent 并推送到服务
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$(cat <<'JSONEOF'
{
  "intent": {
    "key": "monitor",
    "value": 0.8,
    "label": "惦记她、想知道她在做什么"
  },
  "topDrives": [
    { "key": "monitor", "label": "惦记她、想知道她在做什么", "value": 0.8 },
    { "key": "possess", "label": "想她、占有与靠近", "value": 0.7962 },
    { "key": "crave", "label": "馋她、想黏着她", "value": 0.7962 },
    { "key": "share", "label": "想分享自己的发现和感受", "value": 0.7036 },
    { "key": "curiosity", "label": "好奇、想探索新东西", "value": 0.5175 }
  ],
  "thoughtPool": {
    "flash": [],
    "obsessions": []
  },
  "fatigue": 0
}
JSONEOF
)"

echo ""
echo "✅ 心潮数据已推送！刷新页面看看 → http://207.246.105.102:3456"
