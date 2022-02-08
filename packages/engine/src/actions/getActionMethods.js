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

import createCallMethod from './callMethod.js';
import createGetAction from './getAction.js';
import createGetBlockId from './getBlockId.js';
import createGetEvent from './getEvent.js';
import createGetGlobal from './getGlobal.js';
import createGetInput from './getInput.js';
import createGetPageId from './getPageId.js';
import createGetRequest from './getRequest.js';
import createGetState from './getState.js';
import createGetUrlQuery from './getUrlQuery.js';
import createGetUser from './getUser.js';
import createLink from './link.js';
import createLogin from './login.js';
import createLogout from './logout.js';
import createMessage from './message.js';
import createRequest from './request.js';
import createReset from './reset.js';
import createResetValidation from './resetValidation.js';
import createSetGlobal from './setGlobal.js';
import createSetState from './setState.js';
import createValidate from './validate.js';

function getActionMethods(props) {
  return {
    callMethod: createCallMethod(props),
    getAction: createGetAction(props),
    getBlockId: createGetBlockId(props),
    getEvent: createGetEvent(props),
    getGlobal: createGetGlobal(props),
    getInput: createGetInput(props),
    getPageId: createGetPageId(props),
    getRequest: createGetRequest(props),
    getState: createGetState(props),
    getUrlQuery: createGetUrlQuery(props),
    getUser: createGetUser(props),
    link: createLink(props),
    login: createLogin(props),
    logout: createLogout(props),
    message: createMessage(props),
    request: createRequest(props),
    reset: createReset(props),
    resetValidation: createResetValidation(props),
    setGlobal: createSetGlobal(props),
    setState: createSetState(props),
    validate: createValidate(props),
  };
}

export default getActionMethods;
