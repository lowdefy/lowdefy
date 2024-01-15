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

import React, { useEffect, useRef } from 'react';
import { Carousel } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-utils';

const getSlides = ({ content, properties }) => {
  let slides = properties.slides;
  if (!slides) {
    slides = Object.keys(content)
      .sort()
      .map((key) => ({ key }));
  }
  return slides;
};

const CarouselBlock = ({ blockId, content, properties, methods }) => {
  const slides = getSlides({ content, properties });

  const carousel = useRef();

  useEffect(() => {
    methods.registerMethod('goTo', ({ slide, dontAnimate = false }) => {
      const slideNumber = slides.findIndex((item) => {
        return item.key === slide;
      });
      if (slideNumber !== -1) {
        carousel.current.goTo(slideNumber, dontAnimate);
      }
    });
    methods.registerMethod('next', () => {
      carousel.current.next();
    });
    methods.registerMethod('prev', () => {
      carousel.current.prev();
    });
  }, []);

  return (
    <Carousel
      {...properties}
      id={blockId}
      afterChange={(current) => {
        methods.triggerEvent({
          name: 'afterChange',
          event: { current: slides[current] },
        });
      }}
      beforeChange={(current, next) => {
        methods.triggerEvent({
          name: 'beforeChange',
          event: { current: slides[current], next: slides[next] },
        });
      }}
      onInit={() => methods.triggerEvent({ name: 'onInit' })}
      onSwipe={() => methods.triggerEvent({ name: 'onSwipe' })}
      className={methods.makeCssClass(properties.style)}
      ref={carousel}
    >
      {slides?.map((slide) => (
        <div key={slide.key}>{content[slide.key] && content[slide.key]()}</div>
      ))}
    </Carousel>
  );
};

CarouselBlock.defaultProps = blockDefaultProps;
CarouselBlock.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/Carousel/style.less'],
};

export default CarouselBlock;
