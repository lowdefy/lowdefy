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
import { Empty, Input, Modal, Skeleton } from 'antd';
import { ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { cn } from '@lowdefy/block-utils';

import SearchResults from './SearchResults.js';
import useListKeyboardNav from './useListKeyboardNav.js';

function SearchModal({
  open,
  onClose,
  properties,
  methods,
  classNames = {},
  styles = {},
  searchIndex,
  recentSearches,
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

  const flatResults = results.slice(0, maxResults);
  const highlightTerms = flatResults.length > 0 ? flatResults[0].terms : [];

  const handleSelect = useCallback(
    (item) => {
      recentSearches.addSearch(query);
      methods.triggerEvent({
        name: 'onSelect',
        event: { ...item, query, resultCount: results.length },
      });
      onClose();
    },
    [query, results, methods, onClose, recentSearches]
  );

  const handleSelectByIndex = useCallback(
    (index) => {
      if (flatResults[index]) {
        handleSelect(flatResults[index]);
      }
    },
    [flatResults, handleSelect]
  );

  const { selectedIndex, onKeyDown } = useListKeyboardNav({
    itemCount: flatResults.length,
    onSelect: handleSelectByIndex,
  });

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

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const showRecent =
    !query && properties.recentSearches !== false && recentSearches.recentSearches.length > 0;

  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      width={properties.width ?? 640}
      onCancel={onClose}
      className={cn(classNames.modal)}
      style={styles.modal}
      destroyOnClose
    >
      <Input
        ref={inputRef}
        className={cn(classNames.input)}
        style={styles.input}
        prefix={<SearchOutlined />}
        placeholder={properties.placeholder ?? 'Search...'}
        allowClear
        value={query}
        onChange={handleInputChange}
        onKeyDown={onKeyDown}
      />
      {searchIndex.loading && (
        <div style={{ padding: 16 }}>
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      )}
      {!searchIndex.loading && query && flatResults.length === 0 && (
        <Empty
          className={cn(classNames.empty)}
          style={{ padding: 32, ...styles.empty }}
          description={properties.noResultsMessage ?? 'No results found.'}
        />
      )}
      {!searchIndex.loading && flatResults.length > 0 && (
        <SearchResults
          results={flatResults}
          groups={groups}
          resultMapping={resultMapping}
          selectedIndex={selectedIndex}
          highlightTerms={properties.highlightMatches !== false ? highlightTerms : null}
          highlightMatches={properties.highlightMatches !== false}
          onSelect={handleSelect}
          classNames={classNames}
          styles={styles}
        />
      )}
      {showRecent && (
        <div>
          <div className="lf-search-recent-header">
            <span>Recent</span>
          </div>
          {recentSearches.recentSearches.map((item) => (
            <div
              key={item.query}
              className={cn('lf-search-item', classNames.item)}
              style={styles.item}
              onClick={() => handleRecentClick(item.query)}
            >
              <ClockCircleOutlined style={{ color: 'var(--ant-color-text-quaternary)' }} />
              <span>{item.query}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default SearchModal;
