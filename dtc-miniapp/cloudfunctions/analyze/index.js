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
      timeout: options.timeout || 25000
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

// 重试机制
async function withRetry(fn, maxRetries = 2, delay = 1000) {
  let lastError
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (i < maxRetries) {
        console.log(`重试 ${i + 1}/${maxRetries}...`)
        await new Promise(r => setTimeout(r, delay * (i + 1)))
      }
    }
  }
  throw lastError
}

// 爬取网页（增强版）
async function scrapeHomepage(url) {
  try {
    const html = await httpRequest(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })

    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || ''
    const desc = (html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i) || [])[1] || ''
    const h1s = []
    const h1Matches = html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)
    for (const match of h1Matches) {
      h1s.push(match[1].replace(/<[^>]*>/g, '').trim())
    }
    const h2s = []
    const h2Matches = html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)
    for (const match of h2Matches) {
      h2s.push(match[1].replace(/<[^>]*>/g, '').trim())
    }
    const images = html.match(/<img[^>]*>/gi) || []
    const hasEmailInput = /<input[^>]*type=["']?email["']?[^>]*>/i.test(html) ||
                          /<input[^>]*name=["']?email["']?[^>]*>/i.test(html)
    const content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // 提取更多SEO信息
    const canonical = (html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*>/i) || [])[1] || ''
    const ogTitle = (html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i) || [])[1] || ''
    const ogDesc = (html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i) || [])[1] || ''
    const hasViewport = /<meta[^>]*name="viewport"[^>]*>/i.test(html)
    const hasCharset = /<meta[^>]*charset[^>]*>/i.test(html)
    const hasHttps = url.startsWith('https')

    // 提取结构化数据
    const hasJsonLd = /<script[^>]*type="application\/ld\+json"[^>]*>/i.test(html)

    // 提取CTA按钮
    const ctaButtons = (html.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || []).length

    return {
      url,
      title: title.trim().substring(0, 100),
      desc: desc.trim().substring(0, 200),
      h1s: h1s.slice(0, 5),
      h2s: h2s.slice(0, 10),
      imagesCount: images.length,
      hasEmailInput,
      content: content.substring(0, 2000),
      seo: {
        canonical,
        ogTitle: ogTitle.substring(0, 100),
        ogDesc: ogDesc.substring(0, 200),
        hasViewport,
        hasCharset,
        hasHttps,
        hasJsonLd,
        ctaButtons
      }
    }
  } catch (e) {
    console.error('爬取失败:', e.message)
    return {
      url,
      title: '',
      desc: '',
      h1s: [],
      h2s: [],
      imagesCount: 0,
      hasEmailInput: false,
      content: '',
      seo: {
        canonical: '',
        ogTitle: '',
        ogDesc: '',
        hasViewport: false,
        hasCharset: false,
        hasHttps: false,
        hasJsonLd: false,
        ctaButtons: 0
      }
    }
  }
}

// 调用AI API（带重试）
async function callAI(systemPrompt, userPrompt) {
  const url = `${MIMO_API_BASE}/chat/completions`
  const body = JSON.stringify({
    model: MIMO_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: 2000
  })

  return withRetry(async () => {
    console.log('调用API...')

    const res = await httpRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIMO_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      },
      body,
      json: true,
      timeout: 20000
    })

    console.log('API响应收到')

    if (!res || !res.choices || !res.choices[0]) {
      console.error('API响应格式错误:', JSON.stringify(res).substring(0, 200))
      throw new Error('API响应格式错误')
    }

    const content = res.choices[0].message.content || ''
    const reasoning = res.choices[0].message.reasoning_content || ''

    console.log('content长度:', content.length)
    console.log('reasoning长度:', reasoning.length)

    const finalContent = content || reasoning

    if (!finalContent) {
      throw new Error('AI返回空内容')
    }

    return finalContent
  })
}

