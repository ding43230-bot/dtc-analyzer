Page({
  data: {
    url: '',
    loading: false,
    currentStep: 0,
    error: '',
    examples: [
      { name: 'Gymshark', url: 'https://www.gymshark.com', icon: '💪' },
      { name: 'Allbirds', url: 'https://www.allbirds.com', icon: '👟' },
      { name: 'Warby Parker', url: 'https://www.warbyparker.com', icon: '👓' }
    ]
  },

  onLoad: function() {
    // 页面加载
  },

  // 输入变化
  onInputChange: function(e) {
    this.setData({ url: e.detail.value })
  },

  // 使用示例
  useExample: function(e) {
    const url = e.currentTarget.dataset.url
    this.setData({ url })
  },

  // 开始分析
  analyze: function() {
    const { url, loading } = this.data

    if (loading) return

    if (!url) {
      this.showError('请输入网址')
      return
    }

    // 简单验证URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      this.showError('请输入正确的网址（以http://或https://开头）')
      return
    }

    this.setData({ loading: true, currentStep: 1, error: '' })

    // 模拟步骤进度
    setTimeout(() => {
      if (this.data.loading) {
        this.setData({ currentStep: 2 })
      }
    }, 5000)

    wx.cloud.callFunction({
      name: 'analyze',
      data: { url },
      success: (res) => {
        console.log('分析结果:', res)
        if (res.result.success) {
          this.setData({ currentStep: 3 })

          // 保存到本地历史
          this.saveToHistory(url, res.result.reportId, res.result.scores.overall)

          // 跳转到报告页
          setTimeout(() => {
            wx.navigateTo({
              url: `/pages/report/report?id=${res.result.reportId}`
            })
          }, 500)
        } else {
          this.showError(res.result.error || '分析失败')
        }
      },
      fail: (err) => {
        console.error('调用失败:', err)
        console.error('错误详情:', JSON.stringify(err))
        this.showError('云函数调用失败: ' + (err.errMsg || err.message || '未知错误'))
      },
      complete: () => {
        setTimeout(() => {
          this.setData({ loading: false, currentStep: 0 })
        }, 1000)
      }
    })
  },

  // 显示错误
  showError: function(msg) {
    this.setData({ error: msg })
    setTimeout(() => {
      this.setData({ error: '' })
    }, 3000)
  },

  // 隐藏错误
  hideError: function() {
    this.setData({ error: '' })
  },

  // 保存到历史记录
  saveToHistory: function(url, reportId, score) {
    let history = wx.getStorageSync('history') || []

    history.unshift({
      id: reportId,
      url: url,
      score: score,
      time: this.formatTime(new Date())
    })

    history = history.slice(0, 10)
    wx.setStorageSync('history', history)
  },

  // 格式化时间
  formatTime: function(date) {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    return `${month}月${day}日 ${hour}:${minute < 10 ? '0' + minute : minute}`
  }
})
