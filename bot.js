const { Octokit } = require('octokit');
const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const btoa = require('btoa');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());


const octokit = new Octokit({
	auth: process.env.GH_AUTH,
});

if (
	process.env.TOKEN === undefined ||
  process.env.GH_USER === undefined ||
  process.env.GH_AUTH === undefined ||
  process.env.ANNOTATOR_REPO === undefined ||
	process.env.BOLT_REPO === undefined ||
	process.env.DATA_PIPE_REPO === undefined ||
	process.env.PROJECTS_REPO === undefined ||
	process.env.PAYMENT_REPO === undefined ||
	process.env.KAYA_REPO === undefined ||
	process.env.ADMIN_REPO === undefined ||
	process.env.PLAYGROUND_REPO === undefined ||
	process.env.PROFILES_REPO === undefined ||
  process.env.CHANNEL_ID === undefined ||
  process.env.PORT === undefined
) {
	console.error('ERROR: Invalid process.environmental variables');
	process.exit(1);
}


// ? This is an object to assign colours to each embed depending on what repo it's from
const repoList = {
	[process.env.ANNOTATOR_REPO] : { colour: '#FF0000', PRs: [] },
	[process.env.BOLT_REPO] : { colour: '#0000FF', PRs: [] },
	[process.env.DATA_PIPE_REPO] : { colour: '#00FF00', PRs: [] },
	[process.env.PROJECTS_REPO] : { colour: '#33FFF9', PRs: [] },
	[process.env.PAYMENT_REPO] : { colour: '#FFA833', PRs: [] },
	[process.env.KAYA_REPO] : { colour: '#DA33FF', PRs: [] },
	[process.env.ADMIN_REPO] : { colour: '#9333FF', PRs: [] },
	[process.env.PLAYGROUND_REPO] : { colour: '#E0FF33', PRs: [] },
};

// Discord bot must collect all messages from channel, presume all messages are embeds
// Do a fetch request on the URL component of each embed, in the response if the status is 'closed', remove from the list of embeds
// Return list of embeds

// ! function created to delete all messages and reset, not sure where to use this yet
// // const deleteAllMessages = async (channel) => {
// // 	channel.messages.fetch({ limit: 100 }).then((messages) => {
// // 		messages.forEach(async (message) => {
// // 			message.delete();
// // 		});
// // 	});
// // };

// TODO: Function to check if message is already present in the chat, if so don't upload another one
const checkIfPresent = async (channel, prURL) => {
	await channel.messages.fetch({ limit: 100 }).then((messages) => {
		messages.forEach((message) => {
			if (message.embeds.length === 0) {
				return false;
			}
			// console.log('embed url: ', message.embeds[0].data.url);
			// console.log('pr url: ', prURL);
			if (message.embeds[0].data.url === prURL) {
				return true;
			}
		});
	});
	return false;
};

// TODO: Modify this, to accept the repo name as well, to assign colours to it
const createEmbed = async (repo, pr, channel) => {

	if (await checkIfPresent(channel, pr.html_url)) {
		return;
	}

	const Embed = new EmbedBuilder()
		.setColor(repoList[repo].colour)
		.setTitle(`${pr.number}: ${pr.title}`)
		.setURL(pr.html_url)
		.setAuthor({ name: pr.user.login, iconURL: null, url: pr.user.html_url })
		.setThumbnail(pr.user.avatar_url)
		.addFields({
			name: 'Repo',
			value: `${repo}`,
		})
		.setDescription(
			`Merge ${pr.commits} commits into \`${pr.base.ref}\` from \`${pr.head.ref}\` @everyone`,
		);
	channel.send({ embeds: [Embed] });
};

// TODO: Search through all messages, compare embed url with arguement URL, then delete message if it's the same
const deleteMessage = async (channel, prURL) => {
	channel.messages.fetch({ limit: 100 }).then((messages) => {
		messages.forEach(async (message) => {
			if (message.embeds[0].url === prURL) {
				message.delete();
			}
		});
	});
};
/*
TODO:
  - Add argument for update type (listed in main app function)
  ? - Have switch statement for update type
*/

const updateEmbed = async (channel, action, state, prURL) => {
	channel.messages.fetch({ limit: 100 }).then((messages) => {
		messages.forEach(async (message) => {
			// TODO: Switch statement for different message types, reaction for each different type
			if (message.embeds[0].url === prURL) {

				// ? - if action === submitted
				if (action === 'submitted') {
					switch (state) {
					case 'approved':
						message.react('✅');
						break;
					case 'changes_requested':
						message.react('❌');
						break;
					// ! Haven't found a way to remove a specific reaction only once from a message, only remove all (https://discordjs.guide/popular-topics/reactions.html#removing-reactions)
					case 'dismissed':
						break;
					}
				}
			}
		});
	});
};


