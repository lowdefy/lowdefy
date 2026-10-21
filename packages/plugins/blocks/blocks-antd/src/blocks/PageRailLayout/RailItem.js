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

import RailBadge from './RailBadge.js';

// One icon over a short label: a place in the rail, a foot item, or a tab in the phone tab bar.
// With a page or url it is a link; without, a button that fires onClick.
function RailItem({
  active = false,
  badge,
  blockId,
  className,
  components: { Icon, Link },
  events,
  hideTip = false,
  icon,
  link,
  onClick,
  style,
  tip,
  title,
}) {
  const content = (
    <>
      <span className="lf-rail-icon">
        {icon && (
          <Icon
            blockId={`${blockId}_icon`}
            events={events}
            properties={icon}
            classNames={{ element: 'lf-rail-icon-glyph' }}
          />
        )}
        {badge && <RailBadge {...badge} />}
      </span>
      <span className="lf-rail-label">{title}</span>
    </>
  );
  const itemClassName = `lf-rail-item${active ? ' lf-rail-item-active' : ''}${
    className ? ` ${className}` : ''
  }`;
  const hasTarget = link && (link.pageId || link.url);
  const item = hasTarget ? (
    <Link
      {...link}
      id={`${blockId}_link`}
      className={itemClassName}
      style={style}
      onClick={onClick}
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      id={`${blockId}_button`}
      className={itemClassName}
      style={style}
      onClick={onClick}
    >
      {content}
    </button>
  );
  const tipText = hideTip ? null : (
    <>
      <div className="lf-rail-tip-title">{title}</div>
      {tip && <div className="lf-rail-tip-text">{tip}</div>}
    </>
  );
  return (
    <Tooltip title={tipText} placement="right" mouseEnterDelay={0.3}>
      <div className="lf-rail-item-wrap" aria-current={active ? 'page' : undefined}>
        {item}
      </div>
    </Tooltip>
  );
}

export default RailItem;
