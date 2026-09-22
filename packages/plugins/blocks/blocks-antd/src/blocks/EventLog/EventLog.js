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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn, withBlockDefaults } from '@lowdefy/block-utils';
import { get, mergeObjects, type } from '@lowdefy/helpers';

import EventLogList from './EventLogList.js';
import EventLogRow from './EventLogRow.js';
import getRowLevel from './getRowLevel.js';
import getSearchConfig from './getSearchConfig.js';
import levels from './levels.js';
import stripHtml from './stripHtml.js';
import useSetData from '../../useSetData.js';
import cssStyles from './style.module.css';

// Dot paths read off each record. Every path is configurable, so any array of records renders.
const defaultFields = {
  id: '_id',
  time: 'created.timestamp',
  type: 'type',
  level: 'level',
  message: 'title',
  detail: 'description',
  actor: 'created.user',
  actorName: 'name',
  actorPicture: 'picture',
  context: 'metadata',
};

const defaultText = {
  all: 'All',
  clearSearch: 'Clear search',
  context: 'Context',
  copied: 'Copied',
  copy: 'Copy JSON',
  empty: 'No events.',
  error: 'Errors',
  info: 'Info',
  noResults: 'No matching events.',
  searchPlaceholder: 'Search events, context, ids…',
  success: 'Successes',
  systemActor: 'System',
  warning: 'Warnings',
};

