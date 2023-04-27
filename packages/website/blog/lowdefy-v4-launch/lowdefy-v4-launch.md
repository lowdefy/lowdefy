# Introducing Lowdefy v4: The Easiest Config Webstack built on top of Next.js

We're excited to announce Lowdefy v4, an open-source framework that simplifies building web applications, internal tools, admin panels, BI dashboards, and CRUD apps using YAML or JSON configuration files. With this new release, we've introduced several powerful features to enhance your experience and streamline your development process. Key features of v4 include converting Lowdefy apps to run on top as Next.js apps, extensibility your apps with NPM plugins, enhanced styling all of Ant Design's more than 900 style variables, and more flexible deployment options. These improvements will help you create faster, more dynamic, beautiful, and purpose built applications with ease.

## New Features in Lowdefy v4

### Built on top of Next.js

Lowdefy v4 is now built on top of the popular Next.js framework, which means you'll benefit from the thriving Next.js ecosystem. This is the largest React full-stack community, used in production at scale all over the world, and a wealth of plugins and integrations are now available to help you extend and optimize your Lowdefy apps. As a result, you'll experience enhanced performance and an improved developer experience when building your applications.

By adopting Next.js, Lowdefy v4 gains access to cutting-edge web development practices, faster page load times, better SEO options, best in class deployment options and ensures your apps stay modern, fast and maintainable.

### Extensibility with NPM Plugins

Lowdefy v4 introduces plugins with full support for NPM modules, making it easy to extend your apps with custom Blocks, Connections, Requests, Actions, Operators, and Auth Adapters and Providers. Plugins allows you to harness the power of custom javascript code including the vast ecosystem of NPM packages.

Lowdefy plugins are packages installed in your project's Next.js package.json, thus forms part of the normal Next.js build process. This brings all the advantages of performance and optimizations built into Next.js to your Lowdefy apps and plugins. This also simplifies the build and deployment process, removing the complexity that was introduced by Webpack module federation in Lowdefy v3. This update means that developers can now use build and deployment processes that they are already familiar with.

By utilizing Lowdefy plugins, you can easily customize your applications to cater to specific requirements. The flexibility of v4 plugins solves the "brick wall" problem faced by all low-code frameworks. While Lowdefy reduces the need for custom code, the abstraction paradigm introduced by the new plugin mechanism allows developers to speed up and standardize application delivery by only coding the last mile of their application.

### Enhanced Styling and Rendering

A major shift in this Lowdefy upgrade is that we are bringing back a javascript build step for all apps. Building modern day web applications requires a javascript build step, often plagued by application specific complexities. To simplify app development Lowdefy v3 removed this build step by implementing Webpack module federation. This meant we only used one build bundle for all Lowdefy apps, and loaded front-end dependencies at runtime. Although simplifying the build process, it introduced others such as large loading waterfalls, complications for loading server side dependencies at runtime and limitations on app specific build process optimizations and modifications, for example modifying Less style variables.

With an app specific build step Lowdefy v4 apps bundles can include app specific dependencies and apply advanced features such as providing the ability to modify all of [Ant Design v4's +900 style variables](https://github.com/ant-design/ant-design/blob/4.x-stable/components/style/themes/default.less) empowering Lowdefy app developers to build beautiful apps with ease.

In v4 we've also re-engineered how loading states work and added the ability to easily specify loading skeletons on a block level. This gives app developers precise control of loading states while keeping application config simple, clean and understandable. We've also removed any blocking loading elements to instead render eagerly, resulting in a much faster user experience. On our docs introduction page this results in a 5x faster time to first meaningful paint.

## A Word on Lowdefy as a Company

Over the past 7 years our small team has focused on developing custom web applications for internal business processes of enterprise customers. These niche, high-value apps have given us the freedom to bootstrap Lowdefy as an open-source web framework, allowing our team to deliver many web apps of excellent quality. Lowdefy helped us speed up our onboarding process for new devs and made the maintenance and enhancement of our customer apps easy.

Although we might not be growing with the speed of a VC backed business, we've always been focused on building a sustainable business model. Staying small also helped us to stay nimble and gave us the freedom to experiment with platform changes which would be difficult to do at scale. In the future scaling with VC backing might make sense for us, but for now, we are still laser focused on developing Lowdefy to be the easiest way to create web apps for teams big and small.

With the growth of the Lowdefy community, more than 25 000 apps have been built with Lowdefy. Lowdefy is becoming the tool of choice, especially for developers who do not want to invest the effort to learn the complex javascript ecosystem, and are just looking for an easy, secure and scalable way to publish something on the web.

To further improve the Lowdefy developer experience, we've started the development of the Lowdefy dev tools which will be the first of many commercial offerings on our path to develop the Lowdefy ecosystem while maintaining an open core business model.

If your company requires help to develop simple or complex internal applications, please reach out (gvw@lowdefy.com) and let's discuss how our team of engineers can assist.

## Getting Started with Lowdefy v4

To start building applications with Lowdefy v4, check out our [documentation](https://docs.lowdefy.com) and explore the [plugins project example](https://github.com/lowdefy/lowdefy-example-plugins) for a pnpm monorepo setup.

Don't forget to share your custom plugins with the Lowdefy community by publishing them to NPM using `lowdefy` in the name and posting about it on our [Github Discussions](https://github.com/lowdefy/lowdefy/discussions).

We can't wait to see the amazing applications you'll create with Lowdefy v4! If you have any questions or feedback, feel free to reach out to us through [Github Discussions](https://github.com/lowdefy/lowdefy/discussions) or join our [community on Discord](https://discord.gg/lowdefy).

Happy coding! 🎉
