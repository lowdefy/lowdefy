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

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function buildStatePanel({ slug, blocks }) {
  const stateObj = {};
  blocks.forEach((block) => {
    stateObj[block.id] = { _state: block.id };
  });
  return {
    blocks: [
      {
        id: `gallery_state_wrap_${slug}`,
        type: 'Box',
        style: {
          maxHeight: 400,
          overflow: 'auto',
        },
        blocks: [
          {
            id: `gallery_state_${slug}`,
            type: 'MarkdownWithCode',
            style: {
              whiteSpace: 'pre',
            },
            properties: {
              content: {
                _nunjucks: {
                  template: '```yaml\n{{ state | safe }}```\n',
                  on: {
                    state: {
                      _custom_yaml_stringify: [stateObj, { sortKeys: false }],
                    },
                  },
                },
              },
            },
          },
        ],
      },
    ],
  };
}

function transformer(sections, vars) {
  const showState = vars && vars.showState;

  return sections.map((section) => {
    const slug = slugify(section.title);
    const panels = [];
    if (showState) {
      panels.push({
        key: 'state',
        title: 'State',
        icon: 'AiOutlineDatabase',
      });
    }
    panels.push({
      key: 'config',
      title: 'Config',
      icon: 'AiOutlineCode',
    });
    const slots = {
      config: {
        blocks: [
          {
            id: `gallery_code_wrap_${slug}`,
            type: 'Box',
            style: {
              maxHeight: 400,
              overflow: 'auto',
            },
            blocks: [
              {
                id: `gallery_code_${slug}`,
                type: 'MarkdownWithCode',
                style: {
                  whiteSpace: 'pre',
                },
                properties: {
                  content: {
                    _nunjucks: {
                      template: '```yaml\n{{ blocks | safe }}```\n',
                      on: {
                        blocks: {
                          _custom_yaml_stringify: [
                            JSON.parse(JSON.stringify(section.blocks)),
                            { sortKeys: false },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
    };

    if (showState) {
      slots.state = buildStatePanel({ slug, blocks: section.blocks });
    }

    return {
      id: `gallery_card_${slug}`,
      type: 'Card',
      layout: {
        flex: section.fullWidth ? '1 1 100%' : '1 1 calc(50% - 8px)',
      },
      style: {
        minWidth: 0,
        overflow: 'hidden',
      },
      properties: {
        title: section.title,
      },
      blocks: [
        {
          id: `gallery_examples_${slug}`,
          type: 'Box',
          layout: {
            gap: 8,
          },
          blocks: section.blocks,
        },
        {
          id: `gallery_collapse_${slug}`,
          type: 'Collapse',
          properties: {
            defaultActiveKey: showState ? ['state'] : [],
            panels,
          },
          slots,
        },
      ],
    };
  });
}

export default transformer;
