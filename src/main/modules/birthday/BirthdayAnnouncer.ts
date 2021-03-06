import log from 'loglevel';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { Storage } from '../../storage/Storage';
import {
    getBirthdayChannelId,
    getLastAnnouncedDate,
    getUserIdsWithBirthday,
    setLastAnnouncedDate,
} from './BirthdayDbUtil';

const MSEC_PER_MIN = 60 * 1000;
const ANNOUNCEMENT_TIME_IN_MIN = 24 * 60;

/**
 * Returns the number of milliseconds to the start of the next day (12am).
 */
function msecToNextDay(): number {
    const curDate = new Date();
    const curMin = curDate.getHours() * 60 + curDate.getMinutes();
    const remainingMin = ANNOUNCEMENT_TIME_IN_MIN - curMin;
    return remainingMin * MSEC_PER_MIN;
}

function getCurDate(): { day: number; month: number; year: number } {
    const curDate = new Date();
    return {
        day: curDate.getDate(),
        month: curDate.getMonth() + 1,
        year: curDate.getFullYear(),
    };
}

/**
 * Returns true if there is a need for an announcement now.
 */
function needsAnnouncementNow(serverId: string): boolean {
    const curDate = getCurDate();
    const lastAnnouncedDate = getLastAnnouncedDate(serverId);
    return (
        lastAnnouncedDate.day < curDate.day ||
        lastAnnouncedDate.month < curDate.month ||
        lastAnnouncedDate.year < curDate.year
    );
}

export class BirthdayAnnouncer {
    bot: Client;

    storage: Storage;

    serverIds: string[];

    constructor(bot: Client, storage: Storage) {
        this.bot = bot;
        this.storage = storage;
        this.serverIds = [];
    }

    start(): void {
        log.info('Announcing outstanding birthdays...');

        // Check all the guilds the bot is in.
        const { guilds } = this.bot;
        guilds.cache.forEach((guild) => {
            const { id } = guild;
            if (!this.storage.servers.has(id)) return;

            // Get server and settings.
            const server = this.storage.servers.get(id)!;
            if (server === undefined) return;
            this.serverIds.push(server.serverId);

            // Announce birthdays now if we haven't for the day.
            const announceNow = needsAnnouncementNow(server.serverId);
            if (announceNow) {
                this.announce(server.serverId);
            }
        });

        // Announce birthdays every 24 hours.
        setTimeout(this.announceAll.bind(this), msecToNextDay());
    }

    async announce(serverId: string): Promise<void> {
        // Get the birthday announcement channel.
        const channelId = getBirthdayChannelId(serverId);
        if (!channelId) return;
        const channel = await this.bot.channels.fetch(channelId);
        if (!channel || channel.type !== 'text') return;

        // Announce the birthdays for all users who were born on this day.
        const { day, month, year } = getCurDate();
        const userIds = getUserIdsWithBirthday(serverId, day, month);
        if (userIds.length > 0) {
            const embed = new MessageEmbed({
                title: `Wish a happy birthday to the birthday babies for ${day}/${month}!`,
                description: userIds
                    .map((userId) => `<@!${userId}>`)
                    .join('\n'),
            });
            await (channel as TextChannel).send(embed);
        }

        // Update last announced date.
        setLastAnnouncedDate(serverId, day, month, year);
    }

    /**
     * Announces to all registered servers and schedules the next announcement.
     */
    announceAll(): void {
        for (const serverId of this.serverIds) {
            this.announce(serverId);
        }
        setTimeout(this.announceAll.bind(this), msecToNextDay());
    }
}
