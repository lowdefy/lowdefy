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

const controlKeys = {
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
    required: [':switch', ':default'],
    graph: [':default', ':switch.$.:then', ':switch.$.:case'],
    optional: [':switch.$.then'],
  },
  // Action maybe?
  ':log': { required: [':log'], graph: [] },
  ':setState': { required: [':setState'], graph: [], optional: [] },
  //
  ':return': { required: [':return'], graph: [], optional: [] },
  ':throw': { required: [':throw'], graph: [], optional: [] },

  ':foreach': { required: [':foreach', ':do', ':as'], graph: [':do'], optional: [] },
  ':while': { required: [':while', ':do'], graph: [':do'], optional: [] },
};

// TODO: Validate :switch
// function createValidateControl(key, { endpointId }) {
//   if (!validControlKey(key)) {
//     throw new Error(`Invalid control type for endpoint ${endpointId}. Received ${key}`);
//   }
//   const requiredControls = new Set();
//   function removeControl

// }
function graphKey(key) {
  return controlKeys[key]?.graph.includes(key);
}
function validControlKey(key) {
  return Object.keys(controlKeys).includes(key);
}
function getAdditionalKeys(keys) {
  return keys.filter((item) => !controlKeys[keys[0]].required.includes(item));
}
function getMissingRequiredControls(keys) {
  return controlKeys[keys[0]].required.filter((item) => !keys.includes(item));
}
function getInvalidControls(keys) {
  const additionalKeys = getAdditionalKeys(keys);
  return additionalKeys.filter((item) => !controlKeys[keys[0]].optional.includes(item));
}

export {
  validControlKey,
  graphKey,
  getInvalidControls,
  getAdditionalKeys,
  getMissingRequiredControls,
};
