import { APIEmbed, APIEmbedField } from 'discord-api-types/v10'
import { codeBlock, inlineCode, time } from 'discord.js'
import { TrackTwitterSpace } from '../../track/model/track-twitter-space.entity'
import { AudioSpaceMetadataState } from '../api/enum/twitter-graphql.enum'
import { SpaceState } from '../enum/twitter-space.enum'
import { TwitterSpace } from '../model/twitter-space.entity'
import { TwitterUtil } from './twitter.util'

export class TwitterSpaceUtil {
  public static parseId(s: string): string {
    const pattern = /(?<=spaces\/)\w+/
    const value = (pattern.exec(s)?.[0] || s)?.replace(/\?.+/g, '')
    return value
  }

  public static parseState(state: AudioSpaceMetadataState): SpaceState {
    const obj = {
      [AudioSpaceMetadataState.NOT_STARTED]: SpaceState.SCHEDULED,
      [AudioSpaceMetadataState.PRE_PUBLISHED]: SpaceState.SCHEDULED,
      [AudioSpaceMetadataState.RUNNING]: SpaceState.LIVE,
      [AudioSpaceMetadataState.TIMED_OUT]: SpaceState.ENDED,
      [AudioSpaceMetadataState.ENDED]: SpaceState.ENDED,
      [AudioSpaceMetadataState.CANCELED]: SpaceState.CANCELED,
    }
    return obj[state] || null
  }

  public static getMasterPlaylistUrl(url: string): string {
    return url
      // Handle live playlist
      .replace('?type=live', '')
      .replace('dynamic_playlist', 'master_playlist')
      // Handle replay playlist
      .replace('?type=replay', '')
      .replace(/playlist_\d+/g, 'master_playlist')
  }

  public static toDynamicPlaylistUrl(url: string): string {
    return url.replace('master_playlist', 'dynamic_playlist')
  }

  public static getUserIds(space: TwitterSpace): string[] {
    if (!space) {
      return []
    }

    const set = new Set<string>()
    set.add(space.creatorId)
    space.hostIds?.forEach?.((id) => set.add(id))
    space.speakerIds?.forEach?.((id) => set.add(id))
    return [...set]
  }

  public static getEmbed(space: TwitterSpace, trackItem?: TrackTwitterSpace) {
    const creator = space?.creator
    const embed: APIEmbed = {
      title: TwitterSpaceUtil.getEmbedTitle(space, trackItem),
      description: TwitterSpaceUtil.getEmbedDescription(space),
      color: 0x1d9bf0,
      author: {
        name: `${creator?.name} (@${creator?.username})`,
        url: TwitterUtil.getUserUrl(creator?.username),
        icon_url: creator?.profileImageUrl,
      },
      fields: TwitterSpaceUtil.getEmbedFields(space),
      footer: {
        text: 'Twitter',
        icon_url: 'https://abs.twimg.com/favicons/twitter.2.ico',
      },
    }
    return embed
  }

  public static getEmbedTitle(space: TwitterSpace, track?: TrackTwitterSpace) {
    const trackUser = [space.creator, space.hosts || [], space.speakers || []]
      .flat()
      .find((user) => user.id === track?.userId)
    const displayCreator = inlineCode(space.creator?.username || space.creatorId)
    const displayGuest = inlineCode(trackUser?.username || track?.userId)

    if (space.state === SpaceState.SCHEDULED) {
      return `${displayCreator} scheduled a Space`
    }

    if (space.state === SpaceState.ENDED) {
      if (track && space.creatorId !== track.userId) {
        return `${displayCreator} ended a Space | Guest: ${displayGuest}`
      }
      return `${displayCreator} ended a Space`
    }

    // SpaceState.LIVE
    if (track && space.creatorId !== track.userId) {
      if (space.hostIds?.includes?.(track.userId)) {
        return `${displayGuest} is co-hosting ${displayCreator}'s Space`
      }
      if (space.speakerIds?.includes?.(track.userId)) {
        return `${displayGuest} is speaking in ${displayCreator}'s Space`
      }
    }

    return `${displayCreator} is hosting a Space`
  }

  public static getEmbedDescription(space: TwitterSpace) {
    const emojis: string[] = []
    if (space.isAvailableForReplay) {
      emojis.push('⏺️')
    }
    if (space.isAvailableForClipping) {
      emojis.push('✂️')
    }
    return [
      TwitterUtil.getSpaceUrl(space.id),
      emojis.join(''),
    ].join(' ')
  }

  public static getEmbedFields(space: TwitterSpace) {
    const fields: APIEmbedField[] = [
      {
        name: '📄 Title',
        value: codeBlock(space.title),
      },
    ]

    if (space.state === SpaceState.SCHEDULED) {
      fields.push(
        {
          name: '⏰ Scheduled start',
          value: TwitterSpaceUtil.getEmbedLocalTime(space.scheduledStart),
          inline: true,
        },
      )
    }

    if ([SpaceState.LIVE, SpaceState.ENDED].includes(space.state)) {
      fields.push(
        {
          name: '▶️ Started at',
          value: TwitterSpaceUtil.getEmbedLocalTime(space.startedAt),
          inline: true,
        },
      )
    }

    if ([SpaceState.ENDED].includes(space.state)) {
      fields.push(
        {
          name: '⏹️ Ended at',
          value: TwitterSpaceUtil.getEmbedLocalTime(space.endedAt),
          inline: true,
        },
      )
    }

    if ([SpaceState.LIVE, SpaceState.ENDED].includes(space.state) && space.playlistUrl) {
      fields.push(
        {
          name: '🔗 Playlist url',
          value: codeBlock(space.playlistUrl),
        },
      )
    }

    if ([SpaceState.LIVE].includes(space.state) && space.playlistUrl) {
      fields.push(
        {
          name: 'Open with...',
          value: `Copy [this link](${TwitterSpaceUtil.toDynamicPlaylistUrl(space.playlistUrl)}) & open with MPV / IINA / VLC...`,
        },
      )
    }

    return fields
  }

  public static getEmbedTimestamp(ms: number) {
    return codeBlock(String(ms))
  }

  public static getEmbedLocalTime(ms: number) {
    if (!ms) {
      return null
    }
    return [
      time(Math.floor(ms / 1000)),
      time(Math.floor(ms / 1000), 'R'),
    ].join('\n')
  }
}
