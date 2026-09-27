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

import { ConfigError } from '@lowdefy/errors';

import { ConfigWarning } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// The server's defaults: config.requestTimeout (servers/server/src/app.js) and the function
// maxDuration `lowdefy vercel-output` writes when config.vercel.maxDuration is not set.
const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_VERCEL_MAX_DURATION_S = 60;

// The request timeout answers 504 and cancels the upstream calls a request left running (an AI
// provider call among them). On Vercel the platform stops the function at maxDuration, so a
// timeout that is not shorter never gets to run: the function is killed mid-call instead, and
// nothing is cancelled or logged. The app targets Vercel when it sets config.vercel, or when the
// build runs on Vercel (Vercel sets VERCEL in its build environment).
function validateRequestTimeout({ components, context }) {
  const { requestTimeout = DEFAULT_REQUEST_TIMEOUT_MS, vercel } = components.config;
  const targetsVercel = !type.isNone(vercel) || !type.isNone(process.env.VERCEL);
  if (!targetsVercel) {
    return;
  }
  const maxDuration = vercel?.maxDuration ?? DEFAULT_VERCEL_MAX_DURATION_S;
  // testSchema has already warned about a value of the wrong type, and 0 turns the timeout off.
  if (!type.isNumber(requestTimeout) || !type.isNumber(maxDuration) || requestTimeout === 0) {
    return;
  }
  if (requestTimeout < maxDuration * 1000) {
    return;
  }
  context.handleWarning(
    new ConfigWarning(
      `App "config.requestTimeout" (${requestTimeout} ms) is not shorter than the Vercel function's maxDuration (${maxDuration} s). Vercel stops the function first, so the request timeout never answers and the calls a request left running are not cancelled. Set "config.requestTimeout" below ${
        maxDuration * 1000
      } ms, or raise "config.vercel.maxDuration".`,
      { configKey: components.config['~k'] }
    )
  );
}

export default validateRequestTimeout;
