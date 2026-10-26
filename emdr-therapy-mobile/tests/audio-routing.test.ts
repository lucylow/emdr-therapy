import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function channelEnergy(file: Buffer, channel: 0 | 1): number {
  const dataOffset = 44;
  const dataLength = file.readUInt32LE(40);
  let energy = 0;
  for (let offset = dataOffset + channel * 2; offset < dataOffset + dataLength; offset += 4) {
    energy += Math.abs(file.readInt16LE(offset));
  }
  return energy;
}

describe("bilateral audio cue assets", () => {
  it.each([
    ["cue_left.wav", 0, 1],
    ["cue_right.wav", 1, 0],
  ] as const)("routes %s to its named stereo channel only", (filename, activeChannel, silentChannel) => {
    const wav = readFileSync(
      resolve(process.cwd(), "assets/sounds", filename),
    );
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
    expect(wav.readUInt16LE(22)).toBe(2);
    expect(wav.readUInt16LE(34)).toBe(16);
    expect(channelEnergy(wav, activeChannel)).toBeGreaterThan(0);
    expect(channelEnergy(wav, silentChannel)).toBe(0);
  });
});
