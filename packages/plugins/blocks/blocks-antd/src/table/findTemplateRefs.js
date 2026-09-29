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

const OUTPUT_PATTERN = /\{\{-?\s*([A-Za-z_$][\w$]*)/g;

// The names a template's `{{ name }}` outputs start with, in order of first use, without
// duplicates: `{{ company | upper }}` and `{{ company.name }}` both give `company`. Formula and AI
// prompt templates reference columns by key this way (the add-column picker's chips insert
// `{{ key }}`).
function findTemplateRefs(template) {
  if (!type.isString(template)) return [];
  const refs = [];
  for (const match of template.matchAll(OUTPUT_PATTERN)) {
    if (!refs.includes(match[1])) refs.push(match[1]);
  }
  return refs;
}

export default findTemplateRefs;
