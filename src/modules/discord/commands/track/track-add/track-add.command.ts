import { SlashCommandBuilder } from '@discordjs/builders'
import { Inject, Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import { CommandInteraction } from 'discord.js'
import { baseLogger } from '../../../../../logger'
import { BaseCommand } from '../../base/base.command'
import { TrackType } from '../track-type.enum'
import { TrackAddTiktokVideoCommand } from './track-add-tiktok-video.command'
import { TrackAddTwitCastingLiveCommand } from './track-add-twitcasting-live.command'
import { TrackAddTwitchUserStreamCommand } from './track-add-twitch-user-stream.command'
import { TrackAddTwitterProfileCommand } from './track-add-twitter-profile.command'
import { TrackAddTwitterSpaceCommand } from './track-add-twitter-space.command'
import { TrackAddTwitterTweetCommand } from './track-add-twitter-tweet.command'

@Injectable()
export class TrackAddCommand extends BaseCommand {
  public static readonly command = new SlashCommandBuilder()
    .setName('track_add')
    .setDescription('Add tracking')
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
      .setName(TrackType.TWITCH_USER_STREAM)
      .setDescription('Track user live')
      .addStringOption((option) => option
        .setName('username')
        .setDescription('Twitch user, e.g. "nakiriayame_hololive"')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message')))
    //
    .addSubcommand((subcommand) => subcommand
      .setName(TrackType.TIKTOK_VIDEO)
      .setDescription('Track user video')
      .addStringOption((option) => option
        .setName('username')
        .setDescription('TikTok user, e.g. "hololive_english"')
        .setRequired(true))
      .addStringOption((option) => option.setName('message').setDescription('Discord message')))

  private readonly logger = baseLogger.child({ context: TrackAddCommand.name })

  constructor(
    @Inject(ModuleRef)
    private moduleRef: ModuleRef,
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
    switch (subcommand) {
      case TrackType.TWITTER_TWEET:
        return TrackAddTwitterTweetCommand
      case TrackType.TWITTER_PROFILE:
        return TrackAddTwitterProfileCommand
      case TrackType.TWITTER_SPACE:
        return TrackAddTwitterSpaceCommand
      case TrackType.TWITCASTING_LIVE:
        return TrackAddTwitCastingLiveCommand
      case TrackType.TWITCH_USER_STREAM:
        return TrackAddTwitchUserStreamCommand
      case TrackType.TIKTOK_VIDEO:
        return TrackAddTiktokVideoCommand
      default:
        return null
    }
  }
}
