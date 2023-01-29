import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { baseLogger } from '../../../../logger'
import { ConfigService } from '../../../config/service/config.service'
import { DiscordService } from '../../../discord/service/discord.service'
import { TrackYoutubeLiveService } from '../../../track/service/track-youtube-live.service'
import { YoutubeApiService } from '../api/youtube-api.service'

@Injectable()
export class YoutubeLiveTrackingService {
  private readonly logger = baseLogger.child({ context: YoutubeLiveTrackingService.name })

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(TrackYoutubeLiveService)
    private readonly trackYoutubeLiveService: TrackYoutubeLiveService,
    @Inject(YoutubeApiService)
    private readonly youtubeApiService: YoutubeApiService,
    @Inject(forwardRef(() => DiscordService))
    private readonly discordService: DiscordService,
  ) { }

  public async start() {
    this.logger.info('Starting...')
  }
}