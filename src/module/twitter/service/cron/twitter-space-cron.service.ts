import { Inject, Injectable } from '@nestjs/common'
import axios from 'axios'
import { baseLogger } from '../../../../logger'
import { BaseCronService } from '../../../../shared/service/base-cron.service'
import { TwitterSpace } from '../../model/twitter-space.entity'
import { twitterSpacePlaylistLimiter } from '../../twitter.limiter'
import { TwitterSpaceControllerService } from '../controller/twitter-space-controller.service'
import { TwitterSpaceService } from '../data/twitter-space.service'

@Injectable()
export class TwitterSpaceCronService extends BaseCronService {
  protected readonly logger = baseLogger.child({ context: TwitterSpaceCronService.name })

  protected cronTime = '0 */1 * * * *'
  // protected cronRunOnInit = true

  constructor(
    @Inject(TwitterSpaceService)
    private readonly twitterSpaceService: TwitterSpaceService,
    @Inject(TwitterSpaceControllerService)
    private readonly twitterSpaceControllerService: TwitterSpaceControllerService,
  ) {
    super()
  }

  protected async onTick() {
    const spaces = await this.checkSpacesActive()
    await this.checkSpacesPlaylist(spaces)
  }

  private async checkSpacesActive() {
    this.logger.info('--> checkSpacesActive')
    let spaces: TwitterSpace[] = []
    try {
      const liveIds = await this.twitterSpaceService.getLiveSpaceIds()
      const limit = Math.max(0, 20 - liveIds.length)
      spaces = await this.twitterSpaceService.getManyForActiveCheck({ limit })
      this.logger.debug('checkSpacesActive', { spaceCount: spaces.length })
      await Promise.allSettled(spaces.map((space) => this.twitterSpaceControllerService.getOneById(space.id)))
    } catch (error) {
      this.logger.error(`checkSpacesActive: ${error.message}`)
    }
    this.logger.info('<-- checkSpacesActive')
    return spaces
  }

  private async checkSpacesPlaylist(spaces: TwitterSpace[]) {
    this.logger.info('--> checkSpacesPlaylist')
    try {
      const limiter = twitterSpacePlaylistLimiter
      // const spaces = await this.twitterSpaceService.getManyForPlaylistActiveCheck()
      this.logger.debug('checkSpacesPlaylist', { spaceCount: spaces.length })
      await Promise.allSettled(spaces.map((v) => limiter.schedule(() => this.checkSpacePlaylist(v))))
    } catch (error) {
      this.logger.error(`checkSpacesPlaylist: ${error.message}`)
    }
    this.logger.info('<-- checkSpacesPlaylist')
  }

  private async checkSpacePlaylist(space: TwitterSpace) {
    this.logger.debug('--> checkSpacePlaylist', { id: space.id })
    try {
      await axios.head(space.playlistUrl)
      await this.updateSpacePlaylistActive(space.id, true)
    } catch (error) {
      if ([400, 401].includes(error.response?.status)) {
        await this.updateSpacePlaylistActive(space.id, false)
        return
      }
      this.logger.error(`checkSpacePlaylist: ${error.message}`, { id: space.id, playlistUrl: space.playlistUrl })
    }
    this.logger.debug('<-- checkSpacePlaylist', { id: space.id })
  }

  private async updateSpacePlaylistActive(id: string, playlistActive: boolean) {
    this.logger.debug('updateSpacePlaylistActive', { id, playlistActive })
    try {
      await this.twitterSpaceService.updateFields(id, { playlistActive })
    } catch (error) {
      this.logger.error(`updateSpacePlaylistActive: ${error.message}`, { id })
    }
  }
}
