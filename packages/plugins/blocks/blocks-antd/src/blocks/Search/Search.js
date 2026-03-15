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

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { cn, withBlockDefaults } from '@lowdefy/block-utils';

import withTheme from '../withTheme.js';
import SearchModal from './SearchModal.js';
import useSearchIndex from './useSearchIndex.js';
import useRecentSearches from './useRecentSearches.js';

import './style.css';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

function parseShortcut(shortcut) {
  if (!shortcut) return null;
  const parts = shortcut.toLowerCase().split('+');
  return {
    mod: parts.includes('mod'),
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    key: parts[parts.length - 1],
  };
}

function matchesShortcut(e, parsed) {
  if (!parsed) return false;
  const modPressed = parsed.mod ? (isMac ? e.metaKey : e.ctrlKey) : true;
  const ctrlPressed = parsed.ctrl ? e.ctrlKey : true;
  const shiftPressed = parsed.shift ? e.shiftKey : !e.shiftKey;
  const altPressed = parsed.alt ? e.altKey : !e.altKey;
  return (
    modPressed && ctrlPressed && shiftPressed && altPressed && e.key.toLowerCase() === parsed.key
  );
}

function SearchBlock({ blockId, classNames = {}, methods, properties, styles = {} }) {
  const [open, setOpen] = useState(false);

  const searchIndex = useSearchIndex({
    indexUrl: properties.indexUrl,
    documents: properties.documents,
    fields: properties.fields,
    storeFields: properties.storeFields,
    searchOptions: properties.searchOptions,
  });

  const recentSearches = useRecentSearches({
    enabled: properties.recentSearches !== false,
    storageKey: properties.recentSearchesKey,
    maxCount: properties.recentSearchesCount,
  });

  const handleOpen = useCallback(async () => {
    setOpen(true);
    await searchIndex.ensureLoaded();
    methods.triggerEvent({ name: 'onOpen' });
  }, [searchIndex, methods]);

  const handleClose = useCallback(() => {
    setOpen(false);
    methods.triggerEvent({ name: 'onClose' });
  }, [methods]);

  useEffect(() => {
    const parsed = parseShortcut(properties.shortcut ?? 'mod+k');
    function handleKeyDown(e) {
      if (matchesShortcut(e, parsed)) {
        e.preventDefault();
        if (open) {
          handleClose();
        } else {
          handleOpen();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [properties.shortcut, open, handleOpen, handleClose]);

  const shortcutLabel = isMac ? '\u2318K' : 'Ctrl+K';

  return (
    <div id={blockId} className={cn(classNames.element)} style={styles.element}>
      <Button
        className={cn('lf-search-trigger', classNames.trigger)}
        style={styles.trigger}
        onClick={handleOpen}
      >
        <SearchOutlined />
        <span className="lf-search-trigger-label">{properties.label ?? 'Search'}</span>
        {properties.showShortcut !== false && (
          <span
            className={cn('lf-search-shortcut-badge', classNames.triggerBadge)}
            style={styles.triggerBadge}
          >
            {shortcutLabel}
          </span>
        )}
      </Button>
      <SearchModal
        open={open}
        onClose={handleClose}
        properties={properties}
        methods={methods}
        classNames={classNames}
        styles={styles}
        searchIndex={searchIndex}
        recentSearches={recentSearches}
      />
    </div>
  );
}

export default withTheme('Search', withBlockDefaults(SearchBlock));
