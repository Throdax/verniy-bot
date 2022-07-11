import { SlashCommandBuilder } from '@discordjs/builders'
import { Inject, Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import { CommandInteraction } from 'discord.js'
import { baseLogger } from '../../../../logger'
import { TrackType } from '../../../track/enums/track-type.enum'
import { BaseCommand } from '../base/base.command'
import { TrackAddInstagramPostCommand } from './track-add/track-add-instagram-post.command'
import { TrackAddInstagramProfileCommand } from './track-add/track-add-instagram-profile.command'
import { TrackAddInstagramStoryCommand } from './track-add/track-add-instagram-story.command'
import { TrackAddTiktokVideoCommand } from './track-add/track-add-tiktok-video.command'
import { TrackAddTwitCastingLiveCommand } from './track-add/track-add-twitcasting-live.command'
import { TrackAddTwitchChatCommand } from './track-add/track-add-twitch-chat.command'
import { TrackAddTwitchLiveCommand } from './track-add/track-add-twitch-live.command'
import { TrackAddTwitterProfileCommand } from './track-add/track-add-twitter-profile.command'
import { TrackAddTwitterSpaceCommand } from './track-add/track-add-twitter-space.command'
import { TrackAddTwitterTweetCommand } from './track-add/track-add-twitter-tweet.command'
import { TrackAddYoutubeLiveCommand } from './track-add/track-add-youtube-live.command'

@Injectable()
export class TrackAddCommand extends BaseCommand {
  public static readonly command = new SlashCommandBuilder()
    .setName('track_add')
    .setDescription('Add or update tracking')
    //
    .addSubcommand((subcommand) => subcommand
      .setName(TrackType.TWITTER_TWEET)
      .setDescription('Track user tweets')
      .addStringOption((option) => option
        .setName('username')
        .setDescription('Twitter username, e.g. "nakiriayame"')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message'))
      .addBooleanOption((option) => option
        .setName('allow_reply')
        .setDescription('Allow reply?'))
      .addBooleanOption((option) => option
        .setName('allow_retweet')
        .setDescription('Allow retweet?')))
    //
    .addSubcommand((subcommand) => subcommand
      .setName(TrackType.TWITTER_PROFILE)
      .setDescription('Track user profile changes')
      .addStringOption((option) => option
        .setName('username')
        .setDescription('Twitter username, e.g. "nakiriayame"')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message')))
    //
    .addSubcommand((subcommand) => subcommand
      .setName(TrackType.TWITTER_SPACE)
      .setDescription('Track Spaces from user')
      .addStringOption((option) => option
        .setName('username')
        .setDescription('Twitter username, e.g. "nakiriayame"')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message')))
    //
    .addSubcommand((subcommand) => subcommand
      .setName(TrackType.TWITCASTING_LIVE)
      .setDescription('Track user live')
      .addStringOption((option) => option
        .setName('username')
        .setDescription('TwitCasting user, e.g. "nakiriayame"')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message')))
    //
    .addSubcommand((subcommand) => subcommand
      .setName(TrackType.YOUTUBE_LIVE)
      .setDescription('Track user live')
      .addStringOption((option) => option
        .setName('channel_id')
        .setDescription('YouTube channel id')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message')))
    //
    .addSubcommand((subcommand) => subcommand
      .setName(TrackType.TWITCH_LIVE)
      .setDescription('Track user live')
      .addStringOption((option) => option
        .setName('username')
        .setDescription('Twitch user, e.g. "nakiriayame_hololive"')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message')))
    //
    .addSubcommand((subcommand) => subcommand
      .setName(TrackType.TWITCH_CHAT)
      .setDescription('Track user chat')
      .addStringOption((option) => option
        .setName('username')
        .setDescription('Twitch user, e.g. "nakiriayame_hololive"')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message')))
    //
    .addSubcommand((subcommand) => subcommand
      .setName(TrackType.INSTAGRAM_POST)
      .setDescription('Track user posts')
      .addStringOption((option) => option
        .setName('username')
        .setDescription('Instagram user')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message')))
    //
    .addSubcommand((subcommand) => subcommand
      .setName(TrackType.INSTAGRAM_STORY)
      .setDescription('Track user stories')
      .addStringOption((option) => option
        .setName('username')
        .setDescription('Instagram user')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message')))
    //
    // .addSubcommand((subcommand) => subcommand
    //   .setName(TrackType.INSTAGRAM_PROFILE)
    //   .setDescription('Track user profile')
    //   .addStringOption((option) => option
    //     .setName('username')
    //     .setDescription('Instagram user')
    //     .setRequired(true))
    //   .addStringOption((option) => option.setName('message').setDescription('Discord message')))
    //
    .addSubcommand((subcommand) => subcommand
      .setName(TrackType.TIKTOK_VIDEO)
      .setDescription('Track user videos')
      .addStringOption((option) => option
        .setName('username')
        .setDescription('TikTok user, e.g. "hololive_english"')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message')))

  private readonly logger = baseLogger.child({ context: TrackAddCommand.name })

  constructor(
    @Inject(ModuleRef)
    private readonly moduleRef: ModuleRef,
  ) {
    super()
  }

  public async execute(interaction: CommandInteraction) {
    if (interaction.guild) {
      const member = await interaction.guild.members.fetch(interaction.user.id)
      if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        await this.replyMissingPermission(interaction, 'MANAGE_MESSAGES')
        return
      }
    }

    const subcommand = interaction.options.getSubcommand()
    const instance = this.moduleRef.get(this.getCommandService(subcommand))
    await instance?.execute?.(interaction)
  }

  private getCommandService(subcommand: string) {
    this.logger.debug(`getCommandService: ${subcommand}`)
    const instance = {
      [TrackType.TWITTER_TWEET]: TrackAddTwitterTweetCommand,
      [TrackType.TWITTER_PROFILE]: TrackAddTwitterProfileCommand,
      [TrackType.TWITTER_SPACE]: TrackAddTwitterSpaceCommand,
      [TrackType.TWITCASTING_LIVE]: TrackAddTwitCastingLiveCommand,
      [TrackType.YOUTUBE_LIVE]: TrackAddYoutubeLiveCommand,
      [TrackType.TWITCH_LIVE]: TrackAddTwitchLiveCommand,
      [TrackType.TWITCH_CHAT]: TrackAddTwitchChatCommand,
      [TrackType.INSTAGRAM_POST]: TrackAddInstagramPostCommand,
      [TrackType.INSTAGRAM_STORY]: TrackAddInstagramStoryCommand,
      [TrackType.INSTAGRAM_PROFILE]: TrackAddInstagramProfileCommand,
      [TrackType.TIKTOK_VIDEO]: TrackAddTiktokVideoCommand,
    }[subcommand] || null
    return instance
  }
}
