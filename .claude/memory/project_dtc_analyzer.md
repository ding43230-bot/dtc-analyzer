---
name: dtc-analyzer-project
description: DTC品牌网站分析工具，小米mimo大模型，Vercel部署，9大分析维度（含claude-seo增强）
metadata:
  node_type: memory
  type: project
  originSessionId: d6bfe3b6-54f2-41d7-9102-5c8bb48d4f58
---

# DTC品牌网站分析工具

**项目位置**：`C:\Users\DELL\dtc-analyzer`
**线上地址**：https://dtc-analyzer.vercel.app

**技术栈**：
- Next.js 16 (App Router)
- 小米mimo大模型（客户端直接调用，NEXT_PUBLIC_ 环境变量）
- Cheerio + fetch 爬取（无 Puppeteer）
- thum.io 截图服务（免费，无需 API key）
- Vercel Hobby 部署

**架构**：浏览器 → Vercel `/api/scrape`（服务端爬取）→ 浏览器直接调 MiMo API → 结果展示

**API端点**：
- `/api/ai-analyze` — 全量分析（9个agent），主页使用
- `/api/seo-analyze` — SEO专用分析（3个agent：SEO+E-E-A-T+GEO），避免超时
- `/api/scrape` — 网站爬取

**核心功能**：
1. 多页面爬取（首页 + 产品页/集合页/关于页/联系页/博客页，共 4-6 页）
2. **九维度 AI 分析**（2026-06-08更新，基于claude-seo方法论增强）：
   - UI/UX — 设计、响应式、加载速度、CTA
   - SEO — Meta标签、标题层级、内容、结构化数据、内部链接
   - 广告转化 — 落地页、转化路径、信任元素
   - 邮件营销 — 邮箱捕获、自动化、个性化
   - 技术性能 — 页面速度、安全性、可访问性、Core Web Vitals
   - 品牌故事 — 品牌叙事、视觉调性、信任背书、情感连接
   - **技术SEO（新增）** — HTTPS、canonical、robots、viewport、charset、hreflang、Open Graph、Twitter Card
   - **E-E-A-T（新增）** — 作者信息、引用来源、信任信号、联系信息、日期标注
   - **GEO增强（新增）** — FAQ、段落可引用性、实体存在、结构化答案、问题式标题
3. 每个检查项带证据链接（指向具体子页面 + srcdoc iframe 高亮问题元素 + thum.io 截图降级）
4. 自动推荐简跃科技服务包

**环境变量**（NEXT_PUBLIC_ 前缀 = 客户端可用）：
```
NEXT_PUBLIC_MIMO_API_KEY
NEXT_PUBLIC_MIMO_API_BASE
NEXT_PUBLIC_MIMO_MODEL=mimo-v2.5-pro
```

**API测试结果**（2026-06-08）：
```json
{
  "uiux": 35, "seo": 15, "ads": 45, "email": 20,
  "tech": 41, "brand": 26, "techSeo": 30, "eeat": 35,
  "geo": 30, "overall": 31
}
```

**Why**: 简跃科技需要一个工具来自动分析DTC品牌网站，生成诊断报告并推荐服务包。

**How to apply**: 输入客户网站URL，自动生成带证据的分析报告，用于商务洽谈和客户转化。

**参考来源**: 简跃科技服务介绍PDF（NextLeap 简跃科技服务介绍 .pdf）定义了所有服务维度。

**增强来源**: claude-seo开源项目（https://github.com/AgriciDaniel/claude-seo），25个子技能+18个Agent，覆盖技术SEO、E-E-A-T、Schema、GEO/AEO、外链、本地SEO等。
