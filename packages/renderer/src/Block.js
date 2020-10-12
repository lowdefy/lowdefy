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
import { connectBlock } from '@lowdefy/block-tools';
import useDynamicScript from './utils/useDynamicScript';
import loadComponent from './utils/loadComponent';

const Comp = ({ bl }) => {
  const CBlock = connectBlock(bl);
  return <CBlock />;
};

function Block({ meta }) {
  const { ready, failed } = useDynamicScript({
    url: meta && meta.url,
  });

  if (!meta) {
    return <h2>Not meta specified</h2>;
  }

  if (!ready) {
    return <h2>Loading dynamic script: {meta.url}</h2>;
  }

  if (failed) {
    return <h2>Failed to load dynamic script: {meta.url}</h2>;
  }

  const Component = React.lazy(loadComponent(meta.scope, meta.module));

  return (
    <React.Suspense fallback="Loading Block">
      <Comp bl={Component} />
    </React.Suspense>
  );
}

export default Block;
