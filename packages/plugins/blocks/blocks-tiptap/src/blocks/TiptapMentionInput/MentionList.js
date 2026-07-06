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

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import itemSection from './itemSection.js';

function groupItems(items) {
  const groups = [];
  const bySection = new Map();
  items.forEach((item) => {
    const section = itemSection(item);
    if (!bySection.has(section)) {
      const group = { section, items: [] };
      bySection.set(section, group);
      groups.push(group);
    }
    bySection.get(section).items.push(item);
  });
  let startIndex = 0;
  groups.forEach((group) => {
    group.startIndex = startIndex;
    startIndex += group.items.length;
  });
  return groups;
}

const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const groups = groupItems(props.items);
  const flatItems = groups.flatMap((group) => group.items);

  const selectItem = (index) => {
    const item = flatItems[index];
    if (item) {
      props.command({ id: item });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + flatItems.length - 1) % flatItems.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % flatItems.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="tiptap-mention-items">
      {flatItems.length ? (
        groups.map((group) => (
          <React.Fragment key={group.startIndex}>
            {!type.isNone(group.section) && (
              <div className="tiptap-mention-section">{group.section}</div>
            )}
            {group.items.map((item, itemIndex) => {
              const index = group.startIndex + itemIndex;
              return (
                <button
                  className={`tiptap-mention-item ${index === selectedIndex ? 'is-selected' : ''}`}
                  key={index}
                  onClick={() => selectItem(index)}
                >
                  {renderHtml({ html: item?.label ?? item, methods: props.methods })}
                </button>
              );
            })}
          </React.Fragment>
        ))
      ) : (
        <div className="tiptap-mention-item secondary">No matching results</div>
      )}
    </div>
  );
});

export default MentionList;
