import React from 'react';
import LogoSpinner from './LogoSpinner';
import connectBlock from '../connectBlock';

const Loading = ({ properties, methods }) => {
  return (
    <div
      className={methods.makeCssClass({
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <div style={{ width: properties.size || 50, margin: 'auto', height: properties.size || 50 }}>
        <LogoSpinner color={properties.color} colorBar={properties.colorBar} />
        <div className={methods.makeCssClass(properties.style)}>{properties.message}</div>
      </div>
    </div>
  );
};

export default connectBlock(Loading);
