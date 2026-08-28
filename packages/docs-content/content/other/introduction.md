# Introduction

Lowdefy makes it really easy to build web apps. With Lowdefy you can build CRUD apps, admin panels, internal tools, BI dashboards, workflow apps, websites, blogs, webforms or even documentation pages such as this one.

Lowdefy apps are defined in YAML config that follows a structured schema - this makes Lowdefy apps easy to read, write and understand.

## Quickstart

Run the following command to initialize a new Lowdefy app in your current working directory.

$

pnpx lowdefy@5 init && pnpx lowdefy@5 dev

This will create a file called `lowdefy.yaml` in the current working directory that contains the configuration for a Lowdefy app (as well as a `.gitignore`) and launch a local development server at http://localhost:3000. Make changes in the `lowdefy.yaml` file to see them reflect in the app.

> You need Node v22 or newer and pnpm installed to run Lowdefy. For more details see [the tutorial](/tutorial-start).

## Why create web apps using a YAML schema?

The Lowdefy schema is a simple definition of a web app which primarily makes use of block, action, operator and request definitions.

Some advantages of writing web apps in YAML are:
  - All apps use the same schema. This makes it easy to debug large apps or pick up where others left off.
  - Nothing is hidden in a GUI. This allows you to do basic stuff, like copy, paste, find, replace etc. which makes developing apps more productive.
  - App config is just data, thus you can develop scripts to create and manage your apps.
  - YAML files work with your favorite developer and source control tools.

> If you aren't a fan of YAML, you can also build your app using JSON files.

## Build future proof web apps on an source available platform

To date, more than 25 000 apps have been built by the Lowdefy community. We hope to see many community Lowdefy apps and plugins in the future and actively nurture the Lowdefy community on [Github](https://github.com/lowdefy/lowdefy/discussions) and [Discord](https://discord.gg/QQY9eJ7A2D) to help other developers to get started with Lowdefy and grow the ecosystem.

We've built Lowdefy to scale our own ability to develop and maintain web apps and internal tools for customers. Currently, we also provide Custom Software as a Service for larger customers, as well as support plans for those who need some extra help. Using Lowdefy we've built ticketing systems, call center solutions, advanced CRMs, custom MRPs, surveys and BI dashboard solutions and more for startup to enterprise customers. If you are looking for a Custom Software as a Service partner, please [reach out to us](http://lowdefy.com/contact-us).

## Tutorial

The easiest way to get started with Lowdefy is to follow the tutorial. In this tutorial we will be building a simple Lowdefy app to get you started.
