#### Step 1

Go to your project repository on Github, and navigate to `pages/welcome.yaml` in the repository files.

This file contains the configuration for the welcome page on the app. It describes the UI components, called "blocks", as well as the actions on the page.

#### Step 2

To edit this configuration, click on the edit (pencil) icon at the top right. Paste the following text in the text area to replace the existing configuration:
```
id: welcome
type: PageHeaderMenu
blocks:
  - id: content_card
    type: Card
    blocks:
      - id: title
        type: Title
        properties:
          content: Hello World
```
#### Step 3

To save these changes, we are going to make a commit in the project repository.

