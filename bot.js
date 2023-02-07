const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const express = require('express');

const app = express();
// const fetch = require('node-fetch');
const btoa = require('btoa');
require('dotenv').config();


if (
	process.env.TOKEN === undefined
	|| process.env.GH_USER === undefined
	|| process.env.GH_AUTH === undefined
	|| process.env.REPO === undefined
	|| process.env.CHANNEL_ID === undefined
	|| process.env.PORT === undefined
) {
	console.error('ERROR: Invalid process.environmental variables');
	process.exit(1);
}

app.use(express.json());

app.get('/test', (req, res) => {
	res.send({
		hey: 'UwU hiiiii hehe',
		question: 'How did you get here??? very interesting...',
		cya: 'Hope you have a great day! <333',
	});
});

app.post('/', async (req, res) => {
	const channel = client.channels.cache.get(process.env.CHANNEL_ID);
	console.log("Req", req.body.repository.pulls_url);
	channel.messages.fetch({ limit: 100 }).then(messages => {
		console.log(`Received ${messages.size} messages`);
		// console.log('Msgs', messages);
		// Iterate through the messages here with the variable "messages".
		messages.forEach(message => {console.log("\n\nEMBEDS",message.embeds);});
	});
	if (req.body.repository.full_name != process.env.REPO) {
		res.status(400);
		res.send({ status: 400, error: 'Invalid repo' });
		return;
	}
	const pr = req.body.pull_request;
	const commits = await fetch(pr.commits_url, {
		method: 'GET',
		headers: {
			Authorization: `Basic ${btoa(`${process.env.GH_USER}:${process.env.GH_AUTH}`)}`,
		},
	}).then((data) => data.json());
	const embed = new EmbedBuilder()
		.setColor('#00CD2D')
		.setTitle(`${pr.number}: ${pr.title}`)
		.setURL(pr.html_url)
		.setAuthor({ name: pr.user.login, iconURL: null, url: pr.user.html_url })
		.setThumbnail(pr.user.avatar_url)
		.setDescription(
			`Merge ${pr.commits} commits into \`${pr.base.ref}\` from \`${pr.head.ref}\``,
		);
	try {
		commits.forEach((c) => {
			embed.addFields({ name: c.sha.substring(0, 7), value: c.commit.message });
		});
	}
	catch (error) {
		console.error(error);
		res.status(400);
		res.send({ status: 400, error: 'Could not get commits' });
		return;
	}

	channel.send({ embeds: [embed] });
	res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => {
	console.log(`Listening on port ${process.env.PORT || 3000}`);
});
// Listen for when bot is connected to Discord (i.e. logged in)
client.on('ready', () => {
	console.log(`Logged in as ${client.user ? client.user.tag : 'no user defined'}`);
});

// Proceed with connecting to Discord (login)
client.login(process.env.TOKEN);

