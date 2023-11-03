import { parseConfig, SnippetGroup } from './snippets';
test('should parse text to snippet groups', () => {
  const config = `
---
# group1

## snippet1

description1

\`\`\`
body1
\`\`\`

---
# group2

## snippet2

description2

\`\`\`
body2
\`\`\`
`;
  const expected: SnippetGroup[] = [
    {
      name: 'group1',
      snippets: [
        {
          name: 'snippet1',
          description: 'description1',
          body: 'body1',
        },
      ],
    },
    {
      name: 'group2',
      snippets: [
        {
          name: 'snippet2',
          description: 'description2',
          body: 'body2',
        },
      ],
    },
  ];

  const result = parseConfig(config);

  expect(result).toEqual(expected);
});

test('should parses multiple snippets in a group', () => {
  const config = `
---
# group1

## snippet1

description1

\`\`\`
body1
\`\`\`

## snippet2

description2

\`\`\`
body2
\`\`\`
---
`;
  const result = parseConfig(config);
  expect(result).toEqual([
    {
      name: 'group1',
      snippets: [
        {
          name: 'snippet1',
          description: 'description1',
          body: 'body1',
        },
        {
          name: 'snippet2',
          description: 'description2',
          body: 'body2',
        },
      ],
    },
  ]);
});
