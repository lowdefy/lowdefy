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

import { type } from '@lowdefy/helpers';

// Whether antd labels what it draws for a block (a Popconfirm's OK and Cancel) in its en_US
// locale, the only one a headless run knows: the app has no i18n locales, and no ConfigProvider
// holding the block sets a locale (antd's useLocale reads the nearest one), as the Modal
// footer model checks. ancestors are the blocks holding the block (listBlockAncestors).
function knowsAntdLocale({ ancestors, i18n }) {
  if ((i18n?.locales ?? []).length > 0) {
    return false;
  }
  return !ancestors.some(
    (block) => block.type === 'ConfigProvider' && !type.isNone(block.eval?.properties?.locale)
  );
}

export default knowsAntdLocale;
