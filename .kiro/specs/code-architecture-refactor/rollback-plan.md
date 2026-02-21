# Rollback Plan - Code Architecture Refactor

**Date**: 2024-01-XX
**Branch**: refactor/code-architecture
**Purpose**: Define rollback strategy and triggers for the major code architecture refactor

## Overview

This document defines when and how to rollback changes during the refactor process. The goal is to minimize risk and ensure we can quickly recover from issues.

## Rollback Triggers

### Critical Triggers (Immediate Rollback Required)

1. **Test Failure Threshold Exceeded**
   - **Trigger**: More than 5 tests fail after a commit
   - **Action**: Revert the last commit immediately
   - **Reason**: Indicates significant regression or breaking change

2. **Severe Performance Regression**
   - **Trigger**: Performance degrades by more than 20% in any benchmark
   - **Action**: Revert the commit that caused regression
   - **Reason**: Unacceptable impact on user experience

3. **Game Unplayable**
   - **Trigger**: Game crashes on startup or during core gameplay
   - **Action**: Revert to last known working commit
   - **Reason**: Blocks all testing and development

4. **Data Loss or Corruption**
   - **Trigger**: Save files corrupted or cannot be loaded
   - **Action**: Revert immediately and investigate
   - **Reason**: Unacceptable user impact

### Warning Triggers (Investigate Before Proceeding)

1. **Moderate Test Failures**
   - **Trigger**: 1-5 tests fail after a commit
   - **Action**: Investigate and fix before next commit
   - **Reason**: May indicate subtle bugs or regressions

2. **Moderate Performance Regression**
   - **Trigger**: Performance degrades by 5-20% in any benchmark
   - **Action**: Investigate cause, optimize or revert if cannot fix quickly
   - **Reason**: Approaching unacceptable performance impact

3. **Memory Increase**
   - **Trigger**: Memory usage increases by more than 10%
   - **Action**: Investigate memory leaks, optimize or revert
   - **Reason**: May cause issues on lower-end devices

4. **Unexpected Behavior**
   - **Trigger**: Game behaves differently than before (even if tests pass)
   - **Action**: Investigate thoroughly, revert if behavior is incorrect
   - **Reason**: Tests may not catch all regressions

## Rollback Procedures

### Procedure 1: Revert Last Commit

**When to Use**: Last commit caused issues, previous commit was working

**Steps**:
```bash
# 1. Verify current state
git status
git log --oneline -5

# 2. Revert the last commit (keeps changes in working directory)
git reset --soft HEAD~1

# 3. Or revert and discard changes
git reset --hard HEAD~1

# 4. Verify tests pass
npm test

# 5. Document the revert
# Add note to rollback-log.md explaining what was reverted and why
```

**Expected Time**: 5 minutes

### Procedure 2: Revert Specific Commit

**When to Use**: Issue traced to specific commit that's not the most recent

**Steps**:
```bash
# 1. Identify the problematic commit
git log --oneline

# 2. Create a revert commit (preserves history)
git revert <commit-hash>

# 3. Resolve any conflicts if they arise
# Edit conflicted files, then:
git add .
git revert --continue

# 4. Verify tests pass
npm test

# 5. Document the revert
# Add note to rollback-log.md
```

**Expected Time**: 10-15 minutes

### Procedure 3: Rollback to Main Branch

**When to Use**: Multiple issues, refactor branch is unstable, need fresh start

**Steps**:
```bash
# 1. Stash any uncommitted changes (if you want to keep them)
git stash

# 2. Switch to main branch
git checkout main

# 3. Verify main branch is working
npm test

# 4. Create new refactor branch (if restarting)
git checkout -b refactor/code-architecture-v2

# 5. Document the rollback
# Add detailed note to rollback-log.md explaining full rollback
```

**Expected Time**: 10 minutes

### Procedure 4: Cherry-Pick Good Commits

**When to Use**: Some commits are good, but later commits caused issues

**Steps**:
```bash
# 1. Switch to main branch
git checkout main

# 2. Create new refactor branch
git checkout -b refactor/code-architecture-recovery

# 3. Cherry-pick the good commits
git cherry-pick <commit-hash-1>
git cherry-pick <commit-hash-2>
# ... repeat for each good commit

# 4. Verify tests pass after each cherry-pick
npm test

# 5. Document the recovery
# Add note to rollback-log.md
```

