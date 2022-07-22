/*
  Copyright 2020-2022 Lowdefy, Inc

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
import { nunjucksFunction } from '@lowdefy/nunjucks';

function _nunjucks({ params, defaultOn }) {
  let templateString;
  let on;
  if (type.isObject(params) && type.isString(params.template)) {
    templateString = params.template;
    on = type.isObject(params.on) ? params.on : {};
  }
  if (type.isString(params)) {
    templateString = params;
    on = defaultOn;
  }
  if (templateString) {
    try {
      const template = nunjucksFunction(templateString);
      return template(on);
    } catch (e) {
      // log e to LowdefyError
      throw new Error(`_nunjucks failed to parse nunjucks template.`);
    }
  }
  return null;
}

export default _nunjucks;
