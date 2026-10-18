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
import Svg, { Ellipse, G, Path } from 'react-native-svg';

// antd's empty tray, in the theme's fill and border colours.
function EmptyImage({ height, tokens }) {
  return (
    <Svg height={height} viewBox="0 0 64 41" width={(height * 64) / 41}>
      <G fill="none" fillRule="evenodd" transform="translate(0 1)">
        <Ellipse cx="32" cy="33" fill={tokens.colorFillTertiary} rx="32" ry="7" />
        <G fillRule="nonzero" stroke={tokens.colorBorder}>
          <Path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z" />
          <Path
            d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z"
            fill={tokens.colorFillQuaternary}
          />
        </G>
      </G>
    </Svg>
  );
}

export default EmptyImage;
