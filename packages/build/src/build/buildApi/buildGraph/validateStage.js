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

function validateStage(stage, { apiId, checkDuplicateStageId }) {
  if (!type.isObject(stage)) {
    throw new Error(
      `Expected stage to be an object on endpoint "${apiId}". Received ${JSON.stringify(stage)}.`
    );
  }
  if (type.isUndefined(stage.id)) {
    throw new Error(`Stage id missing at endpoint "${apiId}".`);
  }
  if (!type.isString(stage.id)) {
    throw new Error(
      `Stage id is not a string at endpoint "${apiId}". Received ${JSON.stringify(stage.id)}.`
    );
  }
  if (stage.id.includes('.')) {
    throw new Error(`Stage id "${stage.id}" at api "${apiId}" should not include a period (".").`);
  }
  if (type.isNone(stage.type)) {
    throw new Error(`Stage type is not defined at "${stage.id}" on endpoint "${apiId}".`);
  }
  if (!type.isString(stage.type)) {
    throw new Error(
      `Stage type is not a string at "${
        stage.id
      }" on endpoint "${apiId}". Received ${JSON.stringify(stage.type)}.`
    );
  }
  if (!type.isNone(stage.connectionId)) {
    if (!type.isString(stage)) {
      throw new Error(
        `Stage connectionId is not a string at endpoint "${apiId}". Received ${JSON.stringify(
          stage.connectionId
        )}.`
      );
    }
  }

  checkDuplicateStageId({ id: stage.id, apiId });
}

export default validateStage;
