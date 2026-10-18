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

import React, { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import buildTimelineRows from './buildTimelineRows.js';
import createMentionPattern, { DEFAULT_MENTION_FORMAT } from '../Composer/createMentionPattern.js';
import formatRelativeTime from './formatRelativeTime.js';
import getActor from './getActor.js';
import getTimelineColors from './getTimelineColors.js';
import getToneColor from './getToneColor.js';
import LineText from './LineText.js';
import meta from './meta.js';
import RailIcon from './RailIcon.js';
import RailRow from './RailRow.js';
import ThreadCard from './ThreadCard.js';
import useComponentTokens from '../../useComponentTokens.js';
import useNow from './useNow.js';

const REACTIONS = ['👍', '👎', '❤️', '🎉', '😄', '👀', '🙏', '✅'];
const LINE_MARKER_TOP = 6;

function Chevron({ colors, Icon, open }) {
  return (
    <Icon
      properties={{ name: open ? 'ChevronDown' : 'ChevronRight', size: 14, title: '' }}
      styles={{ element: { color: colors.tertiary, marginTop: 3 } }}
    />
  );
}

// An event, gap or fold line on the rail. With onPress it is a button with a press highlight.
function LineRow({ children, ctx, expanded, first, icon, last, onPress, open, tone }) {
  const { colors, Icon, tokens } = ctx;
  const content = (
    <View style={styles.lineContent}>
      <View style={styles.lineText}>{children}</View>
      {onPress && open !== undefined ? <Chevron colors={colors} Icon={Icon} open={open} /> : null}
    </View>
  );
  return (
    <RailRow
      colors={colors}
      first={first}
      last={last}
      marker={
        <RailIcon
          color={getToneColor({ tone, colors, tokens })}
          colors={colors}
          Icon={Icon}
          name={icon}
        />
      }
      markerTop={LINE_MARKER_TOP}
    >
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={
            open === undefined && expanded === undefined
              ? undefined
              : { expanded: open ?? expanded }
          }
          onPress={onPress}
          style={({ pressed }) => [
            styles.pressable,
            pressed ? { backgroundColor: colors.fill } : null,
          ]}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
    </RailRow>
  );
}

// A long event sentence shows two lines and a note three, each ending in an ellipsis, until the
// line is tapped open. Comment bodies always show in full.
const EVENT_LINES = 2;
const NOTE_LINES = 3;

function Note({ colors, expanded, text }) {
  return (
    <View style={[styles.note, { backgroundColor: colors.fill }]}>
      <Text
        ellipsizeMode="tail"
        numberOfLines={expanded ? undefined : NOTE_LINES}
        style={[styles.noteText, { color: colors.secondary }]}
      >
        {text}
      </Text>
    </View>
  );
}

// One event on the rail, its sentence and note cut short until it is tapped, and full after.
function EventLine({ colors, ctx, event, expanded, first, hideActor, last, onToggle, time }) {
  return (
    <LineRow
      ctx={ctx}
      expanded={expanded}
      first={first}
      icon={event.line.icon}
      last={last}
      onPress={onToggle}
      tone={event.line.tone}
    >
      <LineText
        colors={colors}
        hideActor={hideActor}
        numberOfLines={expanded ? undefined : EVENT_LINES}
        segments={event.line.segments}
        time={time}
      />
      {event.line.note ? <Note colors={colors} expanded={expanded} text={event.line.note} /> : null}
    </LineRow>
  );
}

/**
 * A record's activity as a timeline on a thin rail, as GitHub's iOS app draws an issue's: events
 * on their own lines with an icon, the actor and a relative time; detail events by one actor in
 * a row folded into one line that opens; gaps of events not loaded as a count to load; comment
 * threads as cards with avatars, markdown, mentions, reactions and a menu; resolved threads
 * folded to one line. Data comes in through properties and every action goes out as an event.
 */
function ActivityTimeline({
  blockId,
  components,
  events,
  methods,
  properties,
  styles: blockStyles = {},
}) {
  const { isDark, tokens } = useComponentTokens(properties.theme);
  const colors = useMemo(() => getTimelineColors({ isDark, tokens }), [isDark, tokens]);
  const now = useNow();
  const [open, setOpen] = useState(() => new Set());
  const [busy, setBusy] = useState(() => new Set());

  const mentionFormat = type.isString(properties.mentionFormat)
    ? properties.mentionFormat
    : DEFAULT_MENTION_FORMAT;
  const pattern = useMemo(() => createMentionPattern(mentionFormat), [mentionFormat]);
  const people = useMemo(
    () => new Map((properties.mentions ?? []).map((person) => [String(person.value), person])),
    [properties.mentions]
  );
  const hasLinkPress = !type.isNone(events.onLinkPress);

  const trigger = useCallback((name, event) => methods.triggerEvent({ name, event }), [methods]);
  const ctx = useMemo(
    () => ({
      colors,
      hasLinkPress,
      Icon: components.Icon,
      isDark,
      linkChips: properties.linkChips,
      maxLength: properties.maxLength ?? 4000,
      members: properties.members,
      mentionFormat,
      mentions: properties.mentions,
      now,
      onLinkPress: (href) => {
        if (hasLinkPress) {
          trigger('onLinkPress', { href });
          return;
        }
        Linking.openURL(href);
      },
      onRecordPress: (key) => trigger('onOpenRecord', { key }),
      pattern,
      people,
      reactions: properties.reactions ?? REACTIONS,
      repliesShown: properties.repliesShown ?? 3,
      tokens,
      trigger,
      user: properties.user,
    }),
    [
      colors,
      components.Icon,
      hasLinkPress,
      isDark,
      mentionFormat,
      now,
      pattern,
      people,
      properties,
      tokens,
      trigger,
    ]
  );

  const rows = useMemo(
    () =>
      buildTimelineRows({
        entries: properties.entries,
        gaps: properties.gaps,
        earlier: properties.earlier,
        foldDetail: properties.foldDetail !== false,
        formatEvent: properties.formatEvent,
        members: properties.members,
      }),
    [
      properties.entries,
      properties.gaps,
      properties.earlier,
      properties.foldDetail,
      properties.formatEvent,
      properties.members,
    ]
  );

  const toggle = (id) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const runBusy = async (id, name, event) => {
    if (busy.has(id)) return;
    setBusy((current) => new Set([...current, id]));
    try {
      await trigger(name, event);
    } finally {
      setBusy((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  if (rows.length === 0) {
    if (!type.isString(properties.emptyText)) return null;
    return (
      <View style={[styles.empty, blockStyles.element]}>
        <Text style={[styles.emptyText, { color: colors.secondary }]}>{properties.emptyText}</Text>
      </View>
    );
  }

  const time = (at) => formatRelativeTime({ at, now });
  const linkText = (text) => <Text style={{ color: colors.tint, fontWeight: '500' }}>{text}</Text>;

  return (
    <View accessibilityLabel="Activity" style={blockStyles.element} testID={blockId}>
      {rows.map((row, index) => {
        const first = index === 0;
        const last = index === rows.length - 1;
        switch (row.type) {
          case 'earlier':
            return (
              <LineRow
                first={first}
                last={last}
                ctx={ctx}
                icon="Ellipsis"
                key={row.id}
                onPress={() => runBusy(row.id, 'onShowEarlier', { before: row.before ?? null })}
                tone="primary"
              >
                <Text style={styles.lineFont}>
                  {busy.has(row.id) ? (
                    <Text style={{ color: colors.tertiary }}>Loading…</Text>
                  ) : (
                    linkText('Show earlier activity')
                  )}
                </Text>
              </LineRow>
            );
          case 'gap':
            return (
              <LineRow
                first={first}
                last={last}
                ctx={ctx}
                icon="Ellipsis"
                key={row.id}
                onPress={() =>
                  runBusy(row.id, 'onExpandGap', {
                    after: row.gap.after ?? null,
                    before: row.gap.before ?? null,
                    count: row.gap.count,
                    id: row.gap.id ?? null,
                  })
                }
                tone="primary"
              >
                {busy.has(row.id) ? (
                  <Text style={[styles.lineFont, { color: colors.tertiary }]}>Loading…</Text>
                ) : (
                  <LineText
                    colors={{ ...colors, label: colors.tint, secondary: colors.tint }}
                    segments={row.segments}
                  />
                )}
              </LineRow>
            );
          case 'event':
            return (
              <EventLine
                colors={colors}
                ctx={ctx}
                event={row}
                expanded={open.has(`full:${row.id}`)}
                first={first}
                key={row.id}
                last={last}
                onToggle={() => toggle(`full:${row.id}`)}
                time={time(row.entry.at)}
              />
            );
          case 'group': {
            const isOpen = open.has(row.id);
            return (
              <React.Fragment key={row.id}>
                <LineRow
                  first={first}
                  last={last && !isOpen}
                  ctx={ctx}
                  icon={row.line.icon}
                  onPress={() => toggle(row.id)}
                  open={isOpen}
                  tone={row.line.tone}
                >
                  <LineText colors={colors} segments={row.line.segments} time={time(row.at)} />
                </LineRow>
                {isOpen
                  ? row.events.map((event, eventIndex) => (
                      <EventLine
                        colors={colors}
                        ctx={ctx}
                        event={event}
                        expanded={open.has(`full:${event.id}`)}
                        first={false}
                        hideActor
                        key={event.id}
                        last={last && eventIndex === row.events.length - 1}
                        onToggle={() => toggle(`full:${event.id}`)}
                        time={time(event.entry.at)}
                      />
                    ))
                  : null}
              </React.Fragment>
            );
          }
          case 'resolved': {
            const isOpen = open.has(row.id);
            const resolver = getActor({ by: row.thread.resolved?.by, members: properties.members });
            const count = row.thread.reply_count ?? (row.thread.replies ?? []).length;
            const segments = [{ kind: 'text', text: 'Thread resolved by ' }, resolver];
            if (count > 0) {
              segments.push({
                kind: 'text',
                text: ` · ${count === 1 ? '1 reply' : `${count} replies`}`,
              });
            }
            return (
              <React.Fragment key={row.id}>
                <LineRow
                  first={first}
                  last={last && !isOpen}
                  ctx={ctx}
                  icon="CircleCheck"
                  onPress={() => toggle(row.id)}
                  open={isOpen}
                  tone="success"
                >
                  <LineText
                    colors={colors}
                    segments={segments}
                    time={time(row.thread.resolved?.at)}
                  />
                </LineRow>
                {isOpen ? (
                  <ThreadCard ctx={ctx} first={false} last={last} thread={row.thread} />
                ) : null}
              </React.Fragment>
            );
          }
          default:
            return (
              <ThreadCard first={first} last={last} ctx={ctx} key={row.id} thread={row.thread} />
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: { borderRadius: 8, marginHorizontal: -6, paddingHorizontal: 6 },
  lineContent: { alignItems: 'flex-start', flexDirection: 'row', gap: 6, paddingVertical: 8 },
  lineText: { flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0 },
  lineFont: { fontSize: 15, lineHeight: 20 },
  note: { borderRadius: 8, marginTop: 6, paddingHorizontal: 10, paddingVertical: 7 },
  noteText: { fontSize: 14, lineHeight: 19 },
  empty: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 15 },
});

ActivityTimeline.meta = meta;

export default ActivityTimeline;
