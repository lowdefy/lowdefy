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
import { Avatar } from 'antd';
import { type } from '@lowdefy/helpers';
import NullCell from './NullCell.js';
import { resolveLink, resolvePath } from './resolveFieldRefs.js';
import { buildHref } from './LinkCell.js';

function initials(name) {
  if (!type.isString(name) || name.length === 0) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function colorSeed(id) {
  if (type.isNone(id)) return 0;
  const s = String(id);
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return hash;
}

const SEED_COLORS = [
  'var(--ant-color-info)',
  'var(--ant-color-success)',
  'var(--ant-color-warning)',
  'var(--ant-color-error)',
  'var(--ant-color-purple, var(--ant-color-info))',
  'var(--ant-color-cyan, var(--ant-color-info))',
  'var(--ant-color-magenta, var(--ant-color-error))',
];

const rowStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--ant-margin-xs, 8px)',
  maxWidth: '100%',
};

const labelStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const linkStyle = { ...labelStyle, color: 'var(--ant-color-link)', cursor: 'pointer' };

function AvatarCell(params) {
  const { value, data, cellConfig, methods } = params;
  const name = type.isString(cellConfig?.nameField)
    ? resolvePath(cellConfig.nameField, data)
    : value;
  const src = type.isString(cellConfig?.srcField)
    ? resolvePath(cellConfig.srcField, data)
    : undefined;
  const id = type.isString(cellConfig?.idField) ? resolvePath(cellConfig.idField, data) : undefined;

  if (type.isNone(name) && type.isNone(src)) {
    return <NullCell />;
  }

  const shape = cellConfig?.shape === 'square' ? 'square' : 'circle';
  const size = 'var(--lf-avatar-size, var(--ant-control-height-sm, 24px))';
  const fontSize = 'var(--lf-avatar-font-size, var(--ant-font-size-sm, 12px))';
  const bg = SEED_COLORS[colorSeed(id ?? name) % SEED_COLORS.length];

  const avatar = (
    <Avatar
      src={src || undefined}
      shape={shape}
      style={{
        width: size,
        height: size,
        minWidth: size,
        lineHeight: size,
        fontSize,
        backgroundColor: src ? undefined : bg,
        color: 'var(--ant-color-text-light-solid, #fff)',
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </Avatar>
  );

  const link = cellConfig?.link ? resolveLink(cellConfig.link, data) : undefined;

  if (link) {
    const href = buildHref(link);
    const onClick = (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
      if (link.newTab) return;
      event.preventDefault();
      methods?.triggerEvent?.({
        name: 'onCellLink',
        event: { link, row: data, value },
      });
    };
    return (
      <span style={rowStyle}>
        {avatar}
        <a
          href={href ?? '#'}
          style={linkStyle}
          onClick={onClick}
          target={link.newTab ? '_blank' : undefined}
          rel={link.newTab ? 'noopener noreferrer' : undefined}
        >
          {String(name ?? '')}
        </a>
      </span>
    );
  }

  return (
    <span style={rowStyle}>
      {avatar}
      <span style={labelStyle}>{String(name ?? '')}</span>
    </span>
  );
}

export default AvatarCell;
