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

// A variant as a journey of its own: the original's settings, with the
// user or data set the variant runs as instead (`overrides`), named
// `<original> — <kind>: <detail>`, with `variant` naming where it came from.
function buildVariantJourney({ journey, variant }) {
  const result = { name: `${journey.name} — ${variant.kind}: ${variant.detail}` };
  const settings = { ...journey, ...variant.overrides };
  ['pageId', 'pathParams', 'user', 'urlQuery', 'timeout', 'data'].forEach((key) => {
    if (!type.isUndefined(settings[key])) {
      result[key] = settings[key];
    }
  });
  result.variant = { of: journey.name, kind: variant.kind, detail: variant.detail };
  result.steps = variant.steps;
  return result;
}

export default buildVariantJourney;
