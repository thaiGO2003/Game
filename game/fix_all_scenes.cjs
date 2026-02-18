const fs = require('fs');

const previewLogic = `
      case "global_stun":
      case "global_debuff_atk":
      case "global_fire":
      case "global_slow":
        pushUnits(enemies);
        break;
      case "single_burst_armor_pen":
      case "single_poison_slow":
      case "single_bleed":
      case "knockback_charge":
      case "single_strong_poison":
      case "execute_heal":
      case "true_execute":
        pushCell(target.row, target.col);
        break;
      case "aoe_circle_stun":
      case "cleave_armor_break":
        enemies.filter(e => Math.abs(e.row - target.row) <= 1 && Math.abs(e.col - target.col) <= 1)
               .forEach(e => pushCell(e.row, e.col));
        break;
      case "cone_shot":
        enemies.filter(e => Math.abs(e.row - target.row) <= 1 && e.col >= target.col)
               .forEach(e => pushCell(e.row, e.col));
        break;
      case "shield_immune":
      case "revive_or_heal":
      case "team_buff_def":
        pushUnits(allies);
        break;
      case "self_bersek":
        pushCell(attacker.row, attacker.col);
        break;
      case "multi_disarm":
        enemies.sort((a,b) => b.atk - a.atk).slice(0, 3).forEach(e => pushCell(e.row, e.col));
        break;
      case "random_lightning":
        pushCell(target.row, target.col);
        break;
`;

