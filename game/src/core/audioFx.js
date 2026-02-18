const NOTE = {
  click: 440,
  buy: 620,
  hit: 280,
  skill: 760,
  heal: 520,
  ko: 180
};

const SFX_KEY = {
  click: "sfx_key",
  buy: "sfx_blaster",
  hit: "sfx_sword",
  skill: "sfx_shot",
  heal: "sfx_ping",
  ko: "sfx_explosion"
};

export class AudioFx {
  constructor(scene) {
    this.scene = scene;
    this.enabled = true;
    const game = this.scene?.game;
    const seedLevel = Number.isFinite(game?.__forestVolumeLevel) ? Math.floor(game.__forestVolumeLevel) : 10;
    this.volumeLevel = Math.min(10, Math.max(1, seedLevel));
  }

  setEnabled(value) {
    this.enabled = value;
    const globalBgm = this.scene?.game?.__forestBgm;
    if (globalBgm?.sound) globalBgm.sound.setMute(!this.enabled);
  }

  setVolumeLevel(level) {
    const safe = Math.min(10, Math.max(1, Math.floor(Number(level) || 10)));
    this.volumeLevel = safe;
    if (this.scene?.game) this.scene.game.__forestVolumeLevel = safe;
    const globalBgm = this.scene?.game?.__forestBgm;
    if (globalBgm?.sound) {
      const baseVolume = Number.isFinite(globalBgm.baseVolume) ? globalBgm.baseVolume : 0.2;
      globalBgm.sound.setVolume(baseVolume * this.getMasterVolume());
    }
  }

  getVolumeLevel() {
    return this.volumeLevel;
  }

  getMasterVolume() {
    return this.volumeLevel / 10;
  }

  startBgm(key, volume = 0.2) {
    const game = this.scene?.game;
    if (!game) return;
    const current = game.__forestBgm;
    if (current?.key === key && current?.sound?.isPlaying) {
      current.sound.setMute(!this.enabled);
      current.baseVolume = volume;
      current.sound.setVolume(volume * this.getMasterVolume());
      return;
    }
    if (current?.sound) {
      current.sound.stop();
      current.sound.destroy();
      game.__forestBgm = null;
    }
    if (!this.scene.cache.audio.exists(key)) return;
    const sound = this.scene.sound.add(key, { loop: true, volume: volume * this.getMasterVolume(), mute: !this.enabled });
    sound.play();
    game.__forestBgm = { key, sound, baseVolume: volume };
  }

  stopBgm() {
    const game = this.scene?.game;
    const current = game?.__forestBgm;
    if (!current?.sound) return;
    current.sound.stop();
    current.sound.destroy();
    game.__forestBgm = null;
  }

  playPlaylist(keys, volume = 0.2, shuffle = true) {
    if (!keys || keys.length === 0) return;

    const game = this.scene?.game;
    // If already playing this playlist, do nothing?
    // Simplified: Just stop current and start new playlist
    this.stopBgm();

    let playlist = [...keys];
    if (shuffle) {
      // Fisher-Yates shuffle
      for (let i = playlist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
      }
    }

    const playTrack = (index) => {
      if (!this.scene?.game) return; // Scene destroyed
      const key = playlist[index];
      if (!this.scene.cache.audio.exists(key)) {
        // Skip missing track
        const nextIndex = (index + 1) % playlist.length;
        if (playlist.length > 1) playTrack(nextIndex);
        return;
      }

      const sound = this.scene.sound.add(key, { volume: volume * this.getMasterVolume(), mute: !this.enabled });
      sound.play();

      sound.once('complete', () => {
        const nextIndex = (index + 1) % playlist.length;
        playTrack(nextIndex);
      });

      game.__forestBgm = { key: "playlist", sound, baseVolume: volume, playlist, currentIndex: index };
    };

    playTrack(0);
  }

  playWeightedPlaylist(weightsMap, volume = 0.2) {
    if (!weightsMap || Object.keys(weightsMap).length === 0) return;
    const game = this.scene?.game;
    this.stopBgm();

    const playNext = () => {
      if (!this.scene?.game) return;
      const keys = Object.keys(weightsMap).filter((k) => this.scene.cache.audio.exists(k));
      if (keys.length === 0) return;

      const totalWeight = keys.reduce((sum, k) => sum + weightsMap[k], 0);
      let random = Math.random() * totalWeight;
      let selectedKey = keys[0];

      for (const key of keys) {
        if (random < weightsMap[key]) {
          selectedKey = key;
          break;
        }
        random -= weightsMap[key];
      }

      const sound = this.scene.sound.add(selectedKey, { volume: volume * this.getMasterVolume(), mute: !this.enabled });
      sound.play();
      sound.once("complete", () => playNext());

      game.__forestBgm = { key: "weighted_playlist", sound, baseVolume: volume, weightsMap };
    };

    playNext();
  }


  play(type, duration = 0.08) {
    if (!this.enabled) return;
    const master = this.getMasterVolume();
    const key = SFX_KEY[type];
    if (key && this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: (type === "ko" ? 0.26 : 0.18) * master });
      return;
    }

    const game = this.scene?.game;
    const context = game?.sound?.context;
    if (!context) return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = type === "skill" ? "triangle" : "sine";
    oscillator.frequency.value = NOTE[type] ?? 420;
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.06 * master, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }
}
