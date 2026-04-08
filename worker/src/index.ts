import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import { z } from 'zod';

// --- GitHub Client (Cloudflare Cache API 활용) ---

const REPO = 'PTHy/awesome-design-md';
const BASE_RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const LIST_CACHE_TTL = 3600; // 1시간
const MD_CACHE_TTL = 1800; // 30분

async function cachedFetch(url: string, cacheTtl: number): Promise<Response> {
  return fetch(url, {
    cf: { cacheTtl, cacheEverything: true },
    headers: { 'User-Agent': 'awesome-design-mcp-worker/1.0' },
  });
}

async function listDesigns(): Promise<string[]> {
  const res = await cachedFetch(`${BASE_RAW}/design-md/index.json`, LIST_CACHE_TTL);
  if (!res.ok) throw new Error(`Failed to fetch index.json (${res.status})`);
  return (await res.json()) as string[];
}

async function getDesignMd(name: string): Promise<string> {
  const res = await cachedFetch(
    `${BASE_RAW}/design-md/${name.toLowerCase()}/DESIGN.md`,
    MD_CACHE_TTL,
  );
  if (!res.ok) throw new Error(`Design '${name}' not found (${res.status})`);
  return res.text();
}

// --- Section Parser ---

const SECTION_MAP: Record<string, string> = {
  'visual-theme': '## 1.',
  'color-palette': '## 2.',
  'typography': '## 3.',
  'component-stylings': '## 4.',
  'layout': '## 5.',
  'depth': '## 6.',
  'dos-donts': '## 7.',
  'responsive': '## 8.',
  'agent-prompt-guide': '## 9.',
};
const VALID_SECTIONS = Object.keys(SECTION_MAP);

function extractSection(markdown: string, sectionKey: string): string {
  const marker = SECTION_MAP[sectionKey];
  if (!marker) return `Unknown section: ${sectionKey}. Valid: ${VALID_SECTIONS.join(', ')}`;
  const start = markdown.indexOf(marker);
  if (start === -1) return `Section '${sectionKey}' not found in document`;
  const nextSection = markdown.indexOf('\n## ', start + marker.length);
  return nextSection === -1 ? markdown.slice(start) : markdown.slice(start, nextSection);
}

// --- MCP Server Factory ---

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

function createServer(): McpServer {
  const server = new McpServer({ name: 'awesome-design-md', version: '1.0.0' });

  // Resource: design://{name}
  server.registerResource(
    'design',
    new ResourceTemplate('design://{name}', {
      list: async () => {
        const names = await listDesigns();
        return {
          resources: names.map((name) => ({
            uri: `design://${name}`,
            name: `${name} Design System`,
            description: `${name}의 DESIGN.md 디자인 시스템`,
            mimeType: 'text/markdown' as const,
          })),
        };
      },
    }),
    {
      title: 'Design System',
      description: 'DESIGN.md 디자인 시스템 전체 문서',
      mimeType: 'text/markdown',
    },
    async (uri, { name }) => {
      const n = Array.isArray(name) ? name[0] : name;
      const text = await getDesignMd(n);
      return {
        contents: [{ uri: uri.href, mimeType: 'text/markdown' as const, text }],
      };
    },
  );

  // Resource: design://{name}/{section}
  server.registerResource(
    'design-section',
    new ResourceTemplate('design://{name}/{section}', { list: undefined }),
    {
      title: 'Design System Section',
      description: `DESIGN.md 특정 섹션. section: ${VALID_SECTIONS.join(', ')}`,
      mimeType: 'text/markdown',
    },
    async (uri, { name, section }) => {
      const n = Array.isArray(name) ? name[0] : name;
      const s = Array.isArray(section) ? section[0] : section;
      const md = await getDesignMd(n);
      return {
        contents: [{ uri: uri.href, mimeType: 'text/markdown' as const, text: extractSection(md, s) }],
      };
    },
  );

  // Tool: search-designs
  server.registerTool(
    'search-designs',
    {
      title: 'Search Design Systems',
      description: '키워드로 58개 디자인 시스템을 검색합니다. 이름과 DESIGN.md 내용을 모두 검색합니다.',
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: z.object({
        query: z.string().describe('검색 키워드 (예: gradient, dark mode, sans-serif)'),
        maxResults: z.number().optional().describe('최대 결과 수 (기본 5)'),
      }),
    },
    async ({ query, maxResults }) => {
      try {
        const max = maxResults ?? 5;
        const q = query.toLowerCase();
        const names = await listDesigns();

        const entries = await Promise.allSettled(
          names.map(async (name) => ({ name, md: await getDesignMd(name) })),
        );

        const results: Array<{ name: string; matches: Array<{ section: string; snippet: string }> }> = [];

        for (const entry of entries) {
          if (entry.status !== 'fulfilled') continue;
          const { name, md } = entry.value;
          const lines = md.split('\n');
          const matches: Array<{ section: string; snippet: string }> = [];
          let currentSection = 'General';

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('## ')) currentSection = lines[i].replace(/^#+\s*\d*\.?\s*/, '');
            if (lines[i].toLowerCase().includes(q)) {
              const start = Math.max(0, i - 1);
              const end = Math.min(lines.length, i + 2);
              matches.push({ section: currentSection, snippet: lines.slice(start, end).join('\n') });
            }
          }

          if (matches.length > 0 || name.includes(q)) {
            results.push({ name, matches: matches.slice(0, 3) });
          }
        }

        results.sort((a, b) => {
          const aName = a.name.includes(q) ? 1 : 0;
          const bName = b.name.includes(q) ? 1 : 0;
          return bName - aName || b.matches.length - a.matches.length;
        });

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ query, totalResults: results.length, results: results.slice(0, max) }, null, 2),
          }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `검색 실패: ${message}` }], isError: true };
      }
    },
  );

  // Prompt: apply-design
  server.registerPrompt(
    'apply-design',
    {
      title: 'Apply Design System',
      description: '선택한 디자인 시스템을 적용하여 UI를 생성합니다',
      argsSchema: {
        name: completable(
          z.string().describe('디자인 시스템 이름 (예: stripe, airbnb)'),
          async (value) => {
            const designs = await listDesigns();
            return designs.filter((d) => d.startsWith(value));
          },
        ),
        task: z.string().describe('생성할 UI 설명 (예: 로그인 페이지, 대시보드)'),
      },
    },
    async ({ name, task }) => {
      const designMd = await getDesignMd(name);
      return {
        messages: [{
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `아래 DESIGN.md 디자인 시스템을 정확히 따라서 "${task}"을(를) 구현해주세요.\n\n---\n\n${designMd}`,
          },
        }],
      };
    },
  );

  return server;
}

// --- Cloudflare Workers Entry ---

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // /mcp 경로만 MCP 처리
    if (url.pathname === '/mcp') {
      const server = createServer();
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await server.connect(transport);
      return transport.handleRequest(request);
    }

    // 루트: 간단한 안내
    if (url.pathname === '/') {
      return new Response(
        JSON.stringify({
          name: 'awesome-design-md',
          version: '1.0.0',
          description: 'MCP server for 58+ design systems from awesome-design-md',
          mcp_endpoint: `${url.origin}/mcp`,
          usage: `claude mcp add -t http awesome-design-md ${url.origin}/mcp`,
        }, null, 2),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response('Not Found', { status: 404 });
  },
};
