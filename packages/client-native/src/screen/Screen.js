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

import React, { useCallback, useContext, useEffect, useRef } from 'react';

import ScreenOptionsContext from './ScreenOptionsContext.js';

// The mobile page type. It draws its content slot; the shell's router draws the header from the
// options it reports: title, presentation (card, modal or sheet) and headerRight, a function that
// renders the headerRight slot's blocks. headerRight keeps one identity while the slot exists, so
// a router that re-renders on new options is not sent new options on every page render.
function Screen({ content, properties }) {
  const onScreenOptions = useContext(ScreenOptionsContext);
  const headerRightRef = useRef(content.headerRight);
  headerRightRef.current = content.headerRight;
  const hasHeaderRight = typeof content.headerRight === 'function';
  const headerRight = useCallback(() => headerRightRef.current(), []);
  const { presentation = 'card', title } = properties;
  useEffect(() => {
    if (onScreenOptions === null) return;
    onScreenOptions({
      headerRight: hasHeaderRight ? headerRight : undefined,
      presentation,
      title,
    });
  }, [hasHeaderRight, headerRight, onScreenOptions, presentation, title]);
  return content.content ? content.content() : null;
}

Screen.meta = {
  category: 'container',
  icons: [],
  valueType: null,
  slots: {
    content: 'The page content, in a scroll view.',
    headerRight: 'Blocks drawn at the right of the screen header.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: {
        type: 'string',
        description: 'The screen title, shown in the header.',
      },
      presentation: {
        type: 'string',
        enum: ['card', 'modal', 'sheet'],
        default: 'card',
        description: 'How the screen is presented when opened.',
      },
    },
  },
};

export default Screen;
