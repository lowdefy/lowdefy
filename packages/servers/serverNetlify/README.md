# @lowdefy/server-netlify

A Lowdefy server that runs on [Netlify](https://www.netlify.com).

## Deploying to Netlify

#### Step 1

Your project will need to be hosted as a Github repository.

#### Step 2

Link your Github project to Netlify.

- Once logged in to Netlify, click the "New site from git" button.
- Choose Github, and authorise Netlify to access your repositories.
- Select your repository.

> If your repository isn't found, click "Configure Netlify on Github", and give Netlify access to your repository.

#### Step 3

Configure your Netlify deployment.

- Set your build command to `npx lowdefy@latest build-netlify`.
- Set your publish directory to `.lowdefy/publish`.
- Review the other settings, and deploy your site.

> Your site won't work yet. You first need to configure the Lowdefy server in the next step.

#### Step 4

Configure the Lowdefy server.

- Click the "Site settings" button.
- Choose the "Functions" section in the left menu.
- Edit the settings and set your functions directory to `.lowdefy/functions`.

#### Step 5

Redeploy your site.

- Go to the "Deploys" tab.
- Click the "Trigger deploy" button and deploy your site.
- Wait for you site to finish deploying.

On the "Site overview" tab you will find your site url.

## More Lowdefy resources

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-start
- Lowdefy docs - https://docs.lowdefy.com
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
