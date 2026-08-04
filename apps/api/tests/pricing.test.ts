import { describe, it, expect } from "bun:test";
import { resolveRentPrice, diffInDays } from "../src/utils/pricing";

const tiers = { pricePerDay: 150, price3Day: 250, price7Day: 500 };

describe("resolveRentPrice", () => {
  it("charges the 1-day price for a single night", () => {
    expect(resolveRentPrice(1, tiers)).toBe(150);
  });

  it("rounds up to the 3-day tier for 2 nights", () => {
    expect(resolveRentPrice(2, tiers)).toBe(250);
  });

  it("charges the 3-day price exactly at the boundary", () => {
    expect(resolveRentPrice(3, tiers)).toBe(250);
  });

  it("rounds up to the 7-day tier for 4-6 nights", () => {
    expect(resolveRentPrice(4, tiers)).toBe(500);
    expect(resolveRentPrice(5, tiers)).toBe(500);
    expect(resolveRentPrice(6, tiers)).toBe(500);
  });

  it("charges the 7-day price exactly at the boundary", () => {
    expect(resolveRentPrice(7, tiers)).toBe(500);
  });

  it("extends beyond the highest tier using the daily rate", () => {
    expect(resolveRentPrice(8, tiers)).toBe(650); // 500 + 1*150
    expect(resolveRentPrice(10, tiers)).toBe(950); // 500 + 3*150
  });

  it("falls back to linear pricing when no tiers are set", () => {
    const base = { pricePerDay: 150 };
    expect(resolveRentPrice(1, base)).toBe(150);
    expect(resolveRentPrice(2, base)).toBe(300);
    expect(resolveRentPrice(5, base)).toBe(750);
  });

  it("skips a missing 3-day tier and rounds straight to the 7-day tier", () => {
    const noThreeDay = { pricePerDay: 150, price7Day: 500 };
    expect(resolveRentPrice(1, noThreeDay)).toBe(150);
    expect(resolveRentPrice(2, noThreeDay)).toBe(500);
    expect(resolveRentPrice(7, noThreeDay)).toBe(500);
    expect(resolveRentPrice(9, noThreeDay)).toBe(800); // 500 + 2*150
  });

  it("extends beyond the 3-day tier when no 7-day tier is set", () => {
    const noSevenDay = { pricePerDay: 150, price3Day: 250 };
    expect(resolveRentPrice(4, noSevenDay)).toBe(400); // 250 + 1*150
  });
});

describe("diffInDays", () => {
  it("computes whole nights between two midnight-aligned dates", () => {
    expect(diffInDays(new Date("2026-08-01T00:00:00Z"), new Date("2026-08-04T00:00:00Z"))).toBe(3);
  });

  it("rounds up a fractional day span", () => {
    expect(diffInDays(new Date("2026-08-01T00:00:00Z"), new Date("2026-08-02T12:00:00Z"))).toBe(2);
  });

  it("never returns less than 1 night", () => {
    expect(diffInDays(new Date("2026-08-01T00:00:00Z"), new Date("2026-08-01T00:00:00Z"))).toBe(1);
  });
});
