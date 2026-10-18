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

import React, { useState } from 'react';
import {
  FlatList,
  Keyboard,
  Platform,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { BottomSheet } from '@expo/ui/community/bottom-sheet';
import { type } from '@lowdefy/helpers';

import getPickerSheetDetents, { HEADER_HEIGHT, ROW_HEIGHT } from './getPickerSheetDetents.js';
import getPickerSheetRows from './getPickerSheetRows.js';
import getPickerSheetScrollIndex from './getPickerSheetScrollIndex.js';
import getSemanticColors from '../../shared/getSemanticColors.js';
import iosTextStyles from '../../shared/iosTextStyles.js';
import PickerOptionRow from './PickerOptionRow.js';
import PickerSearchField from './PickerSearchField.js';
import SheetCloseButton from '../../shared/SheetCloseButton.js';

const CLOSED = -1;
const MEDIUM = 0;
const LARGE = 1;
const DEFAULT_SEARCH_THRESHOLD = 7;

/**
 * The bottom sheet a Selector with `variant: sheet` opens: its title centred in the header with
 * a close button at the right, a search field while there are more options than
 * `searchThreshold`, and the options as rows (PickerOptionRow), the pinned group first. A short
 * list rests at the medium detent; a long list or one with a search field can be dragged to
 * the large detent, which focusing the search field opens. Its rows mount while it is presented,
 * and the search clears when it is dismissed.
 *
 * As the Sheet block, it keeps the system's background while the app shows the system's colour
 * mode, and takes the theme's elevated background when the app forces the other mode.
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {Object} props.components
 * @param {boolean} props.isDark
 * @param {() => void} props.onClose Called to close the sheet: by its close button, or once a
 *   swipe has dismissed it.
 * @param {(row: Object) => void} props.onPick Called with the picked getPickerSheetRows row.
 * @param {boolean} props.open
 * @param {Array} props.options
 * @param {string} props.placeholder
 * @param {Object} props.properties The Selector's properties.
 * @param {number|null} props.selectedIndex
 * @param {string} [props.title] The header title.
 * @param {Object} props.tokens
 */
function PickerSheet({
  blockId,
  components,
  isDark,
  onClose,
  onPick,
  open,
  options,
  placeholder,
  properties,
  selectedIndex,
  title,
  tokens,
}) {
  const systemScheme = useColorScheme();
  const { height: windowHeight } = useWindowDimensions();
  const colors = getSemanticColors({ tokens });
  const [detentIndex, setDetentIndex] = useState(MEDIUM);
  const [query, setQuery] = useState('');
  // The rows stay mounted from opening until the sheet has been dismissed, so they do not
  // vanish while it slides away.
  const [presented, setPresented] = useState(false);
  if (open && !presented) {
    setPresented(true);
  }

  const allowClear = properties.allowClear !== false;
  const allRows = getPickerSheetRows({ allowClear, options, placeholder, selectedIndex });
  const rows =
    query === ''
      ? allRows
      : getPickerSheetRows({ allowClear, options, placeholder, query, selectedIndex });
  const searchShown = options.length > (properties.searchThreshold ?? DEFAULT_SEARCH_THRESHOLD);
  const { snapPoints, resizable } = getPickerSheetDetents({
    platform: Platform.OS,
    rowCount: allRows.length,
    searchShown,
    windowHeight,
  });
  const showLeading = options.some(
    (option) =>
      type.isObject(option) &&
      (type.isObject(option.avatar) || type.isString(option.symbol) || type.isString(option.icon))
  );
  const showsSystemMode = (systemScheme === 'dark') === isDark;

  return (
    <BottomSheet
      backgroundStyle={showsSystemMode ? undefined : { backgroundColor: tokens.colorBgElevated }}
      enableDynamicSizing={false}
      enablePanDownToClose
      handleComponent={resizable ? undefined : null}
      index={open ? detentIndex : CLOSED}
      onChange={(index) => {
        if (index >= 0) setDetentIndex(index);
      }}
      onClose={() => {
        setPresented(false);
        setQuery('');
        setDetentIndex(MEDIUM);
        onClose();
      }}
      snapPoints={snapPoints}
    >
      {presented ? (
        <View style={{ flex: 1 }} testID={`${blockId}_sheet`}>
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              minHeight: HEADER_HEIGHT,
              paddingHorizontal: 16,
            }}
          >
            {/* Balances the right side so the title sits in the centre, as a navigation bar's. */}
            <View style={{ flex: 1 }} />
            {type.isString(title) ? (
              <Text
                accessibilityRole="header"
                numberOfLines={1}
                style={[iosTextStyles.headline, { color: colors.label, textAlign: 'center' }]}
              >
                {title}
              </Text>
            ) : null}
            <View style={{ alignItems: 'flex-end', flex: 1 }}>
              <SheetCloseButton
                components={components}
                onPress={onClose}
                testID={`${blockId}_close`}
                tokens={tokens}
              />
            </View>
          </View>
          {searchShown ? (
            <PickerSearchField
              accessibilityLabel={type.isString(title) ? `Search ${title}` : 'Search options'}
              blockId={blockId}
              colors={colors}
              components={components}
              onChangeText={setQuery}
              onFocus={() => {
                if (resizable) setDetentIndex(LARGE);
              }}
              tokens={tokens}
              value={query}
            />
          ) : null}
          <FlatList
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ paddingBottom: 16 }}
            data={rows}
            getItemLayout={(_, position) => ({
              index: position,
              length: ROW_HEIGHT,
              offset: ROW_HEIGHT * position,
            })}
            initialScrollIndex={getPickerSheetScrollIndex({
              searchShown,
              selectedPosition: rows.findIndex((row) => row.selected),
              windowHeight,
            })}
            keyExtractor={(row) => row.key}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text
                style={[
                  iosTextStyles.body,
                  { color: colors.secondaryLabel, paddingTop: 24, textAlign: 'center' },
                ]}
              >
                No results
              </Text>
            }
            renderItem={({ item }) => (
              <PickerOptionRow
                blockId={blockId}
                colors={colors}
                components={components}
                isDark={isDark}
                onPick={(row) => {
                  Keyboard.dismiss();
                  onPick(row);
                }}
                row={item}
                showLeading={showLeading}
                tokens={tokens}
              />
            )}
            style={{ flex: 1 }}
            testID={`${blockId}_options`}
          />
        </View>
      ) : null}
    </BottomSheet>
  );
}

export default PickerSheet;
