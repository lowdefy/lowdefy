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

/*global __webpack_share_scopes__, __webpack_init_sharing__*/

import React from 'react';
import ReactDOM from 'react-dom';
import { Loading } from '@lowdefy/block-tools';

const Renderer = React.lazy(() => import('lowdefy_renderer/Renderer'));

function Shell() {
  return (
    <React.Suspense fallback={<Loading type="Spinner" properties={{ height: '100vh' }} />}>
      <Renderer gqlUri="/.netlify/functions/graphql"/>
    </React.Suspense>
  );
}

ReactDOM.render(<Shell />, document.getElementById('root'));
