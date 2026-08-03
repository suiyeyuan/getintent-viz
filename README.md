# 心潮 · get_intent 可视化界面

实时展示久的意图、驱动力、思绪和疲劳值。

## 使用

打开 [https://suiyeyuan.github.io/getintent-viz](https://suiyeyuan.github.io/getintent-viz)

## 说明

当前为界面原型，展示 get_intent 工具返回的数据结构。

## 数据字段

| 字段 | 说明 |
|------|------|
| `intent` | 当前主要意图（key / value / label） |
| `topDrives` | 驱动力排行（key / label / value） |
| `thoughtPool.flash` | 闪念思绪 |
| `thoughtPool.obsessions` | 执念思绪 |
| `fatigue` | 疲劳值（0-1） |
| `satisfiedDrives` | 已满足的驱动力列表 |
