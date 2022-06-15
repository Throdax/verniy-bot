import { Inject, Injectable } from '@nestjs/common'
import { baseLogger } from '../../../../../logger'
import { TrackTwitCastingLiveService } from '../../../../track/services/track-twitcasting-live.service'
import { TwitCastingUser } from '../../../../twitcasting/models/twitcasting-user.entity'
import { TwitCastingUserControllerService } from '../../../../twitcasting/services/controller/twitcasting-user-controller.service'
import { TwitCastingUtils } from '../../../../twitcasting/utils/twitcasting.utils'
import { TrackAddBaseSubcommand } from '../base/track-add-base-subcommand'

@Injectable()
export class TrackAddTwitCastingLiveCommand extends TrackAddBaseSubcommand {
  logger = baseLogger.child({ context: TrackAddTwitCastingLiveCommand.name })

  constructor(
    @Inject(TrackTwitCastingLiveService)
    protected readonly trackService: TrackTwitCastingLiveService,
    @Inject(TwitCastingUserControllerService)
    private readonly twitCastingUserControllerService: TwitCastingUserControllerService,
  ) {
    super()
  }

  protected async getUser(username: string): Promise<TwitCastingUser> {
    const user = await this.twitCastingUserControllerService.getOneAndSaveById(username)
    return user
  }

  // eslint-disable-next-line class-methods-use-this
  protected getSuccessEmbedDescription(user: TwitCastingUser): string {
    return `Tracking **[${user.screenId}](${TwitCastingUtils.getUserUrl(user.screenId)})** TwitCasting`
  }
}