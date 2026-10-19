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

import packsForIconName from './packsForIconName.js';

test('packsForIconName returns the single pack for a unique prefix', () => {
  expect(packsForIconName({ name: 'AiOutlineUser' })).toEqual(['ai']);
  expect(packsForIconName({ name: 'LuPencil' })).toEqual(['lu']);
  expect(packsForIconName({ name: 'TfiAlarmClock' })).toEqual(['tfi']);
  expect(packsForIconName({ name: 'LiaUser' })).toEqual(['lia']);
  expect(packsForIconName({ name: 'VscAccount' })).toEqual(['vsc']);
});

test('packsForIconName lists shared-prefix packs in resolution order', () => {
  expect(packsForIconName({ name: 'FaWhatsapp' })).toEqual(['fa', 'fa6']);
  expect(packsForIconName({ name: 'HiOutlineUser' })).toEqual(['hi', 'hi2']);
  expect(packsForIconName({ name: 'IoIosAdd' })).toEqual(['io5', 'io']);
  expect(packsForIconName({ name: 'IoAddCircle' })).toEqual(['io5', 'io']);
});

test('packsForIconName returns no packs for a name without a react-icons prefix', () => {
  expect(packsForIconName({ name: 'Pencil' })).toEqual([]);
  expect(packsForIconName({ name: 'HomeOutlined' })).toEqual([]);
  expect(packsForIconName({ name: 'edit' })).toEqual([]);
});
