import math
import struct
import wave
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "assets" / "sounds"
SAMPLE_RATE = 44_100
DURATION_SECONDS = 0.18
FREQUENCY_HZ = 440
PEAK_AMPLITUDE = 8_000
FADE_SAMPLES = 1_800


def write_directional_cue(filename: str, active_channel: int) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    frame_count = round(SAMPLE_RATE * DURATION_SECONDS)
    frames = bytearray()

    for index in range(frame_count):
        envelope = min(
            1.0,
            index / FADE_SAMPLES,
            (frame_count - index) / FADE_SAMPLES,
        )
        sample = round(
            PEAK_AMPLITUDE
            * envelope
            * math.sin(2 * math.pi * FREQUENCY_HZ * index / SAMPLE_RATE)
        )
        left, right = (sample, 0) if active_channel == 0 else (0, sample)
        frames.extend(struct.pack("<hh", left, right))

    with wave.open(str(OUTPUT_DIR / filename), "wb") as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(frames)


if __name__ == "__main__":
    write_directional_cue("cue_left.wav", active_channel=0)
    write_directional_cue("cue_right.wav", active_channel=1)
