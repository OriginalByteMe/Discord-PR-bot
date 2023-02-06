// Importing Client and Intents class from Harmony
import { Client, Intents, Embed, load, ChannelsManager  } from './deps.ts'
import express from "npm:express@4.18.2";

const app = express();
const env = await load();
// Creating client (or bot!)
const client = new Client()

if (
	env['TOKEN'] == undefined ||
  env['GH_USER'] == undefined ||
  env['GH_AUTH'] == undefined ||
  env['REPO'] == undefined ||
  env['CHANNEL_ID'] == undefined ||
  env['PORT'] == undefined
) {
	console.error('ERROR: Invalid environmental variables');
	Deno.exit(5);
}

app.use(express.json());

app.get('/test', function(req, res) {
	res.send({
		hey: 'UwU hiiiii hehe',
		question: 'How did you get here??? very interesting...',
		cya: 'Hope you have a great day! <333',
	});
});

app.post('/', async function(req, res) {
  const channelsManager = new ChannelsManager(client)
	if (req.body.repository.full_name != env['REPO']) {
		res.status(400);
		res.send({ status: 400, error: 'Invalid repo' });
		return;
	}
	const pr = req.body.pull_request;
	const commits = await fetch(pr.commits_url, {
		method: 'GET',
		headers: {
			Authorization: 'Basic ' + btoa(`${env['GH_USER']}:${env['GH_AUTH']}`),
		},
	}).then((data) => data.json());
	const embed = new Embed()
		.setColor('#00CD2D')
		.setTitle(`${pr.number}: ${pr.title}`)
		.setURL(pr.html_url)
		.setAuthor(pr.user.login, pr.user.avatar_url)
		.setThumbnail(pr.user.avatar_url)
		.setDescription(
			`Merge ${pr.commits} commits into \`${pr.base.ref}\` from \`${pr.head.ref}\``,
		);
	try {
		commits.forEach((c) => {
			embed.addField(c.sha.substring(0, 7), c.commit.message);
		});
	}
	catch (error) {
		console.error(error);
		res.status(400);
		res.send({ status: 400, error: 'Could not get commits' });
		return;
	}

	channelsManager.sendMessage(env['CHANNEL_ID'],embed);
	res.sendStatus(200);
});

app.listen(env['PORT'] || 3000, () => {
	console.log(`Listening on port ${env['PORT'] || 3000}`);
});
// Listen for when bot is connected to Discord (i.e. logged in)
client.on('ready', () => {
  console.log(`Logged in as ${client.user ? client.user.tag : "no user defined"}`);
})

// Proceed with connecting to Discord (login)
client.connect(env['TOKEN'], Intents.None)