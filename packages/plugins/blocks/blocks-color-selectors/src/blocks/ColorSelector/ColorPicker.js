/*
  Copyright 2020-2022 Lowdefy, Inc

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

import React, { useCallback, useRef, useState } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import classNames from 'classnames';

import useClickOutside from './useClickOutside.js';

const DEFAULT_COLOR = '#000000';

export const ColorPicker = ({
  className,
  disabled,
  hideInput,
  onChange,
  size,
  undefinedColor,
  value,
}) => {
  const popover = useRef();
  const [isOpen, toggle] = useState(false);
  const [color, setColor] = useState(value || undefinedColor || DEFAULT_COLOR);

  const close = useCallback((newColor) => {
    toggle(false);
    onChange(newColor);
  }, []);
  useClickOutside(popover, close, color);
  return (
    <div
      className={classNames({
        'color-picker': true,
        [className]: true,
      })}
    >
      <div
        className={classNames({
          'color-picker-swatch': true,
          'color-picker-swatch-sm': size === 'small',
          'color-picker-swatch-lg': size === 'large',
          'color-picker-swatch-disabled': disabled,
        })}
        style={{ backgroundColor: color }}
        onClick={() => !disabled && toggle(true)}
      />
      {!hideInput && (
        <HexColorInput
          className={classNames({
            'color-picker-input': true,
            'color-picker-input-sm ': size === 'small',
            'color-picker-input-lg': size === 'large',
            'ant-input': true,
            'ant-input-sm': size === 'small',
            'ant-input-lg': size === 'large',
          })}
          color={color}
          onChange={(newColor) => {
            setColor(newColor);
            onChange(newColor);
          }}
          prefixed={true}
          disabled={disabled}
        />
      )}
      {isOpen && (
        <div className="color-picker-popover" ref={popover}>
          <HexColorPicker color={color} onChange={setColor} />
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
