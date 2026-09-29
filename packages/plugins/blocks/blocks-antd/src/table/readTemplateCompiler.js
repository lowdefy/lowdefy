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

import loadTemplateCompiler from './loadTemplateCompiler.js';

// The template compiler for a render that `needed` it, or null when the config uses no template.
// Until it has loaded this suspends (throws the load's promise), so a lazy Table keeps its
// skeleton fallback up until its templates can render.
function readTemplateCompiler({ needed }) {
  if (!needed) return null;
  const { compile, error, promise } = loadTemplateCompiler();
  if (error !== null) throw error;
  if (compile === null) throw promise;
  return compile;
}

export default readTemplateCompiler;
