import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GitHubClient } from '../github-client.js';
import { extractSection } from '../section-parser.js';

export function registerDesignResources(server: McpServer, github: GitHubClient): void {
  // design://{name} — DESIGN.md 전체
  server.registerResource(
    'design',
    new ResourceTemplate('design://{name}', {
      list: async () => {
        const names = await github.listDesigns();
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
      const text = await github.getDesignMd(n);
      return {
        contents: [{ uri: uri.href, mimeType: 'text/markdown' as const, text }],
      };
    },
  );

  // design://{name}/{section} — 특정 섹션
  server.registerResource(
    'design-section',
    new ResourceTemplate('design://{name}/{section}', {
      list: undefined,
    }),
    {
      title: 'Design System Section',
      description:
        'DESIGN.md 특정 섹션. section: visual-theme, color-palette, typography, component-stylings, layout, depth, dos-donts, responsive, agent-prompt-guide',
      mimeType: 'text/markdown',
    },
    async (uri, { name, section }) => {
      const n = Array.isArray(name) ? name[0] : name;
      const s = Array.isArray(section) ? section[0] : section;
      const md = await github.getDesignMd(n);
      const text = extractSection(md, s);
      return {
        contents: [{ uri: uri.href, mimeType: 'text/markdown' as const, text }],
      };
    },
  );
}
