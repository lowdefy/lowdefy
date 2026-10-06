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

// Clicked text as the production pull stores it and the config text set
// collects it: whitespace runs collapsed to one space, trimmed. Returns null
// for a value that is not a string or is empty after trimming, so one
// normalisation decides both what a click said and what the config holds.
function normaliseClickText(value) {
  if (!type.isString(value)) return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text === '' ? null : text;
}

export default normaliseClickText;
