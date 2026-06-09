'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SEOPage() {
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
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (!scrapeRes.ok) {
        const text = await scrapeRes.text().catch(() => '');
        setError(`爬取失败 (${scrapeRes.status}): ${text.substring(0, 100)}`);
        setLoading(false);
        return;
      }

      const scrapeData = await scrapeRes.json();
      if (!scrapeData.success) {
        setError(scrapeData.error || '网站爬取失败');
        setLoading(false);
        return;
      }

      setProgress('正在进行SEO深度分析...');

      const seoRes = await fetch('/api/seo-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          scrapedData: scrapeData.data,
        }),
      });

      if (!seoRes.ok) {
        const text = await seoRes.text().catch(() => '');
        setError(`SEO分析失败 (${seoRes.status}): ${text.substring(0, 100)}`);
        setLoading(false);
        return;
      }

      const seoData = await seoRes.json();
      setProgress('分析完成，正在生成报告...');

      const reportId = `seo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      try {
        localStorage.setItem(`seo_report_${reportId}`, JSON.stringify({
          id: reportId,
          url: normalizedUrl,
          timestamp: new Date().toISOString(),
          scrapeData: scrapeData.data,
          seoAnalysis: seoData.analysis || seoData,
          scores: seoData.scores,
        }));
      } catch {}

      router.push(`/seo/report/${reportId}`);
    } catch (err: any) {
      setError(`网络错误: ${err?.message || '请检查网络后重试'}`);
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
        <a href="/" className="flex items-center gap-2 no-nowrap">
          <img src="/company-logo.png" alt="NextLeap" className="h-9 w-auto object-contain" />
        </a>

        <div className="flex-1" />

        <div className="flex items-center gap-6">
          <a href="/" className="text-sm text-[#6B7280] hover:text-[#F97316] transition-colors">DTC分析</a>
          <a href="/seo" className="text-sm text-[#F97316] font-semibold">SEO分析</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-[1200px] mx-auto px-[52px] py-[70px] pb-20 grid grid-cols-[44%_56%] gap-12 items-center min-h-[calc(100vh-62px)]">
        {/* LEFT */}
        <div className="flex flex-col gap-6 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full py-1 px-3.5 text-[12.5px] text-[#6B7280] w-fit shadow-[0_1px_4px_rgba(0,0,0,0.07)] font-medium">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            claude-seo 方法论驱动
          </div>

          {/* Title */}
          <h1 className="text-[52px] font-black leading-[1.08] text-[#111827] tracking-[-2px]">
            深度 SEO 分析
            <br />
            <span className="text-[#F97316]">提升搜索排名</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[15px] text-[#6B7280] leading-[1.8] max-w-[430px]">
            基于 claude-seo 方法论，从技术SEO、E-E-A-T、GEO三大维度全面诊断你的网站，获取专业优化建议
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
                placeholder="输入网站URL进行SEO分析"
                className="flex-1 border-none outline-none text-sm text-[#111827] bg-transparent font-normal placeholder:text-[#C0C6D0]"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#F97316] text-white border-none px-4 py-2 rounded-lg text-[13.5px] font-bold cursor-pointer whitespace-nowrap transition-colors hover:bg-[#EA6C0A] shrink-0 disabled:opacity-60"
              >
                {loading ? progress || '分析中...' : '开始分析'}
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
        </div>

        {/* RIGHT: SEO Dashboard Card */}
        <div className="flex justify-end relative animate-slide-in-right delay-200">
          <div className="w-full max-w-[520px] relative">
            <div className="bg-white rounded-[18px] shadow-[0_30px_70px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100">
              {/* Top bar */}
              <div className="bg-[#1F2937] px-4 py-2.5 flex items-center gap-2.5">
                <div className="flex gap-[5px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                </div>
                <span className="text-gray-300 text-[13px] font-semibold ml-2 flex-1">SEO 分析报告</span>
              </div>

              {/* Body */}
              <div className="p-5">
                {/* Score Overview */}
                <div className="flex items-center gap-5 mb-5">
                  <div className="relative">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#F3F4F6" strokeWidth="6"/>
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#F97316" strokeWidth="6"
                        strokeDasharray="214" strokeDashoffset="53"
                        strokeLinecap="round" className="donut-animate" transform="rotate(-90 40 40)"/>
                      <text x="40" y="44" textAnchor="middle" fontSize="20" fontWeight="800" fill="#111827">75</text>
                    </svg>
                    <div className="text-[10px] text-[#9CA3AF] text-center mt-1 font-medium">/ 100</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-bold text-[#111827] mb-3 uppercase tracking-[0.3px]">分析维度</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { name: '技术SEO', value: '82', up: true },
                        { name: 'E-E-A-T', value: '71', up: true },
                        { name: 'GEO优化', value: '65', up: false },
                        { name: '结构化数据', value: '78', up: true },
                      ].map((m) => (
                        <div key={m.name} className="flex justify-between items-center text-[11px]">
                          <span className="text-[#6B7280]">{m.name}</span>
                          <div className="flex items-center gap-1">
                            <span className={m.up ? 'text-[#10B981]' : 'text-[#EF4444]'}>{m.up ? '↑' : '↓'}</span>
                            <span className="font-bold text-[#111827]">{m.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Issue Summary */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="text-[11px] font-bold text-[#111827] mb-3 uppercase tracking-[0.3px]">问题概览</div>
                  <div className="flex gap-3">
                    {[
                      { label: '严重', count: 2, color: 'bg-[#EF4444]' },
                      { label: '警告', count: 5, color: 'bg-[#F97316]' },
                      { label: '通过', count: 12, color: 'bg-[#10B981]' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5 text-[11px]">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="font-bold text-[#111827]">{item.count}</span>
                        <span className="text-[#6B7280]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Meta标签', value: '通过', ok: true },
                      { label: 'Canonical', value: '缺失', ok: false },
                      { label: '结构化数据', value: '部分', ok: false },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <div className="text-[10px] text-[#9CA3AF] mb-1">{s.label}</div>
                        <div className={`text-[11px] font-bold ${s.ok ? 'text-[#10B981]' : 'text-[#F97316]'}`}>{s.value}</div>
                      </div>
                    ))}
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
          <h2 className="text-3xl font-bold text-[#111827] tracking-tight text-center mb-3">三大分析维度</h2>
          <p className="text-[#6B7280] text-center max-w-xl mx-auto mb-12">基于 claude-seo 方法论，全方位诊断你的网站SEO表现</p>

          <div className="grid grid-cols-3 gap-5">
            {[
              {
                title: '技术SEO',
                desc: 'HTTPS、canonical、robots、viewport、hreflang、Open Graph等12项检查',
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              },
              {
                title: 'E-E-A-T 评估',
                desc: '作者信息、引用来源、信任信号、专业性、经验性全面评估',
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              },
              {
                title: 'GEO 优化',
                desc: 'FAQ检测、段落可引用性、实体存在、AI搜索引擎适配分析',
                svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
              },
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
