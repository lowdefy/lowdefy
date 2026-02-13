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

/* eslint-disable react/jsx-props-no-spreading */

import React from 'react';
import AuthE2E from './AuthE2E.js';

import authConfig from '../../build/auth.js';

function Auth({ children, session }) {
  return (
    <AuthE2E session={session} authConfig={authConfig}>
      {(auth) => children(auth)}
    </AuthE2E>
  );
}

export default Auth;
