const fs = require('fs');
const filePath = 'p:/DigiGO/games/game/src/scenes/PlanningScene.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update updateCombatUnitUi icons in PlanningScene
const updateUiRegex = /updateCombatUnitUi\(unit\) \{[\s\S]*?unit\.statusLabel\.setText\(s\.join\(" "\)\);\s*\}/;
if (updateUiRegex.test(content)) {
    const newUi = `updateCombatUnitUi(unit) {
    unit.hpLabel.setText(\`HP:\${unit.hp}/\${unit.maxHp}\${unit.shield ? \` +S\${unit.shield}\` : ""}\`);
    unit.rageLabel.setText(\`R:\${unit.rage}/\${unit.rageMax}\`);
    const s = [];
    if (unit.rage >= unit.rageMax - 1 && unit.rage > 0 && unit.alive) s.push("⚡");
    if (unit.shield > 0) s.push("🛡️");
    if (unit.statuses.immuneTurns > 0) s.push("🧤");
    if (unit.statuses.freeze > 0) s.push("❄");
    if (unit.statuses.stun > 0) s.push("💫");
    if (unit.statuses.sleep > 0) s.push("😴");
    if (unit.statuses.silence > 0) s.push("🔇");
    if (unit.statuses.disarmTurns > 0) s.push("🚫");
    if (unit.statuses.burnTurns > 0) s.push("🔥");
    if (unit.statuses.poisonTurns > 0) s.push("☠");
    if (unit.statuses.bleedTurns > 0) s.push("🩸");
    if (unit.statuses.diseaseTurns > 0) s.push("🦠");
    if (unit.statuses.tauntTurns > 0 && unit.statuses.tauntTargetId) s.push("🎯");
    if (unit.statuses.armorBreakTurns > 0) s.push("⚔️");
    if (unit.statuses.slowTurns > 0) s.push("⏳");
    if (unit.statuses.atkDebuffTurns > 0) s.push("📉");
    if (unit.statuses.reflectTurns > 0 || unit.statuses.physReflectTurns > 0) s.push("🌀");
    unit.statusLabel.setText(s.slice(0, 5).join(" "));
  }`;
    content = content.replace(updateUiRegex, newUi);
    console.log('Updated PlanningScene UI icons.');
}

// 2. Add status timers to processStartTurn in PlanningScene
const processStartTurnRegex = /this\.tickTimedStatus\(unit, "mdefBuffTurns"\);/;
if (processStartTurnRegex.test(content)) {
    content = content.replace(processStartTurnRegex,
        'this.tickTimedStatus(unit, "mdefBuffTurns");\n' +
        '    this.tickTimedStatus(unit, "slowTurns");\n' +
        '    this.tickTimedStatus(unit, "disarmTurns");\n' +
        '    this.tickTimedStatus(unit, "immuneTurns");\n' +
        '    this.tickTimedStatus(unit, "physReflectTurns");\n' +
        '    this.tickTimedStatus(unit, "counterTurns");\n' +
        '    this.tickTimedStatus(unit, "isProtecting");'
    );
    console.log('Injected PlanningScene status timers.');
}

// 3. Add Bleed handling to processStartTurn in PlanningScene
const poisonTurnsRegex = /if \(unit\.statuses\.poisonTurns > 0\) \{[\s\S]*?unit\.statuses\.poisonTurns -= 1;\s*\}/;
if (poisonTurnsRegex.test(content)) {
    content = content.replace(poisonTurnsRegex, (match) => {
        return match + '\n    if (unit.statuses.bleedTurns > 0) {\n' +
            '      this.resolveDamage(null, unit, unit.statuses.bleedDamage, "true", "MÁU", { noRage: true, noReflect: true });\n' +
            '      unit.statuses.bleedTurns -= 1;\n' +
            '    }';
    });
    console.log('Injected PlanningScene bleed handling.');
}

