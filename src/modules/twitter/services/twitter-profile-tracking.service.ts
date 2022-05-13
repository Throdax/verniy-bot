import { bold, hideLinkEmbed, inlineCode } from '@discordjs/builders'
import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { MessageOptions } from 'discord.js'
import { UserV1 } from 'twitter-api-v2'
import { logger as baseLogger } from '../../../logger'
import { Utils } from '../../../utils/Utils'
import { ConfigService } from '../../config/services/config.service'
import { TwitterUser } from '../../database/models/twitter-user.entity'
import { TrackTwitterProfileService } from '../../database/services/track-twitter-profile.service'
import { TwitterUserService } from '../../database/services/twitter-user.service'
import { DiscordService } from '../../discord/services/discord.service'
import { TWITTER_API_LIST_SIZE } from '../constants/twitter.constant'
import { TwitterApiService } from './twitter-api.service'

@Injectable()
export class TwitterProfileTrackingService {
  private readonly logger = baseLogger.child({ context: TwitterProfileTrackingService.name })

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(TrackTwitterProfileService)
    private readonly trackTwitterProfileService: TrackTwitterProfileService,
    @Inject(TwitterUserService)
    private readonly twitterUserService: TwitterUserService,
    @Inject(TwitterApiService)
    private readonly twitterApiService: TwitterApiService,
    @Inject(forwardRef(() => DiscordService))
    private readonly discordService: DiscordService,
  ) { }

  public async start() {
    this.logger.info('Starting...')
    await this.execute()
  }

  private async execute() {
    try {
      const userIds = await this.trackTwitterProfileService.getTwitterUserIds()
      if (userIds.length) {
        const chunks = Utils.splitArrayIntoChunk(userIds, TWITTER_API_LIST_SIZE)
        await Promise.allSettled(chunks.map((v) => this.checkUsers(v)))
      }
    } catch (error) {
      this.logger.error(`execute: ${error.message}`)
    }

    const { interval } = this.configService.twitter.profile
    setTimeout(() => this.execute(), interval)
  }

  private async checkUsers(userIds: string[]) {
    try {
      const users = await this.twitterApiService.getUsersByUserIds(userIds)
      const inactiveUserIdSet = new Set(userIds)
      users.forEach((user) => {
        inactiveUserIdSet.delete(user.id_str)
        this.checkActiveUserProfile(user)
      })
      inactiveUserIdSet.forEach((id) => {
        this.checkInactiveUserProfile(id)
      })
    } catch (error) {
      this.logger.error(`checkUsers: ${error.message}`)
    }
  }

  private async checkInactiveUserProfile(id: string) {
    try {
      const oldUser = await this.twitterUserService.getOneById(id)
      const newUser = await this.twitterUserService.updateIsActive(id, false)
      await this.checkUserProfile(newUser, oldUser)
    } catch (error) {
      this.logger.error(`checkInactiveUserProfile: ${error.message}`, { id })
    }
  }

  private async checkActiveUserProfile(user: UserV1) {
    try {
      const oldUser = await this.twitterUserService.getOneById(user.id_str)
      const newUser = await this.twitterUserService.updateByTwitterUser(user)
      await this.checkUserProfile(newUser, oldUser)
    } catch (error) {
      this.logger.error(`checkActiveUserProfile: ${error.message}`, { id: user.id_str })
    }
  }

  private async checkUserProfile(newUser: TwitterUser, oldUser: TwitterUser) {
    if (!newUser || !oldUser) {
      return
    }
    try {
      const detectConditions = [
        newUser.isActive !== oldUser.isActive,
        newUser.username !== oldUser.username,
        newUser.name !== oldUser.name,
        newUser.location !== oldUser.location,
        newUser.description !== oldUser.description,
        newUser.protected !== oldUser.protected,
        newUser.verified !== oldUser.verified,
        newUser.profileImageUrl !== oldUser.profileImageUrl,
        newUser.profileBannerUrl !== oldUser.profileBannerUrl,
      ]
      const isProfileChanged = detectConditions.some((v) => v)
      if (!isProfileChanged) {
        return
      }

      this.logger.info(`User changed: ${oldUser.username}`)
      this.logger.debug('New user', newUser)
      this.logger.debug('Old user', oldUser)
      this.onProfileChange(newUser, oldUser)
    } catch (error) {
      this.logger.error(`checkUserProfile: ${error.message}`, { id: oldUser.id })
    }
  }

  private async onProfileChange(newUser: TwitterUser, oldUser: TwitterUser) {
    try {
      const channelIds = await this.getDiscordChannelIds(oldUser)
      if (!channelIds.length) {
        return
      }

      const baseContent = bold(inlineCode(`@${oldUser.username}`))
      const messageOptionsList: MessageOptions[] = []

      if (newUser.isActive !== oldUser.isActive) {
        try {
          this.logger.warn(`${oldUser.username} isActive: ${newUser.isActive ? '✅' : '❌'}`)
          messageOptionsList.push({
            content: [
              baseContent,
              `Active: ${newUser.isActive ? '✅' : '❌'}`,
            ].join('\n'),
          })
        } catch (error) {
          this.logger.error(`onProfileChange#isActive: ${error.message}`)
        }
      }

      if (newUser.username !== oldUser.username) {
        try {
          this.logger.warn(`${oldUser.username} username`, { to: newUser.username, from: oldUser.username })
          messageOptionsList.push({
            content: [
              `${baseContent}'s username changed`,
              `❌ ${inlineCode(oldUser.username)}`,
              `➡️ ${inlineCode(newUser.username)}`,
            ].join('\n'),
          })
        } catch (error) {
          this.logger.error(`onProfileChange#username: ${error.message}`)
        }
      }

      if (newUser.name !== oldUser.name) {
        try {
          this.logger.warn(`${oldUser.username} name`, { to: newUser.name, from: oldUser.name })
          messageOptionsList.push({
            content: [
              `${baseContent}'s name changed`,
              `❌ ${inlineCode(oldUser.name)}`,
              `➡️ ${inlineCode(newUser.name)}`,
            ].join('\n'),
          })
        } catch (error) {
          this.logger.error(`onProfileChange#name: ${error.message}`)
        }
      }

      if (newUser.location !== oldUser.location) {
        try {
          this.logger.warn(`${oldUser.username} location`, { to: newUser.location, from: oldUser.location })
          messageOptionsList.push({
            content: [
              `${baseContent}'s location changed`,
              `❌ ${inlineCode(oldUser.location)}`,
              `➡️ ${inlineCode(newUser.location)}`,
            ].join('\n'),
          })
        } catch (error) {
          this.logger.error(`onProfileChange#location: ${error.message}`)
        }
      }

      if (newUser.description !== oldUser.description) {
        try {
          this.logger.warn(`${oldUser.username} description`, { to: newUser.description, from: oldUser.description })
          messageOptionsList.push({
            content: [
              `${baseContent}'s description changed`,
              `❌ ${inlineCode(oldUser.description)}`,
              `➡️ ${inlineCode(newUser.description)}`,
            ].join('\n'),
          })
        } catch (error) {
          this.logger.error(`onProfileChange#description: ${error.message}`)
        }
      }

      if (newUser.protected !== oldUser.protected) {
        try {
          this.logger.warn(`${oldUser.username} protected: ${newUser.protected ? '✅' : '❌'}`)
          messageOptionsList.push({
            content: [
              baseContent,
              `Protected: ${newUser.protected ? '✅' : '❌'}`,
            ].join('\n'),
          })
        } catch (error) {
          this.logger.error(`onProfileChange#protected: ${error.message}`)
        }
      }

      if (newUser.verified !== oldUser.verified) {
        try {
          this.logger.warn(`${oldUser.username} verified: ${newUser.verified ? '✅' : '❌'}`)
          messageOptionsList.push({
            content: [
              baseContent,
              `Verified: ${newUser.verified ? '✅' : '❌'}`,
            ].join('\n'),
          })
        } catch (error) {
          this.logger.error(`onProfileChange#verified: ${error.message}`)
        }
      }

      if (newUser.profileImageUrl !== oldUser.profileImageUrl) {
        try {
          const newProfileImageUrl = newUser.profileImageUrl
          const oldProfileImageUrl = oldUser.profileImageUrl
          this.logger.warn(`${oldUser.username} profile image`, { to: newProfileImageUrl, from: oldProfileImageUrl })
          messageOptionsList.push({
            content: [
              `${baseContent}'s profile image changed`,
              `❌ ${hideLinkEmbed(oldUser.profileImageUrl)}`,
              `➡️ ${hideLinkEmbed(newUser.profileImageUrl)}`,
            ].join('\n'),
            files: [newProfileImageUrl],
          })
        } catch (error) {
          this.logger.error(`onProfileChange#profileImageUrl: ${error.message}`)
        }
      }

      if (newUser.profileBannerUrl !== oldUser.profileBannerUrl) {
        try {
          this.logger.warn(`${oldUser.username} profile banner`, { to: newUser.profileBannerUrl, from: oldUser.profileBannerUrl })
          const fileName = newUser.profileBannerUrl
            ? `${new URL(newUser.profileBannerUrl).pathname.split('/').reverse()[0]}.jpg`
            : null
          messageOptionsList.push({
            content: [
              `${baseContent}'s profile banner changed`,
              `❌ ${hideLinkEmbed(oldUser.profileBannerUrl)}`,
              `➡️ ${hideLinkEmbed(newUser.profileBannerUrl)}`,
            ].join('\n'),
            files: newUser.profileBannerUrl
              ? [{ attachment: newUser.profileBannerUrl, name: fileName }]
              : null,
          })
        } catch (error) {
          this.logger.error(`onProfileChange#profileBannerUrl: ${error.message}`)
        }
      }

      this.logger.info('Channels', { id: channelIds })
      channelIds.forEach((channelId) => {
        messageOptionsList.forEach((messageOptions) => {
          this.discordService.sendToChannel(channelId, messageOptions)
        })
      })
    } catch (error) {
      this.logger.error(`onProfileChange: ${error.message}`, { newUser, oldUser })
    }
  }

  private async getDiscordChannelIds(user: TwitterUser) {
    let channelIds = []
    try {
      const records = await this.trackTwitterProfileService.getManyByTwitterUserId(user.id)
      channelIds = records.map((v) => v.discordChannelId)
    } catch (error) {
      this.logger.error(`getDiscordChannelIds: ${error.message}`, { user })
    }
    return channelIds
  }
}