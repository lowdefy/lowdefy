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

import React from 'react';

const ErrorPage = ({ code, description, message, name }) => (
  <div
    style={{
      height: '100%',
      fontFamily: 'system-ui',
      margin: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <div
      style={{
        flex: '0 1 auto',
        fontSize: '4.3em',
        fontWeight: '100',
        paddingRight: 30,
      }}
    >
      {code ?? 500}
    </div>
    <div
      style={{
        flex: '0 1 auto',
        paddingLeft: 30,
        maxWidth: 400,
        borderLeft: '1px solid #aeaeae',
      }}
    >
      <div style={{ fontSize: '1.3em', fontWeight: '300', paddingBottom: 10 }}>
        {name ?? 'Error'}
      </div>
      <div style={{ fontSize: '0.9em' }}>{message ?? 'An error has occurred.'}</div>
      <div style={{ fontSize: '0.9em' }}>{description}</div>
      <div style={{ paddingTop: 20 }}>
        <a href="/">Return to home page</a>
      </div>
    </div>
  </div>
);

export default ErrorPage;
