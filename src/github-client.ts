const REPO = 'PTHy/awesome-design-md';
const BASE_RAW = `https://raw.githubusercontent.com/${REPO}/main`;

const LIST_TTL = 60 * 60 * 1000; // 1시간
const MD_TTL = 30 * 60 * 1000; // 30분
const CONCURRENCY = 10;

class Cache<T> {
  private store = new Map<string, { data: T; expiry: number }>();

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiry: Date.now() + ttlMs });
  }
}

export class GitHubClient {
  private listCache = new Cache<string[]>();
  private mdCache = new Cache<string>();

  async listDesigns(): Promise<string[]> {
    const cached = this.listCache.get('designs');
    if (cached) return cached;

    const res = await fetch(`${BASE_RAW}/design-md/index.json`);
    if (!res.ok) throw new Error(`Failed to fetch index.json (${res.status})`);

    const names = (await res.json()) as string[];
    this.listCache.set('designs', names, LIST_TTL);
    return names;
  }

  async getDesignMd(name: string): Promise<string> {
    const key = name.toLowerCase();
    const cached = this.mdCache.get(key);
    if (cached) return cached;

    const res = await fetch(`${BASE_RAW}/design-md/${key}/DESIGN.md`);
    if (!res.ok) throw new Error(`Design '${name}' not found (${res.status})`);

    const text = await res.text();
    this.mdCache.set(key, text, MD_TTL);
    return text;
  }

  async preloadAll(): Promise<void> {
    const names = await this.listDesigns();

    for (let i = 0; i < names.length; i += CONCURRENCY) {
      const chunk = names.slice(i, i + CONCURRENCY);
      await Promise.allSettled(chunk.map((n) => this.getDesignMd(n)));
    }
  }
}
