// Quick verification script to check tier odds sum to 1.0
const TIER_ODDS_BY_LEVEL = {
  1: [1, 0, 0, 0, 0],
  2: [0.8, 0.2, 0, 0, 0],
  3: [0.65, 0.3, 0.05, 0, 0],
  4: [0.5, 0.35, 0.13, 0.02, 0],
  5: [0.35, 0.35, 0.22, 0.07, 0.01],
  6: [0.25, 0.3, 0.28, 0.14, 0.03],
  7: [0.18, 0.24, 0.3, 0.2, 0.08],
  8: [0.12, 0.18, 0.27, 0.26, 0.17],
  9: [0.08, 0.12, 0.2, 0.3, 0.3],
  10: [0.05, 0.10, 0.20, 0.35, 0.30],
  11: [0.01, 0.05, 0.15, 0.30, 0.49],
  12: [0, 0, 0.10, 0.30, 0.60],
  13: [0, 0, 0.08, 0.28, 0.64],
  14: [0, 0, 0.06, 0.26, 0.68],
  15: [0, 0, 0.05, 0.24, 0.71],
  16: [0, 0, 0.04, 0.22, 0.74],
  17: [0, 0, 0.03, 0.20, 0.77],
  18: [0, 0, 0.03, 0.18, 0.79],
  19: [0, 0, 0.02, 0.16, 0.82],
  20: [0, 0, 0.02, 0.14, 0.84],
  21: [0, 0, 0.02, 0.12, 0.86],
  22: [0, 0, 0.02, 0.10, 0.88],
  23: [0, 0, 0.02, 0.09, 0.89],
  24: [0, 0, 0.02, 0.08, 0.90],
  25: [0, 0, 0.02, 0.08, 0.90]
};

console.log("Verifying tier odds sum to 1.0 for all levels:\n");

let allValid = true;
for (let level = 1; level <= 25; level++) {
  const odds = TIER_ODDS_BY_LEVEL[level];
  const sum = odds.reduce((a, b) => a + b, 0);
  const isValid = Math.abs(sum - 1.0) < 0.001;
  
  if (!isValid) {
    console.log(`❌ Level ${level}: Sum = ${sum.toFixed(4)} (Expected 1.0)`);
    allValid = false;
  } else {
    console.log(`✓ Level ${level}: Sum = ${sum.toFixed(4)} | Tier 5 odds: ${(odds[4] * 100).toFixed(1)}%`);
  }
}

console.log("\n" + (allValid ? "✅ All tier odds are valid!" : "❌ Some tier odds are invalid!"));

// Check progression requirements
console.log("\n\nChecking tier odds progression:");
console.log("- Tier 1 odds should decrease (already 0 from level 12+)");
console.log("- Tier 5 odds should increase");
console.log("- Target: ~90% tier 5 at level 25");

const tier5AtLevel25 = TIER_ODDS_BY_LEVEL[25][4];
console.log(`\nTier 5 odds at level 25: ${(tier5AtLevel25 * 100).toFixed(1)}%`);
console.log(tier5AtLevel25 >= 0.70 ? "✅ Meets requirement (≥70%)" : "❌ Does not meet requirement");
