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

import { ActionSheetIOS, Alert, Platform } from 'react-native';

/**
 * A message's actions on a long press (Copy, Regenerate): iOS's own action sheet, the platform
 * alert elsewhere.
 *
 * @param {Object} params
 * @param {{ id: string, title: string }[]} params.items
 * @param {(item: Object) => void} params.onSelect
 * @param {string} params.cancelTitle
 */
function showMessageMenu({ cancelTitle, items, onSelect }) {
  if (items.length === 0) return;
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        cancelButtonIndex: items.length,
        options: [...items.map((item) => item.title), cancelTitle],
      },
      (index) => {
        if (index < items.length) onSelect(items[index]);
      }
    );
    return;
  }
  Alert.alert(undefined, undefined, [
    ...items.map((item) => ({ onPress: () => onSelect(item), text: item.title })),
    { style: 'cancel', text: cancelTitle },
  ]);
}

export default showMessageMenu;
