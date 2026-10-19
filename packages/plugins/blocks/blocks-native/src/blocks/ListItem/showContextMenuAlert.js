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

import { Alert } from 'react-native';

/**
 * A row's context menu where there is no SwiftUI: the platform's alert, its items as buttons.
 *
 * @param {Object} params
 * @param {{ id: string, title: string, destructive?: boolean }[]} params.items
 * @param {(item: Object) => void} params.onSelect
 * @param {string} params.title The row title.
 */
function showContextMenuAlert({ items, onSelect, title }) {
  Alert.alert(title, undefined, [
    ...items.map((item) => ({
      onPress: () => onSelect(item),
      style: item.destructive === true ? 'destructive' : 'default',
      text: item.title,
    })),
    { style: 'cancel', text: 'Cancel' },
  ]);
}

export default showContextMenuAlert;
