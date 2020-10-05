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
