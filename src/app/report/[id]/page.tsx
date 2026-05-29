'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// SVG Icons
const Icons = {
  check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  alert: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
  ),
  x: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  arrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
    </svg>
  ),
  chevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  lightbulb: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>
    </svg>
  ),
  layout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  ),
  search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  trendingUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  mail: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  spinner: () => (
    <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
};

interface CheckItem {
  label: string;
  score: number;
  feedback: string;
  suggestion?: string;
  status: 'pass' | 'warn' | 'fail';
}

interface CategoryData {
  score: number;
  summary?: string;
  checks: CheckItem[];
  issues: string[];
  suggestions?: string[];
}

interface ReportData {
  id: string;
  url: string;
  timestamp: string;
  scores: {
    uiux: number;
    seo: number;
    ads: number;
    email: number;
    overall: number;
  };
  recommendations: Array<{
    serviceName: string;
    price: string;
    reason: string;
    priority: string;
  }>;
  analysis: {
    uiux: CategoryData;
    seo: CategoryData;
    ads: CategoryData;
    email: CategoryData;
  };
}

function getStatus(score: number): 'pass' | 'warn' | 'fail' {
  if (score >= 70) return 'pass';
  if (score >= 50) return 'warn';
  return 'fail';
}

function StatusIcon({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  const styles = {
    pass: 'bg-emerald-50 text-emerald-600',
    warn: 'bg-amber-50 text-amber-600',
    fail: 'bg-red-50 text-red-600',
  };

  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${styles[status]}`}>
      {status === 'pass' ? <Icons.check /> : status === 'warn' ? <Icons.alert /> : <Icons.x />}
    </div>
  );
}

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.1s ease' }}
        />
      </svg>
      <div className="score-value" style={{ color }}>{animatedScore}</div>
    </div>
  );
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  const bgColors: Record<string, string> = {
    green: 'bg-emerald-500', orange: 'bg-orange-500', purple: 'bg-violet-500', red: 'bg-rose-500',
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-20 shrink-0">{label}</span>
      <div className="progress-bar flex-1">
        <div className={`progress-bar-fill ${bgColors[color] || 'bg-orange-500'}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-semibold w-10 text-right ${score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
        {score}
      </span>
    </div>
  );
}

function CategoryCard({ title, icon, data, color }: { title: string; icon: React.ReactNode; data: CategoryData; color: string }) {
  const [expanded, setExpanded] = useState(false);
  const borderColors: Record<string, string> = {
    green: 'border-t-emerald-500', purple: 'border-t-violet-500', orange: 'border-t-orange-500', red: 'border-t-rose-500',
  };

  const checks: CheckItem[] = data.checks || [];
  const suggestions = data.suggestions || [];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up hover:shadow-md transition-shadow duration-200">
      <div className={`border-t-4 ${borderColors[color] || 'border-t-orange-500'} px-6 py-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-500">{icon}</span>
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <span className={`text-2xl font-bold ${data.score >= 70 ? 'text-emerald-600' : data.score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
            {data.score}<span className="text-sm font-normal text-gray-400">/100</span>
          </span>
        </div>
        {data.summary && (
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{data.summary}</p>
        )}
      </div>

      <div className="px-6 pb-5">
        {/* Check items */}
        {checks.map((check, i) => {
          const status = check.status || getStatus(check.score);
          return (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
              <StatusIcon status={status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{check.label}</p>
                <p className="text-[13px] text-gray-500 mt-0.5 leading-relaxed">{check.feedback}</p>
                {check.suggestion && (
                  <p className="text-[13px] text-orange-600 mt-1.5 flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0"><Icons.lightbulb /></span>
                    {check.suggestion}
                  </p>
                )}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                status === 'pass' ? 'bg-emerald-50 text-emerald-700' :
                status === 'warn' ? 'bg-amber-50 text-amber-700' :
                'bg-red-50 text-red-700'
              }`}>
                {check.score}
              </span>
            </div>
          );
        })}

        {/* Issues */}
        {data.issues && data.issues.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">发现的问题</p>
            {data.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2.5 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <p className="text-[13px] text-gray-600">{issue}</p>
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors duration-200 cursor-pointer"
            >
              <span className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
                <Icons.chevronRight />
              </span>
              优化建议 ({suggestions.length})
            </button>
            {expanded && (
              <div className="mt-3 space-y-2 animate-slide-down">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                    <span className="text-orange-500 font-bold text-xs mt-0.5">{i + 1}</span>
                    <p className="text-[13px] text-gray-700 leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // Try localStorage first (for Vercel serverless)
        try {
          const stored = localStorage.getItem(`report_${params.id}`);
          if (stored) {
            setReport(JSON.parse(stored));
            setLoading(false);
            return;
          }
        } catch {}

        // Fallback to API
        const response = await fetch(`/api/report/${params.id}`);
        const data = await response.json();
        if (data.success) {
          setReport(data.report);
        } else {
          setError(data.error || '报告不存在');
        }
      } catch {
        setError('加载报告失败');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center animate-fade-in">
          <div className="text-orange-500"><Icons.spinner /></div>
          <p className="mt-4 text-gray-500 text-sm">加载报告中...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center bg-white rounded-xl border border-gray-100 shadow-sm p-8 animate-scale-in">
          <p className="text-red-500 text-lg mb-4">{error || '报告不存在'}</p>
          <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-sm shadow-orange-200 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 cursor-pointer">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const categories = [
    { key: 'uiux', title: 'UI/UX 分析', icon: <Icons.layout />, data: report.analysis.uiux, color: 'green' },
    { key: 'seo', title: 'SEO/GEO 分析', icon: <Icons.search />, data: report.analysis.seo, color: 'purple' },
    { key: 'ads', title: '广告转化分析', icon: <Icons.trendingUp />, data: report.analysis.ads, color: 'orange' },
    { key: 'email', title: '邮件营销分析', icon: <Icons.mail />, data: report.analysis.email, color: 'red' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors duration-200 cursor-pointer"
              >
                <Icons.arrowLeft />
                返回
              </button>
              <div className="h-5 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-200">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900">分析报告</h1>
                  <p className="text-[11px] text-gray-400 max-w-xs truncate">{report.url}</p>
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {report.timestamp ? new Date(report.timestamp).toLocaleString('zh-CN') : ''}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Overall Score */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 mb-6 text-center animate-scale-in">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-5">综合评分</p>
          <ScoreRing score={report.scores.overall} />
          <div className="mt-7 max-w-md mx-auto space-y-3.5">
            <ScoreBar label="UI/UX" score={report.scores.uiux} color="green" />
            <ScoreBar label="SEO" score={report.scores.seo} color="purple" />
            <ScoreBar label="广告转化" score={report.scores.ads} color="orange" />
            <ScoreBar label="邮件营销" score={report.scores.email} color="red" />
          </div>

          {/* 评分标准说明 */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-left">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">评分标准</p>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { range: '0-20', label: '极差', desc: '几乎缺失', color: 'bg-red-50 text-red-700 border-red-100' },
                { range: '21-40', label: '较差', desc: '严重不足', color: 'bg-orange-50 text-orange-700 border-orange-100' },
                { range: '41-60', label: '一般', desc: '基础水平', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
                { range: '61-80', label: '良好', desc: '达到行业标准', color: 'bg-green-50 text-green-700 border-green-100' },
                { range: '81-100', label: '优秀', desc: '超越行业水平', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
              ].map((level) => (
                <div key={level.range} className={`rounded-lg border p-2 ${level.color}`}>
                  <p className="text-sm font-bold">{level.range}</p>
                  <p className="text-xs font-semibold">{level.label}</p>
                  <p className="text-[10px] mt-0.5 opacity-75">{level.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 animate-fade-in-up delay-200">
            <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2.5">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-orange-400 to-orange-600" />
              服务推荐
            </h2>
            <div className="space-y-3">
              {report.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-orange-50/50 border border-transparent hover:border-orange-100 transition-all duration-200 cursor-default">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-bold shrink-0 border border-orange-100">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{rec.serviceName}</h3>
                    <p className="text-[13px] text-gray-500 mt-0.5">{rec.reason}</p>
                  </div>
                  <span className="text-sm font-bold text-orange-600 whitespace-nowrap">{rec.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.key}
              title={cat.title}
              icon={cat.icon}
              data={cat.data}
              color={cat.color}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center py-10 animate-fade-in-up delay-600">
          <p className="text-gray-400 mb-4 text-sm">想分析其他网站？</p>
          <button onClick={() => router.push('/')} className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-sm shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:shadow-md hover:shadow-orange-200 active:scale-[0.98] transition-all duration-200 cursor-pointer">
            重新分析
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-5 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className="text-xs text-gray-400">DTC品牌网站分析工具</p>
          <p className="text-xs text-gray-400">© 2024 简跃科技 NextLeap Business</p>
        </div>
      </footer>
    </div>
  );
}
