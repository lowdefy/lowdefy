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
import IconSpinner from './Spinner/IconSpinner';
import Skeleton from './Skeleton/Skeleton';
import SkeletonAvatar from './Skeleton/SkeletonAvatar';
import SkeletonButton from './Skeleton/SkeletonButton';
import SkeletonInput from './Skeleton/SkeletonInput';
import SkeletonParagraph from './Skeleton/SkeletonParagraph';
import Spinner from './Spinner/Spinner';

const Loading = ({ type, properties }) => {
  switch (type) {
    case 'IconSpinner':
      return <IconSpinner properties={properties} />;
    case 'Skeleton':
      return <Skeleton properties={properties} />;
    case 'SkeletonAvatar':
      return <SkeletonAvatar properties={properties} />;
    case 'SkeletonButton':
      return <SkeletonButton properties={properties} />;
    case 'SkeletonInput':
      return <SkeletonInput properties={properties} />;
    case 'SkeletonParagraph':
      return <SkeletonParagraph properties={properties} />;
    case 'Spinner':
      return <Spinner properties={properties} />;
    default:
      return <div />;
  }
};

export default Loading;
