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

/*global __webpack_share_scopes__, __webpack_init_sharing__*/

import React from 'react';
import ReactDOM from 'react-dom';
import { Loading } from '@lowdefy/block-tools';

function loadComponent(scope, module) {
  return async () => {
    // Initializes the share scope. This fills it with known provided modules from this build and all remotes
    await __webpack_init_sharing__('default');
    const container = window[scope]; // or get the container somewhere else
    // Initialize the container, it may provide shared modules
    await container.init(__webpack_share_scopes__.default);
    const factory = await window[scope].get(`./${module}`);
    const Module = factory();
    return Module;
  };
}

const useDynamicScript = (args) => {
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!args.url) {
      return;
    }

    const element = document.createElement('script');

    element.src = args.url;
    element.type = 'text/javascript';
    element.async = true;

    setReady(false);
    setFailed(false);

    element.onload = () => {
      console.log(`Dynamic Script Loaded: ${args.url}`);
      setReady(true);
    };

    element.onerror = () => {
      console.error(`Dynamic Script Error: ${args.url}`);
      setReady(false);
      setFailed(true);
    };

    document.head.appendChild(element);

    return () => {
      console.log(`Dynamic Script Removed: ${args.url}`);
      document.head.removeChild(element);
    };
  }, [args.url]);

  return {
    ready,
    failed,
  };
};

function Shell({ version }) {
  const { ready, failed } = useDynamicScript({
    url: `http://unpkg.com/@lowdefy/renderer@${version}/dist/remoteEntry.js`,
  });

  if (!ready) {
    return <Loading type="Spinner" properties={{ height: '100vh' }} />;
  }

  if (failed) {
    return <h2>Failed to load dynamic script</h2>;
  }

  const Component = React.lazy(loadComponent('lowdefy_renderer', 'Renderer'));

  return (
    <React.Suspense fallback={<Loading type="Spinner" properties={{ height: '100vh' }} />}>
      <Component />
    </React.Suspense>
  );
}

const getVersion = async () => {
  return (await fetch(`api/dev/version`)).json();
};

getVersion().then((version) => {
  ReactDOM.render(<Shell version={version} />, document.getElementById('root'));
});
