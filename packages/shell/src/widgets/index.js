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

import { Text, VStack, HStack, Spacer } from '@expo/ui/swift-ui';
import { font, foregroundStyle, lineLimit, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import fetchWidgetData from './fetchWidgetData.js';
import { getCurrentApp } from '../native/currentApp.js';

// The two fixed layouts, drawn by the widget extension from the props the app hands them
// ({ sources }) and the source the person picked when adding the widget (its `source` parameter).
// They run in the widget's own JavaScript runtime ('widget' directive), so they read nothing but
// their arguments.
function CountLayout(props, environment) {
  'widget';
  const sources = props.sources ?? {};
  const source = sources[environment.configuration?.source] ?? sources[Object.keys(sources)[0]];
  if (!source) {
    return <Text>Open the app to load this widget.</Text>;
  }
  if (environment.widgetFamily === 'accessoryInline') {
    return (
      <Text modifiers={[widgetURL(source.url)]}>{`${source.count ?? '–'} ${
        source.label ?? source.title
      }`}</Text>
    );
  }
  return (
    <VStack alignment="leading" modifiers={[widgetURL(source.url)]}>
      <Text
        modifiers={[
          font({ size: 13, weight: 'semibold' }),
          foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
        ]}
      >
        {source.title}
      </Text>
      <Spacer />
      <Text modifiers={[font({ size: 40, weight: 'bold' })]}>{String(source.count ?? '–')}</Text>
      {source.label ? (
        <Text
          modifiers={[
            font({ size: 13 }),
            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
            lineLimit(1),
          ]}
        >
          {source.label}
        </Text>
      ) : null}
    </VStack>
  );
}

function ListLayout(props, environment) {
  'widget';
  const sources = props.sources ?? {};
  const source = sources[environment.configuration?.source] ?? sources[Object.keys(sources)[0]];
  if (!source) {
    return <Text>Open the app to load this widget.</Text>;
  }
  const rows = environment.widgetFamily === 'systemLarge' ? 6 : 3;
  return (
    <VStack alignment="leading" spacing={6} modifiers={[widgetURL(source.url)]}>
      <Text
        modifiers={[
          font({ size: 13, weight: 'semibold' }),
          foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
        ]}
      >
        {source.title}
      </Text>
      {source.items.slice(0, rows).map((item, index) => (
        <HStack key={index}>
          <VStack alignment="leading" spacing={0}>
            <Text modifiers={[font({ size: 15, weight: 'medium' }), lineLimit(1)]}>
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text
                modifiers={[
                  font({ size: 12 }),
                  foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                  lineLimit(1),
                ]}
              >
                {item.subtitle}
              </Text>
            ) : null}
          </VStack>
          <Spacer />
        </HStack>
      ))}
      {source.items.length === 0 ? (
        <Text modifiers={[foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
          Nothing here.
        </Text>
      ) : null}
      <Spacer />
    </VStack>
  );
}

const countWidget = createWidget('LowdefyCount', CountLayout, { sources: {} });
const listWidget = createWidget('LowdefyList', ListLayout, { sources: {} });

// The sources a person picks from when adding a widget, by layout.
function setSourceOptions(sources) {
  [
    [countWidget, 'count'],
    [listWidget, 'list'],
  ].forEach(([widget, layout]) => {
    widget.setConfigurationParameterEnum(
      'source',
      Object.entries(sources)
        .filter(([, source]) => source.layout === layout)
        .map(([value, source]) => ({ name: source.title, value }))
    );
  });
}

/**
 * The widgets device feature (the widgets extension): RefreshWidgets, and the shell's own refreshes
 * (refreshWidgets.js), fetch every source and hand each layout the sources of its kind.
 */
const widgets = {
  async refresh() {
    const sources = await fetchWidgetData({ app: await getCurrentApp() });
    setSourceOptions(sources);
    const pick = (layout) =>
      Object.fromEntries(Object.entries(sources).filter(([, source]) => source.layout === layout));
    countWidget.updateSnapshot({ sources: pick('count') });
    listWidget.updateSnapshot({ sources: pick('list') });
    return { sources: Object.keys(sources).length };
  },
};

// The widgets extension's device features (profiles.js WIDGETS_ENTRY).
const features = { widgets };
const hosts = [];

export { features, hosts };
