import { beforeEach, describe, expect, it, vi } from 'vitest'
import { call, toaster } from '@decky/api'
import { getFullCache } from '../../src/cache/musicCache'
import { getResolver } from '../../src/actions/audio'
import { downloadAutomaticTheme, removeReplacedTheme } from '../../src/actions/automaticThemes'

vi.mock('@decky/api', () => ({ call: vi.fn(), toaster: { toast: vi.fn() } }))
vi.mock('../../src/cache/musicCache', () => ({ getFullCache: vi.fn() }))

describe('automatic theme downloads', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('window', { SP_REACT: { createElement: vi.fn() } })
    vi.mocked(getFullCache).mockResolvedValue({})
  })

  function resolver() {
    const result = getResolver('youtube')
    vi.spyOn(result, 'isDownloaded').mockResolvedValue(false)
    vi.spyOn(result, 'downloadAudio').mockResolvedValue(true)
    return result
  }

  it('deduplicates downloads and notifies once at start and completion', async () => {
    const r = resolver()
    await Promise.all([downloadAutomaticTheme('new', r), downloadAutomaticTheme('new', r)])
    expect(r.downloadAudio).toHaveBeenCalledTimes(1)
    expect(toaster.toast).toHaveBeenCalledTimes(2)
  })

  it('silently reuses existing downloads', async () => {
    const r = resolver()
    vi.mocked(r.isDownloaded).mockResolvedValue(true)
    await downloadAutomaticTheme('existing', r)
    expect(r.downloadAudio).not.toHaveBeenCalled()
    expect(toaster.toast).not.toHaveBeenCalled()
  })

  it('reports failures and permits retry', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = resolver()
    vi.mocked(r.downloadAudio).mockResolvedValueOnce(false)
    await downloadAutomaticTheme('retry', r)
    expect(toaster.toast).toHaveBeenLastCalledWith(expect.objectContaining({ body: expect.stringContaining('failed') }))
    await downloadAutomaticTheme('retry', r)
    expect(r.downloadAudio).toHaveBeenCalledTimes(2)
  })

  it('removes an unreferenced replaced track', async () => {
    await removeReplacedTheme('old', 'new')
    expect(call).toHaveBeenCalledWith('remove_unused_audio', 'old')
  })

  it('preserves songs referenced by another game, unchanged songs and empty selections', async () => {
    vi.mocked(getFullCache).mockResolvedValue({ '123': { videoId: 'old' } })
    await removeReplacedTheme('old', 'new')
    await removeReplacedTheme('old', 'old')
    await removeReplacedTheme('', 'new')
    expect(call).not.toHaveBeenCalled()
  })

  it('waits for background downloading before deleting the old song', async () => {
    const r = resolver()
    let finish!: (value: boolean) => void
    vi.mocked(r.downloadAudio).mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    const downloading = downloadAutomaticTheme('pending', r)
    await vi.waitFor(() => expect(r.downloadAudio).toHaveBeenCalled())
    const cleanup = removeReplacedTheme('pending', 'new')
    await Promise.resolve()
    expect(call).not.toHaveBeenCalled()
    finish(true)
    await Promise.all([downloading, cleanup])
    expect(call).toHaveBeenCalledWith('remove_unused_audio', 'pending')
  })
})
