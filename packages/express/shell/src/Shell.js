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
import loadComponent from './utils/loadComponent';
import useDynamicScript from './utils/useDynamicScript';

function Engine() {
  const { ready, failed } = useDynamicScript({
    url: 'https://unpkg.com/nxjdkxbp/dist/remoteEntry.js',
  });

  if (!ready) {
    return <h2>Loading dynamic script</h2>;
  }

  if (failed) {
    return <h2>Failed to load dynamic script</h2>;
  }

  const Component = React.lazy(loadComponent('nxjdkxbp', 'Engine'));

  return (
    <React.Suspense fallback="Loading Engine">
      <Component />
    </React.Suspense>
  );
}

const Shell = () => <Engine />;
export default Shell;
