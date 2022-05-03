/*
  Copyright 2020-2022 Lowdefy, Inc

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
import { getNextAuthConfig } from '@lowdefy/api';

import authJson from '../../../build/auth.json';
import providers from '../../../build/plugins/auth/providers.js';

// If getNextAuthConfig needs to be async:
// async function auth(req, res) {
//   const config = await getNextAuthConfig();
//   return await NextAuth(req, res, config);
// }

// export default auth;

export default NextAuth(getNextAuthConfig({ authJson, plugins: { providers } }));
