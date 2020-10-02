import React from 'react';
import useDynamicScript from './utils/useDynamicScript';
import loadComponent from './utils/loadComponent';

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
      <Component />
    </React.Suspense>
  );
}

export default Block;
