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

import React, { useRef, useState } from 'react';
import { AutoComplete } from 'antd';
import { withBlockDefaults } from '@lowdefy/block-utils';
import { get, mergeObjects, set, type } from '@lowdefy/helpers';
import Label from '@lowdefy/blocks-antd/blocks/Label/Label.js';
import withTheme from '@lowdefy/blocks-antd/blocks/withTheme.js';

import getNotFoundContent from './getNotFoundContent.js';
import getPlaceKeys from './getPlaceKeys.js';
import mapPlaceResult from './mapPlaceResult.js';
import removePlaceKeys from './removePlaceKeys.js';
import useAutocompleteSuggestions from './useAutocompleteSuggestions.js';
import usePlacesLibrary from './usePlacesLibrary.js';

import './style.css';

// Address input backed by the Places Autocomplete Data API. The block value is an
// object: picking a suggestion writes the fetched place fields into it, and typing
// writes the free text to the label field, so a form holds a usable address whether
// or not a suggestion is ever picked. Typing, picking and clearing each first remove
// the keys the previous place wrote (see getPlaceKeys), so a typed address never
// carries another place's coordinates. Sibling keys written into the same value
// object by other blocks are preserved, and the value is null once none remain.
const PlacesAutocomplete = ({
  blockId,
  classNames = {},
  components,
  events,
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) => {
  const placesLibrary = usePlacesLibrary();
  const [input, setInput] = useState('');
  // Handlers that run after an await, or twice in one tick (antd calls onClear and
  // then onSearch('')), read the value they last wrote rather than a stale prop.
  const valueRef = useRef(value);
  valueRef.current = value;
  // Counts user edits, so a place that resolves after the user typed again or
  // picked another suggestion is dropped instead of overwriting the newer input.
  const editRef = useRef(0);

  const labelField = properties.labelField ?? 'formattedAddress';
  const inputKey = properties.resultMapping?.input ?? 'input';
  const placeKeys = getPlaceKeys({
    fetchFields: properties.fetchFields,
    labelField,
    resultMapping: properties.resultMapping,
  });

  function triggerError(error) {
    methods.triggerEvent({ name: 'onError', event: { message: error.message } });
  }

  const { isLoading, predictions, resetSession } = useAutocompleteSuggestions({
    debounce: properties.debounce ?? 250,
    input,
    onError: triggerError,
    placesLibrary,
    requestOptions: properties.requestOptions,
  });

  function commitValue(nextValue) {
    valueRef.current = nextValue;
    methods.setValue(nextValue);
    methods.triggerEvent({ name: 'onChange', event: { value: nextValue } });
  }

  function clearPlace() {
    const { removed, value: remaining } = removePlaceKeys({
      placeKeys,
      value: valueRef.current,
    });
    if (removed) {
      commitValue(remaining);
    }
  }

  function handleSearch(text) {
    editRef.current += 1;
    setInput(text);
    if (text === '') {
      clearPlace();
      return;
    }
    const { value: remaining } = removePlaceKeys({ placeKeys, value: valueRef.current });
    const typed = mapPlaceResult({ mapping: properties.resultMapping, result: { input: text } });
    set(typed, labelField, text);
    commitValue(mergeObjects([remaining, typed]));
  }

  async function handleSelect(optionValue) {
    const prediction = predictions.find((item) => item.text.text === optionValue);
    editRef.current += 1;
    const edit = editRef.current;
    // The prediction carries the session token into toPlace, and fetchFields ends
    // that session, so the next search needs a new token.
    const place = prediction.toPlace();
    setInput('');
    resetSession();
    try {
      await place.fetchFields({ fields: [...(properties.fetchFields ?? []), 'formattedAddress'] });
    } catch (error) {
      // The typed text stays in the value, so the form still holds what the user entered.
      if (edit === editRef.current) {
        triggerError(error);
      }
      return;
    }
    if (edit !== editRef.current) return;
    const mapped = mapPlaceResult({
      mapping: properties.resultMapping,
      result: { input: place.formattedAddress, ...place.toJSON() },
    });
    const { value: remaining } = removePlaceKeys({ placeKeys, value: valueRef.current });
    const nextValue = mergeObjects([remaining, mapped]);
    commitValue(nextValue);
    methods.triggerEvent({ name: 'onPlaceChanged', event: { place: mapped, value: nextValue } });
  }

  let displayValue;
  if (type.isObject(value)) {
    displayValue = get(value, labelField, { default: get(value, inputKey) });
  }

  let variant = properties.variant;
  if (type.isNone(variant) && properties.bordered === false) {
    variant = 'borderless';
  }

  return (
    <Label
      blockId={blockId}
      classNames={classNames}
      components={components}
      events={events}
      methods={methods}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      styles={styles}
      validation={validation}
      content={{
        content: () => (
          <AutoComplete
            id={`${blockId}_input`}
            className={classNames.element}
            classNames={{ content: classNames.selector, popup: { root: classNames.popup } }}
            style={{ width: '100%', ...styles.element }}
            styles={{ content: styles.selector, popup: { root: styles.popup } }}
            allowClear={
              properties.allowClear !== false && {
                clearIcon: (
                  <components.Icon
                    blockId={`${blockId}_clearIcon`}
                    properties={{ name: 'clear', title: '' }}
                  />
                ),
              }
            }
            autoFocus={properties.autoFocus}
            backfill={properties.backfill}
            defaultOpen={properties.defaultOpen}
            disabled={properties.disabled || loading}
            filterOption={() => true}
            notFoundContent={getNotFoundContent({
              input,
              isLoading,
              placesReady: !type.isNone(placesLibrary),
              properties,
            })}
            placeholder={properties.placeholder ?? 'Start typing to search'}
            popupRender={(menu) => (
              <>
                {menu}
                {predictions.length > 0 && (
                  <div className="lowdefy-places-autocomplete-attribution">Powered by Google</div>
                )}
              </>
            )}
            size={properties.size}
            status={validation.status}
            value={displayValue}
            variant={variant}
            options={predictions.map((prediction, i) => ({
              key: prediction.placeId,
              // The prediction text is the option value, so backfill shows the address.
              value: prediction.text.text,
              className: classNames.options,
              style: styles.options,
              label: (
                <span id={`${blockId}_${i}`}>
                  <components.Icon
                    blockId={`${blockId}_${i}_optionsIcon`}
                    events={events}
                    properties={properties.optionsIcon ?? { name: 'location', title: '' }}
                  />{' '}
                  {prediction.text.text}
                </span>
              ),
            }))}
            onBlur={() => {
              // Leaving the input without picking a suggestion abandons the search.
              setInput('');
              resetSession();
              methods.triggerEvent({ name: 'onBlur' });
            }}
            onClear={() => {
              editRef.current += 1;
              setInput('');
              resetSession();
              clearPlace();
              methods.triggerEvent({ name: 'onClear' });
            }}
            onFocus={() => {
              methods.triggerEvent({ name: 'onFocus' });
            }}
            onSearch={(text) => {
              handleSearch(text);
              methods.triggerEvent({ name: 'onSearch', event: { value: text } });
            }}
            onSelect={handleSelect}
          />
        ),
      }}
    />
  );
};

export default withTheme('Select', withBlockDefaults(PlacesAutocomplete));
