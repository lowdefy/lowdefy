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

import { ConfigError } from '@lowdefy/errors';

import findSimilarString from '../../utils/findSimilarString.js';
import {
  antDesignNamePattern,
  qualifiedNamePattern,
  reactIconsNamePattern,
  semanticNamePattern,
} from './iconNamePatterns.js';
import readIconMigrationTable from './readIconMigrationTable.js';

const REACT_ICONS_SET = 'react-icons';
const UPGRADE_HINT = 'Run `lowdefy upgrade` to migrate names automatically.';
const SEARCH_HINT = 'Search icon names with lowdefy_search_icons.';

function setNames({ sets, setId }) {
  return (sets[setId] ?? []).flatMap((layer) => [...layer.names]);
}

function didYouMean({ name, candidates, prefix = '' }) {
  const suggestion = findSimilarString({
    input: name,
    candidates,
    maxDistance: Math.min(3, Math.ceil(name.length * 0.4)),
  });
  if (suggestion === null) {
    return ` ${SEARCH_HINT}`;
  }
  return ` Did you mean "${prefix}${suggestion}"?`;
}

function suggestFromTable({ name, semantic }) {
  const suggestion = readIconMigrationTable().icons[name];
  if (!suggestion) {
    return ` Use a semantic name or a Lucide name. ${SEARCH_HINT}`;
  }
  if (Object.hasOwn(semantic, suggestion)) {
    return ` Use "${suggestion}" (or "${semantic[suggestion]}").`;
  }
  return ` Use "${suggestion}".`;
}

function reactIconsMessage({ name, sets, semantic }) {
  let message = `Icon "${name}" is a react-icons name. Lowdefy 7 uses Lucide icons.`;
  message += suggestFromTable({ name, semantic });
  if (Object.hasOwn(sets, REACT_ICONS_SET)) {
    message += ` To keep react-icons names, set theme.icons.set: ${REACT_ICONS_SET}.`;
  } else {
    message += ` To keep react-icons names, install @lowdefy/icons-react-icons and set theme.icons.set: ${REACT_ICONS_SET}.`;
  }
  return `${message} ${UPGRADE_HINT}`;
}

function antDesignMessage({ name, semantic }) {
  let message = `Icon "${name}" is an Ant Design icon name. Lowdefy 7 uses Lucide icons.`;
  message += suggestFromTable({ name, semantic });
  return `${message} ${UPGRADE_HINT}`;
}

function qualifiedMessage({ setId, iconName, sets }) {
  if (!Object.hasOwn(sets, setId)) {
    const installed = Object.keys(sets)
      .map((id) => `"${id}"`)
      .join(', ');
    return `Icon "${setId}:${iconName}" names the icon set "${setId}", which is not installed. Installed icon sets: ${installed}.`;
  }
  return (
    `Icon "${setId}:${iconName}" is not in the "${setId}" icon set.` +
    didYouMean({ name: iconName, candidates: setNames({ sets, setId }), prefix: `${setId}:` })
  );
}

// The error for a literal icon name that resolves to nothing. Old react-icons
// and Ant Design names get a migration message with the suggestion
// `lowdefy upgrade` would apply; other names get a did-you-mean over semantic
// names and the names of the default set and Lucide.
function createUnresolvedIconError({ name, icons, configKey }) {
  const { sets, defaultSet, semantic } = icons;
  const qualified = qualifiedNamePattern.exec(name);
  let message;
  if (qualified) {
    message = qualifiedMessage({ setId: qualified[1], iconName: qualified[2], sets });
  } else if (reactIconsNamePattern.test(name) && defaultSet !== REACT_ICONS_SET) {
    message = reactIconsMessage({ name, sets, semantic });
  } else if (antDesignNamePattern.test(name)) {
    message = antDesignMessage({ name, semantic });
  } else if (semanticNamePattern.test(name) && Object.hasOwn(semantic, name)) {
    message = `Icon "${name}" is a semantic name for "${semantic[name]}", which is not an icon.`;
  } else {
    const isSemantic = semanticNamePattern.test(name);
    const kind = isSemantic ? 'a semantic icon name' : 'an icon name';
    const nameCandidates = [
      ...(defaultSet === 'lucide' ? [] : setNames({ sets, setId: defaultSet })),
      ...setNames({ sets, setId: 'lucide' }),
    ];
    // Suggest a name in the same form first: equally close matches differ only
    // in case ("star" and "Star").
    const candidates = isSemantic
      ? [...Object.keys(semantic), ...nameCandidates]
      : [...nameCandidates, ...Object.keys(semantic)];
    message = `Icon "${name}" is not ${kind}.` + didYouMean({ name, candidates });
  }
  return new ConfigError(message, { checkSlug: 'icons', configKey });
}

export default createUnresolvedIconError;
