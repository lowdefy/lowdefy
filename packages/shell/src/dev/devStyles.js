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

import { StyleSheet } from 'react-native';

const devStyles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    padding: 24,
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#8c8c8c',
  },
  error: {
    fontSize: 14,
    color: '#cf1322',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1677ff',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    fontSize: 16,
  },
  row: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  rowText: {
    fontSize: 17,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    padding: 24,
    gap: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#ffffff',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  mono: {
    fontFamily: 'Menlo',
    fontSize: 12,
  },
});

export default devStyles;
