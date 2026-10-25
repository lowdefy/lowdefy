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

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Empty, Input, Modal, Spin } from 'antd';
import { cn } from '@lowdefy/block-utils';
import { journeyTargetSelectors } from '@lowdefy/helpers';

import SearchResults from './SearchResults.js';
import matchesShortcut from './matchesShortcut.js';
import parseShortcut from '../parseShortcut.js';
import useListKeyboardNav from './useListKeyboardNav.js';
import { buildSections, fillQuery } from './searchSections.js';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

function SearchModal({
  blockId,
  components: { Icon, ShortcutBadge },
  open,
  onClose,
  properties,
  methods,
  classNames = {},
  styles = {},
  searchIndex,
  recentSearches,
  recentResults,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const resultMapping = {
    ...(searchIndex.resultDefaults ?? {}),
    ...(properties.result ?? {}),
  };
  const groups = properties.groups ?? searchIndex.groups ?? [];
  const maxResults = properties.maxResults ?? 20;

  const pinned = properties.pinned;
  const pinnedShortcut = parseShortcut(pinned?.shortcut);

  const highlightTerms = results.length > 0 ? results[0].terms : [];

  // With an empty input the list is the recent results. Items are in display (grouped) order, so
  // the keyboard index matches what is on screen.
  const showRecentResults = !query && recentResults.recentResults.length > 0;
  const sections = showRecentResults
    ? [
        {
          label: 'Recent',
          items: recentResults.recentResults,
          total: recentResults.recentResults.length,
        },
      ]
    : buildSections({ results, groups, resultMapping, maxResults });
  const displayOrderResults = sections.flatMap((section) => section.items);
  const hasResults = displayOrderResults.length > 0;
  const showPinned = !!pinned && !!query.trim() && !searchIndex.loading;
  const pinnedIndex = displayOrderResults.length;

  const handleSelect = useCallback(
    (item) => {
      recentSearches.addSearch(query);
      recentResults.addResult(item);
      methods.triggerEvent({
        name: 'onSelect',
        event: { ...item, query, resultCount: results.length },
      });
      onClose();
    },
    [query, results, methods, onClose, recentSearches, recentResults]
  );

  const handlePinned = useCallback(() => {
    methods.triggerEvent({ name: pinned?.event ?? 'onPinned', event: { query } });
    onClose();
  }, [query, methods, onClose, pinned]);

  const handleSeeAll = useCallback(
    (section) => {
      const seeAll = section.seeAll;
      const event = {
        group: section.label,
        count: section.total,
        query,
        ...(typeof seeAll === 'object'
          ? { pageId: seeAll.pageId, urlQuery: fillQuery(seeAll.urlQuery, query) }
          : {}),
      };
      methods.triggerEvent({
        name: typeof seeAll === 'string' ? seeAll : 'onSeeAll',
        event,
      });
      onClose();
    },
    [query, methods, onClose]
  );

  const handleSelectByIndex = useCallback(
    (index) => {
      if (showPinned && index === pinnedIndex) {
        handlePinned();
      } else if (displayOrderResults[index]) {
        handleSelect(displayOrderResults[index]);
      }
    },
    [displayOrderResults, handleSelect, handlePinned, showPinned, pinnedIndex]
  );

  const { selectedIndex, onKeyDown: onNavKeyDown } = useListKeyboardNav({
    itemCount: displayOrderResults.length + (showPinned ? 1 : 0),
    onSelect: handleSelectByIndex,
  });

  // The pinned row's shortcut works from any row, so it is checked before list navigation.
  const onKeyDown = useCallback(
    (e) => {
      if (showPinned && matchesShortcut(e, pinnedShortcut, isMac)) {
        e.preventDefault();
        handlePinned();
        return;
      }
      onNavKeyDown(e);
    },
    [showPinned, pinnedShortcut, handlePinned, onNavKeyDown]
  );

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (!value) {
          setResults([]);
          return;
        }
        const searchResults = searchIndex.search(value);
        setResults(searchResults);
        methods.triggerEvent({
          name: 'onSearch',
          event: { value, resultCount: searchResults.length },
        });
      }, 150);
    },
    [searchIndex, methods]
  );

  const handleRecentClick = useCallback(
    (recentQuery) => {
      setQuery(recentQuery);
      const searchResults = searchIndex.search(recentQuery);
      setResults(searchResults);
    },
    [searchIndex]
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // When the index (re)builds while the modal is open — documents resolved
  // after opening, or the bound request refreshed — re-run the current query
  // so the spinner hands over to real results without a close/reopen.
  useEffect(() => {
    if (!open || !query) return;
    setResults(searchIndex.search(query));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchIndex.version]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const showRecent =
    !query &&
    !searchIndex.loading &&
    properties.recentSearches !== false &&
    recentSearches.recentSearches.length > 0;

  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      width={properties.width ?? 640}
      onCancel={onClose}
      className={cn('lf-search-modal', classNames.modal)}
      style={styles.modal}
      destroyOnHidden
      rootClassName={journeyTargetSelectors.portalClass(blockId)}
    >
      <div onKeyDown={onKeyDown}>
        <Input
          ref={inputRef}
          className={cn(classNames.input)}
          style={styles.input}
          prefix={
            <Icon blockId={`${blockId}_input_icon`} properties={{ name: 'search', title: '' }} />
          }
          placeholder={properties.placeholder ?? 'Search...'}
          allowClear={{
            clearIcon: (
              <Icon blockId={`${blockId}_clearIcon`} properties={{ name: 'clear', title: '' }} />
            ),
          }}
          value={query}
          onChange={handleInputChange}
        />
        {searchIndex.loading && (
          <div
            className={cn('lf-search-loading', classNames.loading)}
            style={{ display: 'flex', justifyContent: 'center', padding: 32, ...styles.loading }}
          >
            <Spin />
          </div>
        )}
        {!searchIndex.loading && query && results.length === 0 && (
          <Empty
            className={cn(classNames.empty)}
            style={{ padding: 32, ...styles.empty }}
            description={properties.noResultsMessage ?? 'No results found.'}
          />
        )}
        {!searchIndex.loading && hasResults && (
          <SearchResults
            blockId={blockId}
            components={{ Icon }}
            grouped={sections}
            resultMapping={resultMapping}
            selectedIndex={selectedIndex}
            highlightTerms={
              properties.highlightMatches !== false && !showRecentResults ? highlightTerms : null
            }
            highlightMatches={properties.highlightMatches !== false}
            onSelect={handleSelect}
            onSeeAll={handleSeeAll}
            classNames={classNames}
            styles={styles}
          />
        )}
        {showPinned && (
          <div
            role="button"
            className={cn(
              'lf-search-item',
              'lf-search-pinned',
              selectedIndex === pinnedIndex && 'lf-search-item-selected',
              classNames.pinned
            )}
            style={styles.pinned}
            onClick={handlePinned}
          >
            <Icon
              blockId={`${blockId}_pinned_icon`}
              properties={pinned.icon ?? { name: 'search', title: '' }}
            />
            <span className="lf-search-item-content">
              {fillQuery(pinned.title ?? '{query}', query)}
            </span>
            {pinned.shortcut && <ShortcutBadge shortcut={pinned.shortcut} />}
          </div>
        )}
        {showRecent && (
          <div>
            <div className="lf-search-recent-header">
              <span>Recent</span>
            </div>
            {recentSearches.recentSearches.map((item) => (
              <div
                key={item.query}
                role="button"
                className={cn('lf-search-item', classNames.item)}
                style={styles.item}
                onClick={() => handleRecentClick(item.query)}
              >
                <Icon
                  blockId={`${blockId}_recent_icon`}
                  properties={{ name: 'history', title: '' }}
                  styles={{ element: { color: 'var(--ant-color-text-quaternary)' } }}
                />
                <span>{item.query}</span>
              </div>
            ))}
          </div>
        )}
        {properties.footer && (
          <div className={cn('lf-search-footer', classNames.footer)} style={styles.footer}>
            {properties.footer}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default SearchModal;
