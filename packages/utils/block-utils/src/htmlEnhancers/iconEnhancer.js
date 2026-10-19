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
import { type } from '@lowdefy/helpers';

import labelIcon from './labelIcon.js';
import PendingDataIcon from './PendingDataIcon.js';

// data-icon="edit" renders the app's Icon component into the element. The
// client registers loadAllIcons when a page holds only its own icons, so a
// name outside them - HTML built from data at runtime - waits for the rest.
const iconEnhancer = {
  name: 'icon',
  attributes: ['data-icon'],
  prepare({ registration, select }) {
    const { Icon, icons, loadAllIcons } = registration;
    const portals = [];
    select('[data-icon]').forEach((element, index) => {
      const name = element.getAttribute('data-icon');
      const key = `${index}:${name}`;
      if (Object.hasOwn(icons, name)) {
        labelIcon(element);
        portals.push({ element, key, node: <Icon properties={{ name, title: '' }} /> });
        return;
      }
      if (!type.isNone(loadAllIcons)) {
        portals.push({
          element,
          key,
          node: (
            <PendingDataIcon
              element={element}
              Icon={Icon}
              icons={icons}
              loadAllIcons={loadAllIcons}
              name={name}
            />
          ),
        });
        return;
      }
      // Existing markup may use data-icon for something else; an unknown name
      // renders nothing rather than the fallback icon.
      console.warn(`data-icon="${name}" is not a known icon, so nothing was rendered.`);
    });
    return { portals };
  },
};

export default iconEnhancer;
