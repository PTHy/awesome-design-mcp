import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitHubClient } from '../github-client.js';

interface SearchMatch {
  section: string;
  snippet: string;
}

interface SearchResult {
  name: string;
  matches: SearchMatch[];
}

export function registerSearchDesigns(server: McpServer, github: GitHubClient): void {
  server.registerTool(
    'search-designs',
    {
      title: 'Search Design Systems',
      description:
        '키워드로 58개 디자인 시스템을 검색합니다. 이름과 DESIGN.md 내용을 모두 검색합니다.',
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
        const names = await github.listDesigns();
        const results: SearchResult[] = [];

        // 전체 DESIGN.md를 병렬로 fetch
        const entries = await Promise.allSettled(
          names.map(async (name) => ({ name, md: await github.getDesignMd(name) })),
        );

        for (const entry of entries) {
          if (entry.status !== 'fulfilled') continue;
          const { name, md } = entry.value;
          const lines = md.split('\n');
          const matches: SearchMatch[] = [];
          let currentSection = 'General';

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('## ')) {
              currentSection = lines[i].replace(/^#+\s*\d*\.?\s*/, '');
            }
            if (lines[i].toLowerCase().includes(q)) {
              const start = Math.max(0, i - 1);
              const end = Math.min(lines.length, i + 2);
              matches.push({
                section: currentSection,
                snippet: lines.slice(start, end).join('\n'),
              });
            }
          }

          if (matches.length > 0 || name.includes(q)) {
            results.push({ name, matches: matches.slice(0, 3) });
          }
        }

        // 이름 매칭 우선, 매칭 수 기준 정렬
        results.sort((a, b) => {
          const aName = a.name.includes(q) ? 1 : 0;
          const bName = b.name.includes(q) ? 1 : 0;
          return bName - aName || b.matches.length - a.matches.length;
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { query, totalResults: results.length, results: results.slice(0, max) },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `검색 실패: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
