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

import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

const MIN_COLUMN = 64;
const MAX_COLUMN = 260;
const CELL_PADDING = { paddingHorizontal: 12, paddingVertical: 8 };

/**
 * A GFM table in a rounded box with a tinted, semibold header row and hairlines between rows.
 * Each column is as wide as its widest cell, between 64 and 260 points (a wider cell wraps), so
 * the cells are measured once and the columns then set; a table wider than the screen scrolls
 * sideways. The renderer keys each parse's elements afresh, so changed content mounts a new table
 * and is measured again.
 *
 * @param {Object} props
 * @param {React.ReactNode[][]} props.header The header cells, as the renderer drew them.
 * @param {Object} props.palette The Markdown's palette (getMarkdownStyles).
 * @param {React.ReactNode[][][]} props.rows The body rows' cells.
 * @param {Object} [props.style] The table's style: its space below.
 */
function MarkdownTable({ header, palette, rows, style }) {
  const columns = header.length;
  const [widths, setWidths] = useState(null);
  const measured = useRef(new Map());
  const cellCount = columns * (rows.length + 1);

  function onCellLayout(cell, column, width) {
    if (widths !== null) return;
    measured.current.set(cell, { column, width });
    if (measured.current.size < cellCount) return;
    const next = Array(columns).fill(MIN_COLUMN);
    measured.current.forEach((entry) => {
      next[entry.column] = Math.min(
        MAX_COLUMN,
        Math.max(next[entry.column], Math.ceil(entry.width))
      );
    });
    setWidths(next);
  }

  function renderRow(cells, rowIndex) {
    const isHeader = rowIndex === 0;
    return (
      <View
        key={rowIndex}
        style={{
          backgroundColor: isHeader ? palette.tableHeader : 'transparent',
          borderTopColor: palette.separator,
          borderTopWidth: isHeader ? 0 : StyleSheet.hairlineWidth,
          flexDirection: 'row',
        }}
      >
        {cells.map((cell, column) => (
          <View
            key={column}
            onLayout={(event) =>
              onCellLayout(`${rowIndex}:${column}`, column, event.nativeEvent.layout.width)
            }
            style={[CELL_PADDING, widths === null ? null : { width: widths[column] }]}
          >
            {cell}
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ flexGrow: 0 }, style]}
      testID="markdown-table"
    >
      <View
        style={{
          borderColor: palette.separator,
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          overflow: 'hidden',
        }}
      >
        {[header, ...rows].map(renderRow)}
      </View>
    </ScrollView>
  );
}

export default MarkdownTable;
