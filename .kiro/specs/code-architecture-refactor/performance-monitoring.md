# Performance Monitoring Setup

**Date**: 2024-01-XX
**Branch**: refactor/code-architecture
**Purpose**: Set up performance monitoring hooks to track performance during refactor

## Performance Targets

From requirements document (Requirement 12):

| Operation | Target | Critical Threshold |
|-----------|--------|-------------------|
| Combat turn execution | < 16ms | < 16ms (60 FPS) |
| Shop refresh operation | < 50ms | < 100ms |
| Board synergy calculation | < 10ms | < 20ms |
| Scene transition | < 100ms | < 200ms |
| Game load time | < 2 seconds | < 4 seconds |

**Performance Regression Limit**: No more than 5% degradation after refactor

## Monitoring Strategy

### 1. Automated Performance Tests

Create performance benchmark tests that run as part of the test suite:

**Location**: `game/tests/performance/`

**Tests to Create**:
- `combatPerformance.test.js` - Measure combat turn execution time
- `shopPerformance.test.js` - Measure shop refresh time
- `synergyPerformance.test.js` - Measure synergy calculation time
- `scenePerformance.test.js` - Measure scene transition time
- `loadPerformance.test.js` - Measure game load time

**Test Structure**:
```javascript
import { describe, test, expect } from 'vitest'
import { performance } from 'perf_hooks'

describe('Combat Performance', () => {
  test('combat turn execution should be < 16ms', () => {
    const iterations = 100
    const times = []
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      // Execute combat turn
      const end = performance.now()
      times.push(end - start)
    }
    
    const avgTime = times.reduce((a, b) => a + b) / times.length
    const maxTime = Math.max(...times)
    
    console.log(`Average: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`)
    
    expect(avgTime).toBeLessThan(16)
    expect(maxTime).toBeLessThan(32) // Allow some variance
  })
})
```

### 2. Manual Performance Profiling

**Tools**:
- Chrome DevTools Performance tab
- Phaser Debug mode
- Console.time() / console.timeEnd()

**Profiling Points**:
1. **Before Refactor**: Profile current implementation
2. **After Each System Extraction**: Profile to detect regressions
3. **After Scene Refactors**: Profile full game flow
4. **Before Merge**: Final comprehensive profiling

**How to Profile**:
```javascript
// Add to code temporarily for profiling
console.time('combat-turn')
// ... combat turn logic
console.timeEnd('combat-turn')
```

### 3. Performance Monitoring Hooks

Add performance monitoring to key operations:

**Location**: `game/src/core/performanceMonitor.js`

```javascript
/**
 * Performance monitoring utility
 * Tracks operation times and reports if thresholds exceeded
 */

const THRESHOLDS = {
  combatTurn: 16,
  shopRefresh: 50,
  synergyCalc: 10,
  sceneTransition: 100
}

const measurements = {
  combatTurn: [],
  shopRefresh: [],
  synergyCalc: [],
  sceneTransition: []
}

export function measureOperation(operationType, fn) {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  
  measurements[operationType].push(duration)
  
  if (duration > THRESHOLDS[operationType]) {
    console.warn(`⚠️ Performance: ${operationType} took ${duration.toFixed(2)}ms (threshold: ${THRESHOLDS[operationType]}ms)`)
  }
  
  return result
}

export function getPerformanceReport() {
  const report = {}
  
  for (const [operation, times] of Object.entries(measurements)) {
    if (times.length === 0) continue
    
    const avg = times.reduce((a, b) => a + b) / times.length
    const max = Math.max(...times)
    const min = Math.min(...times)
    const threshold = THRESHOLDS[operation]
    const violations = times.filter(t => t > threshold).length
    
    report[operation] = {
      count: times.length,
      average: avg.toFixed(2),
      max: max.toFixed(2),
      min: min.toFixed(2),
      threshold,
      violations,
      violationRate: ((violations / times.length) * 100).toFixed(1) + '%'
    }
  }
  
  return report
}

export function clearMeasurements() {
  for (const key in measurements) {
    measurements[key] = []
  }
}
```

**Usage Example**:
```javascript
import { measureOperation } from './core/performanceMonitor.js'

// In CombatSystem
export function executeAction(state, actor) {
  return measureOperation('combatTurn', () => {
    // ... combat turn logic
    return result
  })
}

// In ShopSystem
export function refreshShop(player, cost) {
  return measureOperation('shopRefresh', () => {
    // ... shop refresh logic
    return result
  })
}
```

