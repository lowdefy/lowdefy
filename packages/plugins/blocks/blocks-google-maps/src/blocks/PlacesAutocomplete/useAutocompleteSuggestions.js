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

import { useCallback, useEffect, useRef, useState } from 'react';
import { type } from '@lowdefy/helpers';

// Fetches place predictions from the Places Autocomplete Data API, waiting for
// `debounce` milliseconds after the last keystroke. A session token groups the
// keystrokes of one search with the fetchFields call that follows it into a single
// billed session. resetSession drops the token once the search ends - a place was
// picked, the input was cleared or the user left the input - so the next search
// starts a new session.
// See https://developers.google.com/maps/documentation/javascript/place-autocomplete-data
function useAutocompleteSuggestions({ debounce, input, onError, placesLibrary, requestOptions }) {
  const sessionTokenRef = useRef(null);
  // Only the latest request may write results, so a slow response to an earlier
  // keystroke never replaces the suggestions for the current input.
  const requestIdRef = useRef(0);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // requestOptions is rebuilt by the operator parser on every render, so it is
  // read but not tracked - only a new input string starts a new request.
  useEffect(() => {
    if (type.isNone(placesLibrary)) return undefined;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    if (input === '') {
      setPredictions((current) => (current.length === 0 ? current : []));
      setIsLoading(false);
      return undefined;
    }
    setIsLoading(true);
    const timeout = setTimeout(() => {
      const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLibrary;
      if (type.isNone(sessionTokenRef.current)) {
        sessionTokenRef.current = new AutocompleteSessionToken();
      }
      AutocompleteSuggestion.fetchAutocompleteSuggestions({
        ...requestOptions,
        input,
        sessionToken: sessionTokenRef.current,
      })
        .then((response) => {
          if (requestId !== requestIdRef.current) return;
          setPredictions(
            response.suggestions
              .map((suggestion) => suggestion.placePrediction)
              .filter((prediction) => !type.isNone(prediction))
          );
          setIsLoading(false);
        })
        .catch((error) => {
          if (requestId !== requestIdRef.current) return;
          setPredictions([]);
          setIsLoading(false);
          onError(error);
        });
    }, debounce);
    return () => {
      clearTimeout(timeout);
    };
  }, [debounce, input, placesLibrary]);

  const resetSession = useCallback(() => {
    requestIdRef.current += 1;
    sessionTokenRef.current = null;
    setPredictions([]);
    setIsLoading(false);
  }, []);

  return { isLoading, predictions, resetSession };
}

export default useAutocompleteSuggestions;
