const cloud = require('wx-server-sdk')
const http = require('http')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const MIMO_API_KEY = 'tp-cv59ptcxss837h9wl8xdm92riacjkggpp0m45m9m27al48d0'
const MIMO_API_BASE = 'https://token-plan-cn.xiaomimimo.com/v1'
const MIMO_MODEL = 'mimo-v2.5-pro'

// HTTP请求
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https')
    const client = isHttps ? https : http
    const urlObj = new URL(url)

    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 30000
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (options.json) {
          try { resolve(JSON.parse(data)) } catch (e) { resolve(data) }
        } else {
          resolve(data)
        }
      })
    })

    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    req.end()
  })
}

// 爬取首页（极简）
async function scrapeHomepage(url) {
  try {
    const html = await httpRequest(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || ''
    const desc = (html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i) || [])[1] || ''

    return {
      url,
      title: title.trim().substring(0, 60),
      desc: desc.trim().substring(0, 100),
      content: html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500)
    }
  } catch (e) {
    return { url, title: '', desc: '', content: '' }
  }
}

// 调用API
async function callAPI(prompt) {
  const url = `${MIMO_API_BASE}/chat/completions`
  const body = JSON.stringify({
    model: MIMO_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000
  })

  console.log('调用API，请求大小:', body.length)

  try {
    const res = await httpRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIMO_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      },
      body,
      json: true,
      timeout: 45000
    })

    console.log('API响应:', JSON.stringify(res).substring(0, 200))

    if (!res || !res.choices || !res.choices[0]) {
      console.error('API响应格式错误')
      return null
    }

    // 优先使用content，如果为空则使用reasoning_content
    const content = res.choices[0].message.content || res.choices[0].message.reasoning_content || ''
    console.log('AI返回content:', res.choices[0].message.content?.substring(0, 100))
    console.log('AI返回reasoning:', res.choices[0].message.reasoning_content?.substring(0, 100))
    console.log('最终使用:', content.substring(0, 150))

    if (!content) {
      console.error('AI返回空内容')
      return null
    }

    // 提取JSON（支持 ```json ... ``` 格式，也支持直接JSON）
    let jsonStr = ''

    // 先尝试从content中提取
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
      console.log('从代码块提取JSON')
    } else {
      // 尝试匹配完整的JSON对象（支持嵌套）
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
        console.log('直接提取JSON')
      }
    }

    // 如果content中没有找到JSON，尝试从reasoning_content中提取
    if (!jsonStr && res.choices[0].message.reasoning_content) {
      const reasoning = res.choices[0].message.reasoning_content
      const reasoningJsonMatch = reasoning.match(/\{[\s\S]*\}/)
      if (reasoningJsonMatch) {
        jsonStr = reasoningJsonMatch[0]
        console.log('从reasoning_content提取JSON')
      }
    }

    console.log('提取的JSON:', jsonStr.substring(0, 150))

    if (!jsonStr || !jsonStr.includes('{')) {
      console.error('未找到JSON，原始内容:', content.substring(0, 100))
      return null
    }

    try {
      const result = JSON.parse(jsonStr.replace(/,\s*([\]}])/g, '$1'))
      console.log('解析成功:', result.score)
      return result
    } catch (e) {
      console.error('JSON解析失败:', e.message, '内容:', jsonStr.substring(0, 150))
      return null
    }
  } catch (e) {
    console.error('API调用失败:', e.message)
    return null
  }
}

