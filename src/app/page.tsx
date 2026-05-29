'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url) {
      setError('请输入网站URL');
      return;
    }

    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setError('请输入有效的网站URL');
      return;
    }

    setLoading(true);
    setProgress('正在爬取网站数据...');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      setProgress('正在生成分析报告...');

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        setError(`服务器错误 (${response.status}): ${text.substring(0, 100)}`);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        if (data.cached) setProgress('使用缓存结果...');
        try {
          const reportKey = `report_${data.reportId}`;
          localStorage.setItem(reportKey, JSON.stringify({
            id: data.reportId,
            url: normalizedUrl,
            timestamp: new Date().toISOString(),
            scores: data.analysis?.scores || {},
            recommendations: data.recommendations || [],
            analysis: data.analysis || {},
          }));
        } catch {}
        router.push(data.reportUrl);
      } else {
        setError(data.error || '分析失败，请重试');
        setLoading(false);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('分析超时，请稍后重试（网站可能响应较慢）');
      } else {
        setError(`网络错误: ${err?.message || '请检查网络后重试'}`);
      }
      setLoading(false);
    }
  };

  const exampleUrls = [
    'https://www.allbirds.com',
    'https://www.glossier.com',
    'https://www.awaytravel.com',
    'https://www.rothys.com',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {/* ── NAVBAR ── */}
      <nav className="bg-white border-b border-gray-200 h-[62px] flex items-center px-[52px] sticky top-0 z-50 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <a href="/" className="flex items-center gap-2 font-extrabold text-[15px] text-[#111827] no-nowrap tracking-[-0.3px]">
          <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
            <path d="M1 10 L5 5 L9 13 L13 2 L17 15 L21 7 L25 11 L29 10"
                  stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          简跃科技
        </a>

        <div className="flex-1" />

        <span className="text-xs text-[#9CA3AF] font-medium tracking-wide">DTC品牌网站分析工具</span>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-[1200px] mx-auto px-[52px] py-[70px] pb-20 grid grid-cols-[44%_56%] gap-12 items-center min-h-[calc(100vh-62px)]">
        {/* LEFT */}
        <div className="flex flex-col gap-6 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full py-1 px-3.5 text-[12.5px] text-[#6B7280] w-fit shadow-[0_1px_4px_rgba(0,0,0,0.07)] font-medium">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
            </svg>
            AI 驱动的网站诊断
          </div>

          {/* Title */}
          <h1 className="text-[52px] font-black leading-[1.08] text-[#111827] tracking-[-2px]">
            让你的 DTC 品牌网站
            <br />
            <span className="text-[#F97316]">脱颖而出</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[15px] text-[#6B7280] leading-[1.8] max-w-[430px]">
            输入网址，AI 自动分析网站在 UI/UX、SEO、广告转化、邮件营销四大维度的表现，获取专业优化建议
          </p>

          {/* Search Box */}
          <form onSubmit={handleSubmit}>
            <div className="flex items-center bg-white border-[1.5px] border-gray-200 rounded-[11px] p-1.5 pl-3.5 max-w-[440px] shadow-[0_2px_10px_rgba(0,0,0,0.07)] transition-all focus-within:border-[#F97316] focus-within:shadow-[0_2px_14px_rgba(249,115,22,0.18)]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2.5 shrink-0">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="网站网址"
                className="flex-1 border-none outline-none text-sm text-[#111827] bg-transparent font-normal placeholder:text-[#C0C6D0]"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#F97316] text-white border-none px-4 py-2 rounded-lg text-[13.5px] font-bold cursor-pointer whitespace-nowrap transition-colors hover:bg-[#EA6C0A] shrink-0 disabled:opacity-60"
              >
                {loading ? progress || '分析中...' : '免费分析'}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-500 ml-1">{error}</p>}
          </form>

          {/* Example URLs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-400">试试：</span>
            {exampleUrls.map((u) => (
              <button
                key={u}
                onClick={() => setUrl(u)}
                className="px-3 py-1 text-sm text-[#6B7280] bg-white rounded-lg border border-gray-200 hover:border-[#F97316] hover:text-[#F97316] transition-colors cursor-pointer"
              >
                {u.replace('https://www.', '')}
              </button>
            ))}
          </div>

          {/* Trust Row */}
          <div className="flex items-center gap-0 mt-2">
            <div className="flex items-center">
              {['A', 'B', 'C', 'D', 'E'].map((letter, i) => (
                <div
                  key={letter}
                  className="w-[33px] h-[33px] rounded-full border-[2.5px] border-white -mr-2.5 flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{
                    background: [
                      'linear-gradient(135deg,#667eea,#764ba2)',
                      'linear-gradient(135deg,#f093fb,#f5576c)',
                      'linear-gradient(135deg,#4facfe,#00f2fe)',
                      'linear-gradient(135deg,#43e97b,#38f9d7)',
                      'linear-gradient(135deg,#fa709a,#fee140)',
                    ][i],
                    zIndex: 5 - i,
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="ml-[18px]">
              <div className="text-[#FBBF24] text-[13px] tracking-[1.5px]">★★★★★</div>
              <div className="text-[13px] font-bold text-[#111827] mt-0.5">超过 10,000 名用户信赖</div>
              <div className="text-[11.5px] text-[#9CA3AF]">DTC品牌卖家和营销机构</div>
            </div>
          </div>
        </div>

        {/* RIGHT: Dashboard Card */}
        <div className="flex justify-end relative animate-slide-in-right delay-200">
          <div className="w-full max-w-[570px] relative">
            <div className="dashboard-card bg-white rounded-[18px] shadow-[0_30px_70px_rgba(0,0,0,0.18),0_8px_24px_rgba(0,0,0,0.1)] overflow-hidden">

              {/* Top bar */}
              <div className="bg-[#1F2937] px-4 py-2.5 flex items-center gap-2.5">
                <div className="flex gap-[5px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                </div>
                <span className="text-gray-300 text-[13px] font-semibold ml-2 flex-1">DTC 分析报告</span>
                <div className="flex gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </div>
              </div>

              {/* Body */}
              <div className="flex h-[420px]">
                {/* Sidebar */}
                <div className="w-[46px] bg-[#111827] flex flex-col items-center py-3.5 gap-1.5 shrink-0">
                  {[
                    { active: true, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
                    { active: false, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg> },
                    { active: false, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
                    { active: false, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
                    { active: false, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> },
                    { active: false, svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg> },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                        item.active
                          ? 'bg-[#F97316] text-white'
                          : 'text-[#6B7280] hover:bg-[#374151] hover:text-gray-300'
                      }`}
                    >
                      {item.svg}
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 bg-gray-100 overflow-y-auto p-2.5 flex flex-col gap-2">
                  {/* Row 1: Site Overview + Page Group Insights */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Site Overview */}
                    <div className="bg-white rounded-[10px] p-3 border border-[#EFEFEF] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-[11px] font-extrabold text-[#111827] tracking-[-0.2px]">Site Overview</div>
                          <div className="text-[9.5px] text-[#9CA3AF] mt-px">example.com</div>
                        </div>
                        <a href="#" className="text-[9px] text-[#C0C6D0] no-underline whitespace-nowrap mt-0.5 hover:text-[#F97316]">Summary &gt;</a>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-[54px] h-[38px] rounded-md shrink-0 bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                        </div>
                        <div className="ml-auto text-center">
                          <div className="text-[8px] text-[#9CA3AF] font-semibold uppercase tracking-[0.3px] mb-0.5">SEO Score</div>
                          <svg width="46" height="46" viewBox="0 0 46 46">
                            <circle cx="23" cy="23" r="18" fill="none" stroke="#F3F4F6" strokeWidth="4.5"/>
                            <circle cx="23" cy="23" r="18" fill="none" stroke="#F97316" strokeWidth="4.5"
                              strokeDasharray="113" strokeDashoffset="28"
                              strokeLinecap="round"
                              className="donut-animate"
                              transform="rotate(-90 23 23)"/>
                            <text x="23" y="27" textAnchor="middle" fontSize="9" fontWeight="800" fill="#111827">75</text>
                          </svg>
                          <div className="text-[10px] font-extrabold text-[#111827] mt-0.5">/ 100</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {[
                          { name: 'UI/UX', value: '82', up: true },
                          { name: 'SEO', value: '75', up: true },
                          { name: '广告转化', value: '68', up: false },
                          { name: '邮件营销', value: '45', up: false },
                        ].map((m) => (
                          <div key={m.name} className="flex justify-between items-center py-0.5 border-b border-[#F9FAFB] last:border-0 text-[9.5px]">
                            <span className="text-[#6B7280]">{m.name}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#111827]">
                                <span className={m.up ? 'text-[#10B981] text-[9px]' : 'text-[#EF4444] text-[9px]'}>{m.up ? '↑' : '↓'}</span> {m.value}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Page Group Insights */}
                    <div className="bg-white rounded-[10px] p-3 border border-[#EFEFEF] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[11px] font-extrabold text-[#111827] tracking-[-0.2px]">分析维度</div>
                        <a href="#" className="text-[9px] text-[#C0C6D0] no-underline whitespace-nowrap hover:text-[#F97316]">View report &gt;</a>
                      </div>

                      {/* UI/UX */}
                      <div className="mb-2">
                        <div className="text-[10px] font-bold text-[#111827] mb-1.5">UI/UX 设计</div>
                        <div className="flex items-start gap-2">
                          <div className="shrink-0 text-center">
                            <div className="text-[7.5px] text-[#9CA3AF] font-semibold uppercase tracking-[0.2px] mb-px">Score</div>
                            <svg width="38" height="38" viewBox="0 0 38 38">
                              <circle cx="19" cy="19" r="14" fill="none" stroke="#F3F4F6" strokeWidth="4"/>
                              <circle cx="19" cy="19" r="14" fill="none" stroke="#10B981" strokeWidth="4"
                                strokeDasharray="88" strokeDashoffset="16"
                                strokeLinecap="round" className="donut-animate" transform="rotate(-90 19 19)"/>
                              <text x="19" y="23" textAnchor="middle" fontSize="8" fontWeight="800" fill="#111827">82</text>
                            </svg>
                            <div className="text-[9px] font-extrabold text-[#111827] mt-0.5">/100</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-[8px] font-bold text-[#6B7280] uppercase tracking-[0.4px] mb-1">Top Issues</div>
                            <div className="text-[8.5px] text-[#4B5563] leading-[1.45] mb-0.5 flex items-start gap-1">
                              <span className="text-[#EF4444] text-[7px] mt-[2.5px] shrink-0">●</span>移动端按钮太小
                            </div>
                            <div className="text-[8.5px] text-[#4B5563] leading-[1.45] mb-0.5 flex items-start gap-1">
                              <span className="text-[#EF4444] text-[7px] mt-[2.5px] shrink-0">●</span>首屏加载较慢
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SEO */}
                      <div>
                        <div className="text-[10px] font-bold text-[#111827] mb-1.5">SEO 优化</div>
                        <div className="flex items-start gap-2">
                          <div className="shrink-0 text-center">
                            <div className="text-[7.5px] text-[#9CA3AF] font-semibold uppercase tracking-[0.2px] mb-px">Score</div>
                            <svg width="38" height="38" viewBox="0 0 38 38">
                              <circle cx="19" cy="19" r="14" fill="none" stroke="#F3F4F6" strokeWidth="4"/>
                              <circle cx="19" cy="19" r="14" fill="none" stroke="#F97316" strokeWidth="4"
                                strokeDasharray="88" strokeDashoffset="22"
                                strokeLinecap="round" className="donut-animate" transform="rotate(-90 19 19)"/>
                              <text x="19" y="23" textAnchor="middle" fontSize="8" fontWeight="800" fill="#111827">75</text>
                            </svg>
                            <div className="text-[9px] font-extrabold text-[#111827] mt-0.5">/100</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-[8px] font-bold text-[#6B7280] uppercase tracking-[0.4px] mb-1">Top Issues</div>
                            <div className="text-[8.5px] text-[#4B5563] leading-[1.45] mb-0.5 flex items-start gap-1">
                              <span className="text-[#EF4444] text-[7px] mt-[2.5px] shrink-0">●</span>Meta描述缺失
                            </div>
                            <div className="text-[8.5px] text-[#4B5563] leading-[1.45] mb-0.5 flex items-start gap-1">
                              <span className="text-[#EF4444] text-[7px] mt-[2.5px] shrink-0">●</span>结构化数据不足
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Backlinks + Top Keywords */}
                  <div className="grid grid-cols-[1.15fr_0.85fr] gap-2">
                    {/* Conversion Overview */}
                    <div className="bg-white rounded-[10px] p-3 border border-[#EFEFEF] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[11px] font-extrabold text-[#111827] tracking-[-0.2px]">转化分析</div>
                        <a href="#" className="text-[9px] text-[#C0C6D0] no-underline whitespace-nowrap hover:text-[#F97316]">View report &gt;</a>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        {[
                          { label: 'CTA 得分', value: '72', up: true },
                          { label: '信任指数', value: '58', up: false },
                          { label: '转化路径', value: '65', up: true },
                        ].map((m) => (
                          <div key={m.label} className="text-[9px]">
                            <div className="text-[#9CA3AF] mb-0.5 font-medium">{m.label}</div>
                            <div className="font-extrabold text-xs text-[#111827] flex items-center gap-0.5">
                              <span className={m.up ? 'text-[#10B981] text-[9px]' : 'text-[#EF4444] text-[9px]'}>{m.up ? '↑' : '↓'}</span>
                              {m.value}
                              <span className="text-[9px] font-medium text-[#9CA3AF]">/100</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Sparkline */}
                      <svg width="100%" height="56" viewBox="0 0 220 56" preserveAspectRatio="none">
                        <line x1="0" y1="14" x2="220" y2="14" stroke="#F0F0F0" strokeWidth="1"/>
                        <line x1="0" y1="28" x2="220" y2="28" stroke="#F0F0F0" strokeWidth="1"/>
                        <line x1="0" y1="42" x2="220" y2="42" stroke="#F0F0F0" strokeWidth="1"/>
                        <path d="M0,42 C20,40 35,38 55,30 C75,22 90,20 110,26 C130,32 145,18 165,14 C185,10 200,16 220,12 L220,56 L0,56 Z" fill="rgba(249,115,22,0.1)"/>
                        <path d="M0,42 C20,40 35,38 55,30 C75,22 90,20 110,26 C130,32 145,18 165,14 C185,10 200,16 220,12" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>

                    {/* Issues Summary */}
                    <div className="bg-white rounded-[10px] p-3 border border-[#EFEFEF] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-[11px] font-extrabold text-[#111827] tracking-[-0.2px]">问题汇总</div>
                          <div className="text-[9.5px] text-[#9CA3AF] mt-px">按严重程度</div>
                        </div>
                        <a href="#" className="text-[9px] text-[#C0C6D0] no-underline whitespace-nowrap mt-0.5 hover:text-[#F97316]">View &gt;</a>
                      </div>
                      <div className="flex flex-col gap-[3px] mb-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                          <div className="w-[9px] h-[9px] rounded-[2.5px] shrink-0 bg-[#EF4444]" />
                          <span className="font-extrabold text-[#EF4444]">3</span>
                          <span className="text-[#6B7280] font-medium">严重问题</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                          <div className="w-[9px] h-[9px] rounded-[2.5px] shrink-0 bg-[#F97316]" />
                          <span className="font-extrabold text-[#F97316]">5</span>
                          <span className="text-[#6B7280] font-medium">警告</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                          <div className="w-[9px] h-[9px] rounded-[2.5px] shrink-0 bg-[#111827]" />
                          <span className="font-extrabold text-[#111827]">8</span>
                          <span className="text-[#6B7280] font-medium">通过</span>
                        </div>
                      </div>
                      <table className="w-full border-collapse text-[9px]">
                        <thead>
                          <tr>
                            <th className="text-left py-[3px] px-[5px] text-[#9CA3AF] text-[8px] font-bold uppercase tracking-[0.3px] border-b border-[#F0F0F0]">#</th>
                            <th className="text-left py-[3px] px-[5px] text-[#9CA3AF] text-[8px] font-bold uppercase tracking-[0.3px] border-b border-[#F0F0F0]">问题</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td className="py-[3.5px] px-[5px] text-[#374151] border-b border-[#F9FAFB] text-[#9CA3AF] font-semibold">1</td><td className="py-[3.5px] px-[5px] text-[#374151] border-b border-[#F9FAFB]">Meta描述缺失</td></tr>
                          <tr><td className="py-[3.5px] px-[5px] text-[#374151] border-b border-[#F9FAFB] text-[#9CA3AF] font-semibold">2</td><td className="py-[3.5px] px-[5px] text-[#374151] border-b border-[#F9FAFB]">移动端适配差</td></tr>
                          <tr><td className="py-[3.5px] px-[5px] text-[#374151] border-b border-[#F9FAFB] text-[#9CA3AF] font-semibold">3</td><td className="py-[3.5px] px-[5px] text-[#374151] border-b border-[#F9FAFB]">CTA不明显</td></tr>
                          <tr><td className="py-[3.5px] px-[5px] text-[#374151] text-[#9CA3AF] font-semibold">4</td><td className="py-[3.5px] px-[5px] text-[#374151]">缺少邮件订阅</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="border-t border-gray-200 bg-white py-20">
        <div className="max-w-[1200px] mx-auto px-[52px]">
          <h2 className="text-3xl font-bold text-[#111827] tracking-tight text-center mb-3">全方位诊断</h2>
          <p className="text-[#6B7280] text-center max-w-xl mx-auto mb-12">从设计体验到营销转化，一站式发现网站的所有问题</p>

          <div className="grid grid-cols-4 gap-5">
            {[
              { title: 'UI/UX 分析', desc: '页面设计、用户体验、响应式布局和加载速度', svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
              { title: 'SEO/GEO 分析', desc: 'Meta标签、关键词、结构化数据和AI搜索优化', svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
              { title: '广告转化分析', desc: '落地页质量、CTA设计、转化路径和信任元素', svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
              { title: '邮件营销分析', desc: '订阅入口、邮件捕获机制和自动化流程', svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> },
            ].map((f, i) => (
              <div key={f.title} className="bg-[#F8F9FA] rounded-xl p-6 border border-gray-100 hover:border-[#F97316] hover:shadow-md transition-all cursor-default animate-fade-in-up" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center mb-4">{f.svg}</div>
                <h3 className="font-semibold text-[#111827] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 py-5 bg-white">
        <div className="max-w-[1200px] mx-auto px-[52px] flex items-center justify-between">
          <p className="text-xs text-[#9CA3AF]">DTC品牌网站分析工具</p>
          <p className="text-xs text-[#9CA3AF]">© 2024 简跃科技 NextLeap Business</p>
        </div>
      </footer>
    </div>
  );
}
