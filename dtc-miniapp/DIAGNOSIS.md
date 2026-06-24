# 问题诊断指南

## 常见问题及解决方案

### 1. 云函数未部署（最常见）

**症状**：调用云函数报错 "cloud function not found"

**解决**：
1. 打开微信开发者工具
2. 右键点击 `cloudfunctions/analyze` 目录
3. 选择 **上传并部署：云端安装依赖**
4. 等待部署完成（约30秒）

### 2. 域名白名单未添加

**症状**：API调用失败，网络请求被阻止

**解决**：
1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入 **开发** → **开发管理** → **开发设置**
3. 找到 **服务器域名** → **request 合法域名**
4. 点击 **修改**，添加：
   ```
   https://token-plan-cn.xiaomimimo.com
   ```
5. 保存并发布

### 3. 数据库集合未创建

**症状**：数据写入失败

**解决**：
1. 在微信公众平台，进入 **开发** → **云开发**
2. 点击 **数据库**
3. 创建集合：`reports`
4. 设置权限：**所有用户可读写**

### 4. 云函数超时（新问题）

**症状**：调用云函数超时，返回错误

**原因**：串行调用4个AI，每个约10秒，总计约40秒，可能超过默认20秒超时

**解决**：
1. 在微信公众平台，进入 **开发** → **云开发**
2. 点击 **云函数** → `analyze`
3. 点击 **函数配置**
4. 将 **超时时间** 改为 **60秒**
5. 保存

### 5. MiMo API调用失败

**症状**：返回 "分析失败" 或 "API调用失败"

**解决**：
1. 检查API Key是否有效
2. 检查网络连接
3. 查看云函数日志：
   - 云开发控制台 → 云函数 → analyze → 日志

## 快速检查清单

- [ ] 云函数已部署
- [ ] 域名白名单已添加
- [ ] 数据库集合已创建
- [ ] 云函数超时时间已调整为60秒
- [ ] 小程序已重新编译

## 调试步骤

### 步骤1：测试云函数是否部署

在微信开发者工具的调试器中执行：

```javascript
wx.cloud.callFunction({
  name: 'analyze',
  data: { test: true },
  success: res => console.log('✅ 云函数正常:', res),
  fail: err => console.error('❌ 云函数调用失败:', err)
})
```

### 步骤2：测试真实分析

```javascript
wx.cloud.callFunction({
  name: 'analyze',
  data: { url: 'https://www.gymshark.com' },
  success: res => {
    console.log('✅ 分析成功:', res)
    if (res.result.success) {
      console.log('报告ID:', res.result.reportId)
      console.log('总分:', res.result.scores.overall)
    } else {
      console.error('❌ 分析失败:', res.result.error)
    }
  },
  fail: err => console.error('❌ 调用失败:', err)
})
```

### 步骤3：查看云函数日志

1. 云开发控制台 → 云函数 → analyze → 日志
2. 查看最近的调用记录
3. 检查是否有错误信息

## 如果还是不行

请提供以下信息：
1. 调用云函数时的错误信息
2. 云函数日志中的错误详情
3. 是否已完成上述检查清单