const getAllPRs = async () => {
	for (const repo in repoList) {
		const childObject = repoList[repo];
		const repoName = repo.slice('/');
		console.log('fetching repo: ', repo);

		try {
			const { data } = await octokit.request(`GET /repos/${repo}/pulls`, {
				owner: 'supahands',
				repo: repoName.slice('/'),
				state: 'opened',
			});
			childObject.PRs = data;
		}
		catch (error) {
			console.error(`Error fetching PRs for ${repo}: ${error.message}`);
		}
	}
};
/*
TODO: compare all embeds with all open PR's from the repo where the pull request came from
	? - If pr is open and does not match any of the channel emebds url, create new embed and add to channel
TODO: Look through messages in channel and update accordingly
 ? - If message is not an embed, delete it
 ? - If the PR attached to an embed is closed, delete the message

*/
const updateChannel = async (channel) => {
	const chatEmbeds = [];
	// await getRepoDataFor(repo);
	await getAllPRs();


	await channel.messages.fetch({ limit: 100 }).then((messages) => {
		messages.every(async (message) => {
			if (message.embeds.length === 0) {
				return false;
			}

			// ? - If the message is not an embed, delete it
			if (message.embeds === 0) {
				message.delete();
				return;
			}
			const messageEmbed = message.embeds[0];
			const prNum = messageEmbed.data.title.split(':')[0];
			const repo = messageEmbed.data.fields[0].value;

			// ? - If the PR attached to an embed is closed, delete the message
			const prInfo = await fetch(
				`https://api.github.com/repos/${repo}/pulls/${prNum}`,
				{
					method: 'GET',
					headers: {
						Authorization: `Basic ${btoa(
							`${process.env.GH_USER}:${process.env.GH_AUTH}`,
						)}`,
					},
				},
			).then((data) => data.json());
			if (prInfo.state === 'closed') {
				message.delete();
			}
		});
	});

	const channelMessages = await channel.messages.fetch({ limit: 100 });
	for (const message of channelMessages) {
		if (message[1].embeds.length === 0) {
			break;
		}
		chatEmbeds.push(message[1].embeds[0]);
	}
	// ? - Check through all PR's of each repo to see if any are not displayed atm
	for (const repoItem in repoList) {
		const repoData = repoList[repoItem];
		const prs = repoData.PRs;

		// ? - If the PR is open and does not match any of the channel emebds url, create new embed and add to channel
		for (const pr of prs) {
			const prInChat = chatEmbeds.find(embed => embed.data.url === pr.html_url);
			if (prInChat === undefined) {
				await createEmbed(repoItem, pr, channel);
			}
		}
	}
};


app.post('/', async (req, res) => {
	const channel = client.channels.cache.get(process.env.CHANNEL_ID);
	const repoName = req.body.repository.full_name;
	const action = req.body.action;
	const pr = req.body.pull_request;

	// ! Check for invalid repo
	if (repoList[repoName] === undefined) {
		console.error('Unsupported repo, please check that you spelt the repo correctly: ', repoName);
		res.status(400).send('Unsupported repo, please check that you spelt the repo correctly: ' + repoName);
		return;
	}

	// TODO: Set conditions for each of these actions:
	/*
	 TODO: Add for creation and deletion of embeds
	 ? List of base pull request actions:
	 * - opened : new pr request opened (Add that pr to chat + check if any other PR's are open)
	 * - closed : pr closed (Delete specfied pr from chat)
	 * - converted_to_draft : pr converted to draft (remove that from chat, also need to add condition in update to ignore it, until it is opened)
	 ! - Can put logic in to ignore the ones below
	 * - review_requested : fired each time you request a review from someone (so this happens alot)
	 * - review_request_removed
	 * - assigned: fired when a user is assigned to a pull request
	 * - unassigned: fired when a user is unassigned from a pull request
	 */

	/*
	  TODO: Add for update functionality
		? List of pull_request_review actions:
		* - submitted : review submitted
		* - edited: review edited
		* - dismissed: review dismissed
		* - resolved: Review comment dispute had been resolved
		! -  Look at the state key under the review object to see what sort of review it is
			* - approved: review approved
			* - changes_requested: asks for code changes
			* - dismissed: review dismissed by owner
		? There is also pull_request_comment or known as issue_comment, this uses the exact same syntax as review
	*/
	// >

	if (action === 'opened') {
		await createEmbed(repoName, pr, channel);
		updateChannel(channel, repoName);
		res.status(200).send('Updated and uploaded');
	}
	else if (action === 'closed' || action === 'converted_to_draft') {
		deleteMessage(channel, pr.html_url);
		res.status(200).send('Deleted');
	}
	else if (action === 'submitted') {
		updateEmbed(channel, action);
		res.status(200).send('Updated');
	}
	else {
		res.status(400).send('Unsupported action, please check that you spelt the action correctly: ' + action);
	}
});

// ? - Specify port for server to listen on
app.listen(process.env.PORT || 3000, () => {
	console.log(`Listening on port ${process.env.PORT || 3000}`);
});
// ? - Listen for when bot is connected to Discord (i.e. logged in)
client.on('ready', () => {
	console.log(
		`Logged in as ${client.user ? client.user.tag : 'no user defined'}`,
	);
});

// ? - Proceed with connecting to Discord (login)
client.login(process.env.TOKEN);
