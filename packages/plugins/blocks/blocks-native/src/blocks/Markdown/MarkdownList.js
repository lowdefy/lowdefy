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

import React, { useContext, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import getListMarker from './getListMarker.js';
import { ListDepthContext, ListItemContext } from './MarkdownListContext.js';
import TaskBox from './TaskBox.js';

const ITEM_GAP = 6;

function ListItem({ children, first, marker, markerWidth, palette }) {
  const [task, setTask] = useState(null);
  const item = useMemo(() => ({ setTask }), []);
  return (
    <View style={{ flexDirection: 'row', marginTop: first ? 0 : ITEM_GAP }}>
      <View style={{ alignItems: task === null ? 'flex-end' : 'flex-start', width: markerWidth }}>
        {task === null ? (
          <Text
            style={{
              ...palette.text,
              color: palette.secondaryLabel,
              fontVariant: ['tabular-nums'],
              paddingRight: 8,
            }}
          >
            {marker}
          </Text>
        ) : (
          <TaskBox checked={task.checked} palette={palette} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <ListItemContext.Provider value={item}>{children}</ListItemContext.Provider>
      </View>
    </View>
  );
}

/**
 * A markdown list drawn as iOS lays out text lists: each item's marker in a column of its own, so
 * wrapped lines line up under the text, bullets and numbers by how deep the list sits
 * (getListMarker), and a task item's box in its marker's place. A nested list sits close under
 * its item; a top-level one keeps the block's space below it.
 *
 * @param {Object} props
 * @param {React.ReactNode[]} props.items The items, as the renderer drew them.
 * @param {boolean} props.ordered
 * @param {Object} props.palette The Markdown's palette (getMarkdownStyles).
 * @param {number} [props.start] The first item's number in an ordered list.
 * @param {Object} [props.style] The list's style: its space below.
 */
function MarkdownList({ items, ordered, palette, start = 1, style }) {
  const depth = useContext(ListDepthContext);
  const markers = items.map((_, index) => getListMarker({ depth, number: start + index, ordered }));
  const longest = Math.max(...markers.map((marker) => marker.length));
  const markerWidth = ordered ? Math.max(24, 9 * longest + 8) : 22;
  return (
    <View style={depth === 0 ? style : [style, { marginBottom: 0, marginTop: ITEM_GAP }]}>
      <ListDepthContext.Provider value={depth + 1}>
        {items.map((item, index) => (
          <ListItem
            first={index === 0}
            key={index}
            marker={markers[index]}
            markerWidth={markerWidth}
            palette={palette}
          >
            {item}
          </ListItem>
        ))}
      </ListDepthContext.Provider>
    </View>
  );
}

export default MarkdownList;
