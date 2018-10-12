const { Command } = require('discord.js-commando')
const KC = require('../../settings').KanColle

const EquipmentType = {
    ALL: 'All',
    SG: 'Small gun',
    LG: 'Large gun',
    TP: 'Torpedo',
    AC: 'Aircraft',
    O: 'Other',
}

module.exports = class KCEquipmentBonusCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'bonus',
            aliases: ['bn', 'ebn', 'eq'],
            group: 'kc',
            memberName: 'bonus',
            description: [
                'Equipment bonus tables.',
                'Type must be:',
                Object.keys(EquipmentType)
                    .map(v => `**${v}**: ${EquipmentType[v]}`)
                    .join(', '),
            ].join(' '),
            args: [
                {
                    key: 'type',
                    prompt: `Equipment type must be: ${Object.keys(EquipmentType).join(', ')}`,
                    type: 'string',
                    wait: 10,
                    validate: ((val) => Object.keys(EquipmentType).includes(val.toUpperCase())),
                },
            ],
        })
    }

    async run(msg, args) {
        const message = this.getData(args.type)
        return msg.say(message)
    }

    getData(type) {
        switch (type.toUpperCase()) {
            case 'ALL':
                return KC.Bonus.All
            case 'SG':
                return KC.Bonus.SmallGun
            case 'LG':
                return KC.Bonus.LargeGun
            case 'TP':
                return KC.Bonus.Torpedo
            case 'AC':
                return KC.Bonus.Aircraft
            case 'O':
                return KC.Bonus.Other
        }
        return 'Invalid equipment type'
    }
}