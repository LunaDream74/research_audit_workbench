# Demo video v2 editing guide

## Separate assets

- Picture master: `research-audit-visual-silent.mp4`
- Alternate picture master: `research-audit-visual-silent.webm`
- Timed AI narration master: `narration-ai-voice-timed.wav`
- Lightweight AI narration preview: `narration-ai-voice.mp3`
- Captions timed to the AI narration: `narration-ai-voice.srt`
- Voice script and timing: `narration.md`
- Original scene-timed captions: `narration.srt`

The picture track and timed WAV are both exactly 2:20.64. The speech ends at 2:18.60, leaving a two-second closing beat. The picture master is 1440×900 and contains no audio stream.

## Suggested edit

1. Put `narration-ai-voice-timed.wav` on a separate audio track beneath the silent MP4, both starting at zero.
2. The supplied WAV is mono PCM at 48 kHz and normalized for clear speech.
3. If replacing the voice, align each paragraph with the timestamps in `narration.md`.
4. Trim breaths rather than speeding up the replacement voice if a section runs long.
5. Import `narration-ai-voice.srt` for captions that follow the generated voice, or use `narration.srt` for the original scene timing.
6. Export H.264 video with AAC audio at 1080p or the source 1440×900 size.

Example final mux after the voice is timed:

```powershell
ffmpeg -i research-audit-visual-silent.mp4 -i narration-ai-voice-timed.wav -c:v copy -c:a aac -b:a 192k -shortest research-audit-demo-final.mp4
```

Do not upload the silent picture master as the submission video. The official requirement is a public, under-three-minute video with audio explaining the product and its WebMCP use.
