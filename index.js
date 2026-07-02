require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// CONFIG
const MIN_DAYS = parseInt(process.env.MIN_ACCOUNT_AGE_DAYS || "7");

let WELCOME_CHANNEL_ID = null;

// FIX ICI
client.once("ready", () => {
    console.log(`${client.user.tag} est en ligne`);
});

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    if (message.content.startsWith("!setwelcome")) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("Tu n'as pas la permission d'utiliser cette commande.");
        }

        const channel = message.mentions.channels.first();

        if (!channel) {
            return message.reply("Mentionne un salon. Exemple : !setwelcome #bienvenue");
        }

        WELCOME_CHANNEL_ID = channel.id;

        return message.reply(`Salon de bienvenue défini sur : ${channel.name}`);
    }
});

client.on("guildMemberAdd", async (member) => {

    try {
        const ageDays =
            (Date.now() - member.user.createdTimestamp) /
            (1000 * 60 * 60 * 24);

        if (ageDays >= MIN_DAYS) return;

        if (!WELCOME_CHANNEL_ID) return;

        const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
        if (!channel) return;

        await channel.send(
            `Expulsion : ${member.user.tag} (${ageDays.toFixed(2)} jours)`
        );

        if (!member.kickable) return;

        await member.kick(`Compte trop récent`);

    } catch (err) {
        console.error(err);
    }
});

client.login(process.env.TOKEN);