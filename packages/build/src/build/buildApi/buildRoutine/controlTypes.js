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
import buildRoutine from './buildRoutine.js';
import countControl from './countControl.js';

const controlTypes = {
  ':try': {
    required: [':try'],
    graph: [':try', ':catch', ':finally'],
    optional: [':catch', ':finally'],
  },
  ':parallel': {
    required: [':parallel'],
    graph: [':parallel'],
    optional: [],
  },
  ':if': {
    required: [':if', ':then'],
    graph: [':then', ':else'],
    optional: [':else'],
  },
  ':switch': {
    required: [':switch'],
    graph: [':default'],
    optional: [],
  },
  // Action maybe?
  ':log': { required: [':log'], graph: [] },
  ':setState': { required: [':setState'], graph: [], optional: [] },
  //
  ':return': { required: [':return'], graph: [], optional: [] },
  ':throw': { required: [':throw'], graph: [], optional: [] },

  ':foreach': { required: [':foreach', ':do', ':as'], graph: [':do'], optional: [] },
  ':while': { required: [':while', ':do'], graph: [':do'], optional: [] },
  ':case': { required: [':case', ':then'], graph: [':then'], optional: [] },
};

function getAdditionalKeys(keys) {
  return keys.filter((item) => !controlTypes[keys[0]].required.includes(item));
}

function getMissingRequiredControls(controlType, keys) {
  return controlTypes[keys[controlType]].required.filter((item) => !keys.includes(item));
}

function getInvalidControls(controlType, keys) {
  const additionalKeys = getAdditionalKeys(keys);
  return additionalKeys.filter((item) => !controlTypes[controlType].optional.includes(item));
}

function handleSwitch(control, endpointContext) {
  const switchArray = control[':switch'];
  if (!type.isArray(control[':switch'])) {
    throw new Error(
      `Type given for :switch control is invalid at endpoint ${
        endpointContext.endpointId
      }. Received ${JSON.stringify(control[':switch'])}`
    );
  }

  switchArray.forEach((switchObj) => {
    validateControl(switchObj, endpointContext);
    Object.keys.forEach((key) => {
      if (graphKey(key)) {
        buildRoutine(control[key], endpointContext);
      } else {
        countControl(key);
      }
    });
  });
}

function validateControl(control, endpointContext) {
  const keys = Object.keys(control);
  const intersection = keys.filter((item) => Object.keys(controlTypes).includes(item));
  if (intersection.length !== 1) {
    throw new Error(`More than one control type found. Received ${JSON.stringify(intersection)}`);
  }

  const controlType = intersection[0];
  if (controlType === ':switch') {
    handleSwitch(control, endpointContext);
  }

  const missingRequiredControls = getMissingRequiredControls(controlType, keys);
  if (missingRequiredControls.length > 0) {
    throw new Error(
      `Missing required control type(s) for endpoint ${
        endpointContext.endpointId
      }. Missing ${JSON.stringify(missingRequiredControls)}`
    );
  }

  const invalidControls = getInvalidControls(controlType, keys);
  if (invalidControls.length > 0) {
    throw new Error(
      `Invalid control type(s) for endpoint ${
        endpointContext.endpointId
      }. Received ${JSON.stringify(invalidControls)}`
    );
  }
}

function graphKey(key) {
  return controlTypes[key]?.graph.includes(key);
}

export { graphKey, validateControl };
