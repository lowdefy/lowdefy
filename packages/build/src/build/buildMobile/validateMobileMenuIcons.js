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

import validateIconNames from '../icons/validateIconNames.js';

// Menu icons are drawn from icon data in mobile/config.json, so each must
// resolve. Runs after buildIconContext, which sets context.icons.
function validateMobileMenuIcons({ components, context }) {
  if (type.isNone(components.mobile?.menus)) {
    return;
  }
  validateIconNames({ config: [components.mobile.menus], icons: context.icons, context });
}

export default validateMobileMenuIcons;
