import React from 'react';

const Blank = ({ blockId, makeCss }) => (
  <div
    id={blockId}
    className={makeCss([
      {
        background: '#269',
        border: '2px solid #00aaee',
        textAlign: 'center',
        fontSize: 12,
        color: '#fff',
      },
    ])}
  >
    {blockId}
  </div>
);

export default Blank;
