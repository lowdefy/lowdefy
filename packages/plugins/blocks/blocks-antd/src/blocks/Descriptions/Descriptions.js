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

import React from 'react';

import { renderHtml } from '@lowdefy/block-utils';
import { Descriptions } from 'antd';
import { type } from '@lowdefy/helpers';

import withTheme from '../withTheme.js';

const DescriptionsBlock = ({
  blockId,
  classNames = {},
  content,
  properties,
  methods,
  styles = {},
}) => {
  let dataItem = properties.items || [];
  if (type.isObject(dataItem)) {
    dataItem = Object.keys(dataItem).map((key) => ({ value: dataItem[key], key }));
  }
  return (
    <Descriptions
      id={blockId}
      variant={properties.bordered === false ? 'borderless' : properties.variant}
      colon={properties.colon}
      column={properties.column}
      extra={content.extra && content.extra()}
      layout={properties.layout}
      size={properties.size}
      title={renderHtml({ html: properties.title, methods })}
      className={classNames.element}
      classNames={{ content: classNames.content, label: classNames.label }}
      style={styles.element}
      styles={{ content: styles.content, label: styles.label }}
    >
      {dataItem.map((item, i) => {
        let row = item;
        if (type.isPrimitive(item)) {
          row = { value: item, key: item.toString() };
        }
        const itemOption =
          (properties.itemOptions || []).find((item) => row.key === item.key) || {};
        const value = type.isFunction(itemOption.transformValue)
          ? itemOption.transformValue(row.value, row, i)
          : row.value;
        const label = type.isFunction(itemOption.transformLabel)
          ? itemOption.transformLabel(row.key || row.label, row, i)
          : row.key || row.label;
        return (
          <Descriptions.Item
            key={i}
            label={renderHtml({ html: label, methods })}
            contentStyle={row.contentStyle}
            labelStyle={row.labelStyle}
            span={
              row.span ||
              (type.isFunction(itemOption.span) ? itemOption.span(row, i) : itemOption.span)
            }
            style={{
              whiteSpace: 'pre-wrap',
              ...(type.isFunction(itemOption.style) ? itemOption.style(row, i) : itemOption.style),
              ...row.style,
            }}
          >
            {renderHtml({ html: value, methods })}
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  );
};

DescriptionsBlock.meta = {
  category: 'container',
  icons: [],
  cssKeys: ['element', 'content', 'label'],
};

export default withTheme('Descriptions', DescriptionsBlock);
