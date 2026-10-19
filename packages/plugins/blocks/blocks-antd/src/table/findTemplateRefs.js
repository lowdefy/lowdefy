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

import placeholderPattern from './placeholderPattern.js';

const PLACEHOLDER = new RegExp(placeholderPattern, 'g');

// The keys a template's `{{ key }}` placeholders start with, in order of first use, without
// duplicates: `{{ company }}` and `{{ company.name }}` both give `company`. Formula and AI
// prompt templates reference columns (or prompt inputs) by key this way (the add-column
// picker's chips insert `{{ key }}`); anything else in `{{ }}` is refused by
// findTemplateProblem, so it references nothing.
function findTemplateRefs(template) {
  if (!type.isString(template)) return [];
  const refs = [];
  for (const match of template.matchAll(PLACEHOLDER)) {
    const [key] = match[1].split('.');
    if (!refs.includes(key)) refs.push(key);
  }
  return refs;
}

export default findTemplateRefs;