### 4. Continuous Monitoring During Refactor

**After Each Commit**:
1. Run performance tests: `npm run test:performance`
2. Check for warnings in console during manual testing
3. Review performance report: `getPerformanceReport()`
4. Document any regressions in performance-log.md

**Weekly Review**:
1. Analyze performance trends
2. Identify operations that are slowing down
3. Prioritize optimizations if needed
4. Update performance-log.md with findings

## Performance Benchmarking Process

### Initial Baseline (Before Refactor)

**Status**: ⏳ Not yet completed (from baseline-metrics.md)

**Action Required**:
1. Create performance test files
2. Run benchmarks on current code
3. Document baseline times
4. Commit baseline results

### During Refactor

**After Each System Extraction**:
```bash
# Run performance tests
npm run test:performance

# Compare to baseline
# Document any regressions > 5%
```

**After Each Scene Refactor**:
```bash
# Run full performance suite
npm run test:performance

# Manual profiling session
# 1. Open game in Chrome
# 2. Open DevTools > Performance
# 3. Record full game session
# 4. Analyze flame graph for bottlenecks
```

### Final Validation (Before Merge)

**Comprehensive Performance Test**:
1. Run all performance tests
2. Compare to baseline metrics
3. Verify no regression > 5%
4. Profile full game session
5. Test on multiple devices/browsers
6. Document final performance report

## Performance Test Commands

```bash
# Run all performance tests
npm run test:performance

# Run specific performance test
npm run test:performance -- combatPerformance

# Run with detailed output
npm run test:performance -- --reporter=verbose

# Run and generate report
npm run test:performance -- --reporter=json > performance-report.json
```

## Performance Regression Response

### If Performance Degrades 5-10%
1. ⚠️ **Warning**: Document the regression
2. Investigate the cause
3. Attempt optimization
4. If cannot optimize quickly, consider reverting

### If Performance Degrades 10-20%
1. 🔴 **Alert**: Stop and investigate immediately
2. Profile to find bottleneck
3. Optimize or revert the change
4. Do not proceed until resolved

### If Performance Degrades > 20%
1. 🔴 **Critical**: Revert immediately
2. Analyze what went wrong
3. Plan different approach
4. Document in rollback-log.md

## Optimization Strategies

### If Combat Performance Degrades
- Check for unnecessary object creation in hot path
- Verify turn order calculation is efficient
- Ensure damage calculation is not doing redundant work
- Consider caching frequently accessed data

### If Shop Performance Degrades
- Check tier odds calculation efficiency
- Verify unit generation is not doing unnecessary work
- Consider caching shop offers
- Optimize random number generation

### If Synergy Performance Degrades
- Check for redundant synergy calculations
- Verify unit counting is efficient
- Consider caching synergy results
- Optimize synergy lookup

### If Scene Transition Degrades
- Check for memory leaks
- Verify proper cleanup of previous scene
- Optimize asset loading
- Consider preloading assets

## Memory Monitoring

**Target**: Memory usage should not increase > 10%

**How to Monitor**:
1. Chrome DevTools > Memory tab
2. Take heap snapshot before refactor
3. Take heap snapshot after refactor
4. Compare memory usage
5. Investigate any significant increases

**Memory Leak Detection**:
1. Play game for 10+ rounds
2. Monitor memory usage over time
3. Memory should stabilize, not continuously grow
4. If memory grows continuously, investigate leaks

## Performance Log

See `performance-log.md` for ongoing performance measurements during refactor.

## Tools and Resources

**Browser Tools**:
- Chrome DevTools Performance tab
- Chrome DevTools Memory tab
- Firefox Performance tools

**Node.js Tools**:
- `perf_hooks` module for timing
- `v8-profiler` for CPU profiling
- `heapdump` for memory analysis

**Phaser Tools**:
- Phaser Debug mode
- Phaser Stats plugin
- FPS counter

## Success Criteria

Before completing the refactor:
- ✅ All performance tests pass
- ✅ No operation exceeds target time
- ✅ No performance regression > 5%
- ✅ Memory usage increase < 10%
- ✅ Game maintains 60 FPS during combat
- ✅ No performance warnings in console

## Next Steps

1. ⏳ Create performance test files
2. ⏳ Implement performanceMonitor.js utility
3. ⏳ Run baseline benchmarks
4. ⏳ Document baseline results
5. ⏳ Set up automated performance testing in CI/CD

**Last Updated**: 2024-01-XX
**Status**: Setup complete - ready to create performance tests
