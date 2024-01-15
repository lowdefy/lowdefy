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

const BlockSchemaErrors = ({ schemaErrors }) => {
  if (!schemaErrors || schemaErrors.length === 0) return '';
  return (
    <div
      style={{
        padding: 10,
        fontSize: '0.8rem',
        border: '1px solid red',
        background: '#fBB',
        width: '100%',
      }}
    >
      <div>
        <b>Schema Errors</b>
      </div>
      {schemaErrors.map((error, i) => (
        <div key={i}>
          <br />
          <div>
            <b>keyword:</b> {error.keyword}
          </div>
          <div>
            <b>message:</b> {error.message}
          </div>
          <div>
            <b>params:</b> {JSON.stringify(error.params)}
          </div>
          <div>
            <b>dataPath:</b> {error.dataPath}
          </div>
          <div>
            <b>schemaPath:</b> {error.schemaPath}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BlockSchemaErrors;
