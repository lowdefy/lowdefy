/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { blockDefaultProps, RenderHtml } from '@lowdefy/block-tools';
import { Descriptions } from 'antd';
import { type } from '@lowdefy/helpers';

const DescriptionsBlock = ({ blockId, properties, methods }) => {
  let dataItem = properties.items || [];
  if (type.isObject(dataItem)) {
    dataItem = Object.keys(dataItem).map((key) => ({ value: dataItem[key], key }));
  }
  const { makeCssClass } = methods;
  return (
    <Descriptions
      id={blockId}
      title={<RenderHtml html={properties.title} methods={methods} />}
      bordered={properties.bordered}
      column={properties.column}
      size={properties.size}
      layout={properties.layout}
      colon={properties.colon}
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
            label={<RenderHtml html={`${label}`} methods={methods} />}
            span={
              row.span ||
              (type.isFunction(itemOption.span) ? itemOption.span(row, i) : itemOption.span)
            }
            className={`${makeCssClass([
              { whiteSpace: 'pre-wrap' },
              type.isFunction(itemOption.style) ? itemOption.style(row, i) : itemOption.style,
              row.style,
            ])}`}
          >
            <RenderHtml html={`${value}`} methods={methods} />
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  );
};

DescriptionsBlock.defaultProps = blockDefaultProps;

export default DescriptionsBlock;
