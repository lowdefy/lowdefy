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
import { ConfigError } from '@lowdefy/errors/build';

function validateMutualExclusivity({ components, context, entity }) {
  const configKey = components.auth[entity]?.['~k'] || components.auth?.['~k'];
  if (
    (components.auth[entity].protected === true && components.auth[entity].public === true) ||
    (type.isArray(components.auth[entity].protected) &&
      type.isArray(components.auth[entity].public))
  ) {
    throw new ConfigError({
      message: `Protected and public ${entity} are mutually exclusive. When protected ${entity} are listed, all unlisted ${entity} are public by default and vice versa.`,
      configKey,
      context,
    });
  }
  if (components.auth[entity].protected === false) {
    throw new ConfigError({
      message: `Protected ${entity} can not be set to false.`,
      configKey,
      context,
    });
  }
  if (components.auth[entity].public === false) {
    throw new ConfigError({
      message: `Public ${entity} can not be set to false.`,
      configKey,
      context,
    });
  }
}

export default validateMutualExclusivity;
