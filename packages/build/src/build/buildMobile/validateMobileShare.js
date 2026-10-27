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

import { checkKeys, checkObject, checkString } from './mobileChecks.js';

// mobile.share: the page a shell with the share extension opens when text, links, images or files
// are shared into it.
function validateMobileShare({ share, configKey, context }) {
  const path = 'mobile.share';
  if (!checkObject({ value: share, path, configKey, context })) {
    return;
  }
  const key = share['~k'] ?? configKey;
  checkKeys({ object: share, allowed: ['pageId'], path, configKey: key, context });
  checkString({ value: share.pageId, path: `${path}.pageId`, configKey: key, context });
}

export default validateMobileShare;
