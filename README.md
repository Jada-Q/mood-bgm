# Mood BGM

Pick a mood — get an endless, never-repeating soundtrack, synthesized
live in your browser. Export any piece as a 32-second WAV and drop it
into your project.

The trick: **emotion lives in structure, not samples.** Each mood maps
to a scale, a chord progression, a tempo range, waveforms and drum
density — a tiny WebAudio synth renders them all:

| Mood | Scale / progression | BPM | Lead |
|---|---|---|---|
| Happy 欢乐 | I–V–vi–IV | 118–132 | square |
| Sad 悲伤 | vi–IV–I–V | 66–78 | sine + echo |
| Calm 平静 | maj7 loop | 78–90 | triangle |
| Excited 激动 | I–IV–V | 144–162 | square, 16th hats |
| Angry 愤怒 | phrygian i–♭II riff | 132–148 | sawtooth |
| Mystery 神秘 | harmonic minor | 84–96 | sine + echo |

Seeded RNG: the same seed always renders the same piece, so the WAV you
export is exactly what you heard.

Born from the soundtrack of [Earth Run](https://github.com/Jada-Q/earth-run).

## Run

```bash
pnpm install
pnpm dev   # http://localhost:3015
```

MIT.
