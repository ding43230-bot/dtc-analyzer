---
name: project_dtc_miniapp_fix
description: DTC小程序API修复记录，mimo模型reasoning_content问题
metadata: 
  node_type: memory
  type: project
  originSessionId: d1cd8abb-2d87-4dfa-b03c-8c1f87acbd52
---

## DTC小程序API问题

### 问题描述
小程序4个板块（UI/UX、SEO、广告、邮件）均显示"分析失败"。

### 根本原因
mimo-v2.5-pro模型返回的`content`为空，实际内容在`reasoning_content`字段中。

### 解决方案
1. 代码修改：从`reasoning_content`中提取JSON
2. 提示词优化：强制要求只返回JSON格式，不要其他文字

### 关键代码修改
```javascript
// 优先使用content，如果为空则使用reasoning_content
const content = res.choices[0].message.content || res.choices[0].message.reasoning_content || ''

// 如果content中没有找到JSON，尝试从reasoning_content中提取
if (!jsonStr && res.choices[0].message.reasoning_content) {
  const reasoning = res.choices[0].message.reasoning_content
  const reasoningJsonMatch = reasoning.match(/\{[\s\S]*\}/)
  if (reasoningJsonMatch) {
    jsonStr = reasoningJsonMatch[0]
  }
}
```

### 状态
2026-06-04 代码已修改，待用户部署测试。

**Why:** mimo模型的API返回格式与其他模型不同，content可能为空
**How to apply:** 处理mimo模型API响应时，需要同时检查content和reasoning_content