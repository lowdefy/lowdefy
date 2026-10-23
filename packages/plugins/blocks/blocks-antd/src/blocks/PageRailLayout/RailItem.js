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
import { Tooltip } from 'antd';

import getBadge from './getBadge.js';

// One icon over a short label: a place or foot item in the rail, a tab in the phone tab bar, or a
// row in the phone's More sheet. With a page or url it is a link; without, a button.
function RailItem({
  active = false,
  badge,
  blockId,
  className,
  components: { Icon, Link },
  events,
  hideTip = false,
  icon,
  iconNode,
  link,
  onClick,
  shortcutLabel,
  style,
  tip,
  title,
}) {
  const shownBadge = getBadge(badge);
  const ariaLabel = [
    title,
    shownBadge && !shownBadge.dot ? shownBadge.label ?? shownBadge.text : null,
  ]
    .filter(Boolean)
    .join(', ');
  const content = (
    <>
      <span className="lf-rail-item-icon">
        {iconNode ??
          (icon && (
            <Icon
              blockId={`${blockId}_icon`}
              events={events}
              properties={icon}
              classNames={{ element: 'lf-rail-item-glyph' }}
            />
          ))}
        {shownBadge && (
          <span
            className={`lf-rail-badge lf-rail-badge-${shownBadge.tone}${
              shownBadge.dot ? ' lf-rail-badge-dot' : ''
            }`}
            aria-hidden="true"
          >
            {shownBadge.dot ? null : shownBadge.text}
          </span>
        )}
      </span>
      <span className="lf-rail-item-label">{title}</span>
    </>
  );
  const itemClassName = `lf-rail-item${active ? ' lf-rail-item-active' : ''}${
    className ? ` ${className}` : ''
  }`;
  const item =
    link && (link.pageId || link.url) ? (
      <Link
        {...link}
        id={blockId}
        ariaLabel={ariaLabel}
        className={itemClassName}
        style={style}
        onClick={onClick}
      >
        {content}
      </Link>
    ) : (
      <button
        type="button"
        id={blockId}
        aria-label={ariaLabel}
        className={itemClassName}
        style={style}
        onClick={onClick}
      >
        {content}
      </button>
    );
  if (hideTip) return item;
  const tipText = (
    <span className="lf-rail-tip">
      <span className="lf-rail-tip-title">
        {title}
        {shortcutLabel && <kbd className="lf-rail-tip-kbd">{shortcutLabel}</kbd>}
      </span>
      {tip && <span className="lf-rail-tip-text">{tip}</span>}
    </span>
  );
  return (
    <Tooltip
      title={tipText}
      placement="right"
      mouseEnterDelay={0.4}
      classNames={{ root: 'lf-rail-portal' }}
    >
      <span className="lf-rail-item-wrap" aria-current={active ? 'page' : undefined}>
        {item}
      </span>
    </Tooltip>
  );
}

export default RailItem;
