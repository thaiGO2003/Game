const fs = require('fs');
const filePath = 'p:/DigiGO/games/game/src/scenes/CombatScene.js';
let content = fs.readFileSync(filePath, 'utf8');

const newSkills = `
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
          const newCol = clamp(target.col + push, 0, 9);
          if (!this.getCombatUnitAt(target.side, target.row, newCol)) {
             target.col = newCol;
             const screen = this.gridToScreen(target.col, target.row);
             this.tweens.add({ target: target.sprite, x: screen.x, y: screen.y - 10, duration: 200 });
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

const switchRegex = /switch\s*\(skill\.effect\)\s*\{/;
if (switchRegex.test(content)) {
    content = content.replace(switchRegex, 'switch (skill.effect) {\n' + newSkills);
    console.log('Injected new skill effects.');
} else {
    console.error('Failed to find side switch insertion point.');
}

// 5. Update resolveDamage to support armorPen and disarm/silence checks in basicAttack
const resolveDamageMod = `    let raw = Math.max(1, rawDamage);
    if (attacker && damageType === "physical") {
      if (Math.random() < attacker.mods.critPct) {
        raw *= 1.5;
        this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "BẠO KÍCH", "#ffd785");
      }
    }

    let final = raw;
    if (damageType === "physical") {
      const armorBreak = defender.statuses.armorBreakTurns > 0 ? defender.statuses.armorBreakValue : 0;
      const pen = options.armorPen || 0;
      const effectiveDef = Math.max(0, this.getEffectiveDef(defender) - armorBreak);
      const def = effectiveDef * (1 - pen);
      final = raw * (100 / (100 + def));
    } else if (damageType === "magic") {
      final = raw * (100 / (100 + this.getEffectiveMdef(defender)));
    }`;

const resolveDamageOldRegex = /let raw = Math\.max\(1, rawDamage\);[\s\S]*?final = raw \* \(100 \/ \(100 \+ this\.getEffectiveMdef\(defender\)\)\);/;
if (resolveDamageOldRegex.test(content)) {
    content = content.replace(resolveDamageOldRegex, resolveDamageMod);
    console.log('Updated resolveDamage with armor pen.');
}

// 6. Update stepCombat to check for disarm
const actionCheckRegex = /if \(actor\.rage >= actor\.rageMax && actor\.statuses\.silence <= 0\) \{/;
if (actionCheckRegex.test(content)) {
    content = content.replace(actionCheckRegex, 'if (actor.rage >= actor.rageMax && actor.statuses.silence <= 0) {');
    // Also check disarm for basic attack
    const basicAttackRegex = /await this\.basicAttack\(actor, target\);/;
    content = content.replace(basicAttackRegex, 'if (actor.statuses.disarmTurns <= 0) {\n            await this.basicAttack(actor, target);\n          } else {\n            this.showFloatingText(actor.sprite.x, actor.sprite.y - 45, "BỊ CẤM ĐÁNH", "#ffffff");\n          }');
    console.log('Injected disarm check.');
}

// 7. Update getEffectiveAtk to handle debuff
const getEffectiveAtkRegex = /getEffectiveAtk\(unit\) \{[\s\S]*?return Math\.max\(1, unit\.atk \+ buff\);\s*\}/;
if (getEffectiveAtkRegex.test(content)) {
    const newAtk = `getEffectiveAtk(unit) {
    const buff = unit.statuses.atkBuffTurns > 0 ? unit.statuses.atkBuffValue : 0;
    const debuff = unit.statuses.atkDebuffTurns > 0 ? unit.statuses.atkDebuffValue : 0;
    return Math.max(1, unit.atk + buff - debuff);
  }`;
    content = content.replace(getEffectiveAtkRegex, newAtk);
    console.log('Updated getEffectiveAtk with debuff.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done patching skills in CombatScene.js.');
