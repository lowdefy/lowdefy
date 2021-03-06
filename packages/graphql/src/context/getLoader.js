/*
  Copyright 2020-2021 Lowdefy, Inc

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

import createComponentLoader from '../loaders/componentLoader';
import createConnectionLoader from '../loaders/connectionLoader';
import createPageLoader from '../loaders/pageLoader';
import createRequestLoader from '../loaders/requestLoader';

function createGetLoader(context) {
  const constructors = {
    component: createComponentLoader,
    connection: createConnectionLoader,
    page: createPageLoader,
    request: createRequestLoader,
  };
  const memoized = {};

  function getLoader(name) {
    if (!type.isUndefined(memoized[name])) {
      return memoized[name];
    }
    const loader = constructors[name](context);
    memoized[name] = loader;
    return loader;
  }

  return getLoader;
}

export default createGetLoader;
