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

import YAML from 'yaml';

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function isMarkerKey(key) {
  return typeof key === 'string' && key.length >= 2 && key[0] === '~';
}

function stripMarkers(value) {
  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(stripMarkers);
  }
  if (value !== null && typeof value === 'object') {
    if (value instanceof Date) {
      return value.toISOString();
    }
    const clean = {};
    for (const key of Object.keys(value)) {
      if (!isMarkerKey(key)) {
        const stripped = stripMarkers(value[key]);
        if (stripped !== undefined) {
          clean[key] = stripped;
        }
      }
    }
    return clean;
  }
  return value;
}

function hasOperators(obj) {
  if (Array.isArray(obj)) {
    return obj.some(hasOperators);
  }
  if (obj !== null && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.length > 1 && key[0] === '_' && !isMarkerKey(key)) {
        return true;
      }
      if (hasOperators(obj[key])) {
        return true;
      }
    }
  }
  return false;
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

function buildConfigPanel({ slug, configBlocks }) {
  // Build-time YAML: operators are preserved as literal text
  const yamlStr = YAML.stringify(stripMarkers(configBlocks), { sortKeys: false });
  return {
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
              content: '```yaml\n' + yamlStr + '```\n',
            },
          },
        ],
      },
    ],
  };
}

function buildResolvedPanel({ slug, configBlocks }) {
  return {
    blocks: [
      {
        id: `gallery_resolved_wrap_${slug}`,
        type: 'Box',
        style: {
          maxHeight: 400,
          overflow: 'auto',
        },
        blocks: [
          {
            id: `gallery_resolved_${slug}`,
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
                      _custom_yaml_stringify: [configBlocks, { sortKeys: false }],
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

function buildCopyButton({ slug, configBlocks }) {
  const yamlStr = YAML.stringify(stripMarkers(configBlocks), { sortKeys: false });
  return {
    blocks: [
      {
        id: `gallery_copy_${slug}`,
        type: 'Button',
        properties: {
          icon: 'AiOutlineCopy',
          type: 'text',
          size: 'small',
          shape: 'circle',
        },
        events: {
          onClick: [
            {
              id: `copy_config_${slug}`,
              type: 'CopyToClipboard',
              params: {
                copy: yamlStr,
              },
            },
            {
              id: `copy_message_${slug}`,
              type: 'DisplayMessage',
              params: {
                content: 'Config copied to clipboard',
                duration: 2,
              },
            },
          ],
        },
      },
    ],
  };
}

function buildCard({ section, slug, showState }) {
  const configBlocks = JSON.parse(JSON.stringify(section.blocks));
  const sectionHasOperators = hasOperators(configBlocks);

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
    extraKey: `config_extra_${slug}`,
  });
  if (sectionHasOperators) {
    panels.push({
      key: 'resolved',
      title: 'Resolved',
      icon: 'AiOutlineEye',
    });
  }

  const slots = {};

  slots.config = buildConfigPanel({ slug, configBlocks });
  slots[`config_extra_${slug}`] = buildCopyButton({ slug, configBlocks });

  if (sectionHasOperators) {
    slots.resolved = buildResolvedPanel({ slug, configBlocks });
  }

  if (showState) {
    slots.state = buildStatePanel({ slug, blocks: section.blocks });
  }

  const cardStyle = {
    minWidth: 0,
    overflow: 'hidden',
    breakInside: 'avoid',
    marginBottom: 16,
  };
  if (section.fullWidth) {
    cardStyle.columnSpan = 'all';
  }

  return {
    id: `gallery_card_${slug}`,
    type: 'Card',
    style: cardStyle,
    properties: {
      title: section.title,
    },
    blocks: section.hideConfig
      ? [
          {
            id: `gallery_examples_${slug}`,
            type: 'Box',
            layout: {
              gap: 8,
            },
            blocks: section.blocks,
          },
        ]
      : [
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
}

function transformer(sections, vars) {
  const showState = vars && vars.showState;

  return sections.map((section) => {
    const slug = slugify(section.title);
    return buildCard({ section, slug, showState });
  });
}

export default transformer;