// 解析AI响应
function parseAIResponse(raw) {
  if (!raw) return null

  let jsonStr = ''

  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim()
  } else {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }
  }

  console.log('提取的JSON:', jsonStr.substring(0, 200))

  if (!jsonStr || !jsonStr.includes('{')) {
    console.error('未找到JSON')
    return null
  }

  try {
    const fixedJson = jsonStr.replace(/,\s*([\]}])/g, '$1')
    const result = JSON.parse(fixedJson)
    console.log('解析成功')
    return result
  } catch (e) {
    console.error('JSON解析失败:', e.message)
    return null
  }
}

// 串行分析函数（避免超时）
async function analyzeSequentially(url, data) {
  const results = {}

  // 1. UI/UX分析
  console.log('开始UI/UX分析...')
  const uiuxPrompt = `你是一个UI/UX设计专家。分析这个网站的用户体验设计。

网站信息：
- URL: ${url}
- 标题: ${data.title}
- 描述: ${data.desc}
- H1标签: ${data.h1s.join(', ')}
- H2标签: ${data.h2s.slice(0, 5).join(', ')}
- 图片数量: ${data.imagesCount}
- 内容预览: ${data.content.substring(0, 500)}

请返回JSON格式：
{
  "score": 0-100的分数,
  "summary": "整体评价",
  "checks": [
    {
      "label": "检查项名称",
      "score": 0-100,
      "feedback": "具体反馈",
      "suggestion": "改进建议"
    }
  ],
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}`

  try {
    const uiuxRaw = await callAI('你是UI/UX设计专家', uiuxPrompt)
    results.uiux = parseAIResponse(uiuxRaw) || {
      score: 60,
      summary: '分析失败，使用默认分数',
      checks: [],
      issues: ['无法完成分析'],
      suggestions: ['请稍后重试']
    }
  } catch (e) {
    console.error('UI/UX分析失败:', e.message)
    results.uiux = {
      score: 60,
      summary: '分析失败，使用默认分数',
      checks: [],
      issues: ['无法完成分析'],
      suggestions: ['请稍后重试']
    }
  }

  // 2. SEO分析
  console.log('开始SEO分析...')
  const seoPrompt = `你是一个SEO专家。分析这个网站的搜索引擎优化。

网站信息：
- URL: ${url}
- 标题: ${data.title}
- 描述: ${data.desc}
- H1标签: ${data.h1s.join(', ')}
- H2标签: ${data.h2s.slice(0, 5).join(', ')}
- Canonical: ${data.seo.canonical}
- OG标题: ${data.seo.ogTitle}
- OG描述: ${data.seo.ogDesc}
- Viewport: ${data.seo.hasViewport}
- Charset: ${data.seo.hasCharset}
- HTTPS: ${data.seo.hasHttps}
- JSON-LD: ${data.seo.hasJsonLd}

请返回JSON格式：
{
  "score": 0-100的分数,
  "summary": "整体评价",
  "checks": [
    {
      "label": "检查项名称",
      "score": 0-100,
      "feedback": "具体反馈",
      "suggestion": "改进建议"
    }
  ],
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}`

  try {
    const seoRaw = await callAI('你是SEO专家', seoPrompt)
    results.seo = parseAIResponse(seoRaw) || {
      score: 60,
      summary: '分析失败，使用默认分数',
      checks: [],
      issues: ['无法完成分析'],
      suggestions: ['请稍后重试']
    }
  } catch (e) {
    console.error('SEO分析失败:', e.message)
    results.seo = {
      score: 60,
      summary: '分析失败，使用默认分数',
      checks: [],
      issues: ['无法完成分析'],
      suggestions: ['请稍后重试']
    }
  }

  // 3. 广告转化分析
  console.log('开始广告转化分析...')
  const adsPrompt = `你是一个转化率优化（CRO）专家。分析这个网站的广告转化能力。

网站信息：
- URL: ${url}
- 标题: ${data.title}
- 描述: ${data.desc}
- CTA按钮数量: ${data.seo.ctaButtons}
- 内容预览: ${data.content.substring(0, 500)}

请返回JSON格式：
{
  "score": 0-100的分数,
  "summary": "整体评价",
  "checks": [
    {
      "label": "检查项名称",
      "score": 0-100,
      "feedback": "具体反馈",
      "suggestion": "改进建议"
    }
  ],
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}`

  try {
    const adsRaw = await callAI('你是CRO专家', adsPrompt)
    results.ads = parseAIResponse(adsRaw) || {
      score: 60,
      summary: '分析失败，使用默认分数',
      checks: [],
      issues: ['无法完成分析'],
      suggestions: ['请稍后重试']
    }
  } catch (e) {
    console.error('广告转化分析失败:', e.message)
    results.ads = {
      score: 60,
      summary: '分析失败，使用默认分数',
      checks: [],
      issues: ['无法完成分析'],
      suggestions: ['请稍后重试']
    }
  }

  // 4. 邮件营销分析
  console.log('开始邮件营销分析...')
  const emailPrompt = `你是一个邮件营销专家。分析这个网站的邮件营销策略。

网站信息：
- URL: ${url}
- 标题: ${data.title}
- 有邮箱输入框: ${data.hasEmailInput}
- 内容预览: ${data.content.substring(0, 500)}

请返回JSON格式：
{
  "score": 0-100的分数,
  "summary": "整体评价",
  "checks": [
    {
      "label": "检查项名称",
      "score": 0-100,
      "feedback": "具体反馈",
      "suggestion": "改进建议"
    }
  ],
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}`

  try {
    const emailRaw = await callAI('你是邮件营销专家', emailPrompt)
    results.email = parseAIResponse(emailRaw) || {
      score: 60,
      summary: '分析失败，使用默认分数',
      checks: [],
      issues: ['无法完成分析'],
      suggestions: ['请稍后重试']
    }
  } catch (e) {
    console.error('邮件营销分析失败:', e.message)
    results.email = {
      score: 60,
      summary: '分析失败，使用默认分数',
      checks: [],
      issues: ['无法完成分析'],
      suggestions: ['请稍后重试']
    }
  }

  return results
}

