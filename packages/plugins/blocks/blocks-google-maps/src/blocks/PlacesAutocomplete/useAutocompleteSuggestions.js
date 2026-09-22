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

// Fetches predictions from the Places Autocomplete Data API. A session token
// groups the keystrokes of one search with the fetchFields call that follows it
// into a single billed session, so the token is only dropped once a place has
// been picked, through resetSession.
// See https://developers.google.com/maps/documentation/javascript/place-autocomplete-data
function useAutocompleteSuggestions({ input, placesLibrary, requestOptions }) {
  const sessionTokenRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // requestOptions is rebuilt by the operator parser on every render, so it is
  // read but not tracked - only a new input string starts a new request.
  useEffect(() => {
    if (type.isNone(placesLibrary)) return;
    if (input === '') {
      setSuggestions((current) => (current.length === 0 ? current : []));
      return;
    }
    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLibrary;
    if (type.isNone(sessionTokenRef.current)) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }
    let cancelled = false;
    setIsLoading(true);
    AutocompleteSuggestion.fetchAutocompleteSuggestions({
      ...requestOptions,
      input,
      sessionToken: sessionTokenRef.current,
    })
      .then((response) => {
        if (cancelled) return;
        setSuggestions(response.suggestions);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSuggestions([]);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [input, placesLibrary]);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
    setSuggestions([]);
  }, []);

  return { isLoading, resetSession, suggestions };
}

export default useAutocompleteSuggestions;
