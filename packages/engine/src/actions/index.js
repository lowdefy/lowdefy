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

import { default as callMethod } from './callMethod.js';
import { default as getAction } from './getAction.js';
import { default as getBlockId } from './getBlockId.js';
import { default as getEvent } from './getEvent.js';
import { default as getGlobal } from './getGlobal.js';
import { default as getInput } from './getInput.js';
import { default as getPageId } from './getPageId.js';
import { default as getRequest } from './getRequest.js';
import { default as getState } from './getState.js';
import { default as getUrlQuery } from './getUrlQuery.js';
import { default as getUser } from './getUser.js';
import { default as link } from './link.js';
import { default as login } from './login.js';
import { default as logout } from './logout.js';
import { default as message } from './message.js';
import { default as request } from './request.js';
import { default as reset } from './reset.js';
import { default as resetValidation } from './resetValidation.js';
import { default as scrollTo } from './scrollTo.js';
import { default as setGlobal } from './setGlobal.js';
import { default as setState } from './setState.js';
import { default as validate } from './validate.js';

export const getMethods = ({ actions, arrayIndices, blockId, context, event, responses }) => {
  return {
    callMethod: (params) => callMethod({ arrayIndices, context, params }),
    getAction: (params) => getAction({ arrayIndices, location: blockId, params, responses }),
    getBlockId: () => getBlockId({ blockId }),
    getEvent: (params) => getEvent({ event, params }),
    getGlobal: (params) =>
      getGlobal({
        arrayIndices,
        lowdefyGlobal: context._internal.lowdefy.lowdefyGlobal || {},
        location: blockId,
        params,
      }),
    getInput: (params) =>
      getInput({
        arrayIndices,
        input: context._internal.lowdefy.inputs ? context._internal.lowdefy.inputs[context.id] : {},
        location: blockId,
        params,
      }),
    getPageId: () => getPageId({ pageId: context.pageId }),
    getRequest: (params) =>
      getRequest({
        arrayIndices,
        requests: context.requests,
        location: blockId,
        params,
      }),
    getState: (params) =>
      getState({
        arrayIndices,
        state: context.state,
        location: blockId,
        params,
      }),
    getUrlQuery: (params) =>
      getUrlQuery({
        arrayIndices,
        urlQuery: context._internal.lowdefy.urlQuery || {},
        location: blockId,
        params,
      }),
    getUser: (params) =>
      getUser({
        arrayIndices,
        user: context._internal.lowdefy.user || {},
        location: blockId,
        params,
      }),
    link: (params) => link({ context, params }),
    login: (params) => login({ context, params }),
    logout: () => logout({ context }),
    message: (params) => message({ context, params }),
    request: (params) =>
      request({
        actions,
        arrayIndices,
        context,
        event,
        params,
      }),
    reset: () => reset({ context }),
    resetValidation: (params) => resetValidation({ context, params }),
    scrollTo: (params) => {
      scrollTo({ context, params });
    },
    setGlobal: (params) => setGlobal({ arrayIndices, context, params }),
    setState: (params) => setState({ arrayIndices, context, params }),
    validate: (params) => validate({ context, params }),
  };
};

export default {
  callMethod,
  getAction,
  getBlockId,
  getEvent,
  getGlobal,
  getInput,
  getPageId,
  getRequest,
  getState,
  getUrlQuery,
  getUser,
  link,
  login,
  logout,
  message,
  request,
  reset,
  resetValidation,
  scrollTo,
  setGlobal,
  setState,
  validate,
};
