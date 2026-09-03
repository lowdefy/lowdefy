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

// The starter app ships as files under templates/, not as template strings, so
// the config a new project starts from is the config a build test compiles.
// `__TOKEN__` is the only substitution: it is not valid YAML anywhere else and
// it does not collide with the Lowdefy operator or nunjucks syntax the
// templates themselves contain.
function renderTemplate({ template, values }) {
  return Object.keys(values).reduce(
    (rendered, token) => rendered.replaceAll(`__${token}__`, values[token]),
    template
  );
}

export default renderTemplate;
