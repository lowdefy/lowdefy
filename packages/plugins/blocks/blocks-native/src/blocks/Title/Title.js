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

import getTextStyle from '../../typography/getTextStyle.js';
import meta from './meta.js';
import toPixels from '../../toPixels.js';
import TypographyText from '../../typography/TypographyText.js';
import useComponentTokens from '../../useComponentTokens.js';

// antd's heading: the level's size and line height, strong, in the heading colour, with half an
// em below it. A screen reader reads it as a header.
function Title({ blockId, methods, properties, styles = {} }) {
  const { tokens } = useComponentTokens(properties.theme);
  const level = properties.level ?? 1;
  const fontSize = tokens[`fontSizeHeading${level}`];
  const baseStyle = {
    color: tokens.colorTextHeading,
    fontSize,
    fontWeight: String(tokens.fontWeightStrong),
    lineHeight: fontSize * tokens[`lineHeightHeading${level}`],
    marginBottom: toPixels({ fontSize, value: tokens.titleMarginBottom ?? '0.5em' }),
  };
  return (
    <TypographyText
      accessibilityRole="header"
      blockId={blockId}
      linkStyle={[{ color: tokens.colorLink, fontSize: tokens.fontSize }, styles.actions]}
      methods={methods}
      properties={properties}
      style={[getTextStyle({ baseStyle, properties, tokens }), styles.element]}
    />
  );
}

Title.meta = meta;

export default Title;
