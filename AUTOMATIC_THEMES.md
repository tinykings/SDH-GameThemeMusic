# Automatic theme playback

Games without a saved selection automatically search the configured music provider
and remember the first playable result. Manual selections and “No Music” take
precedence.

In the plugin settings, **Automatic theme playback** offers:

- **Auto download** (default): stream immediately and download in the background.
  Later visits reuse the local file, including offline. Notifications report
  download start, success, or failure. Failed downloads retry on a later visit.
- **Auto stream**: do not start background downloads. Already downloaded tracks
  are still reused; changing this setting does not delete files.

Selecting a replacement song downloads and saves the new selection before
removing the old audio file. Songs referenced by another game's selection are
retained. Existing orphaned downloads are not retroactively removed.

## Development

Work in a separate checkout, not Decky's installed plugin directory: Decky may
reset ownership of installed files.

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm build
```

The build produces `dist/index.js` and its source map. Deploy those files and
`main.py` together, then restart Decky. The backend includes the replacement
cleanup endpoint required by the frontend.

Downloaded binaries under `bin/`, build output under `dist/`, and local `*.bak`
files are ignored by Git. Decky or the plugin's updater installs yt-dlp separately;
do not commit the downloaded executable.
