Page({
  data: {
    report: null,
    loading: true,
    error: null,
    expanded: {
      uiux: true,
      seo: false,
      ads: false,
      email: false
    }
  },

  onLoad: function(options) {
    if (options.id) {
      this.loadReport(options.id)
    } else {
      this.setData({
        loading: false,
        error: '报告ID不存在'
      })
    }
  },

  // 加载报告
  loadReport: function(reportId) {
    const db = wx.cloud.database()

    db.collection('reports').doc(reportId).get({
      success: (res) => {
        console.log('报告数据:', JSON.stringify(res.data).substring(0, 500))
        console.log('UI/UX数据:', JSON.stringify(res.data.analysis?.uiux).substring(0, 300))
        console.log('UI/UX checks:', res.data.analysis?.uiux?.checks?.length)
        this.setData({
          report: res.data,
          loading: false
        })
      },
      fail: (err) => {
        console.error('加载失败:', err)
        this.setData({
          loading: false,
          error: '报告加载失败'
        })
      }
    })
  },

  // 展开/收起板块
  toggleSection: function(e) {
    const key = e.currentTarget.dataset.key
    const expanded = { ...this.data.expanded }
    expanded[key] = !expanded[key]
    this.setData({ expanded })
  },

  // 分析其他网站
  analyzeAnother: function() {
    wx.navigateBack({
      delta: 1
    })
  },

  // 返回首页
  goBack: function() {
    wx.navigateBack({
      delta: 1
    })
  },

  // 分享报告
  onShareAppMessage: function() {
    const { report } = this.data
    if (report) {
      return {
        title: `DTC网站分析报告 - ${report.url}`,
        path: `/pages/report/report?id=${report._id}`
      }
    }
    return {
      title: 'DTC网站分析工具',
      path: '/pages/index/index'
    }
  }
})
