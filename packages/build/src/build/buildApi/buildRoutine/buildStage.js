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

import validateStage from './validateStage.js';
import setStageId from './setStageId.js';
import countStageTypes from './countStageTypes.js';

function buildStage(stage, endpointContext) {
  validateStage(stage, endpointContext);
  setStageId(stage, endpointContext);
  countStageTypes(stage, endpointContext);
}

export default buildStage;
