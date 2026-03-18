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

import React, { useEffect, useRef } from 'react';
import { FileOutlined } from '@ant-design/icons';
import { cn } from '@lowdefy/block-utils';

import SearchHighlight from './SearchHighlight.js';

function groupResults(results, groups, resultMapping) {
  if (!groups || groups.length === 0) return [{ label: null, items: results }];

  const categoryField = resultMapping?.category;
  const grouped = new Map();
  const other = [];

  for (const result of results) {
    const value = categoryField ? result[categoryField] : null;
    let matched = false;
    for (const group of groups) {
      const matchEntries = Object.entries(group.match ?? {});
      if (matchEntries.every(([field, val]) => result[field] === val)) {
        if (!grouped.has(group.label)) {
          grouped.set(group.label, { ...group, items: [] });
        }
        grouped.get(group.label).items.push(result);
        matched = true;
        break;
      }
    }
    if (!matched) {
      other.push(result);
    }
  }

  const result = [];
  for (const group of groups) {
    const entry = grouped.get(group.label);
    if (entry && entry.items.length > 0) {
      result.push(entry);
    }
  }
  if (other.length > 0) {
    result.push({ label: 'Other', items: other });
  }
  return result;
}

function SearchResults({
  results,
  groups,
  resultMapping,
  selectedIndex,
  highlightTerms,
  highlightMatches,
  onSelect,
  classNames = {},
  styles = {},
}) {
  const selectedRef = useRef(null);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const grouped = groupResults(results, groups, resultMapping);
  const titleField = resultMapping?.title ?? 'title';
  const descField = resultMapping?.description;
  const iconField = resultMapping?.icon;

  let flatIndex = 0;

  return (
    <div className={cn('lf-search-results', classNames.results)} style={styles.results}>
      {grouped.map((group, gi) => (
        <div key={group.label ?? gi} className={classNames.group} style={styles.group}>
          {group.label && (
            <div
              className={cn('lf-search-group-header', classNames.groupHeading)}
              style={styles.groupHeading}
            >
              {group.label}
            </div>
          )}
          {group.items.map((item) => {
            const currentIndex = flatIndex++;
            const isSelected = currentIndex === selectedIndex;
            const title = item[titleField] ?? item.id;
            const desc = descField ? item[descField] : null;

            return (
              <div
                key={item.id ?? currentIndex}
                ref={isSelected ? selectedRef : null}
                className={cn(
                  'lf-search-item',
                  isSelected && 'lf-search-item-selected',
                  classNames.item
                )}
                style={styles.item}
                onClick={() => onSelect(item)}
              >
                <span
                  className={classNames.itemIcon}
                  style={{ color: 'var(--ant-color-text-secondary)', ...styles.itemIcon }}
                >
                  <FileOutlined />
                </span>
                <div className="lf-search-item-content">
                  <div
                    className={cn('lf-search-item-title', classNames.itemTitle)}
                    style={styles.itemTitle}
                  >
                    {highlightMatches && highlightTerms ? (
                      <SearchHighlight
                        text={title}
                        terms={highlightTerms}
                        className={cn('lf-search-highlight', classNames.highlight)}
                        style={styles.highlight}
                      />
                    ) : (
                      title
                    )}
                  </div>
                  {desc && (
                    <div
                      className={cn('lf-search-item-description', classNames.itemDescription)}
                      style={styles.itemDescription}
                    >
                      {highlightMatches && highlightTerms ? (
                        <SearchHighlight
                          text={desc}
                          terms={highlightTerms}
                          className={cn('lf-search-highlight', classNames.highlight)}
                          style={styles.highlight}
                        />
                      ) : (
                        desc
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default SearchResults;
