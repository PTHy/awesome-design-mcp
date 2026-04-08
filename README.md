# awesome-design-mcp

[awesome-design-md](https://github.com/VoltAgent/awesome-design-md)에 수집된 58개 기업의 DESIGN.md 디자인 시스템을 Claude Code에서 바로 사용할 수 있게 해주는 MCP 서버입니다.

GitHub에서 동적으로 데이터를 가져오므로 로컬 클론이 필요 없습니다.

## 제공 기능

| 타입 | 이름 | 설명 |
|------|------|------|
| Resource | `design://{name}` | 특정 기업의 DESIGN.md 전체 문서 |
| Resource | `design://{name}/{section}` | DESIGN.md의 특정 섹션만 조회 |
| Tool | `search-designs` | 키워드로 58개 디자인 시스템 검색 |
| Prompt | `apply-design` | 선택한 디자인 시스템을 적용하여 UI 생성 |

### 사용 가능한 섹션

`visual-theme` `color-palette` `typography` `component-stylings` `layout` `depth` `dos-donts` `responsive` `agent-prompt-guide`

### 포함된 디자인 시스템 (58개)

Airbnb, Airtable, Apple, BMW, Cal, Claude, Clay, ClickHouse, Cohere, Coinbase, Composio, Cursor, ElevenLabs, Expo, Ferrari, Figma, Framer, HashiCorp, IBM, Intercom, Kraken, Lamborghini, Linear, Lovable, Minimax, Mintlify, Miro, Mistral AI, MongoDB, Notion, NVIDIA, Ollama, OpenCode AI, Pinterest, PostHog, Raycast, Renault, Replicate, Resend, Revolut, RunwayML, Sanity, Sentry, SpaceX, Spotify, Stripe, Supabase, Superhuman, Tesla, Together AI, Uber, Vercel, VoltAgent, Warp, Webflow, Wise, xAI, Zapier

## 설치

```bash
git clone https://github.com/PTHy/awesome-design-mcp.git
cd awesome-design-mcp
npm install
npm run build
```

## Claude Code에 등록

`~/.claude/.mcp.json` 파일에 추가:

```json
{
  "mcpServers": {
    "awesome-design-md": {
      "command": "node",
      "args": ["/path/to/awesome-design-mcp/dist/index.js"]
    }
  }
}
```

> `GITHUB_TOKEN` 환경변수를 설정하면 GitHub API rate limit이 완화됩니다 (없어도 동작).

## 사용 예시

### Resource로 디자인 시스템 참조

Claude Code에서 `@` 멘션으로 직접 참조:

```
@design://stripe 스타일로 결제 페이지를 만들어줘
```

특정 섹션만 참조:

```
@design://airbnb/color-palette 를 참고해서 색상 팔레트를 적용해줘
```

### Tool로 디자인 시스템 검색

```
gradient를 사용하는 디자인 시스템을 찾아줘
```

### Prompt로 디자인 적용

`apply-design` 프롬프트를 사용하면 디자인 시스템 전체를 컨텍스트에 넣고 UI를 생성합니다.

## 기술 구현

- **데이터 소스**: GitHub raw URL + Contents API (로컬 클론 불필요)
- **캐싱**: 인메모리 TTL 캐시 (목록 1시간, 파일 30분)
- **프리로딩**: 서버 시작 시 백그라운드로 전체 DESIGN.md 프리로드
- **SDK**: `@modelcontextprotocol/sdk` v1.29 + StdioServerTransport

## 라이선스

MIT
