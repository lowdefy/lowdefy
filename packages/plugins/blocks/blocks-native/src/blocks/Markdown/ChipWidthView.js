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

import React, { useContext, useState } from 'react';
import { View } from 'react-native';

import ChipWidthContext from './ChipWidthContext.js';

/**
 * A View that gives the link chips in it its own width (ChipWidthContext), less `inset` for its
 * horizontal padding: the Markdown, a list item's text column and a quote's text each measure
 * theirs, so a chip in a list item is capped by the item's line rather than the block's. Until
 * it is laid out the width around it stands in.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {number} [props.inset] The View's horizontal padding.
 * @param {Object} [props.style]
 * @param {string} [props.testID]
 */
function ChipWidthView({ children, inset = 0, style, testID }) {
  const outer = useContext(ChipWidthContext);
  const [width, setWidth] = useState(null);
  return (
    <View
      onLayout={(event) => setWidth(Math.max(0, event.nativeEvent.layout.width - inset))}
      style={style}
      testID={testID}
    >
      <ChipWidthContext.Provider value={width ?? outer}>{children}</ChipWidthContext.Provider>
    </View>
  );
}

export default ChipWidthView;
