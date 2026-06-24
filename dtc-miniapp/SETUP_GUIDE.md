# DTC 小程序修复指南

## 问题诊断

✅ API 地址正确：`token-plan-cn.xiaomimimo.com`
✅ API Key 有效
✅ 云环境 ID 已配置：`cloudbase-d2gmbzzk6a7f90600`

## 需要手动完成的步骤

### 1. 添加域名白名单（必须）

登录 [微信公众平台](https://mp.weixin.qq.com)：

1. 进入 **开发** → **开发管理** → **开发设置**
2. 找到 **服务器域名** → **request 合法域名**
3. 点击 **修改**，添加：
   ```
   https://token-plan-cn.xiaomimimo.com
   ```
4. 保存并发布

### 2. 创建数据库集合（必须）

在微信公众平台：

1. 进入 **开发** → **云开发**
2. 点击 **数据库**
3. 创建集合：`reports`
4. 设置权限：**所有用户可读写**

### 3. 部署云函数（必须）

使用微信开发者工具：

1. 打开 `dtc-miniapp` 项目
2. 右键点击 `cloudfunctions/analyze` 目录
3. 选择 **上传并部署：云端安装依赖**
4. 等待部署完成

### 4. 测试云函数（可选）

部署后可以测试：

1. 右键点击 `cloudfunctions/analyze`
2. 选择 **云端测试**
3. 输入测试数据：
   ```json
   {
     "test": true
   }
   ```
4. 查看返回结果

## 常见问题

### Q1: 调用云函数报错 "invalid appid"

**原因**：AppID 不匹配
**解决**：确保 `project.config.json` 中的 appid 与微信公众平台一致

### Q2: 调用云函数报错 "cloud function not found"

**原因**：云函数未部署
**解决**：按步骤 3 重新部署

### Q3: API 调用超时

**原因**：网络问题或 API 响应慢
**解决**：
- 检查域名白名单是否正确
- 云函数超时时间默认 20 秒，复杂分析可能需要更长时间

### Q4: 返回 "分析失败"

**原因**：MiMo API 返回格式异常
**解决**：查看云函数日志，在云开发控制台 → 云函数 → analyze → 日志

## 调试命令

在微信开发者工具的调试器中执行：

```javascript
// 测试云函数
wx.cloud.callFunction({
  name: 'analyze',
  data: { test: true },
  success: res => console.log('测试成功:', res),
  fail: err => console.error('测试失败:', err)
})

// 检查云环境
wx.cloud.callFunction({
  name: 'analyze',
  data: { url: 'https://www.gymshark.com' },
  success: res => console.log('分析结果:', res),
  fail: err => console.error('分析失败:', err)
})
```
