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

import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import ListRowContext from './ListRowContext.js';

const GROUPED_INSET = 16;
const GROUPED_RADIUS = 10;
// Where the separator starts when the row's blocks do not say: the cell's content inset.
const DEFAULT_SEPARATOR_INSET = 16;

/**
 * One List item's row: in an inset grouped List a cell of its section (inset from the screen
 * edges, the section's first and last cells rounded), and in either variant a hairline separator
 * under every row but the section's last, inset to the row's text.
 *
 * @param {Object} props
 * @param {string} props.background The row colour.
 * @param {boolean} props.first The first row of its section.
 * @param {boolean} props.grouped The List is inset grouped.
 * @param {boolean} props.last The last row of its section.
 * @param {string} props.separatorColor
 * @param {Object} [props.style] The List's `cell` style.
 */
function ListRow({ background, children, first, grouped, last, separatorColor, style }) {
  const [separatorInset, setSeparatorInset] = useState(null);
  const context = useMemo(() => ({ background, setSeparatorInset }), [background]);
  const groupedStyle = grouped
    ? {
        borderBottomLeftRadius: last ? GROUPED_RADIUS : 0,
        borderBottomRightRadius: last ? GROUPED_RADIUS : 0,
        borderTopLeftRadius: first ? GROUPED_RADIUS : 0,
        borderTopRightRadius: first ? GROUPED_RADIUS : 0,
        marginHorizontal: GROUPED_INSET,
        overflow: 'hidden',
      }
    : null;
  return (
    <View style={[{ backgroundColor: background }, groupedStyle, style]}>
      <ListRowContext.Provider value={context}>{children}</ListRowContext.Provider>
      {last ? null : (
        <View
          pointerEvents="none"
          style={{
            backgroundColor: separatorColor,
            bottom: 0,
            height: StyleSheet.hairlineWidth,
            left: separatorInset ?? DEFAULT_SEPARATOR_INSET,
            position: 'absolute',
            right: 0,
          }}
          testID="list_separator"
        />
      )}
    </View>
  );
}

export { GROUPED_INSET };
export default ListRow;
