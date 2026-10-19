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
import { StyleSheet, View } from 'react-native';

export const RAIL_WIDTH = 28;
const LINE_WIDTH = 1.5;

/**
 * One row of the timeline: the rail column, with its marker (an icon or avatar) `markerTop`
 * from the row's top and the rail line above and below it, and the row's content beside it.
 * Rows sit flush, so their line pieces join into one rail; the first row draws none above its
 * marker and the last none below.
 */
function RailRow({ children, colors, first, last, marker, markerTop }) {
  const line = { backgroundColor: colors.separator, width: LINE_WIDTH };
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[line, { height: markerTop }, first ? styles.hidden : null]} />
        {marker}
        <View style={[line, styles.grow, last ? styles.hidden : null]} />
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { alignItems: 'center', width: RAIL_WIDTH },
  grow: { flexGrow: 1, minHeight: 4 },
  hidden: { opacity: 0 },
  content: { flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0, paddingLeft: 12 },
});

export default RailRow;
