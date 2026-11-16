import { call } from '@decky/api'
import { useEffect, useState } from 'react'

export type Settings = {
  volume: number
  musicProvider?: string
  autoPlaybackMode?: 'stream' | 'download'
}

export const defaultSettings: Settings = {
  volume: 1,
  musicProvider: 'youtube',
  autoPlaybackMode: 'download'
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getData = async () => {
      setIsLoading(true)
      const savedSettings = await call<[string, Settings], Settings>(
        'get_setting',
        'settings',
        settings
      )
      setSettings({ ...defaultSettings, ...savedSettings })
      setIsLoading(false)
    }
    getData()
  }, [])

  async function updateSettings(
    key: keyof Settings,
    value: Settings[keyof Settings]
  ) {
    setSettings((oldSettings) => {
      const newSettings = { ...oldSettings, [key]: value }
      call<[string, Settings], Settings>(
        'set_setting',
        'settings',
        newSettings
      ).catch(console.error)
      return newSettings
    })
  }

  function setVolume(value: Settings['volume']) {
    updateSettings('volume', value)
  }
  function setMusicProvider(value: Settings['musicProvider']) {
    updateSettings('musicProvider', value)
  }

  function setAutoPlaybackMode(value: Settings['autoPlaybackMode']) {
    updateSettings('autoPlaybackMode', value)
  }

  return {
    settings,
    setVolume,
    setMusicProvider,
    setAutoPlaybackMode,
    isLoading
  }
}