const EventLog = ({
  blockId,
  classNames = {},
  components: { Icon },
  methods,
  properties,
  styles = {},
}) => {
  const data = useSetData({ properties, methods }) ?? [];
  const fields = useMemo(
    () => mergeObjects([defaultFields, properties.fields]),
    [properties.fields]
  );
  const text = useMemo(() => mergeObjects([defaultText, properties.text]), [properties.text]);
  const eventTypeConfig = properties.eventTypeConfig ?? {};
  const searchConfig = getSearchConfig(properties.search);
  const showLevelFilters = properties.levelFilters !== false;
  const useWindowScroll = type.isNone(properties.height);

  const methodsRef = useRef(methods);
  methodsRef.current = methods;

  // Each record is read once into a flat entry: the resolved display config, the severity, and a
  // lowercased blob the search filter matches against.
  const entries = useMemo(() => {
    const list = data.map((record, index) => {
      const row = type.isNone(record) ? {} : record;
      const eventType = get(row, fields.type, { default: null });
      const typeConfig = eventTypeConfig[eventType] ?? {};
      const message = get(row, fields.message, { default: null });
      const detail = get(row, fields.detail, { default: null });
      const context = get(row, fields.context, { default: null });
      const actor = get(row, fields.actor, { default: null });
      const messageText = stripHtml(message);
      return {
        actorName: type.isObject(actor) ? get(actor, fields.actorName, { default: null }) : actor,
        actorPicture: type.isObject(actor)
          ? get(actor, fields.actorPicture, { default: null })
          : null,
        blob: [eventType, typeConfig.title, messageText, stripHtml(detail), JSON.stringify(context)]
          .filter((part) => !type.isNone(part))
          .join(' ')
          .toLowerCase(),
        context,
        detail,
        eventType,
        id: get(row, fields.id, { default: null }) ?? index,
        level: getRowLevel({ fields, row, typeConfig }),
        message,
        messageText,
        row,
        time: get(row, fields.time, { default: null }),
        typeConfig,
      };
    });
    return properties.reverse === true ? list.reverse() : list;
  }, [data, eventTypeConfig, fields, properties.reverse]);

  const counts = useMemo(() => {
    const result = { all: entries.length, error: 0, warning: 0, success: 0, info: 0 };
    entries.forEach((entry) => {
      result[entry.level] += 1;
    });
    return result;
  }, [entries]);

  const filterPills = useMemo(() => {
    const options = type.isArray(properties.levelFilterOptions)
      ? properties.levelFilterOptions
      : ['all', ...levels].filter((key) => key === 'all' || counts[key] > 0);
    return options
      .filter((key) => key === 'all' || levels.includes(key))
      .map((key) => ({ key, label: text[key], count: counts[key] ?? 0 }));
  }, [properties.levelFilterOptions, counts, text]);

  const [levelFilter, setLevelFilter] = useState('all');

  const debounce = searchConfig?.debounce ?? 150;
  const minLength = searchConfig?.minLength ?? 0;
  const [rawQuery, setRawQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const debounceRef = useRef(null);
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );
  const onSearchChange = useCallback(
    (event) => {
      const query = event.target.value;
      setRawQuery(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setAppliedQuery(query), debounce);
    },
    [debounce]
  );
  const clearSearch = useCallback(() => {
    setRawQuery('');
    setAppliedQuery('');
  }, []);

  const visible = useMemo(() => {
    const query = appliedQuery.trim().toLowerCase();
    const filterByQuery = query.length > 0 && query.length >= minLength;
    return entries.filter((entry) => {
      if (levelFilter !== 'all' && entry.level !== levelFilter) return false;
      if (filterByQuery && !entry.blob.includes(query)) return false;
      return true;
    });
  }, [entries, appliedQuery, minLength, levelFilter]);

  const [openIds, setOpenIds] = useState(() => new Set());
  useEffect(() => {
    if (properties.defaultExpanded === true) {
      setOpenIds(new Set(entries.map((entry) => entry.id)));
    }
  }, [properties.defaultExpanded, entries]);

  const toggle = useCallback((entry) => {
    setOpenIds((previous) => {
      const next = new Set(previous);
      const expanded = !next.has(entry.id);
      if (expanded) next.add(entry.id);
      else next.delete(entry.id);
      methodsRef.current.triggerEvent({
        name: 'onExpand',
        event: { row: entry.row, expanded },
      });
      return next;
    });
    methodsRef.current.triggerEvent({ name: 'onRowClick', event: { row: entry.row } });
  }, []);

  const rowClassNames = useMemo(
    () => ({ row: classNames.row, detail: classNames.detail, context: classNames.context }),
    [classNames.row, classNames.detail, classNames.context]
  );
  const rowStyles = useMemo(
    () => ({ row: styles.row, detail: styles.detail, context: styles.context }),
    [styles.row, styles.detail, styles.context]
  );

  const itemContent = useCallback(
    (_index, entry) => (
      <EventLogRow
        blockId={blockId}
        classNames={rowClassNames}
        entry={entry}
        expanded={openIds.has(entry.id)}
        Icon={Icon}
        methodsRef={methodsRef}
        onToggle={() => toggle(entry)}
        styles={rowStyles}
        text={text}
      />
    ),
    [blockId, openIds, toggle, Icon, rowClassNames, rowStyles, text]
  );

  const showToolbar =
    entries.length > 0 &&
    (!type.isNone(searchConfig) || (showLevelFilters && filterPills.length > 1));

  return (
    <div id={blockId} className={cn(cssStyles.element, classNames.element)} style={styles.element}>
      {showToolbar && (
        <div className={cn(cssStyles.toolbar, classNames.toolbar)} style={styles.toolbar}>
          {!type.isNone(searchConfig) && (
            <div className={cn(cssStyles.search, classNames.search)} style={styles.search}>
              <svg
                className={cssStyles.searchIcon}
                width="13"
                height="13"
                viewBox="0 0 14 14"
                aria-hidden
              >
                <circle
                  cx="6"
                  cy="6"
                  r="4.25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M9.2 9.2 L12.5 12.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
              <input
                id={`${blockId}_search`}
                className={cssStyles.searchInput}
                type="text"
                value={rawQuery}
                onChange={onSearchChange}
                placeholder={searchConfig.placeholder ?? text.searchPlaceholder}
                spellCheck={false}
              />
              {rawQuery !== '' && (
                <button
                  type="button"
                  className={cssStyles.searchClear}
                  onClick={clearSearch}
                  aria-label={text.clearSearch}
                >
                  ×
                </button>
              )}
            </div>
          )}
          {showLevelFilters && filterPills.length > 1 && (
            <div className={cn(cssStyles.filters, classNames.filters)} style={styles.filters}>
              {filterPills.map((pill) => (
                <button
                  type="button"
                  key={pill.key}
                  className={cn(cssStyles.pill, levelFilter === pill.key && cssStyles.pillActive)}
                  data-level={pill.key}
                  onClick={() => setLevelFilter(pill.key)}
                >
                  {pill.label}
                  <span className={cssStyles.pillCount}>{pill.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <EventLogList
        classNames={classNames}
        entries={entries}
        height={properties.height}
        itemContent={itemContent}
        overscan={properties.overscan ?? 400}
        styles={styles}
        text={text}
        useWindowScroll={useWindowScroll}
        visible={visible}
      />
    </div>
  );
};

export default withBlockDefaults(EventLog);
