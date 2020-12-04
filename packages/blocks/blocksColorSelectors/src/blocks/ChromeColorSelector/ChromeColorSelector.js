import React, { useState } from 'react';
import { ChromePicker } from 'react-color';
import { Label } from '@lowdefy/blocks-antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

const Selector = ({ blockId, loading, methods, properties, required, validation, value }) => {
  const [color, setColor] = useState(value || properties.defaultColor || '#000000');
  return (
    <Label
      blockId={blockId}
      loading={loading}
      methods={methods}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => (
          <ChromePicker
            id={`${blockId}_input`}
            className={methods.makeCssClass([
              { marginBottom: '0px !important' },
              properties.inputStyle,
            ])}
            color={(color && color[color.source]) || color || '#000000'}
            disableAlpha={properties.disableAlpha}
            onChange={(clr) => setColor(clr)}
            onChangeComplete={(clr) => {
              setColor(clr);
              methods.setValue(clr);
              methods.callAction({ action: 'onChange' });
            }}
          />
        ),
      }}
    />
  );
};

Selector.defaultProps = blockDefaultProps;

export default Selector;
