import { Column, Entity, Index } from 'typeorm'
import { DB_CURRENT_TIMESTAMP } from '../../database/constant/database.constant'
import { BaseExternalEntity } from '../../database/model/base-external.entity'
import { SpaceState } from '../enum/twitter-space.enum'
import { TwitterUser } from './twitter-user.entity'

@Entity('twitter_space')
export class TwitterSpace extends BaseExternalEntity {
  @Column({ name: 'updated_at', type: 'numeric', default: () => DB_CURRENT_TIMESTAMP })
  updatedAt?: number

  @Column({ name: 'creator_id', type: 'text' })
  creatorId: string

  @Index()
  @Column({ name: 'state', type: 'text', default: SpaceState.LIVE })
  state: SpaceState

  @Column({ name: 'is_ticketed', type: 'boolean', default: false })
  isTicketed?: boolean

  @Column({ name: 'scheduled_start', type: 'numeric', nullable: true })
  scheduledStart?: number

  @Column({ name: 'started_at', type: 'numeric', nullable: true })
  startedAt?: number

  @Column({ name: 'ended_at', type: 'numeric', nullable: true })
  endedAt?: number

  @Column({ name: 'lang', type: 'text', nullable: true })
  lang?: string

  @Column({ name: 'title', type: 'text', nullable: true })
  title?: string

  @Column({
    name: 'host_ids',
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: string[]) => (Array.isArray(value) ? JSON.stringify(value) : null),
      from: (value: string) => JSON.parse(value),
    },
  })
  hostIds?: string[]

  @Column({
    name: 'speaker_ids',
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: string[]) => (Array.isArray(value) ? JSON.stringify(value) : null),
      from: (value: string) => JSON.parse(value),
    },
  })
  speakerIds?: string[]

  @Column({ name: 'participant_count', type: 'numeric', nullable: true })
  participantCount?: number

  @Column({ name: 'total_live_listeners', type: 'numeric', nullable: true })
  totalLiveListeners?: number

  @Column({ name: 'total_replay_watched', type: 'numeric', nullable: true })
  totalReplayWatched?: number

  @Column({ name: 'is_available_for_replay', type: 'boolean', nullable: true })
  isAvailableForReplay?: boolean

  @Column({ name: 'is_available_for_clipping', type: 'boolean', nullable: true })
  isAvailableForClipping?: boolean

  @Column({ name: 'playlist_url', type: 'text', nullable: true })
  playlistUrl?: string

  @Column({ name: 'playlist_active', type: 'boolean', nullable: true })
  playlistActive?: boolean

  creator?: TwitterUser

  hosts?: TwitterUser[]

  speakers?: TwitterUser[]
}