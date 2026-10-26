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

import { Linking } from 'react-native';
import { createLink } from '@lowdefy/engine';
import { ConfigError } from '@lowdefy/errors';

// The Link action and link components on a phone. A page link goes through the host router. Any
// other link leaves the app through the system (`Linking`): a phone has no tabs, so `newTab`
// opens the same way. The shell may route its own domain's links back into the app.
function setupLink(lowdefy) {
  const { router } = lowdefy._internal;
  const backLink = () => router.back();
  const disabledLink = () => {};
  const newOriginLink = ({ href, url, query }) => {
    const target = href ?? `${url}${query ? `?${query}` : ''}`;
    return Linking.openURL(target);
  };
  const sameOriginLink = ({ pathname, query, replace, scroll, setInput }) => {
    setInput();
    const navigate = replace ? router.replace : router.push;
    return navigate({ pathname, query, scroll });
  };
  const noLink = () => {
    throw new ConfigError('Invalid Link: no target resolved.');
  };
  return createLink({ backLink, disabledLink, lowdefy, newOriginLink, noLink, sameOriginLink });
}

export default setupLink;
