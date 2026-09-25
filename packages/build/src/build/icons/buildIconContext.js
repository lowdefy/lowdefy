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

import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';
import createIconContext from './createIconContext.js';
import validateIconTheme from './validateIconTheme.js';
import validateIconThemeShape from './validateIconThemeShape.js';

// Icon sets load asynchronously (plugin iconSets modules and their name
// lists), so this step runs outside tryBuildStep. It sets context.icons, which
// buildImports resolves and validates against.
async function buildIconContext({ components, context }) {
  const iconsConfig = components.theme?.icons;
  try {
    validateIconThemeShape({ iconsConfig });
    context.icons = await createIconContext({ context, iconsConfig });
  } catch (error) {
    if (error instanceof ConfigError) {
      collectExceptions(context, error);
      return;
    }
    throw error;
  }
  validateIconTheme({ iconsConfig, icons: context.icons, context });
}

export default buildIconContext;
