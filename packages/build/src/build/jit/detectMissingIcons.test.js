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

import createIconContext from '../icons/createIconContext.js';
import detectMissingIcons from './detectMissingIcons.js';

const icons = await createIconContext({ context: { typesMap: { iconSets: {} } } });

function detect({ page, bundledIcons = [], dynamicIconData = {} }) {
  return detectMissingIcons({
    page,
    bundledIcons: new Set(bundledIcons),
    dynamicIconData,
    icons,
  });
}

test('detectMissingIcons returns names the bundle and earlier pages lack', () => {
  const page = {
    blocks: [
      { id: 'a', type: 'Button', properties: { icon: 'edit' } },
      { id: 'b', type: 'Button', properties: { icon: 'CirclePlus' } },
      { id: 'c', type: 'Button', properties: { icon: 'lucide:Clock' } },
      { id: 'd', type: 'Button', properties: { icon: 'check' } },
    ],
  };
  expect(detect({ page, bundledIcons: ['check'] })).toEqual(['CirclePlus', 'edit', 'lucide:Clock']);
  expect(detect({ page, bundledIcons: ['check'], dynamicIconData: { edit: {} } })).toEqual([
    'CirclePlus',
    'lucide:Clock',
  ]);
});

test('detectMissingIcons skips names that do not resolve and type values', () => {
  const page = {
    type: 'Box',
    blocks: [{ id: 'a', type: 'Menu', properties: { icon: 'AiOutlineUser', title: 'nope-nope' } }],
  };
  expect(detect({ page })).toEqual([]);
});

test('detectMissingIcons finds names in _js code and data-icon HTML', () => {
  const page = {
    blocks: [
      {
        id: 'a',
        type: 'Html',
        properties: {
          html: '<i data-icon="delete"></i>',
          content: { _js: 'return done ? \'Check\' : "X";' },
        },
      },
    ],
  };
  expect(detect({ page })).toEqual(['Check', 'X', 'delete']);
});
