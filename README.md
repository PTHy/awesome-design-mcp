# awesome-design-mcp

[awesome-design-md](https://github.com/VoltAgent/awesome-design-md)에 수집된 58개 기업의 DESIGN.md 디자인 시스템을 Claude Code에서 바로 사용할 수 있게 해주는 MCP 서버입니다.

## 설정

### Claude Code

원격 서버를 사용하므로 별도 설치가 필요 없습니다:

```bash
claude mcp add -s user -t http awesome-design-md https://awesome-design-mcp.tae020117.workers.dev/mcp
```

<details>
<summary>로컬 서버로 사용하기</summary>

```bash
git clone https://github.com/PTHy/awesome-design-mcp.git
cd awesome-design-mcp
npm install && npm run build
claude mcp add -s user awesome-design-md -- node $(pwd)/dist/index.js
```

</details>

### Claude Desktop

`claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "awesome-design-md": {
      "url": "https://awesome-design-mcp.tae020117.workers.dev/mcp"
    }
  }
}
```

등록 후 Claude를 재시작하면 MCP가 활성화됩니다.

## 사용 가능한 기능

### Resources

- `design://{name}` — 특정 기업의 DESIGN.md 전체 문서 (예: `design://stripe`)
- `design://{name}/{section}` — 특정 섹션만 조회 (예: `design://stripe/color-palette`)

사용 가능한 섹션: `visual-theme` `color-palette` `typography` `component-stylings` `layout` `depth` `dos-donts` `responsive` `agent-prompt-guide`

### Tools

- `search-designs` — 키워드로 58개 디자인 시스템의 이름과 내용을 검색

### Prompts

- `apply-design` — 디자인 시스템 이름과 작업을 입력하면 해당 디자인을 적용하여 UI 생성

## 사용 예시

```
@design://stripe 스타일로 결제 페이지를 만들어줘
```

```
@design://airbnb/color-palette 를 참고해서 색상 팔레트를 적용해줘
```

```
gradient를 사용하는 디자인 시스템을 찾아줘
```

## 포함된 디자인 시스템 (58개)

Airbnb · Airtable · Apple · BMW · Cal · Claude · Clay · ClickHouse · Cohere · Coinbase · Composio · Cursor · ElevenLabs · Expo · Ferrari · Figma · Framer · HashiCorp · IBM · Intercom · Kraken · Lamborghini · Linear · Lovable · Minimax · Mintlify · Miro · Mistral AI · MongoDB · Notion · NVIDIA · Ollama · OpenCode AI · Pinterest · PostHog · Raycast · Renault · Replicate · Resend · Revolut · RunwayML · Sanity · Sentry · SpaceX · Spotify · Stripe · Supabase · Superhuman · Tesla · Together AI · Uber · Vercel · VoltAgent · Warp · Webflow · Wise · xAI · Zapier

## 연결 해제

```bash
claude mcp remove -s user awesome-design-md
```

## 라이선스

MIT
