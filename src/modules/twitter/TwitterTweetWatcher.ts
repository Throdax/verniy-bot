import EventEmitter from 'events'
import Twit from 'twit'
import winston from 'winston'
import { logger as baseLogger } from '../../logger'
import { twitterUserController } from '../database/controllers/TwitterUserController'

export class TwitterTweetWatcher extends EventEmitter {
  private logger: winston.Logger
  private stream: Twit.Stream

  constructor(private twit: Twit) {
    super()
    this.logger = baseLogger.child({ label: '[TwitterTweetWatcher]' })
    this.twit = twit
  }

  public async watch() {
    const users = await twitterUserController.getAll()
    this.logger.info(`User count: ${users?.length || 0}`)
    if (!users?.length) {
      return
    }

    this.logger.info('Watching...')
    this.logger.info('Users', { userCount: users.length, usernames: users.map((v) => v.username) })
    const userIds = users.map((v) => v.id)
    const streamPath = 'statuses/filter'
    const streamParams = { follow: userIds.join(',') }
    this.logger.debug(`Stream path: ${streamPath}`)
    this.logger.debug(`Stream pararms: ${JSON.stringify(streamParams)}`)
    const stream = this.twit.stream(streamPath, streamParams)
    this.stream = stream

    stream.on('error', (error) => this.logger.error(error.message))
    stream.on('warning', (message) => this.logger.warn(`Warning: ${message}`))
    stream.on('limit', (message) => this.logger.warn(`Limit: ${message}`))
    stream.on('connect', () => this.logger.info('Connecting...'))
    stream.on('connected', () => this.logger.info('Connected!'))
    stream.on('disconnect', (message) => this.logger.warn(`Disconnect: ${message}`))
    stream.on('reconnect', (req, res, connectInterval) => this.logger.info(`Reconnect in ${connectInterval}ms`))
    stream.on('tweet', (tweet) => this.emit('tweet', tweet))
  }
}