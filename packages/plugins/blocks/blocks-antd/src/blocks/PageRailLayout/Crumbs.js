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
import { Popover } from 'antd';

import Mark from './Mark.js';
import SwitcherList from './SwitcherList.js';

// The bar's breadcrumb. A crumb with a switcher (an organisation, a space, a lens) opens a list to
// switch it in place; a crumb with a page links back; the last crumb is where the person is. The
// switchers lead, so they keep their place while the trail behind them shortens.
function Crumbs({
  blockId,
  className,
  components,
  crumbs,
  events,
  onAction,
  onCrumbClick,
  onSelect,
  style,
}) {
  const { Icon, Link } = components;
  const [openId, setOpenId] = useState(null);

  function renderCrumb(crumb, last) {
    const crumbBlockId = `${blockId}_crumb_${crumb.id}`;
    const inner = (
      <>
        <Mark
          blockId={crumbBlockId}
          components={components}
          events={events}
          mark={crumb.mark}
          size={20}
        />
        {crumb.icon && !crumb.mark && (
          <Icon blockId={`${crumbBlockId}_icon`} events={events} properties={crumb.icon} />
        )}
        <span className="lf-rail-crumb-label">{crumb.label}</span>
      </>
    );
    if (crumb.switcher) {
      const open = openId === crumb.id;
      return (
        <Popover
          open={open}
          onOpenChange={(next) => setOpenId(next ? crumb.id : null)}
          trigger="click"
          placement="bottomLeft"
          arrow={false}
          destroyOnHidden
          classNames={{ root: 'lf-rail-portal lf-rail-switcher-popover' }}
          content={
            <SwitcherList
              blockId={`${crumbBlockId}_switcher`}
              components={components}
              crumb={crumb}
              events={events}
              onAction={(action) => onAction(crumb, action)}
              onDone={() => setOpenId(null)}
              onSelect={(option) => onSelect(crumb, option)}
            />
          }
        >
          <button
            type="button"
            id={crumbBlockId}
            className={`lf-rail-crumb lf-rail-crumb-switch${open ? ' lf-rail-crumb-open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={crumb.switcher.ariaLabel ?? `${crumb.label}, switch`}
          >
            {inner}
            <Icon
              blockId={`${crumbBlockId}_chevron`}
              events={events}
              properties={{ name: 'chevron-down' }}
              classNames={{ element: 'lf-rail-crumb-chevron' }}
            />
          </button>
        </Popover>
      );
    }
    if (!last && (crumb.pageId || crumb.url)) {
      return (
        <Link
          id={crumbBlockId}
          className="lf-rail-crumb lf-rail-crumb-link"
          pageId={crumb.pageId}
          url={crumb.url}
          urlQuery={crumb.urlQuery}
          onClick={() => onCrumbClick(crumb)}
        >
          {inner}
        </Link>
      );
    }
    return (
      <span
        id={crumbBlockId}
        className="lf-rail-crumb lf-rail-crumb-current"
        aria-current={last ? 'page' : undefined}
      >
        {inner}
      </span>
    );
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`lf-rail-crumbs${className ? ` ${className}` : ''}`}
      style={style}
    >
      <ol>
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li
              key={crumb.id ?? index}
              className={`lf-rail-crumb-item${crumb.switcher ? ' lf-rail-crumb-item-switch' : ''}${
                last ? ' lf-rail-crumb-item-last' : ''
              }`}
            >
              {index > 0 && (
                <span className="lf-rail-crumb-separator" aria-hidden="true">
                  /
                </span>
              )}
              {renderCrumb(crumb, last)}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Crumbs;
