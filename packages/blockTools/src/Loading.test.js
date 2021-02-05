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

import React from 'react';

import {
  IconSpinner,
  Loading,
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonInput,
  SkeletonParagraph,
  Spinner,
} from '../src';

import { configure, shallow } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
configure({ adapter: new Adapter() });

test('All loading components under switch statement', () => {
  expect(shallow(<Loading type="IconSpinner" />).contains(<Spinner />)).toBe(false);
  expect(shallow(<Loading />).contains(<div />)).toBe(true);
  expect(shallow(<Loading type="IconSpinner" />).contains(<IconSpinner />)).toBe(true);
  expect(shallow(<Loading type="Skeleton" />).contains(<Skeleton />)).toBe(true);
  expect(shallow(<Loading type="SkeletonAvatar" />).contains(<SkeletonAvatar />)).toBe(true);
  expect(shallow(<Loading type="SkeletonButton" />).contains(<SkeletonButton />)).toBe(true);
  expect(shallow(<Loading type="SkeletonInput" />).contains(<SkeletonInput />)).toBe(true);
  expect(shallow(<Loading type="SkeletonParagraph" />).contains(<SkeletonParagraph />)).toBe(true);
  expect(shallow(<Loading type="Spinner" />).contains(<Spinner />)).toBe(true);
});
