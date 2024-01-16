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

function transformer(obj) {
  // console.log(JSON.stringify(obj, null, 2));
  if (!obj.methods) {
    return obj.page;
  }
  const contentArray = obj.page.blocks[1].areas.content.blocks[0].blocks[1].blocks;
  const operatorName = obj.page.properties.title;

  contentArray.push({
    id: `methods_title`,
    type: 'Markdown',
    properties: {
      content: '# Operator methods:',
    },
  });

  obj.methods.forEach((method) => {
    // console.log(method);
    contentArray.push({
      id: `${method.name}_link`,
      type: 'Anchor',
      properties: {
        title: `${operatorName}.${method.name}`,
        icon: 'AiOutlineLink',
      },
      events: {
        onClick: [
          {
            id: 'scroll',
            type: 'ScrollTo',
            params: {
              blockId: `${method.name}_title`,
            },
          },
        ],
      },
    });
  });

  // const methodsBlocks = [];
  obj.methods.forEach((method) => {
    // console.log(method);
    contentArray.push({
      id: `${method.name}_title`,
      type: 'Markdown',
      properties: {
        content: `## ${operatorName}.${method.name}`,
      },
    });
    contentArray.push({
      id: `${method.name}_types`,
      type: 'Markdown',
      style: {
        '.markdown-body': { fontSize: '14px' },
      },
      properties: {
        content: method.types,
      },
    });
    contentArray.push({
      id: `${method.name}_description`,
      type: 'MarkdownWithCode',
      properties: {
        content: method.description,
      },
    });
    if (method.arguments) {
      contentArray.push({
        id: `${method.name}_arguments_title`,
        type: 'Markdown',
        properties: {
          content: '#### Arguments',
        },
      });
      contentArray.push({
        id: `${method.name}_arguments`,
        type: 'MarkdownWithCode',
        properties: {
          content: method.arguments,
        },
      });
    }
    if (method.examples) {
      contentArray.push({
        id: `${method.name}_arguments_title`,
        type: 'Markdown',
        properties: {
          content: '#### Examples',
        },
      });
      contentArray.push({
        id: `${method.name}_examples`,
        type: 'MarkdownWithCode',
        properties: {
          content: method.examples,
        },
      });
    }
  });
  return obj.page;
}

export default transformer;
