import { describe, it, expect } from "bun:test";
import { resolveRentPrice, diffInDays } from "../src/utils/pricing";

const tiers = [
  { days: 3, price: 250 },
  { days: 7, price: 500 },
];

describe("resolveRentPrice", () => {
  it("charges the 1-day price for a single night", () => {
    expect(resolveRentPrice(1, 150, tiers)).toBe(150);
  });

  it("rounds up to the 3-day tier for 2 nights", () => {
    expect(resolveRentPrice(2, 150, tiers)).toBe(250);
  });

  it("charges the 3-day price exactly at the boundary", () => {
    expect(resolveRentPrice(3, 150, tiers)).toBe(250);
  });

  it("rounds up to the 7-day tier for 4-6 nights", () => {
    expect(resolveRentPrice(4, 150, tiers)).toBe(500);
    expect(resolveRentPrice(5, 150, tiers)).toBe(500);
    expect(resolveRentPrice(6, 150, tiers)).toBe(500);
  });

  it("charges the 7-day price exactly at the boundary", () => {
    expect(resolveRentPrice(7, 150, tiers)).toBe(500);
  });

  it("extends beyond the highest tier using the daily rate", () => {
    expect(resolveRentPrice(8, 150, tiers)).toBe(650); // 500 + 1*150
    expect(resolveRentPrice(10, 150, tiers)).toBe(950); // 500 + 3*150
  });

  it("falls back to linear pricing when no tiers are set", () => {
    expect(resolveRentPrice(1, 150, [])).toBe(150);
    expect(resolveRentPrice(2, 150, [])).toBe(300);
    expect(resolveRentPrice(5, 150, [])).toBe(750);
  });

  it("defaults tiers to an empty array when omitted entirely", () => {
    expect(resolveRentPrice(3, 150)).toBe(450);
  });

  it("skips a missing 3-day tier and rounds straight to the 7-day tier", () => {
    const noThreeDay = [{ days: 7, price: 500 }];
    expect(resolveRentPrice(1, 150, noThreeDay)).toBe(150);
    expect(resolveRentPrice(2, 150, noThreeDay)).toBe(500);
    expect(resolveRentPrice(7, 150, noThreeDay)).toBe(500);
    expect(resolveRentPrice(9, 150, noThreeDay)).toBe(800); // 500 + 2*150
  });

  it("extends beyond the 3-day tier when no 7-day tier is set", () => {
    const noSevenDay = [{ days: 3, price: 250 }];
    expect(resolveRentPrice(4, 150, noSevenDay)).toBe(400); // 250 + 1*150
  });

  it("works regardless of the input order of tiers (sorts internally)", () => {
    const outOfOrder = [
      { days: 30, price: 1600 },
      { days: 3, price: 250 },
      { days: 15, price: 900 },
      { days: 7, price: 500 },
    ];
    expect(resolveRentPrice(2, 150, outOfOrder)).toBe(250);
    expect(resolveRentPrice(10, 150, outOfOrder)).toBe(900);
    expect(resolveRentPrice(31, 150, outOfOrder)).toBe(1750);
  });

  it("supports arbitrary custom day counts chosen by the owner (not just 3/7/15/30)", () => {
    const custom = [
      { days: 2, price: 200 },
      { days: 5, price: 450 },
      { days: 90, price: 6000 },
    ];
    expect(resolveRentPrice(1, 150, custom)).toBe(150);
    expect(resolveRentPrice(2, 150, custom)).toBe(200);
    expect(resolveRentPrice(3, 150, custom)).toBe(450); // ปัดขึ้น tier 5 วัน
    expect(resolveRentPrice(5, 150, custom)).toBe(450);
    expect(resolveRentPrice(6, 150, custom)).toBe(6000); // ปัดขึ้น tier 90 วัน
    expect(resolveRentPrice(90, 150, custom)).toBe(6000);
    expect(resolveRentPrice(92, 150, custom)).toBe(6300); // 6000 + 2*150
  });

  describe("15-day and 30-day tiers", () => {
    const allTiers = [
      { days: 3, price: 250 },
      { days: 7, price: 500 },
      { days: 15, price: 900 },
      { days: 30, price: 1600 },
    ];

    it("rounds up to the 15-day tier for 8-14 nights", () => {
      expect(resolveRentPrice(8, 150, allTiers)).toBe(900);
      expect(resolveRentPrice(14, 150, allTiers)).toBe(900);
    });

    it("charges the 15-day price exactly at the boundary", () => {
      expect(resolveRentPrice(15, 150, allTiers)).toBe(900);
    });

    it("rounds up to the 30-day tier for 16-29 nights", () => {
      expect(resolveRentPrice(16, 150, allTiers)).toBe(1600);
      expect(resolveRentPrice(29, 150, allTiers)).toBe(1600);
    });

    it("charges the 30-day price exactly at the boundary", () => {
      expect(resolveRentPrice(30, 150, allTiers)).toBe(1600);
    });

    it("extends beyond the 30-day tier using the daily rate", () => {
      expect(resolveRentPrice(31, 150, allTiers)).toBe(1750); // 1600 + 1*150
      expect(resolveRentPrice(35, 150, allTiers)).toBe(2350); // 1600 + 5*150
    });

    it("skips missing middle tiers and rounds straight to the 30-day tier", () => {
      const only30 = [{ days: 30, price: 1600 }];
      expect(resolveRentPrice(1, 150, only30)).toBe(150);
      expect(resolveRentPrice(2, 150, only30)).toBe(1600);
      expect(resolveRentPrice(30, 150, only30)).toBe(1600);
      expect(resolveRentPrice(32, 150, only30)).toBe(1900); // 1600 + 2*150
    });

    it("still works when only the 15-day tier is added to the old tiers", () => {
      const no30 = [
        { days: 3, price: 250 },
        { days: 7, price: 500 },
        { days: 15, price: 900 },
      ];
      expect(resolveRentPrice(10, 150, no30)).toBe(900);
      expect(resolveRentPrice(16, 150, no30)).toBe(1050); // 900 + 1*150
    });
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
