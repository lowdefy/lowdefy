/*
  Copyright 2020-2024 Lowdefy, Inc

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
import dateFilter from './dateFilter.js';
import uniqueFilter from './uniqueFilter.js';
import urlQueryFilter from './urlQueryFilter.js';

// dateFilter.setDefaultFormat('YYYY-MM-DD');
export const nunjucksEnv = new nunjucks.Environment();

nunjucksEnv.addFilter('date', dateFilter);
nunjucksEnv.addFilter('unique', uniqueFilter);
nunjucksEnv.addFilter('urlQuery', urlQueryFilter);

const nunjucksTemplates = {};
// slow
export const nunjucksString = (templateString, value) => {
  if (type.isPrimitive(value)) {
    return nunjucksEnv.renderString(templateString, { value });
  }
  return nunjucksEnv.renderString(templateString, value);
};

export const validNunjucksString = (templateString, returnError = false) => {
  try {
    nunjucksString(templateString, {});
    return true;
  } catch (e) {
    if (returnError) {
      return { name: e.name, message: e.message };
    }
    return false;
  }
};

// fast
// test with memoization
// this method compiles a nunjucks string only if the client has not compiled the same string before.
export const nunjucksFunction = (templateString) => {
  // template was already compiled
  if (type.isFunction(nunjucksTemplates[templateString])) {
    return nunjucksTemplates[templateString];
  }
  if (type.isString(templateString)) {
    const template = nunjucks.compile(templateString, nunjucksEnv);
    // execute once to throw catch template errors
    template.render({});
    nunjucksTemplates[templateString] = (value) => {
      if (type.isPrimitive(value)) {
        return template.render({ value });
      }
      return template.render(value);
    };
  } else {
    // for non string types like booleans or objects
    nunjucksTemplates[templateString] = () => templateString;
  }
  return nunjucksTemplates[templateString];
};
