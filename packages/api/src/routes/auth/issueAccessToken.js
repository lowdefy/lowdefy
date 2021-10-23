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

import { get } from '@lowdefy/helpers';
import jwt from 'jsonwebtoken';

function issueAccessToken({ config, host, secrets }, { claims }) {
  const { JWT_SECRET } = secrets;
  const { expiresIn } = get(config, 'auth.jwt', { default: {} });
  // eslint-disable-next-line no-unused-vars
  const { aud, exp, iat, iss, ...otherClaims } = claims;
  return jwt.sign(
    {
      ...otherClaims,
      lowdefy_access_token: true,
    },
    JWT_SECRET,
    {
      expiresIn: expiresIn || '4h',
      audience: host,
      issuer: host,
    }
  );
}

export default issueAccessToken;
