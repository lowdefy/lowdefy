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

import detectMissingIcons from './detectMissingIcons.js';

test('detectMissingIcons returns empty array when all icons are already imported', () => {
  const page = {
    id: 'home',
    type: 'Box',
    blocks: [
      {
        id: 'btn',
        type: 'Button',
        properties: { icon: 'AiFillHome' },
      },
    ],
  };
  const iconImports = [
    { icons: ['AiFillHome'], package: 'react-icons/ai' },
    { icons: [], package: 'react-icons/io5' },
  ];

  const result = detectMissingIcons({ page, iconImports });
  expect(result).toEqual([]);
});

test('detectMissingIcons detects icon not in current imports', () => {
  const page = {
    id: 'home',
    type: 'Box',
    blocks: [
      {
        id: 'btn',
        type: 'Button',
        properties: { icon: 'IoAddCircle' },
      },
    ],
  };
  const iconImports = [
    { icons: [], package: 'react-icons/ai' },
    { icons: [], package: 'react-icons/io5' },
  ];

  const result = detectMissingIcons({ page, iconImports });
  expect(result).toContainEqual({ icon: 'IoAddCircle', package: 'react-icons/io5' });
});

test('detectMissingIcons detects multiple icons across packages', () => {
  const page = {
    id: 'home',
    type: 'Box',
    blocks: [
      {
        id: 'btn1',
        type: 'Button',
        properties: { icon: 'IoAddCircle' },
      },
      {
        id: 'btn2',
        type: 'Button',
        properties: { icon: 'MdDelete', suffixIcon: 'AiFillWarning' },
      },
    ],
  };
  const iconImports = [
    { icons: [], package: 'react-icons/ai' },
    { icons: [], package: 'react-icons/io5' },
    { icons: [], package: 'react-icons/md' },
  ];

  const result = detectMissingIcons({ page, iconImports });
  expect(result).toContainEqual({ icon: 'IoAddCircle', package: 'react-icons/io5' });
  expect(result).toContainEqual({ icon: 'MdDelete', package: 'react-icons/md' });
  expect(result).toContainEqual({ icon: 'AiFillWarning', package: 'react-icons/ai' });
});

test('detectMissingIcons returns empty array when page has no icon references', () => {
  const page = {
    id: 'home',
    type: 'Box',
    blocks: [
      {
        id: 'text',
        type: 'TextInput',
        properties: { label: 'Name' },
      },
    ],
  };
  const iconImports = [{ icons: [], package: 'react-icons/ai' }];

  const result = detectMissingIcons({ page, iconImports });
  expect(result).toEqual([]);
});

test('detectMissingIcons detects icon in nested block property', () => {
  const page = {
    id: 'home',
    type: 'Box',
    blocks: [
      {
        id: 'card',
        type: 'Card',
        areas: {
          content: {
            blocks: [
              {
                id: 'btn',
                type: 'Button',
                properties: { icon: 'FaRocket' },
              },
            ],
          },
        },
      },
    ],
  };
  const iconImports = [{ icons: [], package: 'react-icons/fa' }];

  const result = detectMissingIcons({ page, iconImports });
  expect(result).toEqual([{ icon: 'FaRocket', package: 'react-icons/fa' }]);
});

test('detectMissingIcons detects icons when iconImports is empty', () => {
  const page = {
    id: 'home',
    type: 'Box',
    blocks: [
      {
        id: 'btn',
        type: 'Button',
        properties: { icon: 'IoAddCircle' },
      },
    ],
  };

  const result = detectMissingIcons({ page, iconImports: [] });
  expect(result).toContainEqual({ icon: 'IoAddCircle', package: 'react-icons/io5' });
});

test('detectMissingIcons does not return duplicate icons when same icon appears multiple times', () => {
  const page = {
    id: 'home',
    type: 'Box',
    blocks: [
      {
        id: 'btn1',
        type: 'Button',
        properties: { icon: 'IoAddCircle' },
      },
      {
        id: 'btn2',
        type: 'Button',
        properties: { icon: 'IoAddCircle' },
      },
    ],
  };
  const iconImports = [{ icons: [], package: 'react-icons/io5' }];

  const result = detectMissingIcons({ page, iconImports });
  const io5Icons = result.filter((r) => r.icon === 'IoAddCircle');
  expect(io5Icons).toHaveLength(1);
});
