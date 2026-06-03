# DTC网站分析小程序

## 项目结构

```
dtc-miniapp/
├── cloudfunctions/          # 云函数
│   └── analyze/             # 分析云函数
│       ├── index.js         # 主逻辑
│       └── package.json     # 依赖
├── miniprogram/             # 小程序前端
│   ├── pages/
│   │   ├── index/           # 首页
│   │   └── report/          # 报告页
│   ├── app.js               # 应用入口
│   ├── app.json             # 应用配置
│   └── app.wxss             # 全局样式
└── project.config.json      # 项目配置
```

## 配置步骤

### 1. 登录微信公众平台

访问 https://mp.weixin.qq.com，使用你的小程序账号登录。

### 2. 获取云开发环境ID

1. 在微信公众平台，进入 **开发** → **云开发**
2. 开通云开发服务
3. 创建一个环境（选择免费套餐）
4. 记录 **环境ID**（例如：`dtc-analyzer-xxx`）

### 3. 修改配置文件

#### 修改 `miniprogram/app.js`

```javascript
wx.cloud.init({
  env: 'your-env-id', // 替换为你的云开发环境ID
  traceUser: true,
})
```

#### 修改 `cloudfunctions/analyze/index.js`

如果需要更换 mimo API key，修改第 6 行：
```javascript
const MIMO_API_KEY = 'your-api-key'
```

### 4. 创建云数据库集合

在云开发控制台，创建以下集合：
- `reports`（存储分析报告）

### 5. 部署云函数

1. 使用微信开发者工具打开 `dtc-miniapp` 目录
2. 右键点击 `cloudfunctions/analyze` 目录
3. 选择 **上传并部署：云端安装依赖**

### 6. 运行小程序

1. 在微信开发者工具中编译
2. 预览或真机调试

## 功能说明

### 首页
- 输入网站URL
- 点击开始分析
- 查看历史记录

### 报告页
- 显示综合评分
- 四维度分数（UI/UX、SEO、广告、邮件）
- 每个维度的详细检查项
- 发现的问题和建议

## 注意事项

1. **云开发环境ID**：必须替换为你自己的环境ID
2. **API Key**：mimo API key 已配置，如需更换请修改云函数
3. **数据库权限**：确保 `reports` 集合的权限设置为所有用户可读写
4. **域名白名单**：如果遇到网络请求失败，检查小程序后台的域名配置

## 后续优化

- [ ] 用户登录和历史记录同步
- [ ] 报告分享功能
- [ ] 服务推荐（简跃科技）
- [ ] 证据截图功能
- [ ] 多页面深度分析
