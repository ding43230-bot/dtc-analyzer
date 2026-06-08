'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface SEOReport {
  id: string;
  url: string;
  timestamp: string;
  scrapeData: any;
  seoAnalysis: any;
}

export default function SEOReportPage() {
  const params = useParams();
  const [report, setReport] = useState<SEOReport | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-white text-lg">加载中...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center">
        <div className="text-white text-lg mb-4">报告不存在</div>
        <a href="/seo" className="text-[#F97316] hover:underline">返回SEO分析</a>
      </div>
    );
  }

  const seo = report.seoAnalysis;
  const techSeo = seo?.techSeo || seo?.techSEO || {};
  const eeat = seo?.eeat || seo?.EEAT || {};
  const geo = seo?.geo || {};

  return (
    <div className="min-h-screen bg-[#0F172A]">
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

      {/* Report Content */}
      <div className="max-w-[1200px] mx-auto px-[52px] py-[40px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-white mb-2">SEO 分析报告</h1>
          <div className="flex items-center gap-4 text-[14px] text-[#94A3B8]">
            <span>{report.url}</span>
            <span>•</span>
            <span>{new Date(report.timestamp).toLocaleString('zh-CN')}</span>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Tech SEO Score */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-[16px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-white">技术SEO</h3>
              <div className="text-[32px] font-bold text-[#F97316]">
                {techSeo.score || '-'}
              </div>
            </div>
            <div className="w-full bg-[#334155] rounded-full h-2">
              <div
                className="bg-[#F97316] h-2 rounded-full transition-all"
                style={{ width: `${techSeo.score || 0}%` }}
              />
            </div>
          </div>

          {/* E-E-A-T Score */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-[16px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-white">E-E-A-T</h3>
              <div className="text-[32px] font-bold text-[#10B981]">
                {eeat.score || '-'}
              </div>
            </div>
            <div className="w-full bg-[#334155] rounded-full h-2">
              <div
                className="bg-[#10B981] h-2 rounded-full transition-all"
                style={{ width: `${eeat.score || 0}%` }}
              />
            </div>
          </div>

          {/* GEO Score */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-[16px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-white">GEO优化</h3>
              <div className="text-[32px] font-bold text-[#8B5CF6]">
                {geo.score || '-'}
              </div>
            </div>
            <div className="w-full bg-[#334155] rounded-full h-2">
              <div
                className="bg-[#8B5CF6] h-2 rounded-full transition-all"
                style={{ width: `${geo.score || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 gap-6">
          {/* Tech SEO Details */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-[16px] p-6">
            <h3 className="text-[18px] font-bold text-white mb-4 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              技术SEO详情
            </h3>
            {techSeo.details ? (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(techSeo.details).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-[#0F172A] rounded-[10px] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-[#94A3B8] capitalize">{key}</span>
                      <span className={`text-[12px] font-semibold ${value.score >= 70 ? 'text-[#10B981]' : value.score >= 40 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
                        {value.score}/100
                      </span>
                    </div>
                    <p className="text-[13px] text-[#CBD5E1] leading-[1.6]">{value.feedback}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-[#64748B]">暂无详细数据</p>
            )}
          </div>

          {/* E-E-A-T Details */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-[16px] p-6">
            <h3 className="text-[18px] font-bold text-white mb-4 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              E-E-A-T 详情
            </h3>
            {eeat.details ? (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(eeat.details).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-[#0F172A] rounded-[10px] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-[#94A3B8] capitalize">{key}</span>
                      <span className={`text-[12px] font-semibold ${value.score >= 70 ? 'text-[#10B981]' : value.score >= 40 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
                        {value.score}/100
                      </span>
                    </div>
                    <p className="text-[13px] text-[#CBD5E1] leading-[1.6]">{value.feedback}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-[#64748B]">暂无详细数据</p>
            )}
          </div>

          {/* GEO Details */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-[16px] p-6">
            <h3 className="text-[18px] font-bold text-white mb-4 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              GEO 优化详情
            </h3>
            {geo.details ? (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(geo.details).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-[#0F172A] rounded-[10px] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-[#94A3B8] capitalize">{key}</span>
                      <span className={`text-[12px] font-semibold ${value.score >= 70 ? 'text-[#10B981]' : value.score >= 40 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
                        {value.score}/100
                      </span>
                    </div>
                    <p className="text-[13px] text-[#CBD5E1] leading-[1.6]">{value.feedback}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-[#64748B]">暂无详细数据</p>
            )}
          </div>
        </div>

        {/* Issues */}
        {(techSeo.issues?.length > 0 || eeat.issues?.length > 0 || geo.issues?.length > 0) && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-[16px] p-6 mt-6">
            <h3 className="text-[18px] font-bold text-white mb-4">发现的问题</h3>
            <div className="space-y-3">
              {techSeo.issues?.map((issue: string, i: number) => (
                <div key={`tech-${i}`} className="flex items-start gap-3 bg-[#0F172A] rounded-[10px] p-4">
                  <span className="text-[#F97316] text-[12px] font-semibold whitespace-nowrap">技术SEO</span>
                  <p className="text-[14px] text-[#CBD5E1]">{issue}</p>
                </div>
              ))}
              {eeat.issues?.map((issue: string, i: number) => (
                <div key={`eeat-${i}`} className="flex items-start gap-3 bg-[#0F172A] rounded-[10px] p-4">
                  <span className="text-[#10B981] text-[12px] font-semibold whitespace-nowrap">E-E-A-T</span>
                  <p className="text-[14px] text-[#CBD5E1]">{issue}</p>
                </div>
              ))}
              {geo.issues?.map((issue: string, i: number) => (
                <div key={`geo-${i}`} className="flex items-start gap-3 bg-[#0F172A] rounded-[10px] p-4">
                  <span className="text-[#8B5CF6] text-[12px] font-semibold whitespace-nowrap">GEO</span>
                  <p className="text-[14px] text-[#CBD5E1]">{issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <a href="/seo" className="inline-flex items-center gap-2 text-[#F97316] hover:underline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/>
              <path d="M12 19l-7-7 7-7"/>
            </svg>
            返回SEO分析
          </a>
        </div>
      </div>
    </div>
  );
}
