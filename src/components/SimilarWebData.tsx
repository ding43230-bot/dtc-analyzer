'use client';

import { useState } from 'react';

interface SimilarWebDataProps {
  url: string;
}

interface SimilarWebInfo {
  url: string;
  note?: string;
  globalRank: string;
  countryRank: string;
  categoryRank: string;
  totalVisits: string;
  bounceRate: string;
  pagesPerVisit: string;
  avgVisitDuration: string;
  trafficSources: Array<{ source: string; percentage: string }>;
  topCountries: Array<{ country: string; percentage: string }>;
  genderDistribution: { male: string; female: string };
  ageDistribution: Array<{ age: string; percentage: string }>;
  competitors: Array<{ domain: string; similarity: string }>;
}

export default function SimilarWebData({ url }: SimilarWebDataProps) {
  const [data, setData] = useState<SimilarWebInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSimilarWebData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/similarweb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          📊 SimilarWeb 流量数据
        </h3>
        <button
          onClick={fetchSimilarWebData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '查询中...' : '查询 SimilarWeb'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* 降级提示 */}
          {data.note && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-600 text-lg">⚠️</span>
                <p className="text-amber-800 text-sm font-medium">Vercel 环境暂不支持自动抓取</p>
              </div>
              <p className="text-amber-700 text-sm mb-3">请在浏览器中打开以下链接查看流量数据：</p>
              <div className="flex items-center gap-2 bg-white rounded-lg border border-amber-200 p-2">
                <code className="flex-1 text-sm text-gray-700 truncate select-all">{data.url}</code>
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 whitespace-nowrap"
                >
                  在新窗口打开 ↗
                </a>
              </div>
            </div>
          )}

          {/* 排名信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.globalRank && (
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{data.globalRank}</div>
                <div className="text-sm text-gray-600">全球排名</div>
              </div>
            )}
            {data.countryRank && (
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{data.countryRank}</div>
                <div className="text-sm text-gray-600">国家排名</div>
              </div>
            )}
            {data.categoryRank && (
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{data.categoryRank}</div>
                <div className="text-sm text-gray-600">类别排名</div>
              </div>
            )}
          </div>

          {/* 核心指标 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.totalVisits && (
              <div className="border rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">总访问量</div>
                <div className="text-lg font-semibold">{data.totalVisits}</div>
              </div>
            )}
            {data.bounceRate && (
              <div className="border rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">跳出率</div>
                <div className="text-lg font-semibold">{data.bounceRate}</div>
              </div>
            )}
            {data.pagesPerVisit && (
              <div className="border rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">每次访问页数</div>
                <div className="text-lg font-semibold">{data.pagesPerVisit}</div>
              </div>
            )}
            {data.avgVisitDuration && (
              <div className="border rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">平均访问时长</div>
                <div className="text-lg font-semibold">{data.avgVisitDuration}</div>
              </div>
            )}
          </div>

          {/* 流量来源 */}
          {data.trafficSources.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">流量来源</h4>
              <div className="space-y-2">
                {data.trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-24 text-sm text-gray-600">{source.source}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 mr-3">
                      <div
                        className="bg-blue-500 rounded-full h-4"
                        style={{ width: source.percentage }}
                      />
                    </div>
                    <div className="text-sm font-medium w-12 text-right">{source.percentage}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 地理分布 */}
          {data.topCountries.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">地理分布</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.topCountries.slice(0, 6).map((country, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                    <span className="text-sm">{country.country}</span>
                    <span className="text-sm font-medium text-blue-600">{country.percentage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 用户画像 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 性别分布 */}
            {(data.genderDistribution.male || data.genderDistribution.female) && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">性别分布</h4>
                <div className="flex gap-4">
                  <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-600">{data.genderDistribution.male || '-'}</div>
                    <div className="text-sm text-gray-600">男性</div>
                  </div>
                  <div className="flex-1 bg-pink-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-pink-600">{data.genderDistribution.female || '-'}</div>
                    <div className="text-sm text-gray-600">女性</div>
                  </div>
                </div>
              </div>
            )}

            {/* 年龄分布 */}
            {data.ageDistribution.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">年龄分布</h4>
                <div className="space-y-2">
                  {data.ageDistribution.slice(0, 5).map((age, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-16 text-sm text-gray-600">{age.age}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 mr-2">
                        <div
                          className="bg-green-500 rounded-full h-3"
                          style={{ width: age.percentage }}
                        />
                      </div>
                      <div className="text-sm font-medium w-12 text-right">{age.percentage}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 竞争对手 */}
          {data.competitors.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">竞争对手</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.competitors.slice(0, 4).map((comp, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                    <span className="text-sm">{comp.domain}</span>
                    <span className="text-sm text-gray-500">{comp.similarity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 查看详情链接 */}
          <div className="text-center pt-4 border-t">
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              在 SimilarWeb 查看完整数据 →
            </a>
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="text-center text-gray-500 py-8">
          点击按钮查询 SimilarWeb 流量数据
        </div>
      )}
    </div>
  );
}
