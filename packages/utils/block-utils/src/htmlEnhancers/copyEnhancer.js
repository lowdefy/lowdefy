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

import CopyButton from './CopyButton.js';
import NATIVE_INTERACTIVE from './nativeInteractive.js';
import visibleText from './visibleText.js';

// Zero-width and direction-override characters change what a label seems to say.
const INVISIBLE_FORMAT_CHARACTERS = /\p{Cf}/gu;

function showInvisible(character) {
  const codePoint = character.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
  return `[U+${codePoint}]`;
}

// A value that differs from the text is shown in the button's label, in full
// and with its invisible characters spelled out, so HTML cannot show one text
// and silently copy another.
function buttonLabel({ shown, text, translate }) {
  if (text === shown) return translate('client.copy');
  const value = text.replace(INVISIBLE_FORMAT_CHARACTERS, showInvisible);
  return translate('client.copyValue', { value });
}

// data-copy adds a copy button that copies the attribute's value, or the
// element's text when it has none. It runs last, so formatted text is copied
// as shown.
const copyEnhancer = {
  name: 'copy',
  attributes: ['data-copy'],
  prepare({ registration, select }) {
    const { Icon, translate } = registration;
    const portals = [];
    select('[data-copy]').forEach((element, index) => {
      const value = element.getAttribute('data-copy');
      if (value === 'false') return;
      const shown = visibleText(element);
      const text = value === '' ? shown : value;
      const container = element.ownerDocument.createElement('span');
      container.setAttribute('data-lf-copy', '');
      // Controls never nest, and a clamped box would clip the button: next to
      // a link, a button or truncated text, not inside it.
      if (element.matches(`${NATIVE_INTERACTIVE}, [data-truncate]`)) {
        element.after(container);
      } else {
        element.append(container);
      }
      portals.push({
        element: container,
        key: `${index}`,
        node: (
          <CopyButton
            Icon={Icon}
            label={buttonLabel({ shown, text, translate })}
            text={text}
            translate={translate}
          />
        ),
      });
    });
    return { portals };
  },
};

export default copyEnhancer;
