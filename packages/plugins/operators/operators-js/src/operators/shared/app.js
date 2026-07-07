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

import { getFromObject } from '@lowdefy/operators';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

function _app({ arrayIndices, location, lowdefyApp, params }) {
  const value = getFromObject({
    arrayIndices,
    location,
    object: lowdefyApp,
    operator: '_app',
    params,
  });
  if (params === 'slug' && type.isNone(value)) {
    throw new ConfigError(
      '`slug` is required on the app but is not set. Declare `slug` in `lowdefy.yaml`.',
      { received: { slug: value } }
    );
  }
  return value;
}

_app.dynamic = false;

export default _app;
