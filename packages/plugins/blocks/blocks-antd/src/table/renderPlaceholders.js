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

import { get, type } from '@lowdefy/helpers';

const PLACEHOLDER = /\{\{-?\s*([A-Za-z_$][\w$-]*(?:\.[\w$-]+)*)\s*-?\}\}/g;

function toText(value) {
  if (type.isNone(value)) return '';
  if (type.isString(value)) return value;
  if (type.isDate(value)) return value.toISOString();
  if (type.isArray(value)) return value.map(toText).join(', ');
  if (type.isObject(value)) return JSON.stringify(value);
  return String(value);
}

// A template's `{{ path }}` placeholders replaced by the text of `context` at that path (empty
// for no value), in one pass: a value that itself contains "{{ ... }}" stays text. Nothing in
// the template runs, so a template users wrote is safe to render for every viewer
// (findTemplateProblem refuses anything but placeholders).
function renderPlaceholders({ template, context }) {
  return template.replace(PLACEHOLDER, (match, path) => toText(get(context, path)));
}

export default renderPlaceholders;
