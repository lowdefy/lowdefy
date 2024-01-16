/*
  Copyright 2020-2024 Lowdefy, Inc

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

import createCheckDuplicateId from './createCheckDuplicateId.js';

test('checkDuplicateId return value', async () => {
  const checkDuplicateId = createCheckDuplicateId({
    message: 'Duplicate id "{{ id }}".',
  });
  expect(checkDuplicateId({ id: 'id' })).toBe(undefined);
});

test('throw on duplicate ids', async () => {
  const checkDuplicateId = createCheckDuplicateId({
    message: 'Duplicate id "{{ id }}".',
  });
  checkDuplicateId({ id: 'id' });
  checkDuplicateId({ id: 'id_2' });
  expect(() => checkDuplicateId({ id: 'id' })).toThrow('Duplicate id "id".');
});

test('Error message nunjucks variables', async () => {
  const checkDuplicateId = createCheckDuplicateId({
    message: '{{ id }} {{ blockId }} {{ eventId }} {{ menuId }} {{ pageId }}',
  });
  checkDuplicateId({
    id: 'id',
    blockId: 'blockId',
    eventId: 'eventId',
    menuId: 'menuId',
    pageId: 'pageId',
  });
  expect(() =>
    checkDuplicateId({
      id: 'id',
      blockId: 'blockId',
      eventId: 'eventId',
      menuId: 'menuId',
      pageId: 'pageId',
    })
  ).toThrow('id blockId eventId menuId pageId');
});
