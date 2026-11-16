from pathlib import Path

import pytest


@pytest.mark.asyncio
async def test_removes_only_matching_audio(plugin):
    music = Path(plugin.music_path)
    for name in ('old.mp3', 'old.webm', 'old.txt', 'new.mp3'):
        (music / name).write_bytes(b'audio')

    await plugin.remove_unused_audio('old')

    assert sorted(path.name for path in music.iterdir()) == ['new.mp3', 'old.txt']


@pytest.mark.asyncio
async def test_missing_download_is_harmless(plugin):
    await plugin.remove_unused_audio('missing')


@pytest.mark.asyncio
async def test_does_not_follow_symlink_outside_music_directory(plugin, tmp_path):
    outside = tmp_path / 'outside.mp3'
    outside.write_bytes(b'audio')
    (Path(plugin.music_path) / 'old.mp3').symlink_to(outside)

    await plugin.remove_unused_audio('old')

    assert outside.read_bytes() == b'audio'
