---
name: feedback_vercel_deployment
description: Vercel部署踩坑经验总结
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c2ffe301-7603-4ca4-b8ff-33cf1fabe862
---

## Vercel部署关键教训（2026-06-09）

### 必须满足的条件
1. **GitHub仓库必须Public** → Vercel无法读取私有仓库，构建根本不会启动（0ms UNKNOWN状态）
2. **Git邮箱必须匹配** → commit author email必须与GitHub账号邮箱一致，否则Vercel拒绝部署
3. **API超时限制** → Vercel免费版serverless函数超时60秒，9个AI agent并行分析必然超时

### 超时解决方案
- 新建专用API端点（如`/api/seo-analyze`），只跑需要的agent
- 不要在单个serverless函数中跑太多AI调用

### UI一致性原则
- 新页面必须与现有页面风格统一（浅色/深色主题一致）
- 导航栏、Footer、卡片样式保持一致

**Why:** 部署过程反复踩坑，浪费大量时间
**How to apply:** 部署Vercel项目前先检查：仓库Public？邮箱匹配？函数超时？
