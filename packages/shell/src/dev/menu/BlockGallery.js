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

import React from 'react';
import { Text, View } from 'react-native';

import devStyles from '../devStyles.js';

// The shake menu's block gallery: every native block the shell carries, shown with its examples.
// The native block set fills it in; until then it says so.
function BlockGallery() {
  return (
    <View style={devStyles.screen} testID="dev-block-gallery">
      <Text style={devStyles.heading}>Block gallery</Text>
      <Text style={devStyles.hint}>The gallery of native blocks is not in this build yet.</Text>
    </View>
  );
}

export default BlockGallery;
