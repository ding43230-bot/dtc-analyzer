import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  timestamp: number;
  data: any;
}

export function getCache(key: string): any | null {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const cacheFile = path.join(CACHE_DIR, `${encodeURIComponent(key)}.json`);

    if (!fs.existsSync(cacheFile)) {
      return null;
    }

    const content = fs.readFileSync(cacheFile, 'utf-8');
    const entry: CacheEntry = JSON.parse(content);

    if (Date.now() - entry.timestamp > CACHE_TTL) {
      fs.unlinkSync(cacheFile);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function setCache(key: string, data: any): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const cacheFile = path.join(CACHE_DIR, `${encodeURIComponent(key)}.json`);
    const entry: CacheEntry = {
      timestamp: Date.now(),
      data
    };

    fs.writeFileSync(cacheFile, JSON.stringify(entry));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}
