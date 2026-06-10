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
import { Card, Input, Skeleton, theme } from 'antd';
import { Virtuoso } from 'react-virtuoso';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { nunjucksFunction } from '@lowdefy/nunjucks';
import { get, serializer, type } from '@lowdefy/helpers';

import withTheme from '../withTheme.js';
import useSetData from '../../useSetData.js';

const FIELD_SEPARATOR = '';
const SKELETON_COUNT = 4;

// The value stored on select: `valueKey` names the field, otherwise the whole item.
function valueOf(item, valueKey) {
  return type.isString(valueKey) && type.isObject(item) ? get(item, valueKey) : item;
}

// The identity used to match the current value back to a row: `primaryKey` (falling back to
// `valueKey`) names the field; with neither, the whole value is the identity.
function identityOf(x, effKey) {
  return type.isString(effKey) && type.isObject(x) ? get(x, effKey) : x;
}

const ListSelectorRow = React.memo(function ListSelectorRow({
  blockId,
  index,
  item,
  template,
  bordered,
  hoverable,
  size,
  gap,
  cardClassName,
  bodyClassName,
  cardStyle,
  bodyStyle,
  clickable,
  selectable,
  selectedKey,
  effKey,
  selectedClassName,
  selectedStyle,
  onRowClick,
  methodsRef,
}) {
  const html = useMemo(
    () => (template ? template({ item, index }) : null),
    [template, item, index]
  );
  const selected = useMemo(
    () =>
      selectedKey != null &&
      serializer.serializeToString(identityOf(item, effKey), { stable: true }) === selectedKey,
    [item, selectedKey, effKey]
  );
  const handleClick = useCallback(() => onRowClick(index, item), [onRowClick, index, item]);
  const className =
    [cardClassName, selected ? selectedClassName : null].filter(Boolean).join(' ') || undefined;
  return (
    <div style={{ paddingBottom: gap }}>
      <Card
        id={`${blockId}_${index}`}
        variant={bordered === false ? 'borderless' : 'outlined'}
        hoverable={hoverable}
        size={size}
        onClick={clickable ? handleClick : undefined}
        aria-selected={selectable ? selected : undefined}
        className={className}
        classNames={{ body: bodyClassName }}
        style={{
          outline: 'none',
          cursor: clickable ? 'pointer' : undefined,
          ...cardStyle,
          ...(selected ? selectedStyle : null),
        }}
        styles={{ body: bodyStyle }}
      >
        {html != null && renderHtml({ html, methods: methodsRef.current })}
      </Card>
    </div>
  );
});

function useSearchBlobs(data, fields, caseSensitive) {
  return useMemo(() => {
    if (!data || data.length === 0) return null;
    const normalize = caseSensitive ? (s) => s : (s) => s.toLowerCase();
    if (!type.isArray(fields) || fields.length === 0) {
      return data.map((item) => normalize(JSON.stringify(item) ?? ''));
    }
    return data.map((item) =>
      normalize(
        fields
          .map((f) => {
            const v = get(item, f);
            return type.isNone(v) ? '' : String(v);
          })
          .join(FIELD_SEPARATOR)
      )
    );
  }, [data, fields, caseSensitive]);
}

