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

import { render } from 'react-dom';
import IconSpinner from './IconSpinner';
import React from 'react';
import Skeleton from './Skeleton';
import SkeletonAvatar from './SkeletonAvatar';
import SkeletonButton from './SkeletonButton';
import SkeletonInput from './SkeletonInput';
import SkeletonParagraph from './SkeletonParagraph';
import Spinner from './Spinner';

import { makeCssClass, ErrorBoundary } from '../src';

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
    <IconSpinner />
    <Spinner />
    <Skeleton />
    <SkeletonAvatar />
    <SkeletonButton />
    <SkeletonInput />
    <SkeletonParagraph />
  </div>
);

export default Demo;

render(<Demo />, document.querySelector('#root'));
