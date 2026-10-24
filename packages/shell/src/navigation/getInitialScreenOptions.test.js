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

import getInitialScreenOptions from './getInitialScreenOptions.js';

test('getInitialScreenOptions reads the bar a Screen config gives before it renders', () => {
  const options = getInitialScreenOptions({
    pageConfig: {
      type: 'Screen',
      properties: {
        title: 'My work',
        largeTitle: true,
        headerSearch: { placeholder: 'Search designs', hideWhenScrolling: true },
        backgroundTint: { color: '#ff7a45' },
      },
    },
  });
  expect(options).toMatchObject({
    backgroundTint: true,
    headerActions: [],
    headerBottom: false,
    largeTitle: true,
    presentation: 'card',
    title: 'My work',
  });
  expect(options.headerSearch).toMatchObject({
    autoFocus: false,
    hideWhenScrolling: true,
    placeholder: 'Search designs',
  });
  // The Screen sets the search handlers once it renders.
  expect(() => options.headerSearch.onChangeText('a')).not.toThrow();
});

test('getInitialScreenOptions takes only literal properties, and leaves the rest to the Screen', () => {
  const options = getInitialScreenOptions({
    pageConfig: {
      type: 'Screen',
      properties: { title: { _state: 'task.key' }, largeTitle: { _state: 'large' } },
    },
  });
  expect(options).toMatchObject({
    backgroundTint: false,
    headerSearch: undefined,
    largeTitle: false,
    title: undefined,
  });
  expect(getInitialScreenOptions({ pageConfig: { type: 'Screen' } }).largeTitle).toBe(false);
});

test('getInitialScreenOptions gives nothing for a page that is not a Screen', () => {
  expect(getInitialScreenOptions({ pageConfig: { type: 'Box', properties: {} } })).toBeNull();
});
