import fs from 'fs';
import path from 'path';

const REPORTS_DIR = path.join(process.cwd(), '.reports');

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
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const reportFile = path.join(REPORTS_DIR, `${id}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(data));
  } catch (error) {
    console.error('Report save error:', error);
  }
}

export function getReport(id: string): StoredReport | null {
  try {
    if (!fs.existsSync(REPORTS_DIR)) {
      return null;
    }

    const reportFile = path.join(REPORTS_DIR, `${id}.json`);

    if (!fs.existsSync(reportFile)) {
      return null;
    }

    const content = fs.readFileSync(reportFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