// 主函数
exports.main = async (event, context) => {
  const { url, test } = event

  console.log('云函数被调用，参数:', { url, test })

  // 测试模式
  if (test) {
    console.log('测试模式')
    try {
      const result = await callAI('你是一个助手', '返回JSON:{"status":"ok"}')
      const parsed = parseAIResponse(result)
      console.log('测试结果:', parsed)
      return { success: true, result: parsed }
    } catch (e) {
      console.error('测试失败:', e)
      return { success: false, error: e.message }
    }
  }

  if (!url) {
    console.log('未提供URL')
    return { success: false, error: '请提供网址' }
  }

  context.callbackWaitsForEmptyEventLoop = false

  try {
    console.log('开始爬取:', url)
    const data = await scrapeHomepage(url)
    console.log('爬取完成:', data.title)

    // 串行调用AI分析（避免超时）
    console.log('开始AI分析（串行模式）...')
    const analysis = await analyzeSequentially(url, data)
    console.log('AI分析完成')

    // 计算总分
    const overall = Math.round(
      (analysis.uiux.score + analysis.seo.score + analysis.ads.score + analysis.email.score) / 4
    )

    console.log('写入数据库...')
    const db = cloud.database()
    const dbResult = await db.collection('reports').add({
      data: {
        url,
        timestamp: db.serverDate(),
        scores: {
          uiux: analysis.uiux.score,
          seo: analysis.seo.score,
          ads: analysis.ads.score,
          email: analysis.email.score,
          overall
        },
        analysis,
        pages: [{ type: 'homepage', title: data.title, url }]
      }
    })
    console.log('数据库写入成功，ID:', dbResult._id)

    return {
      success: true,
      reportId: dbResult._id,
      scores: {
        uiux: analysis.uiux.score,
        seo: analysis.seo.score,
        ads: analysis.ads.score,
        email: analysis.email.score,
        overall
      },
      analysis,
      pages: [{ type: 'homepage', title: data.title, url }]
    }
  } catch (e) {
    console.error('失败:', e.message)
    console.error('错误堆栈:', e.stack)
    return { success: false, error: e.message }
  }
}
