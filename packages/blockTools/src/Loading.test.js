/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { render } from '@testing-library/react';

import Loading from './Loading';

test('Render default', () => {
  const { container } = render(<Loading />);
  expect(container.firstChild).toMatchInlineSnapshot(`<div />`);
});

test('Render IconSpinner', () => {
  const { container } = render(<Loading type="IconSpinner" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    .emotion-0 {
      height: 20px;
      display: -webkit-box;
      display: -webkit-flex;
      display: -ms-flexbox;
      display: flex;
      -webkit-align-items: center;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      -webkit-box-pack: center;
      -ms-flex-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
    }

    <span
      class="emotion-0"
    >
      <svg
        aria-hidden="true"
        class="icon-spinner"
        data-icon="loading-3-quarters"
        fill="currentColor"
        focusable="false"
        height="20"
        viewBox="0 0 1024 1024"
        width="20"
      >
        <path
          d="M512 1024c-69.1 0-136.2-13.5-199.3-40.2C251.7 958 197 921 150 874c-47-47-84-101.7-109.8-162.7C13.5 648.2 0 581.1 0 512c0-19.9 16.1-36 36-36s36 16.1 36 36c0 59.4 11.6 117 34.6 171.3 22.2 52.4 53.9 99.5 94.3 139.9 40.4 40.4 87.5 72.2 139.9 94.3C395 940.4 452.6 952 512 952c59.4 0 117-11.6 171.3-34.6 52.4-22.2 99.5-53.9 139.9-94.3 40.4-40.4 72.2-87.5 94.3-139.9C940.4 629 952 571.4 952 512c0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.2C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3s-13.5 136.2-40.2 199.3C958 772.3 921 827 874 874c-47 47-101.8 83.9-162.7 109.7-63.1 26.8-130.2 40.3-199.3 40.3z"
          fill="#bfbfbf"
        />
      </svg>
    </span>
  `);
});

test('Render Skeleton', () => {
  const { container } = render(<Loading type="Skeleton" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      class="skeleton emotion-0"
      style="width: 100%; height: 100%;"
    />
  `);
});

test('Render SkeletonAvatar', () => {
  const { container } = render(<Loading type="SkeletonAvatar" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    .emotion-0 {
      border-radius: 16px;
    }

    <div
      class="skeleton emotion-0"
      style="width: 32px; height: 32px;"
    />
  `);
});

test('Render SkeletonButton', () => {
  const { container } = render(<Loading type="SkeletonButton" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      class="skeleton emotion-0"
      style="width: 100%; height: 32px;"
    />
  `);
});

test('Render SkeletonInput', () => {
  const { container } = render(<Loading type="SkeletonInput" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    .emotion-0 {
      margin-bottom: 10px;
    }

    <div>
      <div
        class="skeleton emotion-0"
        style="width: 30%; height: 20px;"
      />
      <div
        class="skeleton emotion-1"
        style="width: 100%; height: 32px;"
      />
    </div>
  `);
});

test('Render SkeletonParagraph', () => {
  const { container } = render(<Loading type="SkeletonParagraph" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    .emotion-0 {
      margin-bottom: 1rem;
    }

    <div
      style="width: 100%;"
    >
      <div
        class="skeleton emotion-0"
        style="width: 100%; height: 1.25rem;"
      />
      <div
        class="skeleton emotion-0"
        style="width: 100%; height: 1.25rem;"
      />
      <div
        class="skeleton emotion-0"
        style="width: 100%; height: 1.25rem;"
      />
      <div
        class="skeleton emotion-0"
        style="width: 40%; height: 1.25rem;"
      />
    </div>
  `);
});

test('Render Spinner', () => {
  const { container } = render(<Loading type="Spinner" />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    .emotion-0 {
      height: 100%;
      display: -webkit-box;
      display: -webkit-flex;
      display: -ms-flexbox;
      display: flex;
      -webkit-align-items: center;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      -webkit-box-pack: center;
      -ms-flex-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
    }

    .emotion-1 {
      text-align: center;
      color: #bfbfbf;
      font-size: 12px;
      padding-top: 2px;
      font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";
    }

    <div
      class="emotion-0"
    >
      <div
        style="width: 50px; margin: auto; height: 50px;"
      >
        <svg
          height="100%"
          version="1.1"
          viewBox="0 0 94 91"
          width="100%"
        >
          <g>
            <path
              d="M94,18.634c0,-10.284 -8.35,-18.634 -18.634,-18.634l-56.732,0c-10.284,0 -18.634,8.35 -18.634,18.634l0,53.732c0,10.284 8.35,18.634 18.634,18.634l56.732,0c10.284,0 18.634,-8.35 18.634,-18.634l0,-53.732Z"
              style="fill: #bfbfbf;"
            />
            <rect
              class="loading-bar"
              height="59"
              style="fill: #fff;"
              width="30"
              x="16"
              y="15"
            />
            <rect
              class="loading-bar-sm"
              height="25"
              style="fill: #fff;"
              width="25"
              x="53"
              y="52"
            />
          </g>
        </svg>
        <div
          class="emotion-1"
        >
          Lowdefy
        </div>
      </div>
    </div>
  `);
});
