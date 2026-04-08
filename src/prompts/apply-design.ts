import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import { z } from 'zod';
import { GitHubClient } from '../github-client.js';

export function registerApplyDesignPrompt(server: McpServer, github: GitHubClient): void {
  server.registerPrompt(
    'apply-design',
    {
      title: 'Apply Design System',
      description: '선택한 디자인 시스템을 적용하여 UI를 생성합니다',
      argsSchema: {
        name: completable(
          z.string().describe('디자인 시스템 이름 (예: stripe, airbnb)'),
          async (value) => {
            const designs = await github.listDesigns();
            return designs.filter((d) => d.startsWith(value));
          },
        ),
        task: z.string().describe('생성할 UI 설명 (예: 로그인 페이지, 대시보드)'),
      },
    },
    async ({ name, task }) => {
      const designMd = await github.getDesignMd(name);
      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `아래 DESIGN.md 디자인 시스템을 정확히 따라서 "${task}"을(를) 구현해주세요.\n\n---\n\n${designMd}`,
            },
          },
        ],
      };
    },
  );
}
