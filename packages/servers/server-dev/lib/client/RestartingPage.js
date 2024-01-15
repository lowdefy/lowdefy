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

const RestartingPage = () => {
  return (
    <div
      style={{
        height: '100vh',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          verticalAlign: 'middle',
          display: 'inline-block',
        }}
      >
        <h3>Rebuilding Lowdefy App</h3>
        <p>
          The server is restarting because your configuration changed. The page will reload when
          ready.
        </p>
      </div>
    </div>
  );
};

export default RestartingPage;
