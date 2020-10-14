import React from 'react';
import './LogoSpinner.css';

const LogoSpinner = ({ color, barColor }) => (
  <div>
    <svg width="100%" height="100%" viewBox="0 0 94 91" version="1.1">
      <g>
        <path
          d="M94,18.634c0,-10.284 -8.35,-18.634 -18.634,-18.634l-56.732,0c-10.284,0 -18.634,8.35 -18.634,18.634l0,53.732c0,10.284 8.35,18.634 18.634,18.634l56.732,0c10.284,0 18.634,-8.35 18.634,-18.634l0,-53.732Z"
          style={{ fill: color || '#697a8c' }}
        />
        <rect
          className="loading-bar"
          x={16}
          y={15}
          width={30}
          height={59}
          style={{ fill: barColor || '#fff' }}
        />
        <rect
          className="loading-bar-sm"
          x={53}
          y={52}
          width={25}
          height={25}
          style={{ fill: barColor || '#fff' }}
        />
      </g>
    </svg>
  </div>
);

export default LogoSpinner;
