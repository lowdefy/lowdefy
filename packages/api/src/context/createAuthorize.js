/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { ServerError } from './errors.js';

function createAuthorize({ session }) {
  // Next-auth getSession provides a session object if the user is authenticated
  // else session will be null

  const authenticated = !!session;
  const roles = session?.user?.roles ?? [];
  function authorize({ auth }) {
    if (auth.public === true) return true;
    if (auth.public === false) {
      if (auth.roles) {
        return authenticated && auth.roles.some((role) => roles.includes(role));
      }
      return authenticated;
    }
    throw new ServerError('Invalid auth configuration');
  }
  return authorize;
}

export default createAuthorize;
