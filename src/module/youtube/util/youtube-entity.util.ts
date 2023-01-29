/* eslint-disable camelcase */
import { youtube_v3 } from '@googleapis/youtube'
import { YoutubeChannel } from '../model/youtube-channel.entity'
import { YoutubePlaylistItem } from '../model/youtube-playlist-item.entity'
import { YoutubePlaylist } from '../model/youtube-playlist.entity'
import { YoutubeVideo } from '../model/youtube-video.entity'
import { YoutubeApiUtil } from './youtube-api.util'

export class YoutubeEntityUtil {
  public static buildChannel(data: youtube_v3.Schema$Channel) {
    const obj: YoutubeChannel = {
      id: data.id,
      isActive: true,
      createdAt: new Date(data.snippet.publishedAt || 0).getTime(),
      updatedAt: Date.now(),
      name: data.snippet.title,
      description: data.snippet.description,
      thumbnailUrl: YoutubeApiUtil.getThumbnailUrl(data.snippet.thumbnails),
      customUrl: data.snippet.customUrl,
      country: data.snippet.country,
      videoCount: Number(data.statistics.videoCount),
      subscriberCount: Number(data.statistics.subscriberCount),
      viewCount: Number(data.statistics.viewCount),
    }
    return obj
  }

  public static buildVideo(data: youtube_v3.Schema$Video) {
    const obj: YoutubeVideo = {
      id: data.id,
      isActive: true,
      createdAt: new Date(data.snippet.publishedAt || 0).getTime(),
      updatedAt: Date.now(),
      channelId: data.snippet.channelId,
      categoryId: data.snippet.categoryId,
      title: data.snippet.title,
      // description: data.snippet.description,
      thumbnailUrl: YoutubeApiUtil.getThumbnailUrl(data.snippet.thumbnails),
      privacyStatus: data.status.privacyStatus as any,
      uploadStatus: data.status.uploadStatus as any,
      liveBroadcastContent: data.snippet.liveBroadcastContent,
      scheduledStartTime: data.liveStreamingDetails?.scheduledStartTime
        ? new Date(data.liveStreamingDetails.scheduledStartTime).getTime()
        : undefined,
      actualStartTime: data.liveStreamingDetails?.actualStartTime
        ? new Date(data.liveStreamingDetails.actualStartTime).getTime()
        : undefined,
      actualEndTime: data.liveStreamingDetails?.actualEndTime
        ? new Date(data.liveStreamingDetails.actualEndTime).getTime()
        : undefined,
      viewCount: Number(data.statistics.viewCount),
      likeCount: Number(data.statistics.likeCount),
      commentCount: Number(data.statistics.commentCount),
    }
    return obj
  }

  public static buildPlaylist(data: youtube_v3.Schema$Playlist) {
    const obj: YoutubePlaylist = {
      id: data.id,
      isActive: true,
      createdAt: new Date(data.snippet.publishedAt || 0).getTime(),
      updatedAt: Date.now(),
      channelId: data.snippet.channelId,
      title: data.snippet.title,
      description: data.snippet.description,
      thumbnailUrl: YoutubeApiUtil.getThumbnailUrl(data.snippet.thumbnails),
      privacyStatus: data.status.privacyStatus as any,
    }
    return obj
  }

  public static buildPlaylistItem(data: youtube_v3.Schema$PlaylistItem) {
    const obj: YoutubePlaylistItem = {
      id: data.id,
      isActive: true,
      createdAt: new Date(data.snippet.publishedAt || 0).getTime(),
      updatedAt: Date.now(),
      channelId: data.snippet.channelId,
      playlistId: data.snippet.playlistId,
      videoId: data.contentDetails.videoId,
      position: data.snippet.position,
    }
    return obj
  }
}