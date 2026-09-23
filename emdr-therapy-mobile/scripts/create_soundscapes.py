import math
import random
import wave
from pathlib import Path

SAMPLE_RATE = 22050
SECONDS = 8
AMPLITUDE = 0.12
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "sounds"
OUTPUT.mkdir(parents=True, exist_ok=True)


def write_wav(name: str, samples: list[float]) -> None:
    path = OUTPUT / name
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for sample in samples:
            clipped = max(-1.0, min(1.0, sample))
            frames += int(clipped * 32767).to_bytes(2, "little", signed=True)
        handle.writeframes(frames)


random.seed(7)
count = SAMPLE_RATE * SECONDS
rain = []
previous = 0.0
for index in range(count):
    white = random.uniform(-1.0, 1.0)
    previous = previous * 0.86 + white * 0.14
    shimmer = math.sin(index / SAMPLE_RATE * math.tau * 0.42) * 0.03
    rain.append((previous + shimmer) * AMPLITUDE)
write_wav("soundscape_rain.wav", rain)

hum = []
for index in range(count):
    time = index / SAMPLE_RATE
    tone = math.sin(math.tau * 110 * time) * 0.35 + math.sin(math.tau * 220 * time) * 0.08
    fade = min(1.0, index / (SAMPLE_RATE * 0.4), (count - index) / (SAMPLE_RATE * 0.4))
    hum.append(tone * AMPLITUDE * fade)
write_wav("soundscape_hum.wav", hum)
