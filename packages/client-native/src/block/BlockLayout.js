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

import React, { useContext } from 'react';
import { View } from 'react-native';

import BreakpointContext from '../layout/BreakpointContext.js';
import ColumnGapContext from '../layout/ColumnGapContext.js';
import layoutStyles from '../layout/layoutStyles.js';

// The view a block is placed in. Its testID and accessibilityLabel are the block id, so device
// automation finds a block as a browser journey finds its `bl-<blockId>` element. The label is
// not made an accessibility element (accessible stays unset), so screen readers still reach the
// controls inside.
//
// In a gapped area the block takes the column gap as left padding, so its own style (a
// background, a border) goes on an inner view that fills the placement, as the web's column div
// carries it without the gap.
const BlockLayout = ({ blockId, children, layout = {}, style }) => {
  const breakpoint = useContext(BreakpointContext);
  const columnGap = useContext(ColumnGapContext);
  if (layout.disabled === true) {
    return (
      <View accessibilityLabel={blockId} style={style} testID={blockId}>
        {children}
      </View>
    );
  }
  const placement = layoutStyles(layout, breakpoint, columnGap).child;
  if (columnGap === 0 || placement.display === 'none') {
    return (
      <View accessibilityLabel={blockId} style={[placement, style]} testID={blockId}>
        {children}
      </View>
    );
  }
  return (
    <View style={placement}>
      <View accessibilityLabel={blockId} style={[{ flexGrow: 1 }, style]} testID={blockId}>
        {children}
      </View>
    </View>
  );
};

export default BlockLayout;
