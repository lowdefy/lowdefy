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

import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

function pickBest(candidates, supported) {
  for (const candidate of candidates ?? []) {
    if (supported.includes(candidate)) return candidate;
    const primary = candidate.split('-')[0];
    const match = supported.find((code) => code.split('-')[0] === primary);
    if (match) return match;
  }
  return undefined;
}

function resolveActive({ userPreference, browserLocale, defaultLocale, supportedCodes }) {
  if (userPreference !== 'auto' && supportedCodes.includes(userPreference)) {
    return userPreference;
  }
  if (browserLocale) return browserLocale;
  return defaultLocale;
}

async function loadAntdLocale({ active, antdLocaleLoaders }) {
  if (!active || !antdLocaleLoaders?.[active]) return null;
  const mod = await antdLocaleLoaders[active]();
  return mod?.default ?? mod;
}

function useLocale({ i18n, antdLocaleLoaders, dayjsLocaleMap }) {
  const supportedCodes = useMemo(
    () => (i18n?.locales ?? []).map((l) => l.code),
    [i18n?.locales]
  );

  const [userPreference, setUserPreference] = useState(() => {
    return window.localStorage?.getItem('lowdefy_locale') ?? 'auto';
  });

  const browserLocale = useMemo(() => {
    if (supportedCodes.length === 0) return undefined;
    const candidates = window.navigator?.languages ?? [window.navigator?.language].filter(Boolean);
    return pickBest(candidates, supportedCodes);
  }, [supportedCodes]);

  const setPreference = useCallback((code) => {
    if (code === 'auto') {
      window.localStorage?.removeItem('lowdefy_locale');
    } else {
      window.localStorage?.setItem('lowdefy_locale', code);
    }
    setUserPreference(code ?? 'auto');
  }, []);

  window.__lowdefy_setLocale = setPreference;

  const active = resolveActive({
    userPreference,
    browserLocale,
    defaultLocale: i18n?.defaultLocale,
    supportedCodes,
  });

  window.__lowdefy_locale = active;
  window.__lowdefy_supported_locales = i18n?.locales ?? [];

  const [antdLocale, setAntdLocale] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadAntdLocale({ active, antdLocaleLoaders }).then((locale) => {
      if (!cancelled) setAntdLocale(locale);
    });
    return () => {
      cancelled = true;
    };
  }, [active, antdLocaleLoaders]);

  useEffect(() => {
    const dayjsId = dayjsLocaleMap?.[active];
    if (dayjsId) {
      dayjs.locale(dayjsId);
    }
  }, [active, dayjsLocaleMap]);

  return {
    active,
    userPreference,
    setPreference,
    antdLocale,
  };
}

export default useLocale;