**Expected Time**: 20-30 minutes

## Rollback Decision Matrix

| Situation | Tests Failing | Performance | Action |
|-----------|---------------|-------------|--------|
| 0 failures | 0% regression | ✅ Continue |
| 1-2 failures | < 5% regression | ⚠️ Fix before next commit |
| 3-5 failures | 5-10% regression | ⚠️ Investigate, may need to revert |
| 6-10 failures | 10-20% regression | 🔴 Revert last commit |
| > 10 failures | > 20% regression | 🔴 Rollback to main branch |
| Game crashes | Any | 🔴 Immediate rollback |
| Save corruption | Any | 🔴 Immediate rollback |

## Prevention Strategies

### Before Each Commit
1. ✅ Run full test suite (`npm test`)
2. ✅ Verify all tests pass
3. ✅ Manual smoke test (start game, play one round)
4. ✅ Check for console errors
5. ✅ Commit with descriptive message

### After Each System Extraction
1. ✅ Run full test suite
2. ✅ Run performance benchmarks (if available)
3. ✅ Manual test the extracted system's features
4. ✅ Verify backward compatibility
5. ✅ Document any issues in rollback-log.md

### After Each Scene Refactor
1. ✅ Run full test suite
2. ✅ Manual test the entire scene flow
3. ✅ Verify UI works correctly
4. ✅ Test save/load functionality
5. ✅ Check for memory leaks

## Backup Strategy

### Automatic Backups
- **Git Commits**: Every working state is committed
- **Branch Preservation**: refactor/code-architecture branch preserved until merge
- **Main Branch**: Always kept in working state

### Manual Backups
- **Before Major Changes**: Create backup branch
  ```bash
  git checkout -b backup/before-combat-system-extraction
  git checkout refactor/code-architecture
  ```
- **Before Risky Operations**: Stash or commit work in progress
- **Weekly Snapshots**: Tag working states weekly
  ```bash
  git tag refactor-week-1-stable
  ```

## Recovery Testing

### After Any Rollback
1. ✅ Run full test suite
2. ✅ Verify all tests pass
3. ✅ Manual test all core features:
   - Shop operations (refresh, buy, sell)
   - Board operations (place, move, remove)
   - Unit upgrades
   - Combat flow
   - Save/load
4. ✅ Run performance benchmarks
5. ✅ Document recovery in rollback-log.md

## Communication Protocol

### When Rollback Occurs
1. **Document**: Add entry to rollback-log.md with:
   - Date and time
   - What was rolled back
   - Why it was rolled back
   - What commit/state we rolled back to
   - Lessons learned
2. **Notify**: If working in a team, notify team members
3. **Analyze**: Investigate root cause before attempting again
4. **Plan**: Adjust approach to avoid same issue

## Rollback Log

See `rollback-log.md` for history of all rollbacks during this refactor.

## Success Criteria for Proceeding

After any rollback, verify these before continuing:
- ✅ All tests pass (100%)
- ✅ Game is playable
- ✅ No console errors
- ✅ Performance meets targets
- ✅ Save/load works
- ✅ Root cause identified and understood

## Emergency Contacts

**Project Lead**: [Name]
**Technical Lead**: [Name]
**QA Lead**: [Name]

## Notes

- **Be Conservative**: When in doubt, revert
- **Test Thoroughly**: Better to catch issues early
- **Document Everything**: Future you will thank you
- **Learn from Rollbacks**: Each rollback is a learning opportunity
- **Don't Rush**: Take time to understand issues before proceeding

## Appendix: Common Issues and Solutions

### Issue: Tests Pass But Game Doesn't Work
- **Cause**: Tests don't cover all scenarios
- **Solution**: Add more integration tests, manual test thoroughly

### Issue: Performance Regression Not Caught
- **Cause**: No performance benchmarks running
- **Solution**: Add performance tests to CI/CD

### Issue: Merge Conflicts on Rollback
- **Cause**: Multiple commits with interdependencies
- **Solution**: Use `git revert` instead of `git reset`, resolve conflicts carefully

### Issue: Can't Reproduce Issue After Rollback
- **Cause**: Issue was environment-specific or timing-dependent
- **Solution**: Document environment, add more logging, test in multiple environments

**Last Updated**: 2024-01-XX
**Status**: Active - ready for use during refactor
