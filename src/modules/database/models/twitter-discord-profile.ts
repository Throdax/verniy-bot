import {
  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn,
} from 'typeorm'

@Entity('twitter_discord_profile')
@Unique(['twitterUsername', 'discordChannelId'])
export class TwitterDiscordProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at', type: 'numeric', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'numeric', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ name: 'twitter_username', type: 'text' })
  twitterUsername: string

  @Column({ name: 'discord_channel_id', type: 'text' })
  discordChannelId: string
}