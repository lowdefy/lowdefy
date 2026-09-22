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

import React, { useCallback, useMemo } from 'react';
import { cn, renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import ContextTable from './ContextTable.js';
import flattenContext from './flattenContext.js';
import formatTime from './formatTime.js';
import getAvatarColor from './getAvatarColor.js';
import getInitials from './getInitials.js';
import cssStyles from './style.module.css';

const EventLogRow = React.memo(function EventLogRow({
  blockId,
  classNames,
  entry,
  expanded,
  Icon,
  methodsRef,
  onToggle,
  styles,
  text,
}) {
  const { actorName, actorPicture, context, detail, level, message, messageText, typeConfig } =
    entry;
  const time = formatTime(entry.time);
  const contextRows = useMemo(
    () => (expanded && !type.isNone(context) ? flattenContext(context) : []),
    [expanded, context]
  );
  const onKeyDown = useCallback(
    (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onToggle();
    },
    [onToggle]
  );

  const typeLabel = typeConfig.title ?? entry.eventType;

  return (
    <div
      className={cn(cssStyles.row, expanded && cssStyles.rowOpen, classNames.row)}
      data-level={level}
      style={styles.row}
    >
      <div
        className={cssStyles.rowHead}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={onKeyDown}
      >
        <span className={cssStyles.rail} aria-hidden />
        <span className={cssStyles.chevron} data-open={expanded} aria-hidden>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path
              d="M3 1.5 L7 5 L3 8.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <time className={cssStyles.time} dateTime={time.dateTime} title={time.absolute}>
          <span className={cssStyles.timeClock}>{time.clock}</span>
          <span className={cssStyles.timeRelative}>{time.relative}</span>
        </time>
        <span className={cssStyles.type} style={{ color: typeConfig.color }}>
          {type.isNone(typeConfig.icon) ? (
            <span className={cssStyles.dot} aria-hidden />
          ) : (
            <Icon
              blockId={`${blockId}_${entry.id}_icon`}
              properties={{ name: typeConfig.icon, size: 13, color: typeConfig.color }}
            />
          )}
          <span className={cssStyles.typeLabel}>{typeLabel}</span>
        </span>
        <span className={cssStyles.message} title={messageText}>
          {renderHtml({ html: message, methods: methodsRef.current })}
        </span>
      </div>

      {expanded && (
        <div className={cn(cssStyles.detail, classNames.detail)} style={styles.detail}>
          <div className={cssStyles.detailMeta}>
            <span
              className={cssStyles.avatar}
              style={{ background: getAvatarColor(actorName ?? entry.eventType) }}
              aria-hidden
            >
              {type.isNone(actorPicture) ? (
                getInitials(actorName)
              ) : (
                <img src={actorPicture} alt="" className={cssStyles.avatarImage} />
              )}
            </span>
            <span className={cssStyles.actor}>{actorName ?? text.systemActor}</span>
            <span className={cssStyles.detailTime}>{time.absolute}</span>
          </div>
          {!type.isNone(detail) && (
            <div className={cssStyles.detailBody}>
              {renderHtml({ html: detail, methods: methodsRef.current })}
            </div>
          )}
          {contextRows.length > 0 && (
            <ContextTable
              className={classNames.context}
              context={context}
              rows={contextRows}
              style={styles.context}
              text={text}
            />
          )}
        </div>
      )}
    </div>
  );
});

export default EventLogRow;
