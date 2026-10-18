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
import { toPixels } from '@lowdefy/client-native';

import getIosTextStyle from '../../typography/getIosTextStyle.js';
import getTextStyle from '../../typography/getTextStyle.js';
import meta from './meta.js';
import TITLE_LEVEL_STYLES from '../../typography/TITLE_LEVEL_STYLES.js';
import TypographyText from '../../typography/TypographyText.js';
import useComponentTokens from '../../useComponentTokens.js';

// A heading in the iOS text style of its level (or its own textStyle), in the label colour, with
// a third of an em below it. The block's own theme can still set the level's antd heading size.
// A screen reader reads it as a header.
function Title({ blockId, methods, properties, styles = {} }) {
  const { tokens } = useComponentTokens(properties.theme);
  const level = properties.level ?? 1;
  const textStyle = getIosTextStyle({
    textStyle: properties.textStyle ?? TITLE_LEVEL_STYLES[level],
    tokens,
  });
  const fontSize = properties.theme?.[`fontSizeHeading${level}`] ?? textStyle.fontSize;
  const baseStyle = {
    ...textStyle,
    fontSize,
    lineHeight: (fontSize * textStyle.lineHeight) / textStyle.fontSize,
    marginBottom: toPixels({ fontSize, value: tokens.titleMarginBottom ?? '0.3em' }),
  };
  return (
    <TypographyText
      accessibilityRole="header"
      blockId={blockId}
      linkStyle={[
        getIosTextStyle({ color: tokens.colorTint, textStyle: 'body', tokens }),
        styles.actions,
      ]}
      methods={methods}
      properties={properties}
      style={[getTextStyle({ baseStyle, properties, tokens }), styles.element]}
    />
  );
}

Title.meta = meta;

export default Title;
