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

import createAuthorizationController from './authorizationController';
import createComponentController from './componentController';
import createOpenIdController from './openIdController';
import createPageController from './pageController';
import createRequestController from './requestController';
import createTokenController from './tokenController';

function creatGetController(context) {
  const constructors = {
    authorization: createAuthorizationController,
    page: createPageController,
    component: createComponentController,
    openId: createOpenIdController,
    request: createRequestController,
    token: createTokenController,
  };
  const memoized = {};

  function getController(name) {
    if (!type.isUndefined(memoized[name])) {
      return memoized[name];
    }
    const controller = constructors[name](context);
    memoized[name] = controller;
    return controller;
  }

  return getController;
}

export default creatGetController;
