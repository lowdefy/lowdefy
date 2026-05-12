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

import React, { useState } from 'react';

const URL_REGEX = /^https?:\/\/\S+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})/;

function isUrl(value) {
  return typeof value === 'string' && URL_REGEX.test(value);
}

function isIsoDate(value) {
  return typeof value === 'string' && ISO_DATE_REGEX.test(value) && !isNaN(Date.parse(value));
}

function humanizeKey(key) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function CollapsibleText({ text, limit, translate }) {
  const t = translate ?? ((_, fallback) => fallback);
  const [expanded, setExpanded] = useState(false);
  if (text.length <= limit) return <span>{text}</span>;
  return (
    <span>
      {expanded ? text : `${text.slice(0, limit)}...`}
      <a
        onClick={() => setExpanded(!expanded)}
        style={{ marginLeft: 4, fontSize: '0.85em', cursor: 'pointer' }}
      >
        {expanded ? t('agent.toolResult.showLess') : t('agent.toolResult.showMore')}
      </a>
    </span>
  );
}

function formatValue(value, depth, translate) {
  if (value === null || value === undefined) {
    return <span style={{ color: '#999' }}>{'\u2014'}</span>;
  }
  if (typeof value === 'boolean') {
    return <span>{value ? 'Yes' : 'No'}</span>;
  }
  if (typeof value === 'number') {
    return <span>{value.toLocaleString()}</span>;
  }
  if (isUrl(value)) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
        {value}
      </a>
    );
  }
  if (isIsoDate(value)) {
    return <span>{new Date(value).toLocaleString()}</span>;
  }
  if (typeof value === 'string') {
    if (value.length > 200) {
      return <CollapsibleText text={value} limit={200} translate={translate} />;
    }
    return <span>{value}</span>;
  }
  if (Array.isArray(value)) {
    return formatArray(value, depth, translate);
  }
  if (typeof value === 'object') {
    return formatObject(value, depth, translate);
  }
  return <span>{String(value)}</span>;
}

function formatArray(arr, depth, translate) {
  const t = translate ?? ((_, fallback) => fallback);
  if (arr.length === 0) {
    return <span style={{ color: '#999' }}>{t('agent.toolResult.emptyList')}</span>;
  }
  const allPrimitive = arr.every(
    (item) => item === null || item === undefined || typeof item !== 'object'
  );
  if (allPrimitive) {
    return (
      <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
        {arr.map((item, i) => (
          <li key={i}>{formatValue(item, depth + 1, translate)}</li>
        ))}
      </ul>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0' }}>
      {arr.map((item, i) => (
        <div
          key={i}
          style={{
            padding: '8px 10px',
            borderRadius: 6,
            background: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          {formatValue(item, depth + 1, translate)}
        </div>
      ))}
    </div>
  );
}

function formatObject(obj, depth, translate) {
  const t = translate ?? ((_, fallback) => fallback);
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return <span style={{ color: '#999' }}>{t('agent.toolResult.empty')}</span>;
  }
  return (
    <div
      style={{ paddingLeft: depth > 0 ? 12 : 0, display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {keys.map((key) => {
        const val = obj[key];
        const isNested = val !== null && typeof val === 'object' && !Array.isArray(val);
        const isArray = Array.isArray(val);
        if (isNested || isArray) {
          return (
            <div key={key} style={{ marginTop: 4 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9em', marginBottom: 2 }}>
                {humanizeKey(key)}
              </div>
              {formatValue(val, depth + 1, translate)}
            </div>
          );
        }
        return (
          <div key={key}>
            <span style={{ fontWeight: 600, fontSize: '0.9em', color: 'rgba(0, 0, 0, 0.55)' }}>
              {humanizeKey(key)}:{' '}
            </span>
            {formatValue(val, depth + 1, translate)}
          </div>
        );
      })}
    </div>
  );
}

function formatToolResult(output, translate) {
  const t = translate ?? ((_, fallback) => fallback);
  if (output === null || output === undefined) {
    return <span style={{ color: '#999' }}>{t('agent.toolResult.completedNoData')}</span>;
  }
  return (
    <div style={{ fontSize: '0.9em', lineHeight: 1.5, maxHeight: 400, overflowY: 'auto' }}>
      {formatValue(output, 0, translate)}
    </div>
  );
}

export default formatToolResult;
