/*
  Copyright 2020-2026 Lowdefy, Inc

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
import cssStyles from './style.module.css';

const DEFAULT_COLOR = '#000000';

export const ColorPicker = ({
  className,
  disabled,
  hideInput,
  onChange,
  size,
  value = DEFAULT_COLOR,
}) => {
  const popover = useRef();
  const [isOpen, toggle] = useState(false);

  const close = useCallback((newColor) => {
    toggle(false);
    onChange(newColor);
  }, []);

  useClickOutside(popover, close, value);
  return (
    <div
      className={classNames({
        [cssStyles['color-picker']]: true,
        [className]: true,
      })}
    >
      <div
        className={classNames({
          [cssStyles['color-picker-swatch']]: true,
          [cssStyles['color-picker-swatch-sm']]: size === 'small',
          [cssStyles['color-picker-swatch-lg']]: size === 'large',
          [cssStyles['color-picker-swatch-disabled']]: disabled,
        })}
        style={{ backgroundColor: value }}
        onClick={() => !disabled && toggle(true)}
      />
      {!hideInput && (
        <HexColorInput
          className={classNames({
            [cssStyles['color-picker-input']]: true,
            [cssStyles['color-picker-input-sm']]: size === 'small',
            [cssStyles['color-picker-input-lg']]: size === 'large',
            'ant-input': true,
            'ant-input-sm': size === 'small',
            'ant-input-lg': size === 'large',
          })}
          color={value ?? ''}
          onChange={(newColor) => {
            onChange(newColor);
          }}
          prefixed={true}
          disabled={disabled}
        />
      )}
      {isOpen && (
        <div className={cssStyles['color-picker-popover']} ref={popover}>
          <HexColorPicker color={value ?? DEFAULT_COLOR} onChange={onChange} />
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
