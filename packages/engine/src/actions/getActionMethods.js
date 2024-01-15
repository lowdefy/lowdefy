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

import createCallMethod from './createCallMethod.js';
import createGetActions from './createGetActions.js';
import createGetBlockId from './createGetBlockId.js';
import createGetEvent from './createGetEvent.js';
import createGetGlobal from './createGetGlobal.js';
import createGetInput from './createGetInput.js';
import createGetPageId from './createGetPageId.js';
import createGetRequestDetails from './createGetRequestDetails.js';
import createGetState from './createGetState.js';
import createGetUrlQuery from './createGetUrlQuery.js';
import createGetUser from './createGetUser.js';
import createLink from './createLink.js';
import createLogin from './createLogin.js';
import createLogout from './createLogout.js';
import createDisplayMessage from './createDisplayMessage.js';
import createRequest from './createRequest.js';
import createReset from './createReset.js';
import createResetValidation from './createResetValidation.js';
import createSetGlobal from './createSetGlobal.js';
import createSetState from './createSetState.js';
import createUpdateSession from './createUpdateSession.js';
import createValidate from './createValidate.js';

function getActionMethods(props) {
  return {
    callMethod: createCallMethod(props),
    displayMessage: createDisplayMessage(props),
    getActions: createGetActions(props),
    getBlockId: createGetBlockId(props),
    getEvent: createGetEvent(props),
    getGlobal: createGetGlobal(props),
    getInput: createGetInput(props),
    getPageId: createGetPageId(props),
    getRequestDetails: createGetRequestDetails(props),
    getState: createGetState(props),
    getUrlQuery: createGetUrlQuery(props),
    getUser: createGetUser(props),
    link: createLink(props),
    login: createLogin(props),
    logout: createLogout(props),
    request: createRequest(props),
    reset: createReset(props),
    resetValidation: createResetValidation(props),
    setGlobal: createSetGlobal(props),
    setState: createSetState(props),
    updateSession: createUpdateSession(props),
    validate: createValidate(props),
  };
}

export default getActionMethods;
