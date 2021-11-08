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

import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../../context/errors.js';

function verifyOpenIdStateToken({ host, secrets }, { token }) {
  try {
    const { JWT_SECRET } = secrets;
    const claims = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      audience: host,
      issuer: host,
    });
    if (claims.lowdefy_openid_state_token !== true) {
      throw new AuthenticationError('Invalid token.');
    }
    return claims;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token expired.');
    } else {
      throw new AuthenticationError('Invalid token.');
    }
  }
}

export default verifyOpenIdStateToken;
