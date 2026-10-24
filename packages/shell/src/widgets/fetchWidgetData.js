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

import callEndpoint from '../native/callEndpoint.js';

/**
 * Each mobile.widgets source's data, from its endpoint: { [id]: { title, layout, url, count, label,
 * items } }. A count source answers { count, label? }, a list source { items: [{ title, subtitle?
 * }] }. A source whose endpoint fails keeps showing nothing new (it is left out). The url a widget
 * opens is the source's path under the shell's scheme.
 *
 * @param {Object} params
 * @param {Object} params.app The open app (currentApp.js).
 */
async function fetchWidgetData({ app }) {
  const sources = app.session.getState().root?.widgets ?? [];
  const entries = await Promise.all(
    sources.map(async (source) => {
      try {
        const data = await callEndpoint({ app, endpointId: source.endpointId });
        return [
          source.id,
          {
            title: source.title,
            layout: source.layout,
            url: `${app.shell.scheme}://${(source.path ?? '/').replace(/^\//, '')}`,
            count: data?.count ?? null,
            label: data?.label ?? null,
            items: (data?.items ?? []).slice(0, 6).map((item) => ({
              title: String(item.title ?? ''),
              subtitle: item.subtitle === undefined ? null : String(item.subtitle),
            })),
          },
        ];
      } catch (error) {
        return null;
      }
    })
  );
  return Object.fromEntries(entries.filter((entry) => entry !== null));
}

export default fetchWidgetData;