const implementationLogicCombat = `
      case "global_stun": {
        enemies.forEach((enemy) => {
          this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts);
          const effectiveStunChance = Math.min(1, skill.stunChance * starChanceMult);
          if (enemy.alive && Math.random() < effectiveStunChance) {
            enemy.statuses.stun = Math.max(enemy.statuses.stun, skill.stunTurns);
            this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, "CHOÁNG", "#ffd97b");
            this.updateCombatUnitUi(enemy);
          }
        });
        break;
      }
      case "single_burst_armor_pen": {
        const penOpts = { ...skillOpts, armorPen: skill.armorPen || 0.5 };
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, penOpts);
        break;
      }
      case "single_poison_slow": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
        if (target.alive) {
          target.statuses.poisonTurns = Math.max(target.statuses.poisonTurns, skill.poisonTurns);
          target.statuses.poisonDamage = Math.max(target.statuses.poisonDamage, skill.poisonPerTurn);
          target.statuses.slowTurns = Math.max(target.statuses.slowTurns, skill.slowTurns);
          this.updateCombatUnitUi(target);
        }
        break;
      }
      case "aoe_circle_stun": {
        const expandAoe = 1 + areaBonus;
        enemies
          .filter((enemy) => Math.abs(enemy.row - target.row) <= expandAoe && Math.abs(enemy.col - target.col) <= expandAoe)
          .forEach((enemy) => {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts);
            const effectiveStunChance = Math.min(1, skill.stunChance * starChanceMult);
            if (enemy.alive && Math.random() < effectiveStunChance) {
              enemy.statuses.stun = Math.max(enemy.statuses.stun, skill.stunTurns);
              this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, "CHOÁNG", "#ffd97b");
              this.updateCombatUnitUi(enemy);
            }
          });
        break;
      }
      case "single_bleed": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
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
        const victims = enemies.filter(e => Math.abs(e.row - target.row) <= 1 && e.col >= target.col);
        victims.forEach(e => this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name, skillOpts));
        break;
      }
      case "global_debuff_atk": {
        enemies.forEach(e => {
          this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name, skillOpts);
          if (e.alive) {
            e.statuses.atkDebuffTurns = Math.max(e.statuses.atkDebuffTurns, skill.turns);
            e.statuses.atkDebuffValue = Math.max(e.statuses.atkDebuffValue, skill.selfAtkBuff || 20);
            this.showFloatingText(e.sprite.x, e.sprite.y - 45, "YẾU ỚT", "#ffaaaa");
            this.updateCombatUnitUi(e);
          }
        });
        break;
      }
      case "knockback_charge": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
        if (target.alive) {
          const push = attacker.side === "LEFT" ? 1 : -1;
          const newCol = Math.max(0, Math.min(9, target.col + push));
          if (!enemies.find(u => u.row === target.row && u.col === newCol)) {
             target.col = newCol;
             const screen = this.gridToScreen(target.col, target.row);
             this.tweens.add({ targets: target.sprite, x: screen.x, y: screen.y - 10, duration: 200 });
             this.showFloatingText(target.sprite.x, target.sprite.y - 45, "ĐẨY LÙI", "#ffffff");
          }
        }
        break;
      }
      case "cleave_armor_break": {
        enemies
          .filter(e => Math.abs(e.row - target.row) <= 1 && Math.abs(e.col - target.col) <= 1)
          .forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name, skillOpts);
            if (e.alive) {
              e.statuses.armorBreakTurns = Math.max(e.statuses.armorBreakTurns, skill.turns);
              e.statuses.armorBreakValue = Math.max(e.statuses.armorBreakValue, skill.armorBreak);
              this.updateCombatUnitUi(e);
            }
          });
        break;
      }
      case "single_strong_poison": {
         this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
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
          this.showFloatingText(a.sprite.x, a.sprite.y - 45, "MIỄN NHIỄM", "#ffffff");
          this.updateCombatUnitUi(a);
        });
        break;
      }
      case "self_bersek": {
         attacker.statuses.atkBuffTurns = Math.max(attacker.statuses.atkBuffTurns, 5);
         attacker.statuses.atkBuffValue = Math.max(attacker.statuses.atkBuffValue, Math.round(attacker.atk * 0.5));
         this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "CUỒNG NỘ", "#ff0000");
         this.updateCombatUnitUi(attacker);
         break;
      }
      case "execute_heal": {
         const dealt = this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
         if (!target.alive) {
            this.healUnit(attacker, attacker, Math.round(attacker.maxHp * 0.2), "HẤP THỤ");
            attacker.rage = Math.min(attacker.rageMax, attacker.rage + 2);
         }
         break;
      }
      case "global_fire": {
        enemies.forEach(e => {
          this.resolveDamage(attacker, e, rawSkill, "magic", skill.name, skillOpts);
          if (e.alive) {
            e.statuses.burnTurns = Math.max(e.statuses.burnTurns, 3);
            e.statuses.burnDamage = Math.max(e.statuses.burnDamage, Math.round(rawSkill * 0.2));
            this.updateCombatUnitUi(e);
          }
        });
        break;
      }
      case "revive_or_heal": {
         const dead = this.combatUnits.find(u => u.side === attacker.side && !u.alive);
         if (dead && Math.random() < 0.5) {
            dead.alive = true;
            dead.hp = Math.round(dead.maxHp * 0.4);
            dead.sprite.clearFill();
            dead.tag.setColor("#ffffff");
            this.showFloatingText(dead.sprite.x, dead.sprite.y - 45, "HỒI SINH", "#ffff00");
            this.updateCombatUnitUi(dead);
         } else {
            allies.forEach(a => this.healUnit(attacker, a, rawSkill, "CỨU RỖI"));
         }
         break;
      }
      case "true_execute": {
        const bonus = target.hp < target.maxHp * 0.4 ? rawSkill * 2 : rawSkill;
        this.resolveDamage(attacker, target, bonus, "true", skill.name, skillOpts);
        break;
      }
      case "global_slow": {
         enemies.forEach(e => {
           this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name, skillOpts);
           if (e.alive) {
             e.statuses.slowTurns = Math.max(e.statuses.slowTurns, 3);
             this.showFloatingText(e.sprite.x, e.sprite.y - 45, "LÀM CHẬM", "#888888");
             this.updateCombatUnitUi(e);
           }
         });
         break;
      }
      case "multi_disarm": {
         const victims = enemies.sort((a,b) => b.atk - a.atk).slice(0, 3);
         victims.forEach(e => {
            this.resolveDamage(attacker, e, rawSkill * 0.5, "magic", skill.name, skillOpts);
            if (e.alive) {
              e.statuses.disarmTurns = Math.max(e.statuses.disarmTurns, 2);
              this.showFloatingText(e.sprite.x, e.sprite.y - 45, "TƯỚC KHÍ", "#ffffff");
              this.updateCombatUnitUi(e);
            }
         });
         break;
      }
      case "random_lightning": {
         for (let i = 0; i < 5; i++) {
           const e = enemies[Math.floor(Math.random() * enemies.length)];
           if (e) this.resolveDamage(attacker, e, rawSkill, "magic", "LÔI PHẠT", skillOpts);
         }
         break;
      }
      case "team_buff_def": {
         allies.forEach(a => {
           a.statuses.defBuffTurns = Math.max(a.statuses.defBuffTurns, 3);
           a.statuses.defBuffValue = Math.max(a.statuses.defBuffValue, skill.armorBuff || 30);
           this.updateCombatUnitUi(a);
         });
         this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "BẢO VỆ", "#00ff00");
         break;
      }
`;

