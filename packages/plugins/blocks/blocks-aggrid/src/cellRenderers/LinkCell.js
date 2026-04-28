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
import { type } from '@lowdefy/helpers';
import NullCell from './NullCell.js';
import { resolveLink, resolveUrlQuery } from './resolveFieldRefs.js';

function buildHref(link) {
  if (!type.isObject(link)) return undefined;
  if (type.isString(link.href)) return link.href;
  if (!type.isString(link.pageId)) return undefined;
  const query = type.isObject(link.urlQuery)
    ? Object.entries(link.urlQuery)
        .filter(([, v]) => !type.isNone(v))
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return `/${link.pageId}${query ? `?${query}` : ''}`;
}

const linkStyle = {
  color: 'var(--ant-color-link)',
  cursor: 'pointer',
  textDecoration: 'none',
};

function LinkCell(params) {
  const { value, data, cellConfig, methods } = params;
  if (type.isNone(value) || value === '') {
    return <NullCell />;
  }

  const label = type.isString(cellConfig?.labelField)
    ? String(data?.[cellConfig.labelField] ?? value)
    : String(value);

  const link = resolveLink(
    {
      pageId: cellConfig?.pageId,
      href: cellConfig?.href,
      back: cellConfig?.back,
      home: cellConfig?.home,
      newTab: cellConfig?.newTab,
      urlQuery: cellConfig?.urlQuery,
    },
    data
  );

  const href = buildHref(link);

  function onClick(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
    if (cellConfig?.newTab) return;
    event.preventDefault();
    methods?.triggerEvent?.({
      name: 'onCellLink',
      event: { link, row: data, value },
    });
  }

  return (
    <a
      href={href ?? '#'}
      style={linkStyle}
      onClick={onClick}
      target={cellConfig?.newTab ? '_blank' : undefined}
      rel={cellConfig?.newTab ? 'noopener noreferrer' : undefined}
    >
      {label}
    </a>
  );
}

export { buildHref, resolveUrlQuery };
export default LinkCell;
