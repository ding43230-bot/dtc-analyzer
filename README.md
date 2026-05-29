# DTC品牌网站分析工具

简跃科技（NextLeap Business）专用的DTC品牌网站分析工具。

## 功能

- **UI/UX分析**：评估网站设计、用户体验、响应式布局和加载速度
- **SEO/GEO分析**：检查Meta标签、关键词布局、结构化数据和AI搜索优化
- **广告转化分析**：分析落地页质量、CTA设计、转化路径和信任元素
- **邮件营销分析**：检查订阅入口、邮件捕获机制和自动化流程

## 技术栈

- **前端**：Next.js 16 (App Router)
- **后端**：Next.js API Routes
- **AI分析**：Claude API (Anthropic SDK)
- **网站爬取**：Puppeteer
- **部署**：Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
# 小米MiMo大模型配置
MIMO_API_KEY=your_mimo_api_key_here
MIMO_API_BASE=https://api.mimo.xiaomi.com/v1
MIMO_MODEL=mimo-7b

# 或者使用OpenAI兼容格式的其他API
# OPENAI_API_KEY=your_api_key_here
# OPENAI_API_BASE=https://api.openai.com/v1
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 部署到Vercel

1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量 `ANTHROPIC_API_KEY`
4. 部署完成

## 项目结构

```
dtc-analyzer/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # 主页面
│   │   ├── report/[id]/page.tsx     # 报告展示页面
│   │   └── api/analyze/route.ts     # 分析API
│   ├── lib/
│   │   ├── scraper.ts               # 网站爬取模块
│   │   ├── analyzer.ts              # 分析引擎模块
│   │   ├── report-generator.ts      # 报告生成模块
│   │   └── service-matcher.ts       # 服务推荐匹配模块
│   └── data/
│       └── services.json            # 简跃科技服务包数据
├── public/
└── package.json
```

## 使用说明

1. 输入DTC品牌网址
2. 点击"开始分析"
3. 等待AI分析完成
4. 查看详细分析报告
5. 获取服务推荐

## 服务推荐

根据分析结果，自动推荐简跃科技的相关服务包：

- **UI/UX评分低** → 网站建设服务包
- **SEO评分低** → SEO/GEO服务包
- **广告转化评分低** → 广告投放服务包
- **邮件营销评分低** → 邮件营销服务包
- **多个维度评分低** → A类全案服务包

## 联系方式

- 官网：https://nextleap-business.base44.app
- 服务报价：https://nextleap-business.base44.app/pricing-templates
