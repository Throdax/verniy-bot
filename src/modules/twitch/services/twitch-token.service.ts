import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { logger as baseLogger } from '../../../logger'
import { twitchAccessTokenLimiter } from '../twitch.limiter'
import { TwitchApiService } from './api/twitch-api.service'

@Injectable()
export class TwitchTokenService {
  private readonly logger = baseLogger.child({ context: TwitchTokenService.name })

  private accessToken: string
  private accessTokenExpireAt: number

  constructor(
    @Inject(forwardRef(() => TwitchApiService))
    private readonly twitchApiService: TwitchApiService,
  ) { }

  public async getAccessToken() {
    const token = await twitchAccessTokenLimiter.schedule(async () => {
      if (!this.accessToken || Date.now() >= this.accessTokenExpireAt) {
        this.logger.debug('--> getAccessToken')
        const data = await this.twitchApiService.getAccessToken()
        this.accessToken = data.access_token
        this.accessTokenExpireAt = Date.now() + (data.expires_in - 300) * 1000
        this.logger.debug('<-- getAccessToken')
      }
      return Promise.resolve(this.accessToken)
    })
    return token
  }
}
