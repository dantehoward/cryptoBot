// These 2 lines of code are copied from Stack Overflow because of a v13 change
const {
  Client,
  Intents,
  DiscordAPIError
} = require('discord.js');
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

const prefix = '!';
var tickerSymbols = []; // The symbols of all available crypto tickers

var https = require('https');
const fs = require('fs');
const Discord = require('discord.js');
client.commands = new Discord.Collection();

// Creates a list of commands from command files
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  client.commands.set(command.name, command);
}

client.once('ready', () => {
  console.log('Crypto Bot is online!');

  // Upon initialization the json file is read to get the ticker symbols
  fs.readFile('tickerSymbols.json', 'utf8', function (err, json_string) {
    if (err) {
      console.log(err.message);
    } else {
      json_string = json_string.toLowerCase();
      tickerSymbols = JSON.parse(json_string);
    }
  });
});

client.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // Parses the message into an array of arguments
  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'ping') {
    //client.commands.get('ping').execute(message, args);
    message.channel.send('pong');
  } else if (tickerSymbols.includes(command)) {
    makeCryptonatorRequest(command, message)
  } else {
    message.channel.send('Couldn\'t find a crypto ticker with symbol \"' + command + '\"!');
  }
});

function makeCryptonatorRequest(tickerSymbol, message) {
  var options = {
    host: 'api.cryptonator.com',
    path: '/api/ticker/' + tickerSymbol + '-usd'
  }

  var req = https.request(options, function callback(response) {
    var str = '';
    // Appends the received data to a string
    response.on('data', function (chunk) {
      str += chunk;
    });

    response.on('end', function () {
      data = JSON.parse(str); // turning the string into a json object

      if (data.success) { // If the url is successful

        // Cryptos differ by the magnitude of their price, so we use sig figs
        var tickerPrice = data.ticker.price;
        tickerPrice = Number.parseFloat(tickerPrice).toPrecision(7);

        var messageStr = `Price of ${data.ticker.base}: $${tickerPrice}`;
        message.channel.send(messageStr);

      } else {
        console.log('The request was unsuccessful');
      }
    });
  }).end();

};

fs.readFile('token.txt', 'utf8', function (err, token) {
  if (err) {
    console.log(err);
  } else {
    client.login(token); // Last line of file
  }
});