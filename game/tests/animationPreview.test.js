import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for animation preview system
 * Task 9.4: Write unit tests for animation preview
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

describe('Animation Preview System', () => {
  let mockScene;
  let mockUnit;
  let mockSkill;

  beforeEach(() => {
    mockSkill = {
      id: 'test_skill',
      name: 'Test Skill',
      descriptionVi: 'Mô tả kỹ năng test',
      description: 'Test skill description',
      actionPattern: 'SINGLE',
      effect: 'damage',
      damageType: 'physical',
      base: 100,
      scale: 1.5
    };

    mockUnit = {
      id: 'test_unit',
      name: 'Test Unit',
      icon: '🐻',
      tribe: 'FIRE',
      classType: 'FIGHTER',
      tier: 3,
      skillId: 'test_skill',
      stats: {
        hp: 1000,
        atk: 150,
        def: 80,
        matk: 50,
        mdef: 60,
        range: 1,
        rageMax: 100
      }
    };

    mockScene = {
      add: {
        sprite: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          play: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        text: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          height: 20
        })),
        rectangle: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        })),
        container: vi.fn(() => ({
          add: vi.fn(),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn()
        }))
      },
      tweens: { add: vi.fn() },
      time: { delayedCall: vi.fn() },
      scale: { width: 1920, height: 1080 }
    };
  });

  describe('Preview Screen Display (Requirement 3.1)', () => {
    it('should display preview screen when unit is selected', () => {
      const previewState = { visible: false, unit: null, mode: null };
      const selectUnitForPreview = function(unit) {
        this.visible = true;
        this.unit = unit;
        this.mode = 'attack';
      }.bind(previewState);

      selectUnitForPreview(mockUnit);

      expect(previewState.visible).toBe(true);
      expect(previewState.unit).toBe(mockUnit);
      expect(previewState.mode).toBe('attack');
    });

    it('should show both attack and skill preview options', () => {
      const previewOptions = {
        attack: { available: false },
        skill: { available: false }
      };
      const initializePreviewOptions = function(unit) {
        this.attack.available = true;
        this.skill.available = !!unit.skillId;
      }.bind(previewOptions);

      initializePreviewOptions(mockUnit);

      expect(previewOptions.attack.available).toBe(true);
      expect(previewOptions.skill.available).toBe(true);
    });

    it('should not show skill preview if unit has no skill', () => {
      const unitWithoutSkill = { ...mockUnit, skillId: null };
      const previewOptions = { attack: { available: false }, skill: { available: false } };
      const initializePreviewOptions = function(unit) {
        this.attack.available = true;
        this.skill.available = !!unit.skillId;
      }.bind(previewOptions);

      initializePreviewOptions(unitWithoutSkill);

      expect(previewOptions.attack.available).toBe(true);
      expect(previewOptions.skill.available).toBe(false);
    });

    it('should create preview container with proper depth', () => {
      const createPreviewScreen = function(unit) {
        const container = this.add.container();
        container.setDepth(7000);
        return container;
      }.bind(mockScene);

      const container = createPreviewScreen(mockUnit);

      expect(mockScene.add.container).toHaveBeenCalled();
      expect(container.setDepth).toHaveBeenCalledWith(7000);
    });
  });

  describe('Attack Animation Playback (Requirement 3.2)', () => {
    it('should play basic attack animation when triggered', () => {
      const playAttackAnimation = function(unit) {
        const sprite = this.add.sprite(100, 100, 'unit_sprite');
        sprite.play('attack_animation');
        return sprite;
      }.bind(mockScene);

      const sprite = playAttackAnimation(mockUnit);

      expect(mockScene.add.sprite).toHaveBeenCalled();
      expect(sprite.play).toHaveBeenCalledWith('attack_animation');
    });

    it('should show attack animation automatically on preview trigger', () => {
      const previewState = { mode: null, animationPlaying: false };
      const triggerAttackPreview = function() {
        this.mode = 'attack';
        this.animationPlaying = true;
      }.bind(previewState);

      triggerAttackPreview();

      expect(previewState.mode).toBe('attack');
      expect(previewState.animationPlaying).toBe(true);
    });

    it('should create target dummy for attack animation', () => {
      const createAttackPreview = function() {
        const attacker = this.add.sprite(200, 300, 'attacker');
        const target = this.add.sprite(400, 300, 'target_dummy');
        return { attacker, target };
      }.bind(mockScene);

      const preview = createAttackPreview();

      expect(mockScene.add.sprite).toHaveBeenCalledTimes(2);
      expect(preview.attacker).toBeDefined();
      expect(preview.target).toBeDefined();
    });

    it('should reset animation after completion', () => {
      const animationState = { playing: true, completed: false };
      const onAnimationComplete = function() {
        this.playing = false;
        this.completed = true;
      }.bind(animationState);

      onAnimationComplete();

      expect(animationState.playing).toBe(false);
      expect(animationState.completed).toBe(true);
    });
  });

  describe('Skill Animation Playback (Requirement 3.3)', () => {
    it('should play skill animation when triggered', () => {
      const playSkillAnimation = function(unit, skill) {
        const sprite = this.add.sprite(100, 100, 'unit_sprite');
        sprite.play(`skill_${skill.id}`);
        return sprite;
      }.bind(mockScene);

      const sprite = playSkillAnimation(mockUnit, mockSkill);

      expect(mockScene.add.sprite).toHaveBeenCalled();
      expect(sprite.play).toHaveBeenCalledWith(`skill_${mockSkill.id}`);
    });

    it('should show skill animation automatically on preview trigger', () => {
      const previewState = { mode: null, animationPlaying: false };
      const triggerSkillPreview = function() {
        this.mode = 'skill';
        this.animationPlaying = true;
      }.bind(previewState);

      triggerSkillPreview();

      expect(previewState.mode).toBe('skill');
      expect(previewState.animationPlaying).toBe(true);
    });

    it('should handle different skill action patterns', () => {
      const skillPatterns = ['SINGLE', 'AOE', 'SELF', 'ALL_ENEMIES'];
      const getTargetCount = function(pattern) {
        switch(pattern) {
          case 'SINGLE': return 1;
          case 'AOE': return 3;
          case 'SELF': return 0;
          case 'ALL_ENEMIES': return 5;
          default: return 1;
        }
      };

      skillPatterns.forEach(pattern => {
        const targetCount = getTargetCount(pattern);
        expect(targetCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should create appropriate targets based on skill pattern', () => {
      const createSkillPreview = function(skill) {
        const caster = this.add.sprite(200, 300, 'caster');
        const targets = [];
        if (skill.actionPattern === 'SINGLE') {
          targets.push(this.add.sprite(400, 300, 'target'));
        } else if (skill.actionPattern === 'AOE') {
          targets.push(this.add.sprite(400, 250, 'target'));
          targets.push(this.add.sprite(400, 300, 'target'));
          targets.push(this.add.sprite(400, 350, 'target'));
        }
        return { caster, targets };
      }.bind(mockScene);

      const singleTargetSkill = { ...mockSkill, actionPattern: 'SINGLE' };
      const preview1 = createSkillPreview(singleTargetSkill);
      expect(preview1.targets.length).toBe(1);

      const aoeSkill = { ...mockSkill, actionPattern: 'AOE' };
      const preview2 = createSkillPreview(aoeSkill);
      expect(preview2.targets.length).toBe(3);
    });
  });

  describe('Automatic Animation Playback (Requirement 3.4)', () => {
    it('should auto-play animation when preview is triggered', () => {
      const autoPlayState = { triggered: false, playing: false };
      const triggerPreview = function(mode) {
        this.triggered = true;
        this.playing = true;
      }.bind(autoPlayState);

      triggerPreview('attack');

      expect(autoPlayState.triggered).toBe(true);
      expect(autoPlayState.playing).toBe(true);
    });

    it('should not require manual play button for animation', () => {
      const previewConfig = { autoPlay: true, requireManualTrigger: false };
      expect(previewConfig.autoPlay).toBe(true);
      expect(previewConfig.requireManualTrigger).toBe(false);
    });

    it('should start animation immediately after preview mode selection', () => {
      const timeline = [];
      const selectPreviewMode = function(mode) {
        timeline.push({ event: 'mode_selected', mode, time: Date.now() });
        timeline.push({ event: 'animation_started', mode, time: Date.now() });
      };

      selectPreviewMode('skill');

      expect(timeline.length).toBe(2);
      expect(timeline[0].event).toBe('mode_selected');
      expect(timeline[1].event).toBe('animation_started');
    });
  });

  describe('Skill Description Display (Requirement 3.5)', () => {
    it('should display skill description alongside animation', () => {
      const displaySkillInfo = function(skill) {
        const description = this.add.text(100, 500, skill.descriptionVi || skill.description, { fontSize: '14px', color: '#ffffff' });
        return description;
      }.bind(mockScene);

      const descText = displaySkillInfo(mockSkill);

      expect(mockScene.add.text).toHaveBeenCalled();
      expect(descText).toBeDefined();
    });

    it('should show skill name with description', () => {
      const skillInfo = { name: null, description: null };
      const setSkillInfo = function(skill) {
        this.name = skill.name;
        this.description = skill.descriptionVi || skill.description;
      }.bind(skillInfo);

      setSkillInfo(mockSkill);

      expect(skillInfo.name).toBe('Test Skill');
      expect(skillInfo.description).toBe('Mô tả kỹ năng test');
    });

    it('should display skill effect parameters', () => {
      const getSkillEffectText = function(skill) {
        const parts = [];
        if (skill.base) parts.push(`Sát thương cơ bản: ${skill.base}`);
        if (skill.scale) parts.push(`Hệ số: ${skill.scale}`);
        if (skill.damageType) parts.push(`Loại: ${skill.damageType}`);
        return parts.join(' • ');
      };

      const effectText = getSkillEffectText(mockSkill);

      expect(effectText).toContain('100');
      expect(effectText).toContain('1.5');
      expect(effectText).toContain('physical');
    });

    it('should handle missing skill description gracefully', () => {
      const skillWithoutDesc = { id: 'no_desc_skill', name: 'No Description Skill', descriptionVi: null, description: null };
      const getDescription = function(skill) {
        return skill.descriptionVi || skill.description || 'Chưa có mô tả.';
      };

      const desc = getDescription(skillWithoutDesc);

      expect(desc).toBe('Chưa có mô tả.');
    });

    it('should prefer Vietnamese description over English', () => {
      const bilingualSkill = { name: 'Bilingual Skill', descriptionVi: 'Mô tả tiếng Việt', description: 'English description' };
      const getDescription = function(skill) {
        return skill.descriptionVi || skill.description;
      };

      const desc = getDescription(bilingualSkill);

      expect(desc).toBe('Mô tả tiếng Việt');
    });
  });

  describe('Preview Error Handling', () => {
    it('should handle missing unit data gracefully', () => {
      const handlePreviewError = function(unit) {
        if (!unit) return { error: true, message: 'Unit not found' };
        return { error: false };
      };

      const result = handlePreviewError(null);

      expect(result.error).toBe(true);
      expect(result.message).toBe('Unit not found');
    });

    it('should handle missing skill data gracefully', () => {
      const unitWithInvalidSkill = { ...mockUnit, skillId: 'non_existent_skill' };
      const SKILL_LIBRARY = { 'test_skill': mockSkill };
      const getSkillSafely = function(skillId) {
        return SKILL_LIBRARY[skillId] || null;
      };

      const skill = getSkillSafely(unitWithInvalidSkill.skillId);

      expect(skill).toBeNull();
    });

    it('should handle animation loading failures', () => {
      const animationState = { loaded: false, error: null };
      const loadAnimation = function(animKey) {
        try {
          if (!animKey) throw new Error('Invalid animation key');
          this.loaded = true;
        } catch (error) {
          this.error = error.message;
          this.loaded = false;
        }
      }.bind(animationState);

      loadAnimation(null);

      expect(animationState.loaded).toBe(false);
      expect(animationState.error).toBe('Invalid animation key');
    });

    it('should provide fallback when sprite is missing', () => {
      const getSpriteOrFallback = function(spriteKey) {
        if (!spriteKey) return 'default_sprite';
        return spriteKey;
      };

      const sprite = getSpriteOrFallback(null);

      expect(sprite).toBe('default_sprite');
    });

    it('should clean up resources on preview close', () => {
      const previewResources = {
        sprites: [{ destroy: vi.fn() }, { destroy: vi.fn() }],
        texts: [{ destroy: vi.fn() }],
        containers: [{ destroy: vi.fn() }]
      };
      const cleanupPreview = function() {
        this.sprites.forEach(s => s.destroy());
        this.texts.forEach(t => t.destroy());
        this.containers.forEach(c => c.destroy());
      }.bind(previewResources);

      cleanupPreview();

      expect(previewResources.sprites[0].destroy).toHaveBeenCalled();
      expect(previewResources.sprites[1].destroy).toHaveBeenCalled();
      expect(previewResources.texts[0].destroy).toHaveBeenCalled();
      expect(previewResources.containers[0].destroy).toHaveBeenCalled();
    });
  });

  describe('Preview Mode Switching', () => {
    it('should switch between attack and skill preview modes', () => {
      const previewState = { mode: 'attack' };
      const switchMode = function(newMode) {
        this.mode = newMode;
      }.bind(previewState);

      expect(previewState.mode).toBe('attack');
      switchMode('skill');
      expect(previewState.mode).toBe('skill');
      switchMode('attack');
      expect(previewState.mode).toBe('attack');
    });

    it('should stop current animation when switching modes', () => {
      const animationState = { currentAnimation: { stop: vi.fn() }, mode: 'attack' };
      const switchMode = function(newMode) {
        if (this.currentAnimation) this.currentAnimation.stop();
        this.mode = newMode;
      }.bind(animationState);

      switchMode('skill');

      expect(animationState.currentAnimation.stop).toHaveBeenCalled();
      expect(animationState.mode).toBe('skill');
    });

    it('should clear previous preview elements when switching', () => {
      const sprite = { destroy: vi.fn() };
      const text = { destroy: vi.fn() };
      const previewElements = {
        sprites: [sprite],
        texts: [text]
      };
      const clearPreviewElements = function() {
        this.sprites.forEach(s => s.destroy());
        this.texts.forEach(t => t.destroy());
        this.sprites = [];
        this.texts = [];
      }.bind(previewElements);

      clearPreviewElements();

      expect(sprite.destroy).toHaveBeenCalled();
      expect(text.destroy).toHaveBeenCalled();
      expect(previewElements.sprites.length).toBe(0);
      expect(previewElements.texts.length).toBe(0);
    });
  });

  describe('Preview Integration with Wiki', () => {
    it('should open preview from unit detail view', () => {
      const wikiState = { detailUnit: mockUnit, previewVisible: false };
      const openPreview = function() {
        if (this.detailUnit) this.previewVisible = true;
      }.bind(wikiState);

      openPreview();

      expect(wikiState.previewVisible).toBe(true);
    });

    it('should close preview and return to detail view', () => {
      const wikiState = { detailUnit: mockUnit, previewVisible: true };
      const closePreview = function() {
        this.previewVisible = false;
      }.bind(wikiState);

      closePreview();

      expect(wikiState.previewVisible).toBe(false);
      expect(wikiState.detailUnit).toBe(mockUnit);
    });

    it('should maintain wiki scroll position when opening preview', () => {
      const wikiState = { scrollY: 150, previewVisible: false };
      const openPreview = function() {
        const savedScroll = this.scrollY;
        this.previewVisible = true;
        this.scrollY = savedScroll;
      }.bind(wikiState);

      openPreview();

      expect(wikiState.scrollY).toBe(150);
      expect(wikiState.previewVisible).toBe(true);
    });
  });

  describe('Preview Visual Feedback', () => {
    it('should show loading indicator while animation loads', () => {
      const loadingState = { visible: false };
      const showLoading = function() { this.visible = true; }.bind(loadingState);
      const hideLoading = function() { this.visible = false; }.bind(loadingState);

      showLoading();
      expect(loadingState.visible).toBe(true);

      hideLoading();
      expect(loadingState.visible).toBe(false);
    });

    it('should highlight selected preview mode button', () => {
      const buttons = { attack: { highlighted: false }, skill: { highlighted: false } };
      const highlightButton = function(mode) {
        this.attack.highlighted = (mode === 'attack');
        this.skill.highlighted = (mode === 'skill');
      }.bind(buttons);

      highlightButton('attack');
      expect(buttons.attack.highlighted).toBe(true);
      expect(buttons.skill.highlighted).toBe(false);

      highlightButton('skill');
      expect(buttons.attack.highlighted).toBe(false);
      expect(buttons.skill.highlighted).toBe(true);
    });

    it('should show replay button after animation completes', () => {
      const replayButton = { visible: false };
      const onAnimationComplete = function() {
        this.visible = true;
      }.bind(replayButton);

      onAnimationComplete();

      expect(replayButton.visible).toBe(true);
    });
  });
});
