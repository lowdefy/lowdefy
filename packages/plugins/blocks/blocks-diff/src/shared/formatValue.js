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
import { Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { type } from '@lowdefy/helpers';

const { Text } = Typography;

function renderEmpty() {
  return <Text type="secondary">—</Text>;
}

function renderDate(value, { pattern = 'YYYY-MM-DD' } = {}) {
  const parsed = dayjs(value);
  if (!parsed.isValid()) return <Text>{String(value)}</Text>;
  return <Text>{parsed.format(pattern)}</Text>;
}

function renderDateTime(value, { pattern = 'YYYY-MM-DD HH:mm' } = {}) {
  const parsed = dayjs(value);
  if (!parsed.isValid()) return <Text>{String(value)}</Text>;
  return <Text>{parsed.format(pattern)}</Text>;
}

function renderBoolean(value, { yes = 'Yes', no = 'No' } = {}) {
  const truthy = Boolean(value);
  return <Tag color={truthy ? 'success' : 'default'}>{truthy ? yes : no}</Tag>;
}

function renderCurrency(value, { locale, currency = 'USD' } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return <Text>{String(value)}</Text>;
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(number);
    return <Text>{formatted}</Text>;
  } catch (_err) {
    return <Text>{String(value)}</Text>;
  }
}

function renderJson(value) {
  return (
    <pre
      style={{
        margin: 0,
        padding: '8px 10px',
        fontSize: '0.85em',
        background: 'var(--ant-color-fill-tertiary, rgba(0,0,0,0.04))',
        border: '1px solid var(--ant-color-border-secondary, rgba(0,0,0,0.06))',
        borderRadius: 'var(--ant-border-radius-sm, 4px)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function renderCode(value) {
  return <Typography.Text code>{String(value)}</Typography.Text>;
}

function renderEnum(value, { map = {} } = {}) {
  const key = String(value);
  const entry = map[key];
  if (type.isNone(entry)) return <Tag>{key}</Tag>;
  if (type.isString(entry)) return <Tag>{entry}</Tag>;
  if (type.isObject(entry)) {
    return <Tag color={entry.color}>{entry.label ?? key}</Tag>;
  }
  return <Tag>{key}</Tag>;
}

function renderFallback(value) {
  if (type.isPrimitive(value)) return <Text>{String(value)}</Text>;
  return renderJson(value);
}

function formatValue(value, formatter) {
  if (type.isNone(value)) return renderEmpty();
  const formatType = type.isObject(formatter) ? formatter.type : undefined;
  switch (formatType) {
    case 'date':
      return renderDate(value, formatter);
    case 'datetime':
      return renderDateTime(value, formatter);
    case 'boolean':
      return renderBoolean(value, formatter);
    case 'currency':
      return renderCurrency(value, formatter);
    case 'json':
      return renderJson(value);
    case 'code':
      return renderCode(value);
    case 'enum':
      return renderEnum(value, formatter);
    default:
      return renderFallback(value);
  }
}

export default formatValue;
