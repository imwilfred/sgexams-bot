import { Permissions, MessageEmbed } from 'discord.js';
import { Command } from '../Command';
import { CommandResult } from '../classes/CommandResult';
import { CommandArgs } from '../classes/CommandArgs';

export class MsgCheckerSetDeleteMessageCommand extends Command {
    public static INCORRECT_FORMAT = 'Incorrect format. Use only "true" or "false".'

    public static EMBED_TITLE = 'Message Checker Delete Message';

    public static BOOL_CANNOT_BE_UNDEFINED = 'Boolean should not be undefined!';

    /** CheckMessage: true */
    private COMMAND_SUCCESSFUL_COMMANDRESULT: CommandResult = new CommandResult(true);

    /** CheckMessage: true */
    private COMMAND_UNSUCCESSFUL_COMMANDRESULT: CommandResult = new CommandResult(true);

    private permissions = new Permissions(['KICK_MEMBERS', 'BAN_MEMBERS']);

    private args: string[];

    public constructor(args: string[]) {
        super();
        this.args = args;
    }

    /**
     * This function executes the setdeletemessage command
     * Sets the delete message boolean for the server.
     *
     * @param { CommandArgs } commandArgs
     * @returns CommandResult
     */
    public async execute(commandArgs: CommandArgs): Promise<CommandResult> {
        const { server, memberPerms, messageReply } = commandArgs;

        // Check for permissions first
        if (!this.hasPermissions(this.permissions, memberPerms)) {
            this.sendNoPermissionsMessage(messageReply);
            return this.NO_PERMISSIONS_COMMANDRESULT;
        }

        // Execute
        if (this.args.length === 0) {
            messageReply(this.generateNoArgsEmbed());
            return this.COMMAND_UNSUCCESSFUL_COMMANDRESULT;
        }

        const boolStr = this.args[0].toLowerCase();
        const trueFalseRegex = new RegExp(/\btrue\b|\bfalse\b/, 'g');
        if (!trueFalseRegex.test(boolStr)) {
            messageReply(this.generateWrongFormatEmbed());
            return this.COMMAND_UNSUCCESSFUL_COMMANDRESULT;
        }

        let bool: boolean;
        if (boolStr === 'true') {
            bool = true;
        }

        if (boolStr === 'false') {
            bool = false;
        }

        server.messageCheckerSettings.setDeleteMessage({
            serverId: server.serverId,
            bool: bool!,
        });
        messageReply(this.generateValidEmbed(bool!));
        return this.COMMAND_SUCCESSFUL_COMMANDRESULT;
    }

    /**
     * Generate valid embed
     *
     * @param  {boolean} bool
     * @returns RichEmbed
     */
    // eslint-disable-next-line class-methods-use-this
    private generateValidEmbed(bool: boolean): MessageEmbed {
        const embed = new MessageEmbed();
        const msg = `Delete Message set to: **${bool ? 'TRUE' : 'FALSE'}**`;
        embed.setColor(Command.EMBED_DEFAULT_COLOUR);
        embed.addField(MsgCheckerSetDeleteMessageCommand.EMBED_TITLE, msg);

        return embed;
    }

    /**
     * Generate no args embed
     *
     * @returns RichEmbed
     */
    // eslint-disable-next-line class-methods-use-this
    private generateNoArgsEmbed(): MessageEmbed {
        const embed = new MessageEmbed();
        embed.setColor(Command.EMBED_ERROR_COLOUR);
        embed.addField(MsgCheckerSetDeleteMessageCommand.EMBED_TITLE,
                       MsgCheckerSetDeleteMessageCommand.NO_ARGUMENTS);

        return embed;
    }

    /**
     * Generate wrong format embed
     *
     * @returns RichEmbed
     */
    // eslint-disable-next-line class-methods-use-this
    private generateWrongFormatEmbed(): MessageEmbed {
        const embed = new MessageEmbed();
        embed.setColor(Command.EMBED_ERROR_COLOUR);
        embed.addField(MsgCheckerSetDeleteMessageCommand.EMBED_TITLE,
                       MsgCheckerSetDeleteMessageCommand.INCORRECT_FORMAT);

        return embed;
    }
}
