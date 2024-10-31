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
    graph: [':default', ':switch.$.:then'],
    optional: [':switch.$.then'],
  },
  // Action maybe?
  ':log': { required: [':log'], graph: [] },
  ':setState': { required: [':setState'], graph: [], optional: [] },
  //
  ':return': { required: [':return'], graph: [], optional: [] },
  ':foreach': { required: [':foreach', ':do', ':as'], graph: [':do'], optional: [] },
  ':while': { required: [':while', ':do'], graph: [':do'], optional: [] },
};

function graphKey(key) {
  return controlKeys[key]?.graph.includes(key);
}
function validControlKey(keys) {
  return keys.some((key) => Object.keys(controlKeys).includes(key));
}
function optionalKey(key) {
  return controlKeys[key]?.optional.includes(key);
}

export { validControlKey, graphKey, optionalKey };
