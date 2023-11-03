import { lexer } from 'marked';

export type Snippet = {
  name: string;
  description: string;
  body: string;
};

export type SnippetGroup = {
  name: string;
  snippets: Snippet[];
};

export function parseConfig(config: string): SnippetGroup[] {
  const tokens = lexer(config);
  const snippetGroups: SnippetGroup[] = [];
  let currentGroup: SnippetGroup | undefined;
  let currentSnippet: Snippet | undefined;

  tokens.forEach((token) => {
    switch (token.type) {
      case 'heading':
        if (token.depth === 1) {
          if (currentGroup) {
            if (currentSnippet) {
              currentGroup.snippets.push(currentSnippet);
              currentSnippet = undefined;
            }
            snippetGroups.push(currentGroup);
          }
          currentGroup = { name: token.text, snippets: [] };
        } else if (token.depth === 2) {
          if (currentSnippet && currentGroup) {
            currentGroup.snippets.push(currentSnippet);
          }
          currentSnippet = { name: token.text, description: '', body: '' };
        }
        break;
      case 'paragraph':
        if (currentSnippet) {
          currentSnippet.description = token.text;
        }
        break;
      case 'code':
        if (currentSnippet) {
          currentSnippet.body = token.text;
        }
        break;
    }
  });

  if (currentSnippet && currentGroup) {
    currentGroup.snippets.push(currentSnippet);
  }

  if (currentGroup) {
    snippetGroups.push(currentGroup);
  }

  return snippetGroups;
}
