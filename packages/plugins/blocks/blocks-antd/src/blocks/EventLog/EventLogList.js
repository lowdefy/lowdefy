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
import { cn } from '@lowdefy/block-utils';
import { Virtuoso } from 'react-virtuoso';

import cssStyles from './style.module.css';

function EventLogList({
  classNames,
  entries,
  height,
  itemContent,
  overscan,
  styles,
  text,
  useWindowScroll,
  visible,
}) {
  if (entries.length === 0) {
    return (
      <div className={cn(cssStyles.empty, classNames.empty)} style={styles.empty}>
        {text.empty}
      </div>
    );
  }
  if (visible.length === 0) {
    return (
      <div className={cn(cssStyles.empty, classNames.empty)} style={styles.empty}>
        {text.noResults}
      </div>
    );
  }
  return (
    <div
      className={cn(cssStyles.list, classNames.list)}
      style={useWindowScroll ? styles.list : { height, ...styles.list }}
    >
      <Virtuoso
        data={visible}
        useWindowScroll={useWindowScroll}
        overscan={overscan}
        increaseViewportBy={overscan}
        computeItemKey={(_index, entry) => entry.id}
        itemContent={itemContent}
        style={useWindowScroll ? undefined : { height: '100%' }}
      />
    </div>
  );
}

export default EventLogList;
