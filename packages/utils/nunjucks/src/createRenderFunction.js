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

import nunjucks from 'nunjucks';
import { type } from '@lowdefy/helpers';

// The one compile-and-cache factory behind every nunjucks surface in Lowdefy.
// The environment and the cache are parameters because the Template block's
// {% slot %} tag must not change how the rest of Lowdefy renders strings: a
// separate environment means an unknown-tag error there, and a separate cache
// means a template compiled for one environment is never handed to the other.
function createRenderFunction({ environment, cache }) {
  return function renderFunction(templateString) {
    // Non-string templates render as themselves. Nothing to compile, so nothing
    // to cache - and caching them would key every object argument to the same
    // "[object Object]" slot.
    if (!type.isString(templateString)) return () => templateString;

    const cached = cache.get(templateString);
    if (cached) return cached;

    // eagerCompile: a syntax error is the author's mistake and must surface
    // when the template is compiled, not on the first render. Compiling is not
    // rendering - a filter that throws on an absent value (rows | unique) is a
    // property of the data, and must not fail a well-formed template.
    const template = nunjucks.compile(templateString, environment, null, true);
    const render = (value) => {
      if (type.isPrimitive(value)) {
        return template.render({ value });
      }
      return template.render(value);
    };
    cache.set(templateString, render);
    return render;
  };
}

export default createRenderFunction;
