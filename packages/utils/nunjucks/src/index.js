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
import { LRUCache, type } from '@lowdefy/helpers';
import createRenderFunction from './createRenderFunction.js';
import dateFilter from './dateFilter.js';
import uniqueFilter from './uniqueFilter.js';
import urlQueryFilter from './urlQueryFilter.js';
import SlotExtension from './SlotExtension.js';

export const createEnvironment = ({ autoescape = true } = {}) => {
  const environment = new nunjucks.Environment(null, { autoescape });
  environment.addFilter('date', dateFilter);
  environment.addFilter('unique', uniqueFilter);
  environment.addFilter('urlQuery', urlQueryFilter);
  return environment;
};

// dateFilter.setDefaultFormat('YYYY-MM-DD');
export const nunjucksEnv = createEnvironment();

const nunjucksTemplates = new LRUCache({ maxSize: 500 });
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
// Compiles a nunjucks string only once per distinct source, bounded by an LRU cache.
export const nunjucksFunction = createRenderFunction({
  environment: nunjucksEnv,
  cache: nunjucksTemplates,
});

// Templates for the Template block: autoescaped, with the {% slot %} tag registered. Kept apart
// from nunjucksEnv so the extension never changes how the rest of Lowdefy renders strings.
const templateEnv = createEnvironment({ autoescape: true });
templateEnv.addExtension('SlotExtension', new SlotExtension());

const compiledTemplates = new LRUCache({ maxSize: 500 });
export const createTemplateFunction = createRenderFunction({
  environment: templateEnv,
  cache: compiledTemplates,
});

export { createRenderFunction };
