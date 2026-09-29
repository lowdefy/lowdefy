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

// The nunjucks template compiler, loaded once per page on first use: `@lowdefy/nunjucks` is about
// 36 kB gzip, and most tables use no template. The record holds `compile` (nunjucksFunction) once
// it has loaded, or the load `error`, and the `promise` to wait on until then.
const record = { compile: null, error: null, promise: null };

function loadTemplateCompiler() {
  if (record.promise === null) {
    record.promise = import('@lowdefy/nunjucks').then(
      (module) => {
        record.compile = module.nunjucksFunction;
      },
      (error) => {
        record.error = error;
      }
    );
  }
  return record;
}

export default loadTemplateCompiler;
