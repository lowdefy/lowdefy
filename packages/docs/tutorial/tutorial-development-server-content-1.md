Lowdefy has a development server that allows you to develop your app locally. In this section we will start up the development server.

### Requirements
The Lowdefy CLI (Command Line Interface) is needed to run the development server. To run the Lowdefy CLI you need to install Node.js at version 12 or greater. If you don't have it installed, download Node.js from https://nodejs.org/en/download/, and follow the installation steps for your computer. All of the default settings given by the installer are fine for what we need. You will also need a text editor and a git client.

#### Step 1

Clone your project repository on your local machine.

#### Step 2

Open the project with your text editor.

#### Step 3

In a terminal or command line, change directory to your project directory. This should be the directory with the `lowdefy.yaml` file.

#### Step 4

You can run the CLI with `npx`. This will run the latest version of the cli. To start the the development server, run

```
npx @lowdefy/cli dev
```

This will open a window in your browser with the local version of your app.

#### Step 5

If you make changes to any of the files in your project, the server will reload with your changes. Make a change to the title text. You should see the app reload with your new title.