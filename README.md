# Discord Github Pull Request Bot
A Discord bot that integrates with the Github Pull Requests API and delivers notifications to specified Discord channels with the details of the pull request formatted into an embedded message.

## Features
- Receive notifications when pull requests are opened, closed, or when there are new commits
- Send an embedded message with the details of the pull request to a specified Discord channel
- Embedded message includes information such as the pull request's title, author, number of additions, deletions, and changes, and the status of the pull request
## Prerequisites
- Node.js
- A Github account with access to the Github Pull Requests API
- A Discord account with access to create a bot and invite it to a server
- [Deno]("https://deno.land/manual@v1.30.2/getting_started/installation")
## Installation
1. Clone the repository
```bash
Copy code
git clone https://github.com/[YOUR_GITHUB_USERNAME]/Discord-Github-Pull-Request-Bot.git
```
2. Install the dependencies
```Copy code
npm install
```
3. Create a new Discord application and bot account, and invite the bot to your server. You can find the instructions to do this on the Discord Developer Portal (https://discord.com/developers/applications)
4. Create a new personal access token (PAT) with read access to the Github Pull Requests API. You can find the instructions to do this on the Github Developer Settings (https://github.com/settings/tokens)
5. Create a .env file in the root of the project and set the following environment variables:
```css
TOKEN="[Discord bot token]"
GH_USER="[Github Username]"
GH_AUTH="[Github personal access token]"
REPO="[Repository name (ie. MichaelZhao21/michaelzhao)]"
CHANNEL_ID="[ID of text channel to send messages to]"
PORT="[Port to use (optional)]"
```
6. Start the bot
```sql
deno task dev
```
## Deployment
You can run the bot locally using Node.js, but for a more permanent solution, you can deploy the bot to a cloud platform such as Heroku or Google Cloud Platform. Follow the platform's instructions for deploying a Node.js application.

## Built With
- [Deno]('https://deno.land/) - A secure JavaScript and TypeScript runtime
- [Harmony]('https://doc.deno.land/https://raw.githubusercontent.com/harmonyland/harmony/main/mod.ts) - 
- [Express]('https://expressjs.com/) - A minimalist web framework for Node.js
## Contributing
If you want to contribute to this project, feel free to create a pull request.