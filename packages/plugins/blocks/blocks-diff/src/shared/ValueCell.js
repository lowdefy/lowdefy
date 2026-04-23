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
import { Collapse, Space, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { type } from '@lowdefy/helpers';

import { CHANGE_TYPES } from './constants.js';
import formatValue from './formatValue.js';

const { Text } = Typography;

function isComplex(value) {
  return type.isObject(value) || type.isArray(value);
}

// Formatters that produce their own coloured/bordered element already
// communicate the value visually; wrapping them in another highlight strip
// just nests two rectangles, so the emphasis styles are skipped for them.
const SELF_STYLED_FORMATTERS = new Set(['enum', 'boolean', 'json', 'code']);

function isSelfStyled(formatter) {
  return type.isObject(formatter) && SELF_STYLED_FORMATTERS.has(formatter.type);
}

function renderOld(value, formatter) {
  if (isSelfStyled(formatter)) {
    return (
      <span style={{ opacity: 0.55, filter: 'grayscale(0.3)' }} className="lf-datadiff-old">
        {formatValue(value, formatter)}
      </span>
    );
  }
  return (
    <span
      style={{
        textDecoration: 'line-through',
        color: 'var(--ant-color-text-tertiary, rgba(0,0,0,0.45))',
      }}
      className="lf-datadiff-old"
    >
      {formatValue(value, formatter)}
    </span>
  );
}

function renderNew(value, formatter) {
  if (isSelfStyled(formatter)) {
    return <span className="lf-datadiff-new">{formatValue(value, formatter)}</span>;
  }
  return (
    <span
      style={{
        background: 'var(--ant-color-success-bg, rgba(82,196,26,0.1))',
        padding: '1px 6px',
        borderRadius: 'var(--ant-border-radius-sm, 4px)',
        color: 'var(--ant-color-success-text, var(--ant-color-text))',
      }}
      className="lf-datadiff-new"
    >
      {formatValue(value, formatter)}
    </span>
  );
}

function describeComplex(value) {
  if (type.isArray(value)) {
    const n = value.length;
    return `${n} ${n === 1 ? 'item' : 'items'}`;
  }
  const n = Object.keys(value).length;
  return `${n} ${n === 1 ? 'field' : 'fields'}`;
}

function renderCollapsibleObject(value, formatter) {
  const items = [
    {
      key: 'details',
      label: <Text type="secondary">{describeComplex(value)}</Text>,
      children: formatValue(value, formatter ?? { type: 'json' }),
    },
  ];
  return <Collapse size="small" ghost items={items} />;
}

function ValueCell({ change, collapseNested = true }) {
  const { type: changeType, oldValue, newValue, formatter } = change;

  if (changeType === CHANGE_TYPES.CREATE) {
    if (collapseNested && isComplex(newValue) && type.isNone(formatter)) {
      return renderCollapsibleObject(newValue, formatter);
    }
    return renderNew(newValue, formatter);
  }

  if (changeType === CHANGE_TYPES.REMOVE) {
    if (collapseNested && isComplex(oldValue) && type.isNone(formatter)) {
      return renderCollapsibleObject(oldValue, formatter);
    }
    return renderOld(oldValue, formatter);
  }

  if (changeType === CHANGE_TYPES.UNCHANGED) {
    return <Text type="secondary">{formatValue(newValue, formatter)}</Text>;
  }

  return (
    <Space size={8} wrap>
      {renderOld(oldValue, formatter)}
      <ArrowRightOutlined
        style={{ color: 'var(--ant-color-text-quaternary, rgba(0,0,0,0.25))', fontSize: 12 }}
      />
      {renderNew(newValue, formatter)}
    </Space>
  );
}

export default ValueCell;
