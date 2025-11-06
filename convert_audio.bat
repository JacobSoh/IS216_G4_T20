@echo off
REM This script converts the audio to a web-compatible format
REM First, install ffmpeg: https://ffmpeg.org/download.html#build-windows
REM Or use: winget install ffmpeg

echo Converting auction_music.mp3 to web-compatible format...
ffmpeg -i public\auction_music.mp3 -ar 44100 -ab 192k -ac 2 public\auction_music_converted.mp3

echo Done! Now rename:
echo 1. Rename auction_music.mp3 to auction_music_old.mp3
echo 2. Rename auction_music_converted.mp3 to auction_music.mp3
pause
