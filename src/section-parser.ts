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

export const VALID_SECTIONS = Object.keys(SECTION_MAP);

export function extractSection(markdown: string, sectionKey: string): string {
  const marker = SECTION_MAP[sectionKey];
  if (!marker) {
    return `Unknown section: ${sectionKey}. Valid sections: ${VALID_SECTIONS.join(', ')}`;
  }

  const start = markdown.indexOf(marker);
  if (start === -1) {
    return `Section '${sectionKey}' not found in document`;
  }

  const nextSection = markdown.indexOf('\n## ', start + marker.length);
  return nextSection === -1 ? markdown.slice(start) : markdown.slice(start, nextSection);
}
