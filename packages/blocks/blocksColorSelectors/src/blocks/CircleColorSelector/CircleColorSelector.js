import React from 'react';
import { CirclePicker } from 'react-color';
import { Label } from '@lowdefy/blocks-antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

const Selector = ({ blockId, loading, methods, properties, required, validation, value }) => {
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
          <CirclePicker
            id={`${blockId}_input`}
            className={methods.makeCssClass([
              { marginBottom: '0px !important' },
              properties.inputStyle,
            ])}
            circleSize={properties.circleSize}
            circleSpacing={properties.circleSpacing}
            color={value || properties.defaultColor || '#000000'}
            colors={properties.colors}
            width={properties.width || '100%'}
            onChangeComplete={(color) => {
              methods.setValue(color.hex ? color.hex : '#000000');
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