// 4. Update tickTimedStatus in PlanningScene
const tickTimedStatusRegex = /tickTimedStatus\(unit, key\) \{[\s\S]*?unit\.statuses\.reflectTurns = 0;\s*\}\s*\}/;
if (tickTimedStatusRegex.test(content)) {
    const newTick = `tickTimedStatus(unit, key) {
    if (unit.statuses[key] > 0) unit.statuses[key] -= 1;
    if (key === "tauntTurns" && unit.statuses.tauntTurns <= 0) {
      unit.statuses.tauntTargetId = null;
      unit.statuses.tauntTurns = 0;
    }
    if (key === "armorBreakTurns" && unit.statuses.armorBreakTurns <= 0) {
      unit.statuses.armorBreakValue = 0;
      unit.statuses.armorBreakTurns = 0;
    }
    if (key === "atkDebuffTurns" && unit.statuses.atkDebuffTurns <= 0) {
      unit.statuses.atkDebuffValue = 0;
      unit.statuses.atkDebuffTurns = 0;
    }
    if (key === "reflectTurns" && unit.statuses.reflectTurns <= 0) {
      unit.statuses.reflectPct = 0;
      unit.statuses.reflectTurns = 0;
    }
    if (key === "immuneTurns" && unit.statuses.immuneTurns <= 0) {
      unit.statuses.immuneTurns = 0;
    }
  }`;
    content = content.replace(tickTimedStatusRegex, newTick);
    console.log('Updated PlanningScene tickTimedStatus.');
}

