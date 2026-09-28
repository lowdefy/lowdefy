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

import { useEffect } from 'react';

import features from '../features/index.js';

// Registers the features' block methods (exportCsv, scrollToRow, clearSelection, ...) once per
// engine methods object. Each method reads the live table through the API object.
function useFeatureMethods({ api, methods }) {
  useEffect(() => {
    features.forEach((feature) => {
      Object.entries(feature.methods ?? {}).forEach(([name, create]) => {
        methods.registerMethod(name, create(api));
      });
    });
  }, [methods]);
}

export default useFeatureMethods;
