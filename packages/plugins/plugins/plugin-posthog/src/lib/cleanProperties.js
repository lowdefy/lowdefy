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

// Drops null and undefined values so an absent property does not overwrite a
// value PostHog already has for the person.
function cleanProperties(properties) {
  if (!type.isObject(properties)) return {};
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => !type.isNone(value)));
}

export default cleanProperties;
