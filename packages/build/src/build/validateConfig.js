/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2021 Lowdefy, Inc

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
import lowdefySchema from '../lowdefySchema.js';

async function validateConfig({ components }) {
  if (type.isNone(components.config)) {
    components.config = {};
  }
  if (!type.isObject(components.config)) {
    throw new Error('lowdefy.config is not an object.');
  }
  if (type.isNone(components.config.auth)) {
    components.config.auth = {};
  }
  if (type.isNone(components.config.auth.pages)) {
    components.config.auth.pages = {};
  }
  if (type.isNone(components.config.auth.pages.roles)) {
    components.config.auth.pages.roles = {};
  }
  if (type.isNone(components.config.theme)) {
    components.config.theme = {};
  }
  if (type.isString(components.config.basePath)) {
    if (components.config.basePath[0] !== '/') {
      throw Error('Base path must start with "/".');
    }
  }
  validate({
    schema: lowdefySchema.definitions.authConfig,
    data: components.config.auth,
  });
  if (
    (components.config.auth.pages.protected === true &&
      components.config.auth.pages.public === true) ||
    (type.isArray(components.config.auth.pages.protected) &&
      type.isArray(components.config.auth.pages.public))
  ) {
    throw new Error(
      'Protected and public pages are mutually exclusive. When protected pages are listed, all unlisted pages are public by default and visa versa.'
    );
  }
  if (components.config.auth.pages.protected === false) {
    throw new Error('Protected pages can not be set to false.');
  }
  if (components.config.auth.pages.public === false) {
    throw new Error('Public pages can not be set to false.');
  }
  return components;
}

export default validateConfig;
