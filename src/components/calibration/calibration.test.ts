import { describe, it, expect } from "vitest";
import { getStandardPinLayout } from "./PinPositionList";

describe("getStandardPinLayout", () => {
  it("generates exactly 10 points for standard bowling pins", () => {
    const pins = getStandardPinLayout(640, 480);
    expect(pins).toHaveLength(10);
  });

  it("places headpin (pin 1) centered at the top row", () => {
    const pins = getStandardPinLayout(640, 480);
    const headPin = pins[0];
    expect(headPin.x).toBe(320); // exactly center of 640
    expect(headPin.y).toBeLessThan(pins[1].y);
    expect(headPin.y).toBeLessThan(pins[2].y);
  });

  it("arranges rows in ascending Y order", () => {
    const pins = getStandardPinLayout(640, 480);
    // Row 1: pin 1
    // Row 2: pins 2, 3
    // Row 3: pins 4, 5, 6
    // Row 4: pins 7, 8, 9, 10
    expect(pins[0].y).toBeLessThan(pins[1].y);
    expect(pins[1].y).toBe(pins[2].y);
    expect(pins[2].y).toBeLessThan(pins[3].y);
    expect(pins[3].y).toBe(pins[4].y);
    expect(pins[4].y).toBe(pins[5].y);
    expect(pins[5].y).toBeLessThan(pins[6].y);
    expect(pins[6].y).toBe(pins[7].y);
    expect(pins[7].y).toBe(pins[8].y);
    expect(pins[8].y).toBe(pins[9].y);
  });

  it("scales with custom dimensions", () => {
    const pinsCustom = getStandardPinLayout(1280, 720);
    expect(pinsCustom[0].x).toBe(640);
    expect(pinsCustom[9].x).toBeGreaterThan(pinsCustom[6].x);
  });
});
