import { SpaceV2, UserV1, UserV2 } from 'twitter-api-v2'
import { SpaceState } from '../enum/twitter-space.enum'
import { TwitterSpace } from '../model/twitter-space.entity'
import { TwitterUser } from '../model/twitter-user.entity'
import { TwitterUtil } from './twitter.util'

export class TwitterEntityUtil {
  public static buildUser(data: UserV1): TwitterUser {
    const obj: TwitterUser = {
      id: data.id_str,
      isActive: true,
      createdAt: new Date(data.created_at).getTime(),
      username: data.screen_name,
      name: data.name,
      location: data.location,
      description: TwitterUtil.getUserDescription(data),
      protected: data.protected,
      verified: data.verified,
      profileImageUrl: TwitterUtil.getUserProfileImageUrl(data.profile_image_url_https),
      profileBannerUrl: TwitterUtil.getUserProfileBannerUrl(data.profile_banner_url),
      followersCount: data.followers_count,
      followingCount: data.friends_count,
      tweetCount: data.statuses_count,
    }
    return obj
  }

  public static buildUserV2(data: UserV2): TwitterUser {
    const obj: TwitterUser = {
      id: data.id,
      isActive: true,
      createdAt: new Date(data.created_at).getTime(),
      username: data.username,
      name: data.name,
      location: data.location,
      protected: data.protected,
      verified: data.verified,
      profileImageUrl: TwitterUtil.getUserProfileImageUrl(data.profile_image_url),
      followersCount: data.public_metrics?.followers_count,
      followingCount: data.public_metrics?.following_count,
      tweetCount: data.public_metrics?.tweet_count,
    }
    return obj
  }

  public static buildSpace(data: SpaceV2): TwitterSpace {
    const obj: TwitterSpace = {
      id: data.id,
      isActive: true,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
      creatorId: data.creator_id,
      state: data.state as SpaceState,
      isTicketed: data.is_ticketed,
      scheduledStart: data.scheduled_start
        ? new Date(data.scheduled_start).getTime()
        : null,
      startedAt: data.started_at
        ? new Date(data.started_at).getTime()
        : null,
      endedAt: data.ended_at
        ? new Date(data.ended_at).getTime()
        : null,
      lang: data.lang,
      title: data.title,
      hostIds: data.host_ids,
      speakerIds: data.speaker_ids,
      participantCount: data.participant_count,
    }
    return obj
  }
}