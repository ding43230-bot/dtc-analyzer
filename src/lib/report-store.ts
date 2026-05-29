const reports = new Map<string, StoredReport>();

interface StoredReport {
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
  analysis: any;
}

export function saveReport(id: string, data: StoredReport): void {
  try {
    reports.set(id, data);
  } catch {}
}

export function getReport(id: string): StoredReport | null {
  try {
    return reports.get(id) || null;
  } catch {
    return null;
  }
}
