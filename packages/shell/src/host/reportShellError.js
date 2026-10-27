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

import { isExpectedError } from '@lowdefy/errors';

import isNetworkError from './isNetworkError.js';
import { peekCurrentApp } from '../native/currentApp.js';

/**
 * The shell's sink for a fault no screen shows or that a developer must know of: a failed sync, a
 * push token the server refused, a background task that threw. It goes to the core's handleError
 * once a page has created one (the device log, Lowdefy Dev's error bar, and for a Lowdefy error the
 * server log), and to the device console before then. Expected outcomes are not faults: no
 * network, or a refusal the server answered as one (UserError, AuthenticationError, ...), are
 * dropped.
 *
 * @param {Object} params
 * @param {Error} params.error
 * @param {{ getState }} [params.session] The app session whose core reports it; the open app's by
 *   default (currentApp.js).
 */
function reportShellError({ error, session = peekCurrentApp()?.session }) {
  if (isNetworkError(error) || isExpectedError(error)) {
    return;
  }
  const handleError = session?.getState().lowdefy?._internal?.handleError;
  if (handleError === undefined) {
    console.error(error);
    return;
  }
  Promise.resolve(handleError(error)).catch(() => console.error(error));
}

export default reportShellError;
