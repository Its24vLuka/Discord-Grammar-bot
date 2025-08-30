const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('ready', () => {
  console.log(`Reginald is ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // Ignore bot messages and commands
  if (message.author.bot || message.content.startsWith('!')) return;
  
  try {
    const response = await fetch('https://ynhbuis9glth1iwfhgnmnmksc7xz29-00rw-u0cfql0y--50415--96435430.local-credentialless.webcontainer-api.io/discord/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message.content,
        author: { id: message.author.id, bot: false },
        channel_id: message.channel.id,
        guild_id: message.guild?.id,
      }),
    });
    
    const data = await response.json();
    
    if (data.correction) {
      await message.reply(data.correction);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

client.login('MTQxMTE2Njg1MzM5NjY5NzEzMA.GRM8A_.1xNvWixTIhB-izVELw1accEq3ti_C8mtcgCwsc');