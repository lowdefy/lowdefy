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

import { type } from '@lowdefy/helpers';
import { getStepKey } from '@lowdefy/node-utils';

function readsMail(step) {
  const key = getStepKey(step);
  return key === 'email' || (key === 'fill' && !type.isUndefined(step.fill.fromEmail));
}

// Steps that read email need the dev server's mail sink. Without it they would
// each wait out their timeout for mail that can never arrive, so the journey is
// refused up front. Returns an error message, or undefined.
function validateJourneyMail({ steps }) {
  const capturesMail = process.env.LOWDEFY_SERVER_DEV_MAIL_SINK === 'true';
  if (steps.some(readsMail) && !capturesMail) {
    return 'The steps read email (an "email" step or a "fill" with "fromEmail"), but this dev server captures no mail. Start (or restart) it with LOWDEFY_DEV_SMTP_PORT set to a free port, and point the app\'s SMTP connection at 127.0.0.1 on that port.';
  }
  return undefined;
}

export default validateJourneyMail;
