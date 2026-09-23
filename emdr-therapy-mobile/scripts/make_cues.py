import math, wave
from pathlib import Path

out = Path('/home/ubuntu/emdr-therapy-mobile/assets/sounds')
out.mkdir(parents=True, exist_ok=True)
rate = 44100
seconds = 0.18
for name, freq in [('cue_left.wav', 440), ('cue_right.wav', 520)]:
    with wave.open(str(out / name), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        for i in range(int(rate * seconds)):
            envelope = min(1, i / 1800, (rate * seconds - i) / 1800)
            sample = int(10500 * envelope * math.sin(2 * math.pi * freq * i / rate))
            wav.writeframes(sample.to_bytes(2, 'little', signed=True))
