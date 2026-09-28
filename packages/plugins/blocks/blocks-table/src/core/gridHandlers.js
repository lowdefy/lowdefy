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

import features from '../features/index.js';

// Every delegated handler, by DOM event type, in feature order. The grid root carries one React
// listener per event type (D5); a handler that returns true stops the chain.
const gridHandlers = {};
features.forEach((feature) => {
  Object.entries(feature.gridHandlers ?? {}).forEach(([eventType, handler]) => {
    gridHandlers[eventType] = [...(gridHandlers[eventType] ?? []), handler];
  });
});

export default gridHandlers;
