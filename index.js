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

let nombreDeJoursModif = null; 
let WELCOME_CHANNEL_ID = null;

client.once("ready", () => {
    console.log(`${client.user.tag} est en ligne`);
});

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    // SET WELCOME
    if (message.content.startsWith("!setwelcome")) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("Tu n'as pas la permission.");
        }

        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply("Mentionne un salon. Exemple : !setwelcome #bienvenue");
        }

        WELCOME_CHANNEL_ID = channel.id;
        return message.reply(`Salon défini : ${channel.name}`);
    }

    // DISABLE
    if (message.content.startsWith("!setdisablegetout")) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("Tu n'as pas la permission.");
        }

        WELCOME_CHANNEL_ID = null;
        return message.reply("Désactivé.");
    }

    // SET DAYS
    if (message.content.startsWith("!setdaygetout")) {

        if (!message.member.permissions.has("Administrator")) {
            return message.reply("Tu n'as pas la permission.");
        }

        const args = message.content.split(" ");
        const days = parseInt(args[1]);

        if (isNaN(days) || days < 0) {
            return message.reply("Nombre invalide. Exemple : !setdaygetout 30");
        }

        nombreDeJoursModif = days; // OK maintenant
        return message.reply(`Jours modifiés : ${days}`);
    }
});

client.on("guildMemberAdd", async (member) => {

    try {
        const ageDays =
            (Date.now() - member.user.createdTimestamp) /
            (1000 * 60 * 60 * 24);

        const limit = nombreDeJoursModif ?? MIN_DAYS;

        if (ageDays >= limit) return;
        if (!WELCOME_CHANNEL_ID) return;

        const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
        if (!channel) return;

        await channel.send(
            `Expulsion : ${member.user.tag} (${ageDays.toFixed(2)} jours)`
        );

        if (!member.kickable) {
            console.log("Kick impossible (permissions ou hiérarchie)");
            return;
        }

        await member.kick("Compte trop récent");

    } catch (err) {
        console.error("Erreur guildMemberAdd:", err);
    }
});

client.login(process.env.TOKEN);