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

// The block's code types (the native QRScanner's names, plus the three only zxing reads) and
// the BarcodeDetector formats each one asks for. The first format is the one requested; the
// rest are the more specific names zxing reports a read of that type as.
const typeFormats = {
  qr: ['qr_code', 'qr_code_model_1', 'qr_code_model_2', 'micro_qr_code', 'rm_qr_code'],
  aztec: ['aztec', 'aztec_code', 'aztec_rune'],
  codabar: ['codabar'],
  code39: ['code_39', 'code_39_standard', 'code_39_extended', 'code_32', 'pzn'],
  code93: ['code_93'],
  code128: ['code_128'],
  datamatrix: ['data_matrix'],
  itf14: ['itf', 'itf_14'],
  ean13: ['ean_13', 'isbn'],
  ean8: ['ean_8'],
  pdf417: ['pdf417', 'compact_pdf417', 'micro_pdf417'],
  upc_a: ['upc_a'],
  upc_e: ['upc_e'],
  databar: [
    'databar',
    'databar_omni',
    'databar_stacked',
    'databar_stacked_omni',
    'databar_limited',
  ],
  databar_expanded: ['databar_expanded', 'databar_expanded_stacked'],
  maxicode: ['maxi_code'],
};

export default typeFormats;
