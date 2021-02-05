import React from 'react';

const useRunAfterUpdate = () => {
  const afterPaintRef = React.useRef(null);
  React.useLayoutEffect(() => {
    if (afterPaintRef.current) {
      afterPaintRef.current();
      afterPaintRef.current = null;
    }
  });
  return (fn) => {
    afterPaintRef.current = fn;
  };
};

export default useRunAfterUpdate;