// 分析函数（并行调用2个维度）
async function analyze(data) {
  const s = `网站：${data.url}\n标题：${data.title}\n描述：${data.desc}\n内容：${data.content}`

  const prompts = {
    uiux: `UI/UX专家评分0-100。${s}\n返回JSON:{"score":0,"summary":"","checks":[{"label":"","score":0,"feedback":""}],"issues":[],"suggestions":[]}`,
    seo: `SEO专家评分0-100。${s}\n返回JSON:{"score":0,"summary":"","checks":[{"label":"","score":0,"feedback":""}],"issues":[],"suggestions":[]}`,
    ads: `广告专家评分0-100。${s}\n返回JSON:{"score":0,"summary":"","checks":[{"label":"","score":0,"feedback":""}],"issues":[],"suggestions":[]}`,
    email: `邮件专家评分0-100。${s}\n返回JSON:{"score":0,"summary":"","checks":[{"label":"","score":0,"feedback":""}],"issues":[],"suggestions":[]}`
  }

  // 并行调用2个维度
  console.log('并行分析 uiux 和 seo...')
  const [uiux, seo] = await Promise.all([
    callAPI(prompts.uiux).then(r => r || { score: 50, summary: '分析失败', checks: [], issues: [], suggestions: [] }),
    callAPI(prompts.seo).then(r => r || { score: 50, summary: '分析失败', checks: [], issues: [], suggestions: [] })
  ])
  console.log('uiux seo 完成:', uiux.score, seo.score)

  console.log('并行分析 ads 和 email...')
  const [ads, email] = await Promise.all([
    callAPI(prompts.ads).then(r => r || { score: 50, summary: '分析失败', checks: [], issues: [], suggestions: [] }),
    callAPI(prompts.email).then(r => r || { score: 50, summary: '分析失败', checks: [], issues: [], suggestions: [] })
  ])
  console.log('ads email 完成:', ads.score, email.score)

  return { uiux, seo, ads, email }
}

// 主函数
exports.main = async (event, context) => {
  const { url, test } = event

  // 测试模式
  if (test) {
    console.log('测试API...')
    try {
      const result = await callAPI('你好，返回JSON:{"status":"ok"}')
      console.log('测试结果:', result)
      return { success: true, result }
    } catch (e) {
      console.error('测试失败:', e)
      return { success: false, error: e.message }
    }
  }

  if (!url) return { success: false, error: '请提供网址' }

  context.callbackWaitsForEmptyEventLoop = false

  try {
    console.log('爬取...')
    const data = await scrapeHomepage(url)
    console.log('爬取完成:', data.title)

    const s = `${data.url} ${data.title} ${data.content.substring(0, 200)}`

    // 一次调用返回4个维度
    console.log('分析中...')
    const prompt = `你是网站分析专家。根据以下信息，直接返回JSON格式评分，不要任何其他文字。

网站：${data.url}
标题：${data.title}
内容：${data.content.substring(0, 150)}

直接返回这个JSON，不要markdown，不要解释：
{"uiux":{"score":80,"summary":"好","checks":[],"issues":[]},"seo":{"score":70,"summary":"一般","checks":[],"issues":[]},"ads":{"score":60,"summary":"待改进","checks":[],"issues":[]},"email":{"score":50,"summary":"差","checks":[],"issues":[]}}`

    const result = await callAPI(prompt)
    console.log('分析完成')

    const uiux = result?.uiux || { score: 50, summary: '分析失败', checks: [], issues: [], suggestions: [] }
    const seo = result?.seo || { score: 50, summary: '分析失败', checks: [], issues: [], suggestions: [] }
    const ads = result?.ads || { score: 50, summary: '分析失败', checks: [], issues: [], suggestions: [] }
    const email = result?.email || { score: 50, summary: '分析失败', checks: [], issues: [], suggestions: [] }

    const overall = Math.round((uiux.score + seo.score + ads.score + email.score) / 4)

    const db = cloud.database()
    const dbResult = await db.collection('reports').add({
      data: {
        url,
        timestamp: db.serverDate(),
        scores: { uiux: uiux.score, seo: seo.score, ads: ads.score, email: email.score, overall },
        analysis: { uiux, seo, ads, email },
        pages: []
      }
    })

    return {
      success: true,
      reportId: dbResult._id,
      scores: { uiux: uiux.score, seo: seo.score, ads: ads.score, email: email.score, overall },
      analysis: { uiux, seo, ads, email },
      pages: []
    }
  } catch (e) {
    console.error('失败:', e)
    return { success: false, error: e.message }
  }
}