const ListSelector = ({
  blockId,
  classNames = {},
  events,
  loading,
  methods,
  properties,
  styles = {},
  value,
}) => {
  const data = useSetData({ properties, methods }) ?? [];
  const template = useMemo(
    () => (type.isString(properties.html) ? nunjucksFunction(properties.html) : null),
    [properties.html]
  );

  const selectable = properties.selectable !== false;
  const allowDeselect = properties.allowDeselect !== false;
  // `valueKey` names the field stored on select (otherwise the whole item). `primaryKey` (falling
  // back to `valueKey`) is the identity matched when the value is controlled via state.
  const valueKey = properties.valueKey;
  const effKey = type.isString(properties.primaryKey) ? properties.primaryKey : valueKey;

  // Selection lives in the block value (app state), so a single serialized key identifies the
  // selected row. When selection is off the block stores no value and renders like a plain list.
  const selectedKey = useMemo(
    () =>
      !selectable || type.isNone(value)
        ? null
        : serializer.serializeToString(identityOf(value, effKey), { stable: true }),
    [selectable, value, effKey]
  );

  const methodsRef = useRef(methods);
  methodsRef.current = methods;
  const selectableRef = useRef(selectable);
  selectableRef.current = selectable;
  const allowDeselectRef = useRef(allowDeselect);
  allowDeselectRef.current = allowDeselect;
  const selectedKeyRef = useRef(selectedKey);
  selectedKeyRef.current = selectedKey;
  const valueKeyRef = useRef(valueKey);
  valueKeyRef.current = valueKey;
  const effKeyRef = useRef(effKey);
  effKeyRef.current = effKey;

  const clickable = selectable || Boolean(events.onClick);
  const onRowClick = useCallback((index, item) => {
    if (selectableRef.current) {
      const itemKey = serializer.serializeToString(identityOf(item, effKeyRef.current), {
        stable: true,
      });
      const deselect = allowDeselectRef.current && itemKey === selectedKeyRef.current;
      const newValue = deselect ? null : valueOf(item, valueKeyRef.current);
      methodsRef.current.setValue(newValue);
      methodsRef.current.triggerEvent({
        name: 'onChange',
        event: { value: newValue, index, item },
      });
    }
    methodsRef.current.triggerEvent({ name: 'onClick', event: { index, item } });
  }, []);

  const { token } = theme.useToken();

  const selectedStyle = useMemo(
    () => ({
      borderColor: token.colorPrimary,
      boxShadow: `0 0 0 1px ${token.colorPrimary}`,
      ...styles.selected,
    }),
    [token.colorPrimary, styles.selected]
  );

  const gap = properties.gap ?? 8;
  const useWindowScroll = type.isNone(properties.height);
  const overscan = properties.overscan ?? 400;

  const search = properties.search;
  const searchEnabled = type.isObject(search);
  const searchCaseSensitive = searchEnabled ? !!search.caseSensitive : false;
  const searchFields = searchEnabled ? search.fields : null;
  const searchMinLength = searchEnabled ? search.minLength ?? 0 : 0;
  const searchDebounce = searchEnabled ? search.debounce ?? 150 : 150;
  const searchSticky = searchEnabled ? search.sticky !== false : false;
  const searchAllowClear = searchEnabled ? search.allowClear !== false : true;
  const searchPlaceholder = searchEnabled
    ? search.placeholder ?? methods.translate('blocks.listSelector.search.placeholder')
    : '';
  const noResultsText = searchEnabled
    ? search.noResultsText ?? methods.translate('blocks.listSelector.search.noResults')
    : '';
  const noDataText = properties.noData ?? methods.translate('blocks.listSelector.noData');

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
    (e) => {
      const v = e.target.value;
      setRawQuery(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setAppliedQuery(v), searchDebounce);
    },
    [searchDebounce]
  );

  const blobs = useSearchBlobs(
    searchEnabled ? data : null,
    searchEnabled ? searchFields : null,
    searchCaseSensitive
  );

  const filterActive = searchEnabled && appliedQuery && appliedQuery.length >= searchMinLength;

  const filteredEntries = useMemo(() => {
    if (!filterActive || !blobs) return null;
    const needle = searchCaseSensitive ? appliedQuery : appliedQuery.toLowerCase();
    const out = [];
    for (let i = 0; i < blobs.length; i++) {
      if (blobs[i].includes(needle)) out.push({ originalIndex: i, item: data[i] });
    }
    return out;
  }, [filterActive, blobs, data, appliedQuery, searchCaseSensitive]);

  const lastFiredQueryRef = useRef('');
  useEffect(() => {
    if (!searchEnabled) return;
    if (lastFiredQueryRef.current === appliedQuery) return;
    lastFiredQueryRef.current = appliedQuery;
    const resultCount = filterActive ? (filteredEntries ? filteredEntries.length : 0) : data.length;
    methodsRef.current.triggerEvent({
      name: 'onSearch',
      event: { value: appliedQuery, resultCount },
    });
  }, [searchEnabled, appliedQuery, filterActive, filteredEntries, data]);

  const itemContent = useCallback(
    (_virtualIndex, payload) => {
      const isEntry =
        filterActive && payload && type.isObject(payload) && 'originalIndex' in payload;
      const index = isEntry ? payload.originalIndex : _virtualIndex;
      const item = isEntry ? payload.item : payload;
      return (
        <ListSelectorRow
          blockId={blockId}
          index={index}
          item={item}
          template={template}
          bordered={properties.bordered}
          hoverable={properties.hoverable}
          size={properties.size}
          gap={gap}
          cardClassName={classNames.card}
          bodyClassName={classNames.body}
          cardStyle={styles.card}
          bodyStyle={styles.body}
          clickable={clickable}
          selectable={selectable}
          selectedKey={selectedKey}
          effKey={effKey}
          selectedClassName={classNames.selected}
          selectedStyle={selectedStyle}
          onRowClick={onRowClick}
          methodsRef={methodsRef}
        />
      );
    },
    [
      filterActive,
      blockId,
      template,
      properties.bordered,
      properties.hoverable,
      properties.size,
      gap,
      classNames.card,
      classNames.body,
      classNames.selected,
      styles.card,
      styles.body,
      clickable,
      selectable,
      selectedKey,
      effKey,
      selectedStyle,
      onRowClick,
    ]
  );

  const computeItemKey = useCallback(
    (_virtualIndex, payload) => {
      if (filterActive && payload && type.isObject(payload) && 'originalIndex' in payload) {
        return `${blockId}_${payload.originalIndex}`;
      }
      return `${blockId}_${_virtualIndex}`;
    },
    [blockId, filterActive]
  );

  const containerStyle = useWindowScroll
    ? styles.element
    : { display: 'flex', flexDirection: 'column', height: properties.height, ...styles.element };

  const headerStyle = {
    position: searchSticky ? 'sticky' : undefined,
    top: 0,
    zIndex: 1,
    paddingBottom: gap,
  };

  const placeholderStyle = {
    padding: token.paddingLG,
    textAlign: 'center',
    color: token.colorTextSecondary,
  };

  const renderSearch = () =>
    searchEnabled ? (
      <div style={headerStyle} className={classNames.search}>
        <Input.Search
          id={`${blockId}_search`}
          placeholder={searchPlaceholder}
          allowClear={searchAllowClear}
          value={rawQuery}
          onChange={onSearchChange}
        />
      </div>
    ) : null;

  if (loading) {
    return (
      <div id={blockId} className={classNames.element} style={containerStyle}>
        {renderSearch()}
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={`${blockId}_skeleton_${i}`} style={{ paddingBottom: gap }}>
            <Card
              variant={properties.bordered === false ? 'borderless' : 'outlined'}
              size={properties.size}
              className={classNames.card}
              styles={{ body: styles.body }}
            >
              <Skeleton active title paragraph={{ rows: 2 }} />
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div id={blockId} className={classNames.element} style={containerStyle}>
        <div className={classNames.noData} style={placeholderStyle}>
          {noDataText}
        </div>
      </div>
    );
  }

  const virtuosoData = filterActive ? filteredEntries : data;
  const virtuosoStyle = useWindowScroll ? undefined : { flex: '1 1 auto', minHeight: 0 };

  return (
    <div id={blockId} className={classNames.element} style={containerStyle}>
      {renderSearch()}
      {filterActive && filteredEntries.length === 0 ? (
        <div className={classNames.noResults} style={placeholderStyle}>
          {noResultsText}
        </div>
      ) : (
        <Virtuoso
          data={virtuosoData}
          style={virtuosoStyle}
          useWindowScroll={useWindowScroll}
          overscan={overscan}
          increaseViewportBy={overscan}
          itemContent={itemContent}
          computeItemKey={computeItemKey}
        />
      )}
    </div>
  );
};

export default withTheme('Card', withBlockDefaults(ListSelector));
