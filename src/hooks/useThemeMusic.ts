import { useEffect, useState } from 'react'

import { getResolver, getResolverForMediaId } from '../actions/audio'
import { downloadAutomaticTheme } from '../actions/automaticThemes'

import { getCache, updateCache } from '../cache/musicCache'
import { useSettings } from '../hooks/useSettings'

const useThemeMusic = (appId: number) => {
  const { settings, isLoading: settingsLoading } = useSettings()
  const [audio, setAudio] = useState<{ videoId: string; audioUrl: string }>({
    videoId: '',
    audioUrl: ''
  })
  const appDetails = appStore.GetAppOverviewByGameID(appId)
  const appName = appDetails?.display_name?.replace(/(™|®|©)/g, '')

  useEffect(() => {
    let cancelled = false
    setAudio({ videoId: '', audioUrl: '' })
    function playTheme(theme: { videoId: string; audioUrl: string }) {
      if (cancelled) return
      setAudio(theme)
      if (settings.autoPlaybackMode === 'download') {
        void downloadAutomaticTheme(
          theme.videoId,
          getResolverForMediaId(theme.videoId, settings.musicProvider)
        )
      }
    }
    async function getData() {
      const resolver = getResolver(settings.musicProvider)
      const cache = await getCache(appId)
      if (cache?.videoId === '') {
        return setAudio({ videoId: '', audioUrl: '' })
      } else if (cache?.videoId?.length) {
        const newAudio = await getResolverForMediaId(cache.videoId, settings.musicProvider).getAudioUrlFromVideo({
          id: cache.videoId
        })
        if (newAudio?.length) {
          return playTheme({ videoId: cache.videoId, audioUrl: newAudio })
        }
      } else {
        const newAudio = await resolver.getAudio(appName)
        if (cancelled || !newAudio?.audioUrl?.length) return
        // A manual selection made during the search takes precedence.
        if ((await getCache(appId))?.videoId !== undefined) return
        await updateCache(appId, { videoId: newAudio.videoId })
        playTheme(newAudio)
      }
    }
    if (appName?.length && !settingsLoading) {
      getData().catch((error) =>
        console.error('[GameThemeMusic] Automatic theme lookup failed:', error)
      )
    }
    return () => { cancelled = true }
  }, [appId, appName, settingsLoading, settings.musicProvider, settings.autoPlaybackMode])

  return {
    audio
  }
}

export default useThemeMusic
