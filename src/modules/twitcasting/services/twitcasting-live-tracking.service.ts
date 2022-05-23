import { codeBlock } from '@discordjs/builders'
import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { logger as baseLogger } from '../../../logger'
import { ConfigService } from '../../config/services/config.service'
import { DiscordService } from '../../discord/services/discord.service'
import { TrackTwitCastingLiveService } from '../../track/services/track-twitcasting-live.service'
import { TwitCastingMovie } from '../models/twitcasting-movie.entity'
import { TwitCastingUser } from '../models/twitcasting-user.entity'
import { TwitCastingApiPublicService } from './twitcasting-api-public.service'
import { TwitCastingMovieService } from './twitcasting-movie.service'
import { TwitCastingUserService } from './twitcasting-user.service'

@Injectable()
export class TwitCastingLiveTrackingService {
  private readonly logger = baseLogger.child({ context: TwitCastingLiveTrackingService.name })

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(TrackTwitCastingLiveService)
    private readonly trackTwitCastingLiveService: TrackTwitCastingLiveService,
    @Inject(TwitCastingUserService)
    private readonly twitCastingUserService: TwitCastingUserService,
    @Inject(TwitCastingMovieService)
    private readonly twitCastingMovieService: TwitCastingMovieService,
    @Inject(TwitCastingApiPublicService)
    private readonly twitCastingApiPublicService: TwitCastingApiPublicService,
    @Inject(forwardRef(() => DiscordService))
    private readonly discordService: DiscordService,
  ) { }

  public async start() {
    this.logger.info('Starting...')
    await this.initUsers()
    await this.checkLive()
  }

  private async initUsers() {
    try {
      const userIds = await this.trackTwitCastingLiveService.getIdsForInitUsers()
      if (!userIds.length) {
        return
      }
      await Promise.allSettled(userIds.map((v) => this.twitCastingUserService.getOneAndSaveById(v)))
    } catch (error) {
      this.logger.error(`initUsers: ${error.message}`)
    }
  }

  private async checkLive() {
    try {
      const users = await this.trackTwitCastingLiveService.getUsersForLiveCheck()
      await Promise.allSettled(users.map((v) => this.checkUserLive(v)))
    } catch (error) {
      this.logger.error(`checkLive: ${error.message}`)
    }

    const { interval } = this.configService.twitcasting
    setTimeout(() => this.checkLive(), interval)
  }

  private async checkUserLive(user: TwitCastingUser) {
    try {
      const response = await this.twitCastingApiPublicService.getStreamServer(user.screenId)
      const live = response?.movie?.live
      const id = response?.movie?.id
      if (!live) {
        return
      }
      await this.checkMovieById(id)
    } catch (error) {
      this.logger.error(`checkUserLive: ${error.message}`, { user: { id: user.id, screenId: user.screenId } })
    }
  }

  private async checkMovieById(id: string) {
    try {
      const oldMovie = await this.twitCastingMovieService.getOneById(id)
      const newMovie = await this.twitCastingMovieService.getOneAndSaveById(id)
      if (oldMovie?.isLive === newMovie?.isLive) {
        return
      }
      if (!oldMovie?.id) {
        this.logger.warn(`checkMovieById: Found new movie @${newMovie.user?.screenId || newMovie.userId} >> ${id}`, { movie: newMovie })
        await this.broadcastNewMovie(newMovie)
      }
    } catch (error) {
      this.logger.error(`checkMovieById: ${error.message}`, { id })
    }
  }

  private async broadcastNewMovie(movie: TwitCastingMovie) {
    try {
      const trackItems = await this.getTrackItems(movie)
      if (!trackItems.length) {
        return
      }
      trackItems.forEach((trackItem) => {
        // TODO: Update message content/embed
        const content = [
          trackItem.discordMessage,
          codeBlock('json', JSON.stringify(movie, null, 2)),
        ]
          .filter((v) => v)
          .join('\n')
        this.discordService.sendToChannel(trackItem.discordChannelId, { content })
      })
    } catch (error) {
      this.logger.error(`broadcastNewMovie: ${error.message}`, { movie })
    }
  }

  private async getTrackItems(movie: TwitCastingMovie) {
    try {
      const items = await this.trackTwitCastingLiveService.getManyByTwitCastingUserId(movie.userId)
      return items
    } catch (error) {
      this.logger.error(`getTrackItems: ${error.message}`, { movie })
    }
    return []
  }
}
