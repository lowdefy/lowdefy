/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { Html5Qrcode } from 'html5-qrcode';

const codes = {
  QR_CODE: 0,
  AZTEC: 1,
  CODABAR: 2,
  CODE_39: 3,
  CODE_93: 4,
  CODE_128: 5,
  DATA_MATRIX: 6,
  MAXICODE: 7,
  ITF: 8,
  EAN_13: 9,
  EAN_8: 10,
  PDF_417: 11,
  RSS_14: 12,
  RSS_EXPANDED: 13,
  UPC_A: 14,
  UPC_E: 15,
  UPC_EAN_EXTENSION: 16,
};

class QRScanner extends React.Component {
  constructor(props) {
    super(props);
    this.onNewScanResult = this.onNewScanResult.bind(this);
    this.onStart = this.onStart.bind(this);
    this.onStop = this.onStop.bind(this);
    this.scanning = false;
  }

  onNewScanResult(decodedText, decodedResult) {
    this.props.methods.setValue(decodedResult);
    this.props.methods.triggerEvent({ name: 'onScan' });
  }

  onStart() {
    if (!this.scanning) {
      this.scanning = true;
      this.html5QrCode?.start(
        { facingMode: this.props.properties.facingMode ?? 'environment' },
        {
          ...{ aspectRatio: 1 },
          ...this.props.properties,
          ...{ formatsToSupport: codes[this.props.properties.formatsToSupport] },
        },
        this.onNewScanResult
      );
    }
  }

  onStop() {
    if (this.scanning) {
      this.scanning = false;
      this.html5QrCode?.stop();
    }
  }

  componentDidMount() {
    this.html5QrCode = new Html5Qrcode(this.props.blockId);
    if (!this.props.properties.inactiveByDefault) {
      this.onStart();
    }
    this.props.methods.registerMethod('start', () => this.onStart());
    this.props.methods.registerMethod('stop', () => this.onStop());
  }
  componentWillUnmount() {
    this.onStop();
  }

  render() {
    const { blockId, properties, methods } = this.props;
    return <div id={blockId} className={methods.makeCssClass([properties.style])} />;
  }
}

QRScanner.defaultProps = blockDefaultProps;
QRScanner.meta = {
  valueType: 'object',
  category: 'input',
  icons: [],
  styles: [],
};

export default QRScanner;
