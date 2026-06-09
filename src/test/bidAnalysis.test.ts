import { describe, it, expect } from "vitest";
import { analyzeBidHistory, estimateBidSuccessProbability, estimateBidProbabilityMonteCarlo } from "@/utils/bidAnalysis";
import { AssemblyRecord } from "@/types/consortium";

function makeRecord(month: number, minBid: number, avgBid: number, maxBid: number, opts?: Partial<AssemblyRecord>): AssemblyRecord {
  const date = new Date(2024, month - 1, 1);
  return {
    id: `rec-${month}`,
    consortiumType: "imobiliario",
    groupNumber: 100,
    assemblyMonth: `M${month}`,
    assemblyDate: date,
    hasEmbeddedBid: false,
    embeddedBidMaxPercent: 0,
    creditRange: "200k-400k",
    participants: 100,
    totalTerm: 180,
    remainingTerm: 160,
    avgBid3Months: avgBid,
    minBidLastAssembly: minBid,
    maxBidLastAssembly: maxBid,
    contemplationsBySorteio: 2,
    contemplationsByLanceLivre: 3,
    contemplationsByLanceFixo: 1,
    contemplationsLastAssembly: 6,
    contemplationsCancelled: 0,
    totalContemplations: 30,
    sorteio: 2,
    cancelled: 0,
    lanceFixo: 1,
    lanceLivre: 3,
    minBidPercentage: minBid,
    avgBidPercentage: avgBid,
    maxBidPercentage: maxBid,
    contemplationsByLance: 4,
    createdAt: date.toISOString(),
    ...opts,
  };
}

describe("analyzeBidHistory", () => {
  it("calculates variance using average of min bids", () => {
    const records = [
      makeRecord(1, 20, 35, 50),
      makeRecord(2, 22, 37, 52),
      makeRecord(3, 24, 39, 54),
      makeRecord(4, 26, 41, 56),
      makeRecord(5, 28, 43, 58),
      makeRecord(6, 30, 45, 60),
    ];

    const result = analyzeBidHistory(records);
    expect(result).not.toBeNull();
    // avgOfMinBids = 25, variance = 70/6 ≈ 11.67
    expect(result!.stats.variance).toBeCloseTo(11.67, 1);
    expect(result!.stats.variance).toBeLessThan(50);
  });

  it("returns null for empty records", () => {
    expect(analyzeBidHistory([])).toBeNull();
  });

  it("accepts records with bid data but no contemplations (partial data)", () => {
    const records = [
      makeRecord(1, 20, 35, 50, {
        contemplationsBySorteio: 0,
        contemplationsByLanceLivre: 0,
        contemplationsByLanceFixo: 0,
        totalContemplations: 0,
        contemplationsLastAssembly: 0,
      }),
    ];
    const result = analyzeBidHistory(records);
    expect(result).not.toBeNull();
    expect(result!.monthQuality[0].level).toBe('parcial');
  });

  it("filters out records with no bid data AND no contemplations", () => {
    const records = [
      makeRecord(1, 0, 0, 0, {
        contemplationsBySorteio: 0,
        contemplationsByLanceLivre: 0,
        contemplationsByLanceFixo: 0,
        totalContemplations: 0,
        contemplationsLastAssembly: 0,
      }),
    ];
    expect(analyzeBidHistory(records)).toBeNull();
  });

  it("conservative zone uses min bids percentile", () => {
    const records = [
      makeRecord(1, 20, 35, 50),
      makeRecord(2, 22, 37, 55),
      makeRecord(3, 18, 30, 45),
      makeRecord(4, 25, 40, 60),
      makeRecord(5, 21, 36, 52),
      makeRecord(6, 23, 38, 58),
    ];

    const result = analyzeBidHistory(records);
    expect(result).not.toBeNull();
    // Conservative zone threshold should be based on min bids, not max bids
    // All min bids: 20, 22, 18, 25, 21, 23
    // The threshold should be <= max(minBids) since it's percentile 83 of minBids
    expect(result!.zones.conservadora.minBid).toBeLessThanOrEqual(25);
    expect(result!.zones.conservadora.minBid).toBeGreaterThan(0);
  });
});

describe("estimateBidSuccessProbability", () => {
  it("returns 0 for empty arrays", () => {
    expect(estimateBidSuccessProbability(25, [], [])).toBe(0);
  });

  it("returns 1 when bid exceeds all min bids", () => {
    const minBids = [10, 15, 20];
    const weights = [1.0, 1.2, 1.5];
    expect(estimateBidSuccessProbability(25, minBids, weights)).toBeCloseTo(1.0);
  });

  it("returns 0 when bid is below all min bids", () => {
    const minBids = [10, 15, 20];
    const weights = [1.0, 1.2, 1.5];
    expect(estimateBidSuccessProbability(5, minBids, weights)).toBe(0);
  });

  it("returns weighted fraction for partial success", () => {
    const minBids = [10, 20, 30];
    const weights = [1.0, 1.0, 1.0];
    // Bid of 15 beats only first (10), so 1/3
    expect(estimateBidSuccessProbability(15, minBids, weights)).toBeCloseTo(1 / 3);
  });
});

describe("estimateBidProbabilityMonteCarlo", () => {
  it("returns 0 for empty bids", () => {
    expect(estimateBidProbabilityMonteCarlo(25, [])).toBe(0);
  });

  it("returns 0 for zero bid value", () => {
    expect(estimateBidProbabilityMonteCarlo(0, [10, 20])).toBe(0);
  });

  it("returns ~100% when bid far exceeds all historical", () => {
    const prob = estimateBidProbabilityMonteCarlo(99, [10, 15, 20]);
    expect(prob).toBeGreaterThan(95);
  });

  it("returns ~0% when bid is far below all historical", () => {
    const prob = estimateBidProbabilityMonteCarlo(1, [30, 40, 50]);
    expect(prob).toBeLessThan(5);
  });

  it("returns value between 0 and 100", () => {
    const prob = estimateBidProbabilityMonteCarlo(25, [20, 25, 30]);
    expect(prob).toBeGreaterThanOrEqual(0);
    expect(prob).toBeLessThanOrEqual(100);
  });

  it("runs within performance bounds", () => {
    const start = performance.now();
    estimateBidProbabilityMonteCarlo(25, [20, 22, 24, 26, 28, 30], 10000);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
