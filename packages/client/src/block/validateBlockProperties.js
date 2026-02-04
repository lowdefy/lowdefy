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

import { ConfigError } from '@lowdefy/errors/client';

async function validateBlockProperties({ block, lowdefy }) {
  const Component = lowdefy._internal.blockComponents[block.type];

  if (!Component?.schema?.properties) {
    return;
  }

  const { validate } = await import('@lowdefy/ajv');

  const result = validate({
    schema: Component.schema.properties,
    data: block.eval?.properties ?? {},
    returnErrors: true,
  });

  if (!result.valid) {
    const configError = new ConfigError({
      message: `Block "${block.blockId}" of type "${block.type}" has invalid properties.`,
      configKey: block.eval?.configKey,
    });
    lowdefy._internal.logError(configError);
  }
}

export default validateBlockProperties;
