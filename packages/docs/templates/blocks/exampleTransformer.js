/*
  Copyright 2020-2024 Lowdefy, Inc

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
      contentGutter: 16,
    },
    blocks: [],
  };
  obj.examples.forEach((example, i) => {
    examples.blocks.push({
      id: `example_title_${i}`,
      type: 'Markdown',
      properties: {
        content: `#####  ${example.title}

${example.description || ''}
`,
      },
    });
    examples.blocks.push({
      id: `example_block_box_${i}`,
      type: 'Box',
      layout: {
        span: 12,
      },
      blocks: example.extra ? [example.block, example.extra] : [example.block],
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
                    '_yaml.stringify': [
                      { '_json.parse': JSON.stringify(example.block) },
                      { sortKeys: false },
                    ], // copy this object, build must make a copy
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
