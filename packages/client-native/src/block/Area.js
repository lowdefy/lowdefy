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

import areaLayout from '../layout/areaLayout.js';
import BreakpointContext from '../layout/BreakpointContext.js';
import layoutStyles from '../layout/layoutStyles.js';

// A block's slot, laid out as its slot settings (and, for content, the block's layout) ask.
const Area = ({ area, areaKey, children, layout, style }) => {
  const breakpoint = useContext(BreakpointContext);
  const { container } = layoutStyles(areaLayout({ area, areaKey, layout }), breakpoint);
  return <View style={[container, style]}>{children}</View>;
};

export default Area;
