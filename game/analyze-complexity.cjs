/**
 * Simple cyclomatic complexity analyzer
 * Counts decision points in JavaScript functions
 */

const fs = require('fs');
const path = require('path');

function analyzeComplexity(code, functionName) {
  // Find the function
  const functionRegex = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*{`, 'g');
  const match = functionRegex.exec(code);
  
  if (!match) {
    return { name: functionName, complexity: 0, found: false };
  }
  
  const startIndex = match.index;
  
  // Find the matching closing brace
  let braceCount = 0;
  let inFunction = false;
  let endIndex = startIndex;
  
  for (let i = startIndex; i < code.length; i++) {
    if (code[i] === '{') {
      braceCount++;
      inFunction = true;
    } else if (code[i] === '}') {
      braceCount--;
      if (inFunction && braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }
  
  const functionCode = code.substring(startIndex, endIndex + 1);
  
  // Count decision points
  let complexity = 1; // Base complexity
  
  // Count if statements
  complexity += (functionCode.match(/\bif\s*\(/g) || []).length;
  
  // Count else if
  complexity += (functionCode.match(/\belse\s+if\s*\(/g) || []).length;
  
  // Count for loops
  complexity += (functionCode.match(/\bfor\s*\(/g) || []).length;
  
  // Count while loops
  complexity += (functionCode.match(/\bwhile\s*\(/g) || []).length;
  
  // Count case statements
  complexity += (functionCode.match(/\bcase\s+/g) || []).length;
  
  // Count ternary operators
  complexity += (functionCode.match(/\?[^:]*:/g) || []).length;
  
  // Count logical AND/OR (each adds a decision point)
  complexity += (functionCode.match(/&&/g) || []).length;
  complexity += (functionCode.match(/\|\|/g) || []).length;
  
  // Count catch blocks
  complexity += (functionCode.match(/\bcatch\s*\(/g) || []).length;
  
  return {
    name: functionName,
    complexity,
    found: true,
    lines: functionCode.split('\n').length
  };
}

function analyzeFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  
  console.log(`\n=== ${fileName} ===\n`);
  
  // Define functions to check based on the file
  let functionsToCheck = [];
  
  if (fileName === 'CombatSystem.js') {
    functionsToCheck = [
      'calculateDamage',
      'executeSkill',
      'tickStatusEffects',
      'applyStatusEffect',
      'executeAction'
    ];
  } else if (fileName === 'AISystem.js') {
    functionsToCheck = [
      'generateEnemyTeam',
      'selectTarget',
      'makeAIDecision',
      'computeEnemyTeamSize'
    ];
  } else if (fileName === 'BoardSystem.js') {
    functionsToCheck = [
      'calculateSynergies',
      'placeBenchUnitOnBoard',
      'moveBoardUnitToBench'
    ];
  }
  
  const results = functionsToCheck.map(fn => analyzeComplexity(code, fn));
  
  results.forEach(result => {
    if (result.found) {
      const status = result.complexity <= 10 ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.complexity} (${result.lines} lines)`);
    } else {
      console.log(`⚠️  ${result.name}: NOT FOUND`);
    }
  });
  
  const maxComplexity = Math.max(...results.filter(r => r.found).map(r => r.complexity));
  const avgComplexity = results.filter(r => r.found).reduce((sum, r) => sum + r.complexity, 0) / results.filter(r => r.found).length;
  
  console.log(`\nMax Complexity: ${maxComplexity}`);
  console.log(`Avg Complexity: ${avgComplexity.toFixed(1)}`);
}

// Analyze the three largest files
const systemsDir = path.join(__dirname, 'src', 'systems');

console.log('='.repeat(60));
console.log('CYCLOMATIC COMPLEXITY ANALYSIS');
console.log('='.repeat(60));

analyzeFile(path.join(systemsDir, 'CombatSystem.js'));
analyzeFile(path.join(systemsDir, 'AISystem.js'));
analyzeFile(path.join(systemsDir, 'BoardSystem.js'));

console.log('\n' + '='.repeat(60));
console.log('THRESHOLD: Cyclomatic Complexity <= 10');
console.log('='.repeat(60));
