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

// The one placeholder user templates (formula templates, AI prompts) may have: `{{ key }}`, or
// `{{ key.path }}` for a dot path into the key's value, with nunjucks' optional whitespace
// control (`{{- key -}}`). A key or path segment may hold "-" but not end with one, so
// "-}}" is always whitespace control. findTemplateProblem refuses every other `{{ }}`,
// renderPlaceholders fills these in, and findTemplateRefs reads their keys; an app's server
// (the reference app's column check and enrich_ai endpoint) uses the same pattern, so a
// saved template has no placeholder one side fills in and the other skips. Group 1 is the path.
const KEY = '[A-Za-z_$](?:[\\w$-]*[\\w$])?';
const SEGMENT = '[\\w$](?:[\\w$-]*[\\w$])?';
const placeholderPattern = `\\{\\{-?\\s*(${KEY}(?:\\.${SEGMENT})*)\\s*-?\\}\\}`;

export default placeholderPattern;
