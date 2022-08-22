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

import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '../../pages/api/auth/[...nextauth].js';
import authJson from '../../build/auth.json';

async function getServerSession({ req, res }) {
  if (authJson.configured === true) {
    return await unstable_getServerSession(req, res, authOptions);
  }
  return undefined;
}

export default getServerSession;
