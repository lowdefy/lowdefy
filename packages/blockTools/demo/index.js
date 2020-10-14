/*
  Copyright 2020 Lowdefy, Inc

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
import { render } from 'react-dom';

import { makeCssClass, ErrorBoundary, Loading } from '../src';

// eslint-disable-next-line no-undef
const documentCtx = document;

const ErrorComp = () => <div>{this.unknown}</div>;
const FallbackComp = ({ name, error }) => (
  <div>
    {name} {error.message}
  </div>
);

const Demo = () => (
  <div id="page">
    <h4>ErrorBoundary with renderError=true :</h4>
    <ErrorBoundary renderError>
      <ErrorComp />
    </ErrorBoundary>
    <h4>ErrorBoundary with renderError=false :</h4>
    <ErrorBoundary>
      <ErrorComp />
    </ErrorBoundary>
    <h4>ErrorBoundary with fallback :</h4>
    <ErrorBoundary fallback={(error) => <FallbackComp name="Fallback test" error={error} />}>
      <ErrorComp />
    </ErrorBoundary>

    <div id="emotion" />
    <h4>{"makeCssClass({ color: 'red' })"} :</h4>
    <div className={makeCssClass({ color: 'red' })}>Red text</div>

    <h4>Loading component :</h4>
    <div style={{ height: 200 }}>
      <Loading />
    </div>
  </div>
);

export default Demo;

render(<Demo />, documentCtx.querySelector('#root'));
