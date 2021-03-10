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

import { ServerError } from '../context/errors';

class AuthorizationController {
  constructor({ user }) {
    this.user = user;
  }

  authorize({ auth }) {
    if (auth === 'public') return true;
    if (auth === 'protected') {
      return !!this.user.sub;
    }
    throw new ServerError('Invalid auth configuration');
  }
}

function createAuthorizationController(context) {
  return new AuthorizationController(context);
}

export { AuthorizationController };

export default createAuthorizationController;
