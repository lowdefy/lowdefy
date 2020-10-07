import React from 'react';

const Blank = ({ blockId, makeCss, children }) => (
  <div
    id={blockId}
    className={makeCss([
      {
        background: '#900000',
        border: '2px solid #f00',
        textAlign: 'center',
        fontSize: 12,
        color: '#fff',
      },
    ])}
  >
    {children}
  </div>
);

export default Blank;