// 5. Inject new skill effects into applySkillEffect in PlanningScene
const applySkillEffectRegex = /switch\s*\(skill\.effect\)\s*\{/;
const newSkills = `
      case "global_stun": {
        enemies.forEach((enemy) => {
          this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name);
          if (enemy.alive && Math.random() < skill.stunChance) {
            enemy.statuses.stun = Math.max(enemy.statuses.stun, skill.stunTurns);
            this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, "CHOÁNG", "#ffd97b");
            this.updateCombatUnitUi(enemy);
          }
        });
        break;
      }
      case "single_burst_armor_pen": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, { armorPen: skill.armorPen || 0.5 });
        break;
      }
      case "single_poison_slow": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
        if (target.alive) {
          target.statuses.poisonTurns = Math.max(target.statuses.poisonTurns, skill.poisonTurns);
          target.statuses.poisonDamage = Math.max(target.statuses.poisonDamage, skill.poisonPerTurn);
          target.statuses.slowTurns = Math.max(target.statuses.slowTurns, skill.slowTurns);
          this.updateCombatUnitUi(target);
        }
        break;
      }
      case "aoe_circle_stun": {
        enemies
          .filter((enemy) => Math.abs(enemy.row - target.row) <= 1 && Math.abs(enemy.col - target.col) <= 1)
          .forEach((enemy) => {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name);
            if (enemy.alive && Math.random() < skill.stunChance) {
              enemy.statuses.stun = Math.max(enemy.statuses.stun, skill.stunTurns);
              this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, "CHOÁNG", "#ffd97b");
              this.updateCombatUnitUi(enemy);
            }
          });
        break;
      }
      case "single_bleed": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
        if (target.alive) {
          target.statuses.bleedTurns = Math.max(target.statuses.bleedTurns, skill.turns || 3);
          const bleedDmg = Math.round(this.getEffectiveAtk(attacker) * 0.3);
          target.statuses.bleedDamage = Math.max(target.statuses.bleedDamage || 0, bleedDmg);
          this.showFloatingText(target.sprite.x, target.sprite.y - 45, "CHẢY MÁU", "#ff4444");
          this.updateCombatUnitUi(target);
        }
        break;
      }
      case "cone_shot": {
        enemies.filter(e => Math.abs(e.row - target.row) <= 1 && e.col >= target.col)
               .forEach(e => this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name));
        break;
      }
      case "global_debuff_atk": {
        enemies.forEach(e => {
          this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name);
          if (e.alive) {
            e.statuses.atkDebuffTurns = Math.max(e.statuses.atkDebuffTurns, skill.turns);
            e.statuses.atkDebuffValue = Math.max(e.statuses.atkDebuffValue, skill.selfAtkBuff || 20);
            this.updateCombatUnitUi(e);
          }
        });
        break;
      }
      case "knockback_charge": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
        break;
      }
      case "cleave_armor_break": {
        enemies.filter(e => Math.abs(e.row - target.row) <= 1 && Math.abs(e.col - target.col) <= 1)
               .forEach(e => {
                  this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name);
                  if (e.alive) {
                    e.statuses.armorBreakTurns = Math.max(e.statuses.armorBreakTurns, skill.turns);
                    e.statuses.armorBreakValue = Math.max(e.statuses.armorBreakValue, skill.armorBreak);
                    this.updateCombatUnitUi(e);
                  }
               });
        break;
      }
      case "single_strong_poison": {
         this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
         if (target.alive) {
           target.statuses.poisonTurns = Math.max(target.statuses.poisonTurns, 5);
           target.statuses.poisonDamage = Math.max(target.statuses.poisonDamage, Math.round(rawSkill * 0.5));
           this.updateCombatUnitUi(target);
         }
         break;
      }
      case "shield_immune": {
        allies.forEach(a => {
          this.addShield(a, rawSkill);
          a.statuses.immuneTurns = Math.max(a.statuses.immuneTurns, skill.turns || 2);
          this.updateCombatUnitUi(a);
        });
        break;
      }
      case "self_bersek": {
         attacker.statuses.atkBuffTurns = Math.max(attacker.statuses.atkBuffTurns, 5);
         attacker.statuses.atkBuffValue = Math.max(attacker.statuses.atkBuffValue, Math.round(attacker.atk * 0.5));
         this.updateCombatUnitUi(attacker);
         break;
      }
      case "execute_heal": {
         this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
         if (!target.alive) this.healUnit(attacker, attacker, Math.round(attacker.maxHp * 0.2), "FEED");
         break;
      }
      case "global_fire": {
        enemies.forEach(e => {
          this.resolveDamage(attacker, e, rawSkill, "magic", skill.name);
          if (e.alive) {
            e.statuses.burnTurns = Math.max(e.statuses.burnTurns, 3);
            e.statuses.burnDamage = Math.max(e.statuses.burnDamage, Math.round(rawSkill * 0.2));
            this.updateCombatUnitUi(e);
          }
        });
        break;
      }
      case "revive_or_heal": {
         allies.forEach(a => this.healUnit(attacker, a, rawSkill, "HEAL"));
         break;
      }
      case "true_execute": {
        this.resolveDamage(attacker, target, rawSkill, "true", skill.name);
        break;
      }
      case "global_slow": {
         enemies.forEach(e => {
           this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name);
           if (e.alive) {
             e.statuses.slowTurns = Math.max(e.statuses.slowTurns, 3);
             this.updateCombatUnitUi(e);
           }
         });
         break;
      }
      case "multi_disarm": {
         enemies.sort((a,b) => b.atk - a.atk).slice(0, 3).forEach(e => {
            this.resolveDamage(attacker, e, rawSkill * 0.5, "magic", skill.name);
            if (e.alive) {
              e.statuses.disarmTurns = Math.max(e.statuses.disarmTurns, 2);
              this.updateCombatUnitUi(e);
            }
         });
         break;
      }
      case "random_lightning": {
         for (let i = 0; i < 5; i++) {
           const e = enemies[Math.floor(Math.random() * enemies.length)];
           if (e) this.resolveDamage(attacker, e, rawSkill, "magic", "LÔI PHẠT");
         }
         break;
      }
      case "team_buff_def": {
         allies.forEach(a => {
           a.statuses.defBuffTurns = Math.max(a.statuses.defBuffTurns, 3);
           a.statuses.defBuffValue = Math.max(a.statuses.defBuffValue, skill.armorBuff || 30);
           this.updateCombatUnitUi(a);
         });
         break;
      }
`;
if (applySkillEffectRegex.test(content)) {
    content = content.replace(applySkillEffectRegex, 'switch (skill.effect) {\n' + newSkills);
    console.log('Injected PlanningScene new skills.');
}

// 6. Update resolveDamage in PlanningScene for armor pen
const resolveDamageOldRegex = /const def = Math\.max\(0, this\.getEffectiveDef\(defender\) - armorBreak\);[\s\S]*?final = raw \* \(100 \/ \(100 \+ def\)\);/;
const resolveDamageNew = `const pen = options.armorPen || 0;
      const effectiveDef = Math.max(0, this.getEffectiveDef(defender) - armorBreak);
      const def = effectiveDef * (1-pen);
      final = raw * (100 / (100 + def));`;
if (resolveDamageOldRegex.test(content)) {
    content = content.replace(resolveDamageOldRegex, resolveDamageNew);
    console.log('Updated PlanningScene resolveDamage with armor pen.');
}

// 7. Update getEffectiveAtk in PlanningScene
const getEffectiveAtkRegex = /getEffectiveAtk\(unit\) \{[\s\S]*?return Math\.max\(1, unit\.atk \+ buff\);\s*\}/;
if (getEffectiveAtkRegex.test(content)) {
    const newAtk = `getEffectiveAtk(unit) {
    const buff = unit.statuses.atkBuffTurns > 0 ? unit.statuses.atkBuffValue : 0;
    const debuff = unit.statuses.atkDebuffTurns > 0 ? unit.statuses.atkDebuffValue : 0;
    return Math.max(1, unit.atk + buff - debuff);
  }`;
    content = content.replace(getEffectiveAtkRegex, newAtk);
    console.log('Updated PlanningScene getEffectiveAtk with debuff.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done patching PlanningScene.js.');
