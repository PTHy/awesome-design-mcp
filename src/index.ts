import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GitHubClient } from './github-client.js';
import { registerDesignResources } from './resources/design-resource.js';
import { registerSearchDesigns } from './tools/search-designs.js';
import { registerApplyDesignPrompt } from './prompts/apply-design.js';

const server = new McpServer({
  name: 'awesome-design-md',
  version: '1.0.0',
});

const github = new GitHubClient();

registerDesignResources(server, github);
registerSearchDesigns(server, github);
registerApplyDesignPrompt(server, github);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('awesome-design-md MCP server running on stdio');

// 백그라운드 프리로딩 (실패해도 무시)
github.preloadAll().catch(() => {});
