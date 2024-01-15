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

// Used in @lowdefy/engine tests

import buildAuth from '../buildAuth/buildAuth.js';
import buildPages from './buildPages.js';
import createContext from '../../createContext.js';

function buildTestPage({ pageConfig }) {
  const context = createContext({
    customTypesMap: {},
    directories: {},
    logger: {
      debug: () => {},
      log: () => {},
      warn: () => {},
      error: () => {},
    },
    stage: 'test',
  });
  const components = {
    pages: [pageConfig],
  };
  buildAuth({ components, context });
  buildPages({ components, context });

  return components.pages[0];
}

export default buildTestPage;
