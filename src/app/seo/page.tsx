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
      // Scrape
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

      // SEO Analysis
      const seoRes = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          homepage: scrapeData.data.homepage,
          pages: scrapeData.data.pages,
          analysisType: 'seo',
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
          seoAnalysis: seoData,
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
    <div className="min-h-screen flex flex-col bg-[#0F172A]">
      {/* NAVBAR */}
      <nav className="bg-[#1E293B] border-b border-[#334155] h-[62px] flex items-center px-[52px] sticky top-0 z-50">
        <a href="/" className="flex items-center gap-2 no-underline">
          <img src="/company-logo.png" alt="NextLeap" className="h-9 w-auto object-contain" />
        </a>

        <div className="flex-1" />

        <div className="flex items-center gap-6">
          <a href="/" className="text-sm text-[#94A3B8] hover:text-white transition-colors">DTC分析</a>
          <a href="/seo" className="text-sm text-[#F97316] font-semibold">SEO分析</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-[1200px] mx-auto px-[52px] py-[80px] text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#1E293B] border border-[#334155] rounded-full py-1.5 px-4 text-[13px] text-[#F97316] mb-6 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/>
            <path d="m19 9-5 5-4-4-3 3"/>
          </svg>
          claude-seo 方法论驱动
        </div>

        {/* Title */}
        <h1 className="text-[56px] font-black leading-[1.1] text-white tracking-[-2px] mb-6">
          深度 SEO 分析
          <br />
          <span className="text-[#F97316]">提升搜索排名</span>
        </h1>

        {/* Subtitle */}
        <p className="text-[17px] text-[#94A3B8] leading-[1.8] max-w-[600px] mx-auto mb-10">
          基于 claude-seo 方法论，从技术SEO、E-E-A-T、GEO三大维度全面诊断你的网站，获取专业优化建议
        </p>

        {/* Search Box */}
        <form onSubmit={handleSubmit} className="max-w-[560px] mx-auto">
          <div className="flex items-center bg-[#1E293B] border-[1.5px] border-[#334155] rounded-[14px] p-2 pl-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all focus-within:border-[#F97316] focus-within:shadow-[0_4px_30px_rgba(249,115,22,0.2)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 shrink-0">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="输入网站URL进行SEO分析"
              className="flex-1 border-none outline-none text-[15px] text-white bg-transparent font-normal placeholder:text-[#475569]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#F97316] text-white border-none px-6 py-3 rounded-[10px] text-[14px] font-bold cursor-pointer whitespace-nowrap transition-all hover:bg-[#EA6C0A] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] shrink-0 disabled:opacity-60"
            >
              {loading ? progress || '分析中...' : '开始分析'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </form>

        {/* Example URLs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <span className="text-sm text-[#64748B]">试试：</span>
          {exampleUrls.map((u) => (
            <button
              key={u}
              onClick={() => setUrl(u)}
              className="px-4 py-2 text-sm text-[#94A3B8] bg-[#1E293B] rounded-lg border border-[#334155] hover:border-[#F97316] hover:text-[#F97316] transition-colors cursor-pointer"
            >
              {u.replace('https://www.', '')}
            </button>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mt-[80px] max-w-[900px] mx-auto">
          {[
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              ),
              title: '技术SEO',
              desc: 'HTTPS、canonical、robots、viewport、结构化数据等12项检查',
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
              title: 'E-E-A-T',
              desc: '作者信息、引用来源、信任信号、专业性评估',
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
              ),
              title: 'GEO优化',
              desc: 'FAQ检测、段落可引用性、实体存在、AI搜索引擎适配',
            },
          ].map((f, i) => (
            <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-[16px] p-6 text-left hover:border-[#F97316] transition-colors">
              <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-[17px] font-bold text-white mb-2">{f.title}</h3>
              <p className="text-[14px] text-[#94A3B8] leading-[1.6]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
