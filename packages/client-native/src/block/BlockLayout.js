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
import { fillsPlacement } from '@lowdefy/layout-native';

import AreaContext from '../layout/AreaContext.js';
import BreakpointContext from '../layout/BreakpointContext.js';
import layoutStyles from '../layout/layoutStyles.js';
import NaturalSizeContext from '../layout/NaturalSizeContext.js';
import useElementRef from '../elements/useElementRef.js';

const FILL = { flexGrow: 1 };

// The view a block is placed in. Its testID and accessibilityLabel are the block id, so device
// automation finds a block as a browser journey finds its `bl-<blockId>` element. The label is
// not made an accessibility element (accessible stays unset), so screen readers still reach the
// controls inside. The view is registered as the block's element, which ScrollTo measures.
//
// In a gapped area the block takes the column gap as left padding, so its own style (a
// background, a border) goes on an inner view inside it, as the web's column div carries it
// without the gap. The inner view grows to fill the placement only when the placement is taller
// than its content (fillsPlacement): React Native grows a flexGrow view to the height it is
// measured within, so in a wrapping row of aligned blocks every line took the area's height.
//
// In a screen header (NaturalSizeContext) a block takes its content's size, not a column width.
const BlockLayout = ({ blockId, children, layout = {}, style }) => {
  const breakpoint = useContext(BreakpointContext);
  const { columnGap, container } = useContext(AreaContext);
  const naturalSize = useContext(NaturalSizeContext);
  const ref = useElementRef({ blockId, kind: 'view' });
  if (layout.disabled === true || naturalSize) {
    return (
      <View accessibilityLabel={blockId} ref={ref} style={style} testID={blockId}>
        {children}
      </View>
    );
  }
  const placement = layoutStyles(layout, breakpoint, columnGap).child;
  if (columnGap === 0 || placement.display === 'none') {
    return (
      <View accessibilityLabel={blockId} ref={ref} style={[placement, style]} testID={blockId}>
        {children}
      </View>
    );
  }
  return (
    <View style={placement}>
      <View
        accessibilityLabel={blockId}
        ref={ref}
        style={[fillsPlacement({ container, child: placement }) ? FILL : null, style]}
        testID={blockId}
      >
        {children}
      </View>
    </View>
  );
};

export default BlockLayout;
