const { Command } = require('discord.js-commando')
const KC = require('../../_data/settings').KanColle

module.exports = class KCDevCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'dev',
            group: 'kc',
            memberName: 'dev',
            description: '',
        })
    }

    async run(msg, args) {
        msg.channel.send(KC.Development)
    }
}