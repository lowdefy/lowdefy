/* eslint-disable no-param-reassign */

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

import { type } from '@lowdefy/helpers';
import { validate } from '@lowdefy/ajv';
import lowdefySchema from '../../lowdefySchema.js';

import validateMutualExclusivity from './validateMutualExclusivity.js';

async function validateAuthConfig({ components }) {
  if (type.isNone(components.auth)) {
    components.auth = {};
  }
  if (!type.isObject(components.auth)) {
    throw new Error('lowdefy.auth is not an object.');
  }
  if (type.isNone(components.auth.api)) {
    components.auth.api = {};
  }
  if (type.isNone(components.auth.api.roles)) {
    components.auth.api.roles = {};
  }
  if (type.isNone(components.auth.authPages)) {
    components.auth.authPages = {};
  }
  if (type.isNone(components.auth.pages)) {
    components.auth.pages = {};
  }
  if (type.isNone(components.auth.pages.roles)) {
    components.auth.pages.roles = {};
  }
  if (type.isNone(components.auth.callbacks)) {
    components.auth.callbacks = [];
  }
  if (type.isNone(components.auth.events)) {
    components.auth.events = [];
  }
  if (type.isNone(components.auth.providers)) {
    components.auth.providers = [];
  }
  if (type.isNone(components.auth.session)) {
    components.auth.session = {};
  }
  if (type.isNone(components.auth.theme)) {
    components.auth.theme = {};
  }

  validate({
    schema: lowdefySchema.definitions.authConfig,
    data: components.auth,
  });

  validateMutualExclusivity({ components, entity: 'api' });
  validateMutualExclusivity({ components, entity: 'pages' });

  return components;
}

export default validateAuthConfig;
