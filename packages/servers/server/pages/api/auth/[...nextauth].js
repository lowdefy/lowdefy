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

import NextAuth from 'next-auth';

import apiWrapper from '../../../lib/server/apiWrapper.js';
import authJson from '../../../lib/build/auth.js';

async function handler({ context, req, res }) {
  if (authJson.configured !== true) {
    return res.status(404).json({
      message: 'Auth not configured',
    });
  }

  // Required for emails in corporate networks, see:
  // https://next-auth.js.org/tutorials/avoid-corporate-link-checking-email-provider
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }
  return NextAuth(req, res, context.authOptions);
}

export default apiWrapper(handler);
