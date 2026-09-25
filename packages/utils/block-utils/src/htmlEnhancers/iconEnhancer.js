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

// An icon placeholder with no text is decorative unless it is a control. A
// tooltip names an icon-only element for screen readers too.
function labelIcon(element) {
  if (element.hasAttribute('aria-label') || element.textContent.trim() !== '') return;
  const tooltip = element.getAttribute('data-tooltip');
  if (tooltip) {
    element.setAttribute('aria-label', tooltip);
    if (!element.hasAttribute('role')) {
      element.setAttribute('role', 'img');
    }
    return;
  }
  if (element.matches('[data-event], [data-popover]')) return;
  element.setAttribute('aria-hidden', 'true');
}

// data-icon="edit" renders the app's Icon component into the element.
const iconEnhancer = {
  name: 'icon',
  attributes: ['data-icon'],
  prepare({ registration, select }) {
    const { Icon, icons } = registration;
    const portals = [];
    select('[data-icon]').forEach((element, index) => {
      const name = element.getAttribute('data-icon');
      // Existing markup may use data-icon for something else; an unknown name
      // renders nothing rather than the fallback icon.
      if (!Object.hasOwn(icons, name)) {
        console.warn(`data-icon="${name}" is not a known icon, so nothing was rendered.`);
        return;
      }
      labelIcon(element);
      portals.push({
        element,
        key: `${index}:${name}`,
        node: <Icon properties={{ name, title: '' }} />,
      });
    });
    return { portals };
  },
};

export default iconEnhancer;