function fixFile(filePath, isPlanning) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove the incorrectly injected skills from the FIRST switch (collectSkillPreviewCells)
    // We search for the collectSkillPreviewCells function first
    const previewFuncName = isPlanning ? 'collectSkillPreviewCells' : 'collectSkillPreviewCells';
    const previewFuncIndex = content.indexOf(previewFuncName);
    if (previewFuncIndex === -1) {
        console.error(`Failed to find ${previewFuncName} in ${filePath}`);
        return;
    }

    const switchIndex = content.indexOf('switch (skill.effect) {', previewFuncIndex);
    if (switchIndex === -1) {
        console.error(`Failed to find switch in ${previewFuncName} of ${filePath}`);
        return;
    }

    // Replace the switch start with switch + previewLogic
    // But wait, I need to make sure I don't duplicate it if I run it again.
    // I already injected the WRONG logic there. 
    // The wrong logic starts with "case \"global_stun\": {" (with braces)
    // The original logic had nothing for these cases yet.

    const wrongGlobalStunCase = 'case "global_stun": {';
    const wrongStunIndex = content.indexOf(wrongGlobalStunCase, switchIndex);
    if (wrongStunIndex !== -1 && wrongStunIndex < switchIndex + 500) {
        // Find the end of my wrongly injected block
        // It ends at "case \"team_buff_def\": {" ... "break;\n      }"
        const wrongEndCase = 'case "team_buff_def": {';
        const wrongEndIndex = content.indexOf('break;\n      }', content.indexOf(wrongEndCase, wrongStunIndex));
        if (wrongEndIndex !== -1) {
            const actualEnd = wrongEndIndex + 'break;\n      }'.length;
            content = content.slice(0, wrongStunIndex) + previewLogic.trim() + '\n      ' + content.slice(actualEnd);
            console.log(`Fixed preview switch in ${filePath}`);
        }
    } else {
        // If not found, maybe I didn't inject it or it's different.
        // Let's just try to inject previewLogic at the start of the switch if it's not there.
        if (content.indexOf('case "global_stun":', switchIndex) === -1) {
            content = content.slice(0, switchIndex + 'switch (skill.effect) {'.length) +
                '\n' + previewLogic +
                content.slice(switchIndex + 'switch (skill.effect) {'.length);
            console.log(`Injected preview logic in ${filePath}`);
        }
    }

    // 2. Inject implementation logic into the SECOND switch (applySkillEffect)
    const applyFuncName = 'applySkillEffect';
    const applyFuncIndex = content.lastIndexOf(applyFuncName); // Use lastIndexOf to find the second one (implementation)
    if (applyFuncIndex === -1) {
        console.error(`Failed to find ${applyFuncName} in ${filePath}`);
        return;
    }

    const applySwitchIndex = content.indexOf('switch (skill.effect) {', applyFuncIndex);
    if (applySwitchIndex === -1) {
        console.error(`Failed to find second switch in ${filePath}`);
        return;
    }

    if (content.indexOf('case "global_stun":', applySwitchIndex) === -1) {
        content = content.slice(0, applySwitchIndex + 'switch (skill.effect) {'.length) +
            '\n' + implementationLogicCombat +
            content.slice(applySwitchIndex + 'switch (skill.effect) {'.length);
        console.log(`Injected implementation logic in ${filePath}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

fixFile('p:/DigiGO/games/game/src/scenes/CombatScene.js', false);
fixFile('p:/DigiGO/games/game/src/scenes/PlanningScene.js', true);
console.log('All scenes fixed.');
