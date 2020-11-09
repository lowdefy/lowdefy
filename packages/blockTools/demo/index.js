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
import IconSpinner from '../src/Spinner/IconSpinner';
import Spinner from '../src/Spinner/Spinner';
import Skeleton from '../src/Skeleton/Skeleton';
import SkeletonAvatar from '../src/Skeleton/SkeletonAvatar';
import SkeletonButton from '../src/Skeleton/SkeletonButton';
import SkeletonInput from '../src/Skeleton/SkeletonInput';
import SkeletonParagraph from '../src/Skeleton/SkeletonParagraph';
import makeCssClass from '../src/makeCssClass';
import ErrorBoundary from '../src/ErrorBoundary';
import IconSpinnerEx from './examples/IconSpinner.yaml';
import SkeletonEx from './examples/Skeleton.yaml';
import SkeletonAvatarEx from './examples/SkeletonAvatar.yaml';
import SkeletonButtonEx from './examples/SkeletonButton.yaml';
import SkeletonInputEx from './examples/SkeletonInput.yaml';
import SkeletonParagraphEx from './examples/SkeletonParagraph.yaml';
import SpinnerEx from './examples/Spinner.yaml';
import Examples from './Examples';

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
    <Examples Component={IconSpinner} examples={IconSpinnerEx} title={'IconSpinner'} />
    <Examples Component={Skeleton} examples={SkeletonEx} title={'Skeleton'} />
    <Examples Component={Spinner} examples={SpinnerEx} title={'Spinner'} />
    <Examples Component={SkeletonAvatar} examples={SkeletonAvatarEx} title={'SkeletonAvatar'} />
    <Examples Component={SkeletonButton} examples={SkeletonButtonEx} title={'SkeletonButton'} />
    <Examples Component={SkeletonInput} examples={SkeletonInputEx} title={'SkeletonInput'} />
    <Examples
      Component={SkeletonParagraph}
      examples={SkeletonParagraphEx}
      title={'SkeletonParagraph'}
    />
  </div>
);

export default Demo;

render(<Demo />, document.querySelector('#root'));
