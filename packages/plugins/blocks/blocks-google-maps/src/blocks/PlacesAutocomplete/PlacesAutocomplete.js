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

import React, { useCallback, useState } from 'react';
import { AutoComplete } from 'antd';
import { withBlockDefaults } from '@lowdefy/block-utils';
import { get, mergeObjects, set, type } from '@lowdefy/helpers';
import Label from '@lowdefy/blocks-antd/blocks/Label/Label.js';

import getNotFoundContent from './getNotFoundContent.js';
import mapPlaceResult from './mapPlaceResult.js';
import useAutocompleteSuggestions from './useAutocompleteSuggestions.js';
import usePlacesLibrary from './usePlacesLibrary.js';

import './style.css';

// Address input backed by the Places Autocomplete Data API. The block value is an
// object: picking a suggestion merges the fetched place fields into it, and typing
// writes the free text to the label field, so a form holds a usable address whether
// or not a suggestion is ever picked. Sibling keys written into the same value
// object by other blocks are preserved.
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
  const labelField = properties.labelField ?? 'formattedAddress';
  const { isLoading, resetSession, suggestions } = useAutocompleteSuggestions({
    input,
    placesLibrary,
    requestOptions: properties.requestOptions,
  });

  const handleSearch = useCallback(
    (text) => {
      setInput(text);
      if (text === '') {
        methods.setValue(null);
        return;
      }
      const update = { input: text };
      set(update, labelField, text);
      methods.setValue(mergeObjects([value, update]));
    },
    [labelField, methods, value]
  );

  const handleSelect = useCallback(
    async (optionValue) => {
      const suggestion = suggestions[Number(optionValue)];
      if (type.isNone(suggestion?.placePrediction)) return;
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: [...(properties.fetchFields ?? []), 'formattedAddress'] });
      setInput('');
      resetSession();
      const result = { input: place.formattedAddress, ...place.toJSON() };
      const mapped = mapPlaceResult({ mapping: properties.resultMapping, result });
      methods.setValue(mergeObjects([value, mapped]));
      methods.triggerEvent({ name: 'onPlaceChanged' });
    },
    [methods, properties.fetchFields, properties.resultMapping, resetSession, suggestions, value]
  );

  let displayValue;
  if (type.isObject(value)) {
    displayValue = get(value, labelField, { default: value.input });
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
            style={{ width: '100%', ...styles.element }}
            allowClear={properties.allowClear !== false}
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
                {suggestions.length > 0 && (
                  <div className="lowdefy-places-autocomplete-attribution">Powered by Google</div>
                )}
              </>
            )}
            size={properties.size}
            status={validation.status}
            value={displayValue}
            variant={properties.variant}
            options={suggestions.map((suggestion, i) => ({
              value: `${i}`,
              label: (
                <span id={`${blockId}_${i}`}>
                  <components.Icon
                    blockId={`${blockId}_${i}_optionsIcon`}
                    events={events}
                    properties={properties.optionsIcon ?? { name: 'MdLocationOn' }}
                  />{' '}
                  {suggestion.placePrediction?.text?.text}
                </span>
              ),
            }))}
            onBlur={() => {
              methods.triggerEvent({ name: 'onBlur' });
            }}
            onChange={() => {
              methods.triggerEvent({ name: 'onChange' });
            }}
            onClear={() => {
              setInput('');
              resetSession();
              methods.setValue(null);
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

PlacesAutocomplete.meta = {
  category: 'input',
  icons: ['MdLocationOn'],
};

export default withBlockDefaults(PlacesAutocomplete);
