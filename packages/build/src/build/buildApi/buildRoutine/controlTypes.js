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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import buildRoutine from './buildRoutine.js';
import countControl from './countControl.js';
import countOperators from '../../../utils/countOperators.js';

const controlTypes = {
  ':for': { required: [':for', ':in', ':do'], routine: [':do'], optional: [] },
  ':if': {
    required: [':if', ':then'],
    routine: [':then', ':else'],
    optional: [':else'],
  },
  ':log': { required: [':log'], routine: [], optional: [':level'] },
  ':parallel': {
    required: [':parallel'],
    routine: [':parallel'],
    optional: [],
  },
  ':parallel_for': { required: [':parallel_for', ':in', ':do'], routine: [':do'], optional: [] },
  ':reject': { required: [':reject'], routine: [], optional: [':cause'] },
  ':return': { required: [':return'], routine: [], optional: [] },
  ':set_state': { required: [':set_state'], routine: [], optional: [] },
  ':switch': {
    required: [':switch', ':case', ':then'],
    routine: [':default', ':then'],
    optional: [':default'],
  },
  ':throw': { required: [':throw'], routine: [], optional: [':cause'] },
  ':try': {
    required: [':try'],
    routine: [':try', ':catch', ':finally'],
    optional: [':catch', ':finally'],
  },

  ':while': { required: [':while', ':do'], routine: [':do'], optional: [] },
};

function getAdditionalKeys(controlType, keys) {
  return keys.filter((item) => !controlTypes[controlType].required.includes(item));
}

function checkMissingRequiredControls({ controlType, keys, control }, endpointContext) {
  const { endpointId } = endpointContext;
  const missingControls = controlTypes[controlType].required.filter((item) => !keys.includes(item));
  if (missingControls.length > 0) {
    throw new ConfigError(
      `Missing required control type(s) for endpoint ${endpointId}.`,
      { received: missingControls, configKey: control?.['~k'] }
    );
  }
}

function checkInvalidControls({ controlType, keys, control }, endpointContext) {
  const { endpointId } = endpointContext;
  const additionalControls = getAdditionalKeys(controlType, keys);
  const invalidControls = additionalControls.filter(
    (item) => !controlTypes[controlType].optional.includes(item)
  );

  if (invalidControls.length > 0) {
    throw new ConfigError(
      `Invalid control type(s) for endpoint ${endpointId}.`,
      { received: invalidControls, configKey: control?.['~k'] }
    );
  }
}

function handleSwitch(control, endpointContext) {
  const { endpointId } = endpointContext;
  const switchArray = control[':switch'];
  if (!type.isArray(control[':switch'])) {
    throw new ConfigError(
      `Type given for :switch control is invalid at endpoint ${endpointId}.`,
      { received: control[':switch'], configKey: control['~k'] }
    );
  }

  switchArray.forEach((caseObj) => {
    const input = {
      controlType: ':switch',
      keys: [':switch', ...Object.keys(caseObj)],
      control: caseObj,
    };
    checkMissingRequiredControls(input, endpointContext);
    checkInvalidControls(input, endpointContext);
    Object.keys(caseObj).forEach((key) => {
      if (routineKey(':switch', key)) {
        buildRoutine(caseObj[key], endpointContext);
      } else {
        countOperators(caseObj[key], { counter: endpointContext.typeCounters.operators.server });
        countControl(key, endpointContext);
      }
    });
  });
}

function validateControl(control, endpointContext) {
  const { endpointId } = endpointContext;
  const keys = Object.keys(control);
  const intersection = keys.filter((item) => Object.keys(controlTypes).includes(item));
  if (intersection.length === 0) {
    throw new ConfigError(
      `Invalid control type(s) for endpoint ${endpointId}.`,
      { received: keys, configKey: control['~k'] }
    );
  }
  if (intersection.length > 1) {
    throw new ConfigError(
      `More than one control type found for endpoint ${endpointId}.`,
      { received: intersection, configKey: control['~k'] }
    );
  }

  const controlType = intersection[0];
  if (controlType === ':switch') {
    handleSwitch(control, endpointContext);
    return controlType;
  }

  checkMissingRequiredControls({ controlType, keys, control }, endpointContext);
  checkInvalidControls({ controlType, keys, control }, endpointContext);

  return controlType;
}

function routineKey(controlType, key) {
  return controlTypes[controlType]?.routine.includes(key);
}

export { routineKey, validateControl };
