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
import Wrapper from './Wrapper';
import { Skeleton } from '../src';

const Examples = () => (
  <>
    <Wrapper title={'Skeleton'}>
      <Skeleton />
    </Wrapper>
    <Wrapper title={'Skeleton container height=20'} style={{ height: 20 }}>
      <Skeleton />
    </Wrapper>
    <Wrapper title={'Skeleton container height=40 width=100'} style={{ height: 40, width: 100 }}>
      <Skeleton />
    </Wrapper>
  </>
);

export default Examples;
