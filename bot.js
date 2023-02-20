const { Octokit } = require('octokit');
const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const btoa = require('btoa');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const express = require('express');
const app = express();
const serverless = require('serverless-http');
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
	[process.env.BOLT_REPO] : { colour: '#0000FF', PRs: [], amplify: true, pr_preview: 'https://test-pr-previews.dl5eewox9qmvx.amplifyapp.com/' },
	[process.env.KAYA_REPO] : { colour: '#DA33FF', PRs: [], amplify: true, pr_preview: 'https://test-pr-previews.dk2lbhfysm2ic.amplifyapp.com/' },
	[process.env.ADMIN_REPO] : { colour: '#9333FF', PRs: [], amplify: true, pr_preview: 'https://test.d1itkb6pz56lpp.amplifyapp.com/' },
	[process.env.ANNOTATOR_REPO] : { colour: '#FF0000', PRs: [], amplify: false },
	[process.env.DATA_PIPE_REPO] : { colour: '#00FF00', PRs: [], amplify: false },
	[process.env.PROJECTS_REPO] : { colour: '#33FFF9', PRs: [], amplify: false },
	[process.env.PAYMENT_REPO] : { colour: '#FFA833', PRs: [], amplify: false },
	[process.env.PLAYGROUND_REPO] : { colour: '#E0FF33', PRs: [], amplify: false },
};


// ?-  Function to check if message is already present in the chat, if so don't upload another one
const checkIfPresent = async (channel, prURL) => {
	await channel.messages.fetch({ limit: 100 }).then((messages) => {
		messages.forEach((message) => {
			if (message.embeds.length === 0) {
				return false;
			}
			if (message.embeds[0].data.url === prURL) {
				return true;
			}
		});
	});
	return false;
};

const getAmplify = async (repo, prNum, prRewviewURL) => {
	let amplifyLink = '\`PR Link:\` ';
	const regex = /https:\/\/pr\-[^\s]+/;
	const responses = await octokit.request(`GET /repos/${repo}/issues/${prNum}/comments`, {
		owner: 'Supahands',
		repo: repo.slice('/'),
		pull_number: prNum,
	});
	for (const response of responses.data) {
		if (response.user.login === 'aws-amplify-us-west-2[bot]') {
			console.log('PR LINK:', response.body.match(regex)[0]);
			amplifyLink += await response.body.match(regex)[0];
			amplifyLink += `\n\n \`Test link to login first with:\` ${prRewviewURL}/`;
			amplifyLink += '\n\n@Zi Wei @geethekthek';
		}
	}

	return amplifyLink;
};
// ? - Modify this, to accept the repo name as well, to assign colours to it
const createEmbed = async (repo, pr, channel) => {

	if (await checkIfPresent(channel, pr.html_url)) {
		return;
	}

	const { number, title, commits } = pr;
	const { avatar_url, login } = pr.user;
	if (repoList[repo].amplify) {
		const amplifyFieldData = await getAmplify(repo, number, repoList[repo].pr_preview);
		const Embed = new EmbedBuilder()
			.setColor(repoList[repo].colour)
			.setTitle(`${number}: ${title}`)
			.setURL(pr.html_url)
			.setAuthor({ name: login, iconURL: null, url: pr.user.html_url })
			.setThumbnail(avatar_url)
			.addFields({
				name: 'Repo',
				value: `${repo}`,
			},
			{
				name: 'Amplify details',
				value: `${await amplifyFieldData}`,
			})
			.setDescription(
				`Merge ${commits} commits into \`${pr.base.ref}\` from \`${pr.head.ref}\` @everyone`,
			);
		channel.send({ embeds: [Embed] });
	}
	else {

		const Embed = new EmbedBuilder()
			.setColor(repoList[repo].colour)
			.setTitle(`${number}: ${title}`)
			.setURL(pr.html_url)
			.setAuthor({ name: login, iconURL: null, url: pr.user.html_url })
			.setThumbnail(avatar_url)
			.addFields({
				name: 'Repo',
				value: `${repo}`,
			})
			.setDescription(
				`Merge ${commits} commits into \`${pr.base.ref}\` from \`${pr.head.ref}\` @everyone`,
			);
		channel.send({ embeds: [Embed] });
	}
};

// ? - Search through all messages, compare embed url with arguement URL, then delete message if it's the same
const deleteMessage = async (channel, prURL) => {
	channel.messages.fetch({ limit: 100 }).then((messages) => {
		messages.forEach(async (message) => {
			if (message.embeds[0].url === prURL) {
				message.delete();
			}
		});
	});
};

// ? - Updates all the reactions on the embeds
const updateEmbed = async (channel, state, prURL) => {
	channel.messages.fetch({ limit: 100 }).then((messages) => {
		messages.forEach(async (message) => {
			// ? - Switch statement for different message types, reaction for each different type
			if (message.embeds[0].url === prURL) {
				console.log('Review left for', prURL, ': ', state);

				// ? - if action === submitted

				switch (state) {
				case 'APPROVED':
					await message.react('✅');
					break;
				case 'CHANGES_REQUESTED':
					await message.react('❌');
					break;
				case 'COMMENTED':
					await message.react('💬');
					break;
					// ! Haven't found a way to remove a specific reaction only once from a message, only remove all (https://discordjs.guide/popular-topics/reactions.html#removing-reactions)
				case 'dismissed':
					break;
				}

			}
		});
	});
};

// ? - Retrieves all PR data from each specified repo
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

	// ? - Update all repo objects with PR data
	await getAllPRs();

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
			if (prInChat === undefined && pr.draft === false) {
				await createEmbed(repoItem, pr, channel);
			}
		}
	}

	// ? - Go through channel and delete all irrelevant messages
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
			const prURL = messageEmbed.data.url;

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
				return;
			}

			// ? - Update the reactions on the messages
			const reviews = await octokit.request(`GET /repos/${repo}/pulls/${prNum}/reviews`, {
				owner: 'Supahands',
				repo: repo.slice('/')[1],
				pull_number: prNum,
			});

			for (const review of reviews.data) {
				const { state } = review;
				await updateEmbed(channel, state, prURL);
			}
		});
	});
};


app.post('/', async (req, res) => {
	if(req.body.repository === undefined){
		res.status(400).send('No repository specified');
		return
	}
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
		await deleteMessage(channel, pr.html_url);
		res.status(200).send('Deleted');
	}
	// ? - Updating review
	else if (action === 'submitted') {
		const reviewState = req.body.review.state.toUpperCase();
		await updateEmbed(channel, reviewState, pr.html_url);
		res.status(200).send(`Reacted: ${reviewState}`);
	}
	// ? - Updating comments
	else if (action === 'created') {
		const state = 'COMMENTED';
		await updateEmbed(channel, state, pr.html_url);
		res.status(200).send('Commented');
	}
	else {
		res.status(200).send('Recieved but not accepted, action is not currently supported.');
	}
});

if (process.env.ENVIRONMENT === 'production') {
	exports.handler = serverless(app);
}
else {
	app.listen(process.env.PORT || 3000, () => {
		console.log(`Listening on port ${process.env.PORT || 3000}`);
	});
}
// ? - Specify port for server to listen on

// ? - Listen for when bot is connected to Discord (i.e. logged in)
client.on('ready', () => {
	console.log(
		`Logged in as ${client.user ? client.user.tag : 'no user defined'}`,
	);
});

// ? - Proceed with connecting to Discord (login)
client.login(process.env.TOKEN);
