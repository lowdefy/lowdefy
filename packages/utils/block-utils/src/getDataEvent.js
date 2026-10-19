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

// dataset keys are camelCase (data-record-id → recordId); config authors
// write the attributes in kebab-case, so hand them back as snake_case.
function toSnakeCase(key) {
  return key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

// A data-event element names the block event it fires; its other data-*
// attributes are the event object.
function getDataEvent(element) {
  const { event: name, ...data } = element.dataset;
  const event = {};
  Object.keys(data).forEach((key) => {
    event[toSnakeCase(key)] = data[key];
  });
  return { name, event };
}

export default getDataEvent;
