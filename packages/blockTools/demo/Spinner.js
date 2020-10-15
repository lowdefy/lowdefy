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
import { Spinner } from '../src';
import Wrapper from './Wrapper';

const Examples = () => (
  <>
    <Wrapper title="Spinner">
      <Spinner />
    </Wrapper>
    <Wrapper title="Spinner properties.height: 100 :">
      <Spinner properties={{ height: 100 }} />
    </Wrapper>
    <Wrapper title="Spinner container style= height: 200 :" style={{ height: 200 }}>
      <Spinner />
    </Wrapper>
    <Wrapper title="Spinner properties.message = loading">
      <Spinner properties={{ height: 100, message: 'loading' }} />
    </Wrapper>
    <Wrapper title="Spinner shaded = true:">
      <Spinner properties={{ shaded: true }} />
    </Wrapper>
  </>
);

export default Examples;
