# 1. Getting started

In this tutorial, we will be creating a simple ticketing app that allows users to file new tickets and see a list of outstanding tickets. The app reads product data from [DummyJSON](https://dummyjson.com/) and will write the ticket data to an [SQLite](https://www.sqlite.org/) database.

### Requirements

The Lowdefy CLI (Command Line Interface) is needed to run the development server. To run the Lowdefy CLI you need to install Node.js at version 22 or greater. If you don't have it installed, download Node.js from https://nodejs.org/en/download/, and follow the installation steps for your computer. All of the default settings given by the installer are fine for what we need. You will also need a text editor to modify the Lowdefy configuration files.

Lowdefy also requires [`pnpm`](https://pnpm.io/) to be installed. We recommend making activating [Corepack](https://nodejs.org/api/corepack.html), even though it is an experimental feature, as this is the simplest way to install `pnpm`. Alternative methods to install `pnpm` can also be found [here](https://pnpm.io/installation). To activate Corepack, run the following in your computer's command line interface (Windows CMD, Terminal on MacOS).

$

corepack enable

##### YAML files

If you don't have any experience using YAML, please familiarize yourself YAML before continuing.

[This video is a good introduction to YAML.](https://www.youtube.com/embed/cdLNKUoMc6c?origin=https://docs.lowdefy.com)

Lowdefy apps are written using YAML files. YAML files are useful for storing structured data, like the configuration of all of the elements of your app. YAML files focus on being easily readable by humans, this means they don't use lots of syntactic elements like brackets that make it difficult for humans to read, but instead use __indentation to indicate structure__. While this does make the file easier to read, this means care has to be taken that the data structure is as you intended.

> Lowdefy apps can also be defined using JSON files, or a mix of YAML and JSON. We find YAML files more convenient to write.

#### 1.1. Create a project directory

Create a directory (folder) on your computer where you would like to create the configuration files for your project. We will be referring to this directory as the project directory.

#### 1.2. Open a command line interface

Open your computer's command line interface and change directory (`cd`) to the project directory.

#### 1.3. Initialize an app

Use the Lowdefy CLI to initialize your project. We recommend using [`pnpx`](https://pnpm.io/6.x/pnpx-cli) to run the Lowdefy CLI, since this will always run the latest version of the CLI.

Run the following in your terminal:

$

pnpx lowdefy@5 init

This will create two files in your current working directory. The first file, called `lowdefy.yaml` is the starting point of your app's configuration. The second, called `.gitignore`, is a hidden file that tells `git`, a version control tool, not to version or upload some specific files.

> __Error: A "lowdefy.yaml" file already exists__: Try running the command in a new directory or consider deleting the _lowdefy.yaml_ file in your current working directory.

#### 1.4. Start the development server

Run:

$

pnpx lowdefy@5 dev

Your browser should open on http://localhost:3000, and you should see the following:

Made by a Lowdefy 🤖

> __Error: Could not find "lowdefy.yaml"__: Make sure your current working directory contains the _lowdefy.yaml_ file. You can verify this by running the `dir` (Windows) or `ls` (MacOS) command.

### What happened

The Lowdefy CLI helps you develop a Lowdefy app.

We used the `pnpx lowdefy@5 init` command to initialize a new project. This created all the essential files.

We also used the `pnpx lowdefy@5 dev` command to start a development server. The development server runs a Lowdefy app locally on your computer, which can be accessed at http://localhost:3000. The development server watches your configuration files, and if any of them changes it "builds" (compiles the configuration together for the server to serve) the configuration again and refreshes the browser to show the changes.

### Up next

Let's see how easy it is to create a new page.
