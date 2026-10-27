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

/**
 * The markdown's top-level elements without the space above the first or below the last, so the
 * block sits flush in a card or under a title as a Paragraph does. Every top-level element the
 * renderer draws takes a style.
 *
 * @param {React.ReactNode[]} elements
 * @returns {React.ReactNode[]}
 */
function trimOuterSpace(elements) {
  const last = elements.length - 1;
  return elements.map((element, index) => {
    if (!React.isValidElement(element) || (index !== 0 && index !== last)) {
      return element;
    }
    return React.cloneElement(element, {
      style: [
        element.props.style,
        index === 0 ? { marginTop: 0 } : null,
        index === last ? { marginBottom: 0 } : null,
      ],
    });
  });
}

export default trimOuterSpace;
