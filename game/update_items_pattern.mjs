import fs from 'fs';
let content = fs.readFileSync('src/data/items.js', 'utf8');

const tier2Index = content.indexOf('id: "dawn_edge"');

let tier1Content = content.substring(0, tier2Index);
let restContent = content.substring(tier2Index);

tier1Content = tier1Content.replace(/pattern:\s*\[\"([^\"]+)\"([^\]]+)\]/g, 'pattern: ["$1", null, null, null]');

restContent = restContent.replace(/(tier:\s*2,\s*gridSize:\s*2,\s*pattern:\s*\[\"[^\"]+\",\s*\"[^\"]+\",\s*\"[^\"]+\"),\s*null\]/g, '$1, "crystal"]');

let finalContent = tier1Content + restContent;

finalContent = finalContent.replace(
    /if \(recipe\.tier === 2\) \{\s*if \(requires\.length !== 3\) \{\s*console\.warn\(`\[Items\] Recipe \$\{recipe\.id\} \(tier 2\) must require exactly 3 ingredients\.`\);\s*\}/,
    `if (recipe.tier === 1) {
      if (requires.length !== 1) {
        console.warn(\`[Items] Recipe \${recipe.id} (tier 1) must require exactly 1 ingredient.\`);
      }
      if (requires.some((id) => ingredientIsEquipment(id))) {
        console.warn(\`[Items] Recipe \${recipe.id} (tier 1) cannot include crafted equipment.\`);
      }
    }

    if (recipe.tier === 2) {
      if (requires.length !== 4) {
        console.warn(\`[Items] Recipe \${recipe.id} (tier 2) must require exactly 4 ingredients.\`);
      }`
);

finalContent = finalContent.replace(
    /if \(recipe\.tier === 3\) \{\s*if \(requires\.length < 6\) \{\s*console\.warn\(`\[Items\] Recipe \$\{recipe\.id\} \(tier 3\) must require at least 6 ingredients, has \$\{requires\.length\}\.`\);\s*\}\s*if \(!requires\.some\(\(id\) => ingredientIsEquipment\(id\) && ingredientTier\(id\) >= 2\)\) \{\s*console\.warn\(`\[Items\] Recipe \$\{recipe\.id\} \(tier 3\) must include at least 1 tier-2 crafted ingredient\.`\);\s*\}/,
    `if (recipe.tier === 3) {
      if (requires.length !== 9) {
        console.warn(\`[Items] Recipe \${recipe.id} (tier 3) must require exactly 9 ingredients, has \${requires.length}.\`);
      }
      const tier2Count = requires.filter((id) => ingredientIsEquipment(id) && ingredientTier(id) >= 2).length;
      if (tier2Count < 2) {
        console.warn(\`[Items] Recipe \${recipe.id} (tier 3) must include at least 2 tier-2 crafted ingredients.\`);
      }`
);

fs.writeFileSync('src/data/items.js', finalContent);
console.log('Update complete.');
