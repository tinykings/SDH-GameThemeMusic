import { call, toaster } from '@decky/api'
import { FaDownload, FaExclamationTriangle } from 'react-icons/fa'
import { getResolver } from './audio'
import { getFullCache } from '../cache/musicCache'

const downloads = new Map<string, Promise<void>>()
type Resolver = ReturnType<typeof getResolver>

export function downloadAutomaticTheme(videoId: string, resolver: Resolver) {
  const pending = downloads.get(videoId)
  if (pending) return pending

  const task = (async () => {
    const video = { id: videoId }
    if (await resolver.isDownloaded(video)) return
    toaster.toast({
      title: 'Game Theme Music',
      body: 'Downloading theme music in the background…',
      icon: <FaDownload />,
      duration: 4000
    })
    if (!(await resolver.downloadAudio(video))) {
      throw new Error('Could not download theme ' + videoId)
    }
    toaster.toast({
      title: 'Game Theme Music',
      body: 'Theme downloaded. Future playback will use the local file.',
      icon: <FaDownload />,
      duration: 3000
    })
  })()
    .catch((error) => {
      console.warn('[GameThemeMusic] Background download failed:', error)
      toaster.toast({
        title: 'Game Theme Music',
        body: 'Background download failed. Streaming remains available; download will retry on a future visit.',
        icon: <FaExclamationTriangle />,
        duration: 5000
      })
    })
    .finally(() => downloads.delete(videoId))

  downloads.set(videoId, task)
  return task
}

// Only call after the replacement has downloaded and its selection is saved.
export async function removeReplacedTheme(oldId?: string, newId?: string) {
  if (!oldId || oldId === newId) return
  try {
    const isReferenced = async () =>
      Object.values(await getFullCache()).some((entry) => entry.videoId === oldId)
    if (await isReferenced()) return
    await downloads.get(oldId)
    if (!(await isReferenced())) await call('remove_unused_audio', oldId)
  } catch (error) {
    console.warn('[GameThemeMusic] New theme saved, but old download cleanup failed:', error)
  }
}
