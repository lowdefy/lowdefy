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

import getListItemParts from './getListItemParts.js';

test('getListItemParts draws a status glyph before an avatar or icon', () => {
  const parts = getListItemParts({
    properties: { leading: { status: 'inProgress', icon: 'House' }, title: 'Fix sign in' },
  });
  expect(parts.leading).toEqual({
    kind: 'status',
    status: { name: 'inProgress', size: 18 },
    width: 18,
  });
  expect(parts.separatorInset).toEqual(16 + 18 + 12);
});

test('getListItemParts sizes a leading avatar by the row height', () => {
  expect(
    getListItemParts({ properties: { leading: { avatar: { name: 'Ada' } } } }).leading.size
  ).toEqual(28);
  expect(
    getListItemParts({ properties: { leading: { avatar: { name: 'Ada' } }, subtitle: 'Engineer' } })
      .leading.size
  ).toEqual(40);
  expect(
    getListItemParts({ properties: { leading: { avatar: { name: 'Ada', size: 20 } } } })
      .separatorInset
  ).toEqual(48);
});

test('getListItemParts insets the separator by the row padding without a leading glyph', () => {
  expect(getListItemParts({ properties: { title: 'Plain' } })).toEqual({
    leading: null,
    separatorInset: 16,
    subtitle: undefined,
    trailing: {
      avatar: undefined,
      avatars: undefined,
      badges: [],
      check: false,
      icon: undefined,
      status: undefined,
      text: undefined,
      textColor: undefined,
    },
  });
});

test('getListItemParts reads the phase 1 icon, avatar, description and extra properties', () => {
  const parts = getListItemParts({
    properties: { icon: 'FileText', description: 'ACME-645', extra: '3' },
  });
  expect(parts.leading).toEqual({ kind: 'icon', icon: 'FileText', width: 28 });
  expect(parts.subtitle).toEqual('ACME-645');
  expect(parts.trailing.text).toEqual('3');
  expect(
    getListItemParts({ properties: { avatar: { content: 'AL' }, subtitle: 'x' } }).leading
  ).toMatchObject({ kind: 'avatar', size: 40 });
});
