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

import React, { useEffect, useRef, useState } from 'react';

import Mark from './Mark.js';

const DEFAULT_FILTER_FROM = 6;

function matches(option, text) {
  if (!text) return true;
  const needle = text.trim().toLowerCase();
  return [option.label, option.description]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

// A switcher crumb's list: a filter once there are enough options, the options (the current one
// ticked), then the switcher's actions. Focus stays on the filter, or on the list when there is no
// filter, and the arrow keys move a highlight through the rows (aria-activedescendant); Enter
// picks the highlighted row, and a pick closes the list.
function SwitcherList({
  autoFocus = true,
  blockId,
  components,
  crumb,
  events,
  onAction,
  onDone,
  onSelect,
}) {
  const { Icon, Link } = components;
  const switcher = crumb.switcher ?? {};
  const options = switcher.options ?? [];
  const actions = switcher.actions ?? [];
  const showFilter = options.length >= (switcher.filterFrom ?? DEFAULT_FILTER_FROM);
  const [text, setText] = useState('');
  const shown = options.filter((option) => matches(option, text));
  const rows = [
    ...shown.map((row) => ({ kind: 'option', row })),
    ...actions.map((row) => ({ kind: 'action', row })),
  ];
  const selectedIndex = shown.findIndex((option) => option.selected);
  const [active, setActive] = useState(Math.max(0, selectedIndex));
  const focusRef = useRef(null);

  const rowId = (index) => rows[index] && `${blockId}_${rows[index].kind}_${rows[index].row.id}`;

  useEffect(() => {
    if (!autoFocus) return undefined;
    // The popup is positioned after its first render; focusing earlier scrolls the page.
    const frame = requestAnimationFrame(() => focusRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setActive(text ? 0 : Math.max(0, selectedIndex));
  }, [text]);

  useEffect(() => {
    document.getElementById(rowId(active))?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  function onKeyDown(event) {
    if (rows.length === 0) return;
    let next = null;
    if (event.key === 'ArrowDown') next = (active + 1) % rows.length;
    if (event.key === 'ArrowUp') next = (active - 1 + rows.length) % rows.length;
    if (event.key === 'Home' && !showFilter) next = 0;
    if (event.key === 'End' && !showFilter) next = rows.length - 1;
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById(rowId(active))?.querySelector('a, button')?.click();
      return;
    }
    if (next === null) return;
    event.preventDefault();
    setActive(next);
  }

  function renderRow({ kind, row }, index) {
    const pick = () => {
      onDone();
      if (kind === 'option') onSelect(row);
      else onAction(row);
    };
    const content = (
      <>
        {kind === 'option' ? (
          <Mark
            blockId={`${blockId}_${row.id}`}
            components={components}
            events={events}
            mark={row.mark}
            size={24}
          />
        ) : (
          <span className="lf-rail-switcher-action-icon">
            {row.icon && (
              <Icon blockId={`${blockId}_${row.id}_icon`} events={events} properties={row.icon} />
            )}
          </span>
        )}
        <span className="lf-rail-switcher-text">
          <span className="lf-rail-switcher-label">{row.label}</span>
          {row.description && (
            <span className="lf-rail-switcher-description">{row.description}</span>
          )}
        </span>
        {row.extra !== undefined && row.extra !== null && row.extra !== '' && (
          <span className="lf-rail-switcher-extra">{row.extra}</span>
        )}
        {kind === 'option' && row.selected && (
          <span className="lf-rail-switcher-check">
            <Icon
              blockId={`${blockId}_${row.id}_check`}
              events={events}
              properties={{ name: 'check' }}
            />
          </span>
        )}
      </>
    );
    const rowClass = 'lf-rail-switcher-row';
    return (
      <div
        key={`${kind}_${row.id}`}
        id={rowId(index)}
        className={`lf-rail-switcher-item${
          index === active ? ' lf-rail-switcher-item-active' : ''
        }`}
        role={kind === 'option' ? 'menuitemradio' : 'menuitem'}
        aria-checked={kind === 'option' ? row.selected === true : undefined}
        onMouseMove={() => index !== active && setActive(index)}
      >
        {row.pageId || row.url ? (
          <Link
            className={rowClass}
            pageId={row.pageId}
            url={row.url}
            urlQuery={row.urlQuery}
            newTab={row.newTab}
            onClick={pick}
          >
            {content}
          </Link>
        ) : (
          <button type="button" className={rowClass} tabIndex={-1} onClick={pick}>
            {content}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="lf-rail-switcher" onKeyDown={onKeyDown}>
      {switcher.title && <div className="lf-rail-switcher-title">{switcher.title}</div>}
      {showFilter && (
        <label className="lf-rail-switcher-filter">
          <Icon
            blockId={`${blockId}_filter_icon`}
            events={events}
            properties={{ name: 'search' }}
          />
          <input
            ref={focusRef}
            type="text"
            value={text}
            placeholder={switcher.placeholder ?? 'Find…'}
            aria-label={switcher.placeholder ?? `Find ${crumb.label ?? ''}`.trim()}
            aria-controls={`${blockId}_rows`}
            aria-activedescendant={rowId(active)}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
      )}
      <div
        id={`${blockId}_rows`}
        ref={showFilter ? undefined : focusRef}
        className="lf-rail-switcher-rows"
        role="menu"
        aria-label={crumb.label}
        tabIndex={showFilter ? -1 : 0}
        aria-activedescendant={showFilter ? undefined : rowId(active)}
      >
        {rows.slice(0, shown.length).map((row, index) => renderRow(row, index))}
        {shown.length === 0 && (
          <div className="lf-rail-switcher-empty">{switcher.empty ?? 'Nothing matches.'}</div>
        )}
        {actions.length > 0 && <div className="lf-rail-switcher-divider" role="separator" />}
        {rows.slice(shown.length).map((row, index) => renderRow(row, shown.length + index))}
      </div>
    </div>
  );
}

export default SwitcherList;
