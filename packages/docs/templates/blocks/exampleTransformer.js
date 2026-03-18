/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const transformer = (_, obj) => {
  const examples = {
    id: 'examples',
    type: 'Box',
    layout: {
      gap: 16,
    },
    blocks: [],
  };
  obj.examples.forEach((example, i) => {
    // Support both structured { title, block } and raw block { id, type } formats.
    const isRawBlock = example.type && !example.block;
    const title = isRawBlock ? example.id : example.title;
    const block = isRawBlock ? example : example.block;
    const description = isRawBlock ? '' : example.description || '';
    const extra = isRawBlock ? undefined : example.extra;

    examples.blocks.push({
      id: `example_title_${i}`,
      type: 'Markdown',
      properties: {
        content: `#####  ${title}

${description}
`,
      },
    });
    examples.blocks.push({
      id: `example_block_box_${i}`,
      type: 'Box',
      layout: {
        span: 12,
      },
      blocks: extra ? [block, extra] : [block],
    });
    examples.blocks.push({
      id: `example_config_box_${i}`,
      type: 'Box',
      layout: {
        span: 12,
      },
      blocks: [
        {
          id: `example_config_${i}`,
          type: 'MarkdownWithCode',
          properties: {
            content: {
              _nunjucks: {
                template: `
\`\`\`yaml
{{ block | safe }}
\`\`\`
`,
                on: {
                  block: {
                    _custom_yaml_stringify: [
                      JSON.parse(JSON.stringify(block)),
                      { sortKeys: false },
                    ],
                  },
                },
              },
            },
          },
        },
      ],
    });
  });
  return examples;
};

export default transformer;
