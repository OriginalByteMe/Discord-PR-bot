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
	[process.env.ANNOTATOR_REPO] : { colour: '#00FF00', PRs: [] },
	[process.env.BOLT_REPO] : { colour: '#00FF00', PRs: [] },
	[process.env.DATA_PIPE_REPO] : { colour: '#00FF00', PRs: [] },
	[process.env.PROJECTS_REPO] : { colour: '#00FF00', PRs: [] },
	[process.env.PAYMENT_REPO] : { colour: '#00FF00', PRs: [] },
	[process.env.KAYA_REPO] : { colour: '#00FF00', PRs: [] },
	[process.env.ADMIN_REPO] : { colour: '#00FF00', PRs: [] },
	[process.env.PLAYGROUND_REPO] : { colour: '#00FF00', PRs: [] },
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


// TODO: Modify this, to accept the repo name as well, to assign colours to it
const createEmbed = (repo, pr, channel) => {
	// const commits = await fetch(pr.commits_url, {
	// 	method: 'GET',
	// 	headers: {
	// 		Authorization: `Basic ${btoa(
	// 			`${process.env.GH_USER}:${process.env.GH_AUTH}`,
	// 		)}`,
	// 	},
	// }).then((data) => data.json());


	// const commits = await octokit.request(`GET ${pr.commits_url}`, {
	// 	owner: 'supahands',
	// 	repo: 'saas-data-pipeline-service',
	// 	state: 'all',
	// });
	const Embed = new EmbedBuilder()
		.setColor('#00CD2D')
		.setTitle(`${pr.number}: ${pr.title}`)
		.setURL(pr.html_url)
		.setAuthor({ name: pr.user.login, iconURL: null, url: pr.user.html_url })
		.setThumbnail(pr.user.avatar_url)
		.addFields({
			name: 'Repo',
			value: `${repo}`,
		})
		.setDescription(
			`Merge ${pr.commits} commits into \`${pr.base.ref}\` from \`${pr.head.ref}\` @Engineering`,
		);
	channel.send({ embeds: Embed });
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


const getRepoDataFor = async (repo) => {
	switch (repo) {
	case process.env.ANNOTATOR_REPO:
		repoList[process.env.ANNOTATOR_REPO].PRs = await octokit.request(`GET /repos/${process.env.ANNOTATOR_REPO}/pulls`, {
			owner: 'supahands',
			repo: process.env.ANNOTATOR_REPO.slice('/'),
			state: 'opened',
		});
		break;
	case process.env.BOLT_REPO:
		repoList[process.env.BOLT_REPO].PRs = await octokit.request(`GET /repos/${process.env.BOLT_REPO}/pulls`, {
			owner: 'supahands',
			repo: process.env.BOLT_REPO.slice('/'),
			state: 'opened',
		});
		break;
	case process.env.DATA_PIPE_REPO:
		repoList[process.env.DATA_PIPE_REPO].PRs = await octokit.request(`GET /repos/${process.env.DATA_PIPE_REPO}/pulls`, {
			owner: 'supahands',
			repo: process.env.DATA_PIPE_REPO.slice('/'),
			state: 'opened',
		});
		break;
	case process.env.PROJECTS_REPO:
		repoList[process.env.PROJECTS_REPO].PRs = await octokit.request(`GET /repos/${process.env.PROJECTS_REPO}/pulls`, {
			owner: 'supahands',
			repo: process.env.PROJECTS_REPO.slice('/'),
			state: 'opened',
		});
		break;
	case process.env.PAYMENT_REPO:
		repoList[process.env.PAYMENT_REPO].PRs = await octokit.request(`GET /repos/${process.env.PAYMENT_REPO}/pulls`, {
			owner: 'supahands',
			repo: process.env.PAYMENT_REPO.slice('/'),
			state: 'opened',
		});
		break;
	case process.env.KAYA_REPO:
		repoList[process.env.KAYA_REPO].PRs = await octokit.request(`GET /repos/${process.env.KAYA_REPO}/pulls`, {
			owner: 'supahands',
			repo: process.env.KAYA_REPO.slice('/'),
			state: 'opened',
		});
		break;
	case process.env.ADMIN_REPO:
		repoList[process.env.ADMIN_REPO].PRs = await octokit.request(`GET /repos/${process.env.ADMIN_REPO}/pulls`, {
			owner: 'supahands',
			repo: process.env.ADMIN_REPO.slice('/'),
			state: 'opened',
		});
		break;
	case process.env.PLAYGROUND_REPO:
		repoList[process.env.PLAYGROUND_REPO].PRs = await octokit.request(`GET /repos/${process.env.PLAYGROUND_REPO}/pulls`, {
			owner: 'supahands',
			repo: process.env.PLAYGROUND_REPO.slice('/'),
			state: 'opened',
		});
		break;
	default:
		console.error(`Invalid repo name: ${repo}`);
		break;
	}
};
/*
TODO: compare all embeds with all open PR's from the repo where the pull request came from
	? - If pr is open and does not match any of the channel emebds url, create new embed and add to channel
TODO: Look through messages in channel and update accordingly
 ? - If message is not an embed, delete it
 ? - If the PR attached to an embed is closed, delete the message

*/
const updateChannel = async (channel, repo) => {
	await getRepoDataFor(repo);
	await channel.messages.fetch({ limit: 100 }).then((messages) => {
		messages.forEach(async (message) => {
			const messageEmbed = message.embeds[0];
			const prNum = messageEmbed.data.title.split(':');

			// ? - If the message is not an embed, delete it
			if (message.embeds === 0) {
				message.delete();
			}
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
			// ? - If the PR is open and does not match any of the channel emebds url, create new embed and add to channel


		});
	});

};


// const createEmbedList = async (channel, newPR) => {
// 	// TODO: Check through all PR's of given repo and compare them with the list of PRs in the channel

// 	// TODO: Create an embed for any PRs that are not in the channel

// 	// TODO: If there are no new PR's to make, return (?) (Technically should not be getting here)

// 	let embeds = [];
// 	const chatEmbeds = [];
// 	const requestedEmbed = await createEmbed(newPR);
// 	const requestedClosed = await newPR.state === 'closed';
// 	const allPRs = await octokit.request(`GET /repos/${process.env.REPO}/pulls`, {
// 		owner: 'supahands',
// 		repo: 'saas-data-pipeline-service',
// 		state: 'opened',
// 	});

// 	deleteAllMessages(channel);

// 	await channel.messages.fetch({ limit: 100 }).then((messages) => {
// 		messages.forEach(async (message) => {
// 			const embed = message.embeds[0];
// 			const prNum = embed.data.title.split(':');
// 			const prInfo = await fetch(
// 				`https://api.github.com/repos/${process.env.REPO}/pulls/${prNum}`,
// 				{
// 					method: 'GET',
// 					headers: {
// 						Authorization: `Basic ${btoa(
// 							`${process.env.GH_USER}:${process.env.GH_AUTH}`,
// 						)}`,
// 					},
// 				},
// 			).then((data) => data.json());
// 			if (prInfo.state === 'closed') {
// 				message.delete();
// 			}
// 			else {
// 				chatEmbeds.push(embed);
// 			}
// 		});
// 	});

// 	for (const pr of allPRs.data) {
// 		if (pr.number === newPR.number) {
// 			embeds.push(requestedEmbed);
// 		}
// 		const newEmbed = await createEmbed(pr);
// 		embeds.push(newEmbed);
// 	}
// 	// Remove a the requestedEmbed from the list if requestedClosed is true

// 	// Remove all items from embeds array that are also in the chatEmbeds array
// 	embeds = embeds.filter(embed => !chatEmbeds.includes(embed));

// 	return embeds;
// };


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
		createEmbed(repoName, pr, channel);
		updateChannel(channel);
	}
	else if (action === 'closed' || action === 'converted_to_draft') {
		deleteMessage(channel, pr.html_url);
	}
	else if (action === 'submitted') {
		updateEmbed(channel, action);
	}
	else {
		res.status(400).send('Unsupported action, please check that you spelt the action correctly: ' + action);
	}
	// if (req.body.repository.full_name != process.env.ANNOTATOR_REPO) {
	// 	res.status(400);
	// 	res.send({ status: 400, error: 'Invalid repo' });
	// 	return;
	// }

	// const embeds = createEmbedList(channel, pr);
	// if (action === 'closed') {
	// 	res.status(200);
	// 	res.send({ status: 200 });
	// 	return;
	// }
	// if ((await embeds).length === 0) {
	// 	res.status(400);
	// 	res.send({ status: 400, error: 'No embeds found' });
	// }
	// else {
	// 	channel.send({ embeds: await embeds });
	// 	res.send({ status: 200, embeds: await embeds });
	// }
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
