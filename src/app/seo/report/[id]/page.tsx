'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { gsap, ScrollTrigger } from '@/lib/gsap';

interface SEOReport {
  id: string;
  url: string;
  timestamp: string;
  scrapeData: any;
  seoAnalysis: any;
  scores?: any;
}

export default function SEOReportPage() {
  const params = useParams();
  const [report, setReport] = useState<SEOReport | null>(null);
  const [loading, setLoading] = useState(true);

  // GSAP page entrance
  useEffect(() => {
    if (report) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo('.seo-report-header', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo('.seo-overall-score', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6 }, '-=0.2');

      // Score cards stagger
      gsap.fromTo('.seo-score-card', { opacity: 0, y: 40, scale: 0.95 }, {
        opacity: 1, y: 0, scale: 1,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.seo-score-cards', start: 'top 85%', once: true },
      });

      // Detail sections
      gsap.fromTo('.seo-detail-section', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.seo-detail-section', start: 'top 88%', once: true },
      });

      // Check items stagger
      gsap.fromTo('.seo-check-item', { opacity: 0, x: -20 }, {
        opacity: 1, x: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.seo-check-item', start: 'top 90%', once: true },
      });

      return () => { tl.kill(); ScrollTrigger.getAll().forEach(st => st.kill()); };
    }
  }, [report]);

  // Animated counter for score numbers
  const useAnimatedScore = (target: number | undefined) => {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
      const el = ref.current;
      if (!el || !target) return;

      const obj = { value: 0 };
      gsap.to(obj, {
        value: target,
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = Math.round(obj.value).toString(); },
      });
    }, [target]);
    return ref;
  };

  // Animated progress bar
  const useAnimatedBar = (percent: number) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;

      gsap.fromTo(el, { width: '0%' }, {
        width: `${percent}%`,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    }, [percent]);
    return ref;
  };

  useEffect(() => {
    const reportId = params.id as string;
    const stored = localStorage.getItem(`seo_report_${reportId}`);
    if (stored) {
      setReport(JSON.parse(stored));
    }
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <svg className="animate-spin w-10 h-10 text-orange-500 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-4 text-gray-500 text-sm">加载报告中...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <div className="text-center bg-white rounded-xl border border-gray-100 shadow-sm p-8 animate-scale-in">
          <p className="text-[#111827] text-lg mb-4">报告不存在</p>
          <a href="/seo" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-sm shadow-orange-200 hover:from-orange-600 hover:to-orange-700 transition-all duration-200">
            返回SEO分析
          </a>
        </div>
      </div>
    );
  }

  const seoAnalysis = report.seoAnalysis || {};
  const seo = seoAnalysis.seo || {};
  const eeat = seoAnalysis.eeat || {};
  const geo = seoAnalysis.geo || {};
  const scores = report.scores || {};

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-[#10B981]';
    if (score >= 40) return 'text-[#F59E0B]';
    return 'text-[#EF4444]';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-[#10B981]';
    if (score >= 40) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  // Animated score component
  const AnimatedScore = ({ score }: { score: number | undefined }) => {
    const ref = useAnimatedScore(score);
    return <span ref={ref}>0</span>;
  };

  // Animated bar component
  const AnimatedBar = ({ score }: { score: number }) => {
    const ref = useAnimatedBar(score);
    return (
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div ref={ref} className={`h-2 rounded-full ${getScoreBg(score)}`} style={{ width: '0%' }} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* NAVBAR */}
      <nav className="seo-report-header bg-white/80 backdrop-blur-xl border-b border-gray-200 h-[62px] flex items-center px-[52px] sticky top-0 z-50 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <a href="/" className="flex items-center gap-2 no-nowrap">
          <img src="/company-logo.png" alt="NextLeap" className="h-9 w-auto object-contain" />
        </a>
        <div className="flex-1" />
        <div className="flex items-center gap-6">
          <a href="/" className="text-sm text-[#6B7280] hover:text-[#F97316] transition-colors">DTC分析</a>
          <a href="/seo" className="text-sm text-[#F97316] font-semibold">SEO分析</a>
        </div>
      </nav>

      {/* Report Content */}
      <div className="max-w-[1200px] mx-auto px-[52px] py-[40px]">
        {/* Header */}
        <div className="seo-report-header mb-8">
          <h1 className="text-[32px] font-bold text-[#111827] mb-2">SEO 分析报告</h1>
          <div className="flex items-center gap-4 text-[14px] text-[#6B7280]">
            <span>{report.url}</span>
            <span>•</span>
            <span>{new Date(report.timestamp).toLocaleString('zh-CN')}</span>
          </div>
        </div>

        {/* Overall Score */}
        <div className="seo-overall-score bg-white rounded-[16px] p-6 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-8 opacity-0">
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="8"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#F97316" strokeWidth="8"
                  strokeDasharray="264" strokeDashoffset={264 - (264 * (scores.overall || 0) / 100)}
                  strokeLinecap="round" className="donut-animate" transform="rotate(-90 50 50)"/>
                <text x="50" y="55" textAnchor="middle" fontSize="28" fontWeight="800" fill="#111827">
                  <AnimatedScore score={scores.overall} />
                </text>
              </svg>
              <div className="text-[11px] text-[#9CA3AF] text-center mt-1 font-medium">/ 100</div>
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#111827] mb-2">综合评分</h2>
              <p className="text-[14px] text-[#6B7280]">
                {scores.overall >= 70 ? '表现良好，有小幅优化空间' :
                 scores.overall >= 40 ? '基础水平，需要改进' :
                 '存在较大问题，需要重点关注'}
              </p>
            </div>
          </div>
        </div>

        {/* Score Cards */}
        <div className="seo-score-cards grid grid-cols-3 gap-6 mb-8">
          {/* SEO Score */}
          <div className="seo-score-card bg-white rounded-[16px] p-6 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] opacity-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-[#111827]">技术SEO</h3>
              <div className={`text-[32px] font-bold ${getScoreColor(seo.score || 0)}`}>
                <AnimatedScore score={seo.score} />
              </div>
            </div>
            <AnimatedBar score={seo.score || 0} />
            {seo.summary && (
              <p className="mt-3 text-[13px] text-[#6B7280]">{seo.summary}</p>
            )}
          </div>

          {/* E-E-A-T Score */}
          <div className="seo-score-card bg-white rounded-[16px] p-6 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] opacity-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-[#111827]">E-E-A-T</h3>
              <div className={`text-[32px] font-bold ${getScoreColor(eeat.score || 0)}`}>
                <AnimatedScore score={eeat.score} />
              </div>
            </div>
            <AnimatedBar score={eeat.score || 0} />
            {eeat.summary && (
              <p className="mt-3 text-[13px] text-[#6B7280]">{eeat.summary}</p>
            )}
          </div>

          {/* GEO Score */}
          <div className="seo-score-card bg-white rounded-[16px] p-6 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] opacity-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-[#111827]">GEO优化</h3>
              <div className={`text-[32px] font-bold ${getScoreColor(geo.score || 0)}`}>
                <AnimatedScore score={geo.score} />
              </div>
            </div>
            <AnimatedBar score={geo.score || 0} />
            {geo.summary && (
              <p className="mt-3 text-[13px] text-[#6B7280]">{geo.summary}</p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 gap-6">
          {/* SEO Details */}
          <div className="seo-detail-section bg-white rounded-[16px] p-6 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h3 className="text-[18px] font-bold text-[#111827] mb-4 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              技术SEO详情
            </h3>
            {seo.checks?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {seo.checks.map((check: any, i: number) => (
                  <div key={i} className="seo-check-item bg-[#F8F9FA] rounded-[10px] p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-[#374151] font-medium">{check.label}</span>
                      <span className={`text-[12px] font-bold ${getScoreColor(check.score)}`}>
                        {check.score}/100
                      </span>
                    </div>
                    <p className="text-[13px] text-[#6B7280] leading-[1.6]">{check.feedback}</p>
                    {check.suggestion && (
                      <p className="mt-2 text-[12px] text-[#F97316] bg-orange-50 rounded-lg px-3 py-2">
                        💡 {check.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-[#9CA3AF]">暂无详细数据</p>
            )}
          </div>

          {/* E-E-A-T Details */}
          <div className="seo-detail-section bg-white rounded-[16px] p-6 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h3 className="text-[18px] font-bold text-[#111827] mb-4 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              E-E-A-T 详情
            </h3>
            {eeat.checks?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {eeat.checks.map((check: any, i: number) => (
                  <div key={i} className="seo-check-item bg-[#F8F9FA] rounded-[10px] p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-[#374151] font-medium">{check.label}</span>
                      <span className={`text-[12px] font-bold ${getScoreColor(check.score)}`}>
                        {check.score}/100
                      </span>
                    </div>
                    <p className="text-[13px] text-[#6B7280] leading-[1.6]">{check.feedback}</p>
                    {check.suggestion && (
                      <p className="mt-2 text-[12px] text-[#10B981] bg-green-50 rounded-lg px-3 py-2">
                        💡 {check.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-[#9CA3AF]">暂无详细数据</p>
            )}
          </div>

          {/* GEO Details */}
          <div className="seo-detail-section bg-white rounded-[16px] p-6 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h3 className="text-[18px] font-bold text-[#111827] mb-4 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              GEO 优化详情
            </h3>
            {geo.checks?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {geo.checks.map((check: any, i: number) => (
                  <div key={i} className="seo-check-item bg-[#F8F9FA] rounded-[10px] p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-[#374151] font-medium">{check.label}</span>
                      <span className={`text-[12px] font-bold ${getScoreColor(check.score)}`}>
                        {check.score}/100
                      </span>
                    </div>
                    <p className="text-[13px] text-[#6B7280] leading-[1.6]">{check.feedback}</p>
                    {check.suggestion && (
                      <p className="mt-2 text-[12px] text-[#8B5CF6] bg-purple-50 rounded-lg px-3 py-2">
                        💡 {check.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-[#9CA3AF]">暂无详细数据</p>
            )}
          </div>
        </div>

        {/* Issues */}
        {(seo.issues?.length > 0 || eeat.issues?.length > 0 || geo.issues?.length > 0) && (
          <div className="seo-detail-section bg-white rounded-[16px] p-6 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mt-6">
            <h3 className="text-[18px] font-bold text-[#111827] mb-4">发现的问题</h3>
            <div className="space-y-3">
              {seo.issues?.map((issue: string, i: number) => (
                <div key={`seo-${i}`} className="seo-check-item flex items-start gap-3 bg-red-50 rounded-[10px] p-4 border border-red-100">
                  <span className="text-[#F97316] text-[12px] font-semibold whitespace-nowrap bg-orange-100 px-2 py-1 rounded">技术SEO</span>
                  <p className="text-[14px] text-[#374151]">{issue}</p>
                </div>
              ))}
              {eeat.issues?.map((issue: string, i: number) => (
                <div key={`eeat-${i}`} className="seo-check-item flex items-start gap-3 bg-orange-50 rounded-[10px] p-4 border border-orange-100">
                  <span className="text-[#10B981] text-[12px] font-semibold whitespace-nowrap bg-green-100 px-2 py-1 rounded">E-E-A-T</span>
                  <p className="text-[14px] text-[#374151]">{issue}</p>
                </div>
              ))}
              {geo.issues?.map((issue: string, i: number) => (
                <div key={`geo-${i}`} className="seo-check-item flex items-start gap-3 bg-purple-50 rounded-[10px] p-4 border border-purple-100">
                  <span className="text-[#8B5CF6] text-[12px] font-semibold whitespace-nowrap bg-purple-100 px-2 py-1 rounded">GEO</span>
                  <p className="text-[14px] text-[#374151]">{issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {(seo.suggestions?.length > 0 || eeat.suggestions?.length > 0 || geo.suggestions?.length > 0) && (
          <div className="seo-detail-section bg-white rounded-[16px] p-6 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mt-6">
            <h3 className="text-[18px] font-bold text-[#111827] mb-4">优化建议</h3>
            <div className="space-y-3">
              {seo.suggestions?.map((suggestion: string, i: number) => (
                <div key={`seo-${i}`} className="seo-check-item flex items-start gap-3 bg-orange-50 rounded-[10px] p-4 border border-orange-100">
                  <span className="text-[#F97316] text-[12px] font-semibold whitespace-nowrap bg-orange-100 px-2 py-1 rounded">技术SEO</span>
                  <p className="text-[14px] text-[#374151]">{suggestion}</p>
                </div>
              ))}
              {eeat.suggestions?.map((suggestion: string, i: number) => (
                <div key={`eeat-${i}`} className="seo-check-item flex items-start gap-3 bg-green-50 rounded-[10px] p-4 border border-green-100">
                  <span className="text-[#10B981] text-[12px] font-semibold whitespace-nowrap bg-green-100 px-2 py-1 rounded">E-E-A-T</span>
                  <p className="text-[14px] text-[#374151]">{suggestion}</p>
                </div>
              ))}
              {geo.suggestions?.map((suggestion: string, i: number) => (
                <div key={`geo-${i}`} className="seo-check-item flex items-start gap-3 bg-purple-50 rounded-[10px] p-4 border border-purple-100">
                  <span className="text-[#8B5CF6] text-[12px] font-semibold whitespace-nowrap bg-purple-100 px-2 py-1 rounded">GEO</span>
                  <p className="text-[14px] text-[#374151]">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <a href="/seo" className="inline-flex items-center gap-2 text-[#F97316] hover:underline font-medium transition-colors hover:text-[#EA6C0A]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/>
              <path d="M12 19l-7-7 7-7"/>
            </svg>
            返回SEO分析
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 py-5 bg-white mt-12">
        <div className="max-w-[1200px] mx-auto px-[52px] flex items-center justify-between">
          <p className="text-xs text-[#9CA3AF]">DTC品牌网站分析工具</p>
          <p className="text-xs text-[#9CA3AF]">© 2024 简跃科技 NextLeap Business</p>
        </div>
      </footer>
    </div>
  );
}
