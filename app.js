/**
 * Boss Stress Buster Web Game - Core Logic
 */

// Game States
const STATE_CUSTOMIZING = 'customizing-mode';
const STATE_PLAYING = 'playing-mode';
const STATE_VICTORY = 'victory-mode';

// Boss Configurations & Defaults
const MAX_HP = 500;
let currentHp = MAX_HP;
let totalHits = 0;
let comboCount = 0;
let maxCombo = 0;
let heartRate = 80;
let comboTimer = null;
let lastHitTime = 0;

// Customization Info
let bossInfo = {
  name: '김꼰대 부장',
  type: 'konda',
  quote: '"오늘 야근 다들 가능하지? 내일 아침 보고야."',
};

// Weapon specs
const WEAPONS = {
  paper: {
    damage: 5,
    cooldown: 0, // ms
    animationClass: 'hit-light',
    emoji: '🧻',
    particles: ['🧻', '📄', '📑', '🗒️'],
  },
  hammer: {
    damage: 15,
    cooldown: 300, // ms
    animationClass: 'hit-heavy',
    emoji: '🔨',
    particles: ['💥', '⭐', '💫', '🔨'],
  },
  coffee: {
    damage: 30,
    cooldown: 1000, // ms
    animationClass: 'hit-splash',
    emoji: '☕',
    particles: ['☕', '🟫', '💧', '💨'],
  },
  resignation: {
    damage: 100,
    cooldown: 10000, // ms (10 seconds)
    animationClass: 'hit-splash', // we also trigger screen shake
    emoji: '📄',
    particles: ['📄', '💸', '💥', '✨', '🔥'],
  }
};

let activeWeapon = 'paper';
let lastUsed = {
  paper: 0,
  hammer: 0,
  coffee: 0,
  resignation: 0,
};

// Particle Engine
let particles = [];
let animFrameId = null;

// Speech Bubble Text Pools
const BOSS_HIT_RESPONSES = [
  "앗! 내 서류!",
  "김대리, 지금 반항하는 건가?",
  "윽, 뜨거워! 에스프레소잖아!",
  "이게 무슨 짓이야!",
  "뿅망치?! 장난하나!",
  "내, 내 머리!",
  "사직서라니! 자네 미쳤어?!",
  "이거 결재 안 해줄 거야!",
  "살려주게, 김대리!",
  "아이구 나 죽네!",
  "이것 좀 치워!",
  "시말서 각오해!",
];

const ARCHETYPE_QUOTES = {
  micromanager: [
    "이 폰트 1pt만 키워와!",
    "보고서 행간 줄 간격이 안 맞잖아!",
    "김대리, 마우스 클릭 소리가 너무 요란한 거 아닌가?",
    "지금 화장실 몇 분째 가 있는 거지?",
    "메일 발송 전에 나한테 컨펌 먼저 받았나?"
  ],
  konda: [
    "라떼는 말이야, 퇴근이란 단어 자체가 없었어!",
    "요즘 젊은 친구들은 근성이 없어.",
    "내가 자네 나이 때는 밤을 새워도 쌩쌩했어.",
    "상사가 퇴근하기 전에 가방을 싸나?",
    "내가 다 자네 피가 되고 살이 되라고 하는 소리야."
  ],
  indecisive: [
    "음... 역시 시안 A로 할까? 아니 B로 하자. 잠깐, C는 어때?",
    "일단 다 작성해서 가져와봐. 보고 나서 결정할게.",
    "내가 단독으로 결정하기엔 리스크가 너무 크지 않나?",
    "다시 한 번 검토해보게. 뭐가 확실한지 모르겠어.",
    "내일 다시 이야기해보세. 오늘은 퇴근해."
  ],
  angry: [
    "이걸 보고서라고 써왔어?! 당장 치워!",
    "일 똑바로 안 해?! 정신 머리가 어디 간 거야!",
    "내 방으로 즉시 와! 당장!",
    "다 엎어! 처음부터 다시 해!",
    "내가 그렇게 말했는데도 귀뚱으로도 안 듣는구만!"
  ]
};

// UI Selectors
let elBody;
let elHeartRate;
let elRelievedScore;
let elTotalHits;
let elHudBossBadge;
let elHudBossName;
let elHealthPercentage;
let elHealthFill;
let elBossTargetArea;
let elBossSpeech;
let elHitEffectsLayer;
let elBossAvatarWrapper;
let elBossImage;
let elDizzyStars;
let elComboCount;
let elResignationCooldownOverlay;
let elCooldownTimer;
let elEditBossBtn;
let elBgmToggleBtn;
let elToastNotification;

// Initialize script when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  // DOM Cache
  elBody = document.body;
  elHeartRate = document.getElementById('heart-rate');
  elRelievedScore = document.getElementById('relieved-score');
  elTotalHits = document.getElementById('total-hits');
  elHudBossBadge = document.getElementById('hud-boss-badge');
  elHudBossName = document.getElementById('hud-boss-name');
  elHealthPercentage = document.getElementById('health-percentage');
  elHealthFill = document.getElementById('health-fill');
  elBossTargetArea = document.getElementById('boss-target-area');
  elBossSpeech = document.getElementById('boss-speech');
  elHitEffectsLayer = document.getElementById('hit-effects-layer');
  elBossAvatarWrapper = document.getElementById('boss-avatar-wrapper');
  elBossImage = document.getElementById('boss-image');
  elDizzyStars = document.getElementById('dizzy-stars');
  elComboCount = document.getElementById('combo-count');
  elResignationCooldownOverlay = document.getElementById('resignation-cooldown-overlay');
  elCooldownTimer = document.getElementById('cooldown-timer');
  elEditBossBtn = document.getElementById('edit-boss-btn');
  elBgmToggleBtn = document.getElementById('bgm-toggle-btn');
  elToastNotification = document.getElementById('toast-notification');

  // Setup Weapon Click Handlers
  const weaponCards = document.querySelectorAll('.weapon-card');
  weaponCards.forEach(card => {
    card.addEventListener('click', () => {
      const weaponType = card.getAttribute('data-weapon');
      selectWeapon(weaponType);
    });
  });

  // Target Click Action
  elBossTargetArea.addEventListener('click', handleBossClick);

  // Setup Header Button Actions
  elEditBossBtn.addEventListener('click', () => {
    playChirp(400, 0.1);
    setGameState(STATE_CUSTOMIZING);
  });

  elBgmToggleBtn.addEventListener('click', toggleBgm);

  // Setup Custom Quote Display Logic
  const selectQuote = document.getElementById('boss-quote');
  const customQuoteInput = document.getElementById('boss-custom-quote');
  selectQuote.addEventListener('change', () => {
    playChirp(700, 0.05);
  });
  customQuoteInput.addEventListener('focus', () => {
    // optional helper
  });

  // Start floating background particles loop (pure CSS particles or JS initialized particles)
  initBgParticles();

  // Start game loops for physics and cooldowns
  startLoop();
});

/**
 * Game State Switcher
 */
function setGameState(state) {
  elBody.className = state;
  
  if (state === STATE_CUSTOMIZING) {
    elEditBossBtn.style.display = 'none';
    stopBossAutoSpeeches();
  } else if (state === STATE_PLAYING) {
    elEditBossBtn.style.display = 'inline-block';
    startBossAutoSpeeches();
  } else if (state === STATE_VICTORY) {
    elEditBossBtn.style.display = 'none';
    stopBossAutoSpeeches();
  }
}

/**
 * Switch Active Weapon
 */
function selectWeapon(weaponType) {
  if (!WEAPONS[weaponType]) return;

  // Toggle active weapon class in list
  const weaponCards = document.querySelectorAll('.weapon-card');
  weaponCards.forEach(card => {
    if (card.getAttribute('data-weapon') === weaponType) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  // Remove existing cursor class and apply new one
  Object.keys(WEAPONS).forEach(w => {
    elBody.classList.remove(`active-weapon-${w}`);
  });
  elBody.classList.add(`active-weapon-${weaponType}`);

  activeWeapon = weaponType;
  
  // Play subtle feedback chirp
  playChirp(600 + (Object.keys(WEAPONS).indexOf(weaponType) * 100), 0.08);
}

/**
 * Form Submit Action - Start the Game
 */
function startGame(event) {
  event.preventDefault();
  
  // Initialize audio on first click interaction
  initAudioContext();

  const nameInput = document.getElementById('boss-name').value.trim();
  const typeSelect = document.getElementById('boss-type');
  const quoteSelect = document.getElementById('boss-quote');
  const customQuoteInput = document.getElementById('boss-custom-quote').value.trim();

  bossInfo.name = nameInput || '김꼰대 부장';
  bossInfo.type = typeSelect.value;
  
  // Determine catchphrase (prioritize custom quote)
  if (customQuoteInput) {
    bossInfo.quote = `"${customQuoteInput}"`;
  } else {
    bossInfo.quote = quoteSelect.options[quoteSelect.selectedIndex].text;
  }

  // Set up HUD labels
  elHudBossName.textContent = bossInfo.name;
  let typeLabel = typeSelect.options[typeSelect.selectedIndex].text.split(' (')[0];
  elHudBossBadge.textContent = typeLabel;

  // Reset HP and Stats
  currentHp = MAX_HP;
  totalHits = 0;
  comboCount = 0;
  maxCombo = 0;
  heartRate = 80;
  lastHitTime = 0;
  
  // Reset weapon cooldowns
  lastUsed = { paper: 0, hammer: 0, coffee: 0, resignation: 0 };

  // Update UI Stats
  updateStatsUI();

  // Reset Boss Image & dizzy state
  elBossImage.src = 'assets/boss_angry.png';
  elBossAvatarWrapper.classList.remove('dizzy');

  // Clear existing splats/hits
  elHitEffectsLayer.innerHTML = '';
  
  // Initialize speech bubble
  elBossSpeech.textContent = bossInfo.quote;
  elBossSpeech.classList.add('show');
  setTimeout(() => {
    if (elBody.className === STATE_PLAYING) {
      elBossSpeech.classList.remove('show');
    }
  }, 3500);

  // Transition Screen
  setGameState(STATE_PLAYING);
  selectWeapon('paper'); // Default weapon

  // Auto trigger BGM if checked/possible
  if (!isBgmPlaying) {
    startBgm();
  }

  showToast(`💥 ${bossInfo.name}이(가) 나타났습니다! 혼쭐을 내주세요!`);
}
window.startGame = startGame;

/**
 * Handle Target Whacking Clicks
 */
function handleBossClick(e) {
  if (elBody.className !== STATE_PLAYING) return;

  const now = Date.now();
  const weapon = WEAPONS[activeWeapon];
  const cooldown = weapon.cooldown;

  // Cooldown validation
  if (now - lastUsed[activeWeapon] < cooldown) {
    // Play error buzz chirp
    playChirp(150, 0.15);
    return;
  }

  // Update cooldown timestamp
  lastUsed[activeWeapon] = now;

  // Hit Math & damage
  currentHp = Math.max(0, currentHp - weapon.damage);
  totalHits++;
  
  // Trigger Sound effect based on weapon
  if (activeWeapon === 'paper') {
    playThud();
  } else if (activeWeapon === 'hammer') {
    playSqueak();
  } else if (activeWeapon === 'coffee') {
    playSplat();
  } else if (activeWeapon === 'resignation') {
    playUltimateBreak();
  }

  // Combo mechanics
  if (now - lastHitTime <= 2000) {
    comboCount++;
    if (comboCount > maxCombo) {
      maxCombo = comboCount;
    }
  } else {
    comboCount = 1;
  }
  lastHitTime = now;

  // Simulating heart rate increase relative to combo action
  heartRate = Math.min(160, 80 + (comboCount * 2) + Math.floor(Math.random() * 8));

  // Visual effects: Boss Avatar shake/jiggle
  triggerBossHitAnimation(weapon.animationClass);

  // Get Click Coordinates relative to target area
  const rect = elBossTargetArea.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Spawn visual hit particles at click coords
  spawnHitParticles(clickX, clickY, weapon.particles);

  // Spawn Floating hit text
  spawnFloatingText(clickX, clickY, weapon.damage);

  // Splat overlay for coffee weapon
  if (activeWeapon === 'coffee') {
    spawnCoffeeSplat(clickX, clickY);
  }

  // Resignation Ultimate camera flash & heavy shake
  if (activeWeapon === 'resignation') {
    triggerHeavyArenaShake();
  }

  // Dynamic Boss Speech bubble response
  if (totalHits % 5 === 0 || weapon.damage >= 30) {
    triggerBossSpeech();
  }

  // Update Stats UI
  updateStatsUI();

  // Check victory condition
  if (currentHp <= 0) {
    triggerVictory();
  }
}

/**
 * Update Health Bar and Sidebar HUD
 */
function updateStatsUI() {
  const hpPercent = Math.round((currentHp / MAX_HP) * 100);
  
  elHealthPercentage.textContent = hpPercent + "%";
  elHealthFill.style.width = hpPercent + "%";

  const relievedPercent = Math.round(((MAX_HP - currentHp) / MAX_HP) * 100);
  elRelievedScore.textContent = relievedPercent + "%";
  
  elTotalHits.textContent = totalHits + "회";
  elHeartRate.textContent = heartRate + " BPM";

  elComboCount.textContent = comboCount;

  // Animate combo number pulsing
  elComboCount.style.animation = 'none';
  elComboCount.offsetHeight; // trigger reflow
  elComboCount.style.animation = 'pulseCombo 0.2s ease';
}

/**
 * Trigger boss avatar visual hits
 */
function triggerBossHitAnimation(animClass) {
  elBossAvatarWrapper.classList.remove('hit-light', 'hit-heavy', 'hit-splash');
  elBossAvatarWrapper.offsetHeight; // trigger reflow
  elBossAvatarWrapper.classList.add(animClass);

  // Also red glow/tint filter on boss image momentarily
  elBossImage.style.filter = 'brightness(1.2) sepia(1) hue-rotate(-50deg) saturate(3)';
  setTimeout(() => {
    elBossImage.style.filter = 'none';
  }, 180);
}

/**
 * Trigger screen/arena shake
 */
function triggerHeavyArenaShake() {
  const arena = document.querySelector('.arena-panel');
  arena.classList.remove('shake');
  arena.offsetHeight; // reflow
  arena.classList.add('shake');
  
  // Flash effect on body background
  elBody.style.background = 'radial-gradient(circle, var(--color-red-glow) 0%, var(--bg-dark) 80%)';
  setTimeout(() => {
    elBody.style.background = '';
    arena.classList.remove('shake');
  }, 350);
}

/**
 * Spawn Floating Text on Hit Coords
 */
function spawnFloatingText(x, y, damage) {
  const textEl = document.createElement('span');
  textEl.className = 'floating-hit-text';
  textEl.style.left = `${x}px`;
  textEl.style.top = `${y - 15}px`;

  // Stylized quotes or damage numbers
  const randomPhrases = [
    "야근 거부! 🚫",
    "사직서 투하! 📄",
    "퇴근할래요! 🏃",
    "지연 보고! ⏰",
    "결재 반대! ❌",
    "보고서 크래시! 💥",
    "라떼 거절! ☕",
    "내 주말 돌려줘! 📅",
    "그만 괴롭혀요! 😭",
    "주 52시간! ⏱️"
  ];

  let displayContent = `-${damage} HP`;
  
  // 30% chance to show text phrase instead of raw numbers on small hits, or always on heavy damage
  if (damage >= 30 || Math.random() < 0.35) {
    if (activeWeapon === 'resignation') {
      displayContent = `💥 퇴사 폭탄! -${damage} HP`;
      textEl.style.color = 'var(--color-gold)';
    } else if (activeWeapon === 'coffee') {
      displayContent = `☕ 커피 샤워! -${damage} HP`;
      textEl.style.color = '#ff9f43';
    } else if (activeWeapon === 'hammer') {
      displayContent = `🔨 참교육 뿅! -${damage} HP`;
      textEl.style.color = 'var(--color-red)';
    } else {
      displayContent = randomPhrases[Math.floor(Math.random() * randomPhrases.length)];
      textEl.style.color = 'var(--color-cyan)';
    }
  } else {
    textEl.style.color = '#ffffff';
  }

  textEl.textContent = displayContent;
  elHitEffectsLayer.appendChild(textEl);

  // Automatically remove from DOM
  setTimeout(() => {
    if (textEl && textEl.parentNode) {
      textEl.parentNode.removeChild(textEl);
    }
  }, 800);
}

/**
 * Spawn Coffee Splat Sticker
 */
function spawnCoffeeSplat(x, y) {
  const splat = document.createElement('div');
  splat.className = 'coffee-splat';
  // Adjust anchor point to center of splash
  splat.style.left = `${x - 30}px`;
  splat.style.top = `${y - 30}px`;

  // Randomize rotation slightly
  const rot = Math.floor(Math.random() * 360);
  splat.style.transform = `scale(1) rotate(${rot}deg)`;

  elHitEffectsLayer.appendChild(splat);

  // Auto clean
  setTimeout(() => {
    if (splat && splat.parentNode) {
      splat.parentNode.removeChild(splat);
    }
  }, 1000);
}

/**
 * Spawn flying physics particles
 */
function spawnHitParticles(x, y, particlePool) {
  const particleCount = 8 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i < particleCount; i++) {
    const pEl = document.createElement('span');
    pEl.style.position = 'absolute';
    pEl.style.left = `${x}px`;
    pEl.style.top = `${y}px`;
    pEl.style.pointerEvents = 'none';
    pEl.style.fontSize = `${12 + Math.random() * 12}px`;
    pEl.style.zIndex = '30';
    pEl.textContent = particlePool[Math.floor(Math.random() * particlePool.length)];

    elHitEffectsLayer.appendChild(pEl);

    // Initial random velocities
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    
    particles.push({
      element: pEl,
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // slightly bias upwards
      rotation: Math.random() * 360,
      vRot: (Math.random() * 10) - 5,
      alpha: 1,
      life: 1.0,
      decay: 0.02 + Math.random() * 0.03,
      gravity: 0.25
    });
  }
}

/**
 * Boss Dialogue speech trigger
 */
function triggerBossSpeech(customText = null) {
  let speech = "";
  if (customText) {
    speech = customText;
  } else {
    // Choose between archetype quotes and general angry reactions
    if (Math.random() < 0.4) {
      const typeList = ARCHETYPE_QUOTES[bossInfo.type] || ARCHETYPE_QUOTES.konda;
      speech = typeList[Math.floor(Math.random() * typeList.length)];
    } else {
      speech = BOSS_HIT_RESPONSES[Math.floor(Math.random() * BOSS_HIT_RESPONSES.length)];
    }
  }

  elBossSpeech.textContent = speech;
  elBossSpeech.classList.remove('show');
  elBossSpeech.offsetHeight; // reflow
  elBossSpeech.classList.add('show');

  // Auto hide after 2.0s
  // Store a timeout id or clear current speech bubble to avoid race condition
  if (window.speechTimeout) {
    clearTimeout(window.speechTimeout);
  }
  window.speechTimeout = setTimeout(() => {
    if (elBody.className === STATE_PLAYING) {
      elBossSpeech.classList.remove('show');
    }
  }, 2200);
}

// Auto quotes routine
let autoSpeechInterval = null;
function startBossAutoSpeeches() {
  stopBossAutoSpeeches();
  // Boss speaks on their own every 8-12 seconds
  autoSpeechInterval = setInterval(() => {
    if (elBody.className === STATE_PLAYING && Math.random() < 0.7) {
      const quotes = ARCHETYPE_QUOTES[bossInfo.type] || ARCHETYPE_QUOTES.konda;
      const speech = quotes[Math.floor(Math.random() * quotes.length)];
      triggerBossSpeech(speech);
    }
  }, 9000);
}
function stopBossAutoSpeeches() {
  if (autoSpeechInterval) {
    clearInterval(autoSpeechInterval);
    autoSpeechInterval = null;
  }
}

/**
 * Game loops (Physics and Cooldown updates)
 */
function startLoop() {
  function loop() {
    updateParticles();
    updateCooldownsUI();
    decayStats();
    animFrameId = requestAnimationFrame(loop);
  }
  animFrameId = requestAnimationFrame(loop);
}

/**
 * Update active custom particle system physics
 */
function updateParticles() {
  const remaining = [];

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    
    // Physics updates
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.vRot;
    p.life -= p.decay;
    p.alpha = Math.max(0, p.life);

    if (p.life > 0) {
      p.element.style.transform = `translate3d(${p.x - p.element.offsetLeft}px, ${p.y - p.element.offsetTop}px, 0) rotate(${p.rotation}deg)`;
      p.element.style.opacity = p.alpha;
      remaining.push(p);
    } else {
      // Remove element
      if (p.element && p.element.parentNode) {
        p.element.parentNode.removeChild(p.element);
      }
    }
  }

  particles = remaining;
}

/**
 * Update weapons cooldown overlays dynamically
 */
function updateCooldownsUI() {
  const now = Date.now();
  
  // Resignation Letter Ultimate Cooldown
  const resCooldwn = WEAPONS.resignation.cooldown;
  const resElapsed = now - lastUsed.resignation;
  
  if (resElapsed < resCooldwn) {
    const remainingPercent = Math.max(0, 100 - (resElapsed / resCooldwn) * 100);
    elResignationCooldownOverlay.style.width = remainingPercent + "%";
    
    // Update label text
    const secsRemaining = ((resCooldwn - resElapsed) / 1000).toFixed(1);
    elCooldownTimer.textContent = `데미지: 100 | 쿨다운 중 (${secsRemaining}s)`;
    elCooldownTimer.style.color = 'var(--color-cyan)';
    document.getElementById('weapon-resignation').classList.add('cooling-down');
  } else {
    elResignationCooldownOverlay.style.width = "0%";
    elCooldownTimer.textContent = "데미지: 100 | 쿨타임: 10s";
    elCooldownTimer.style.color = '';
    document.getElementById('weapon-resignation').classList.remove('cooling-down');
  }

  // Visual filters on other cooldowns
  const weapons = ['hammer', 'coffee'];
  weapons.forEach(wName => {
    const card = document.getElementById(`weapon-${wName}`);
    const elapsed = now - lastUsed[wName];
    const cd = WEAPONS[wName].cooldown;
    if (elapsed < cd) {
      card.style.opacity = 0.55;
    } else {
      card.style.opacity = 1.0;
    }
  });
}

/**
 * Slowly decays heart rate back to 80 BPM when idle
 */
function decayStats() {
  const now = Date.now();
  if (now - lastHitTime > 3000) {
    // Reset combo after 2 seconds
    if (comboCount > 0 && now - lastHitTime > 2000) {
      comboCount = 0;
      elComboCount.textContent = 0;
    }
    // Smooth heart rate decay
    if (heartRate > 80) {
      heartRate = Math.max(80, heartRate - 0.2);
      elHeartRate.textContent = Math.round(heartRate) + " BPM";
    }
  }
}

/**
 * Handle Game Victory Screen Transition
 */
function triggerVictory() {
  // Play fan fare victory audio
  playVictoryFanfare();

  // Set game mode to victory
  setGameState(STATE_VICTORY);

  // Set dizzy boss
  elBossImage.src = 'assets/boss_dizzy.png';
  elBossAvatarWrapper.classList.add('dizzy');
  
  // Set speech bubble content & force show
  elBossSpeech.textContent = "김대리... 사직서 승인하겠네... 야근은 취소야! 😭";
  elBossSpeech.classList.add('show');

  // Fill in report stats
  document.getElementById('report-boss-name').textContent = bossInfo.name;
  document.getElementById('report-total-hits').textContent = totalHits + "회";
  document.getElementById('report-max-combo').textContent = maxCombo + " 콤보";

  showToast(`🎉 축하합니다! ${bossInfo.name}의 고집을 격파하고 자유를 얻었습니다!`);
}

/**
 * Reset and return to customizer setup
 */
function resetGame() {
  playChirp(350, 0.15);
  setGameState(STATE_CUSTOMIZING);
  
  // Clear game counters
  currentHp = MAX_HP;
  totalHits = 0;
  comboCount = 0;
  maxCombo = 0;
  heartRate = 80;
  particles.forEach(p => {
    if (p.element && p.element.parentNode) p.element.parentNode.removeChild(p.element);
  });
  particles = [];
  elHitEffectsLayer.innerHTML = '';
}
window.resetGame = resetGame;

/**
 * Share Report to Clipboard
 */
function shareStressReport() {
  playChirp(800, 0.1);

  const reportText = `[STRESS BUSTER 부장님 격파 성적표]
🔥 참교육 대상: ${bossInfo.name} (${elHudBossBadge.textContent})
💥 누적 격파 타격: ${totalHits}회
⚡ 최고 콤보 기록: ${maxCombo} 콤보
🎉 해소된 스트레스: 100% (STRESS ZERO!)

"사직서 투하 한방에 어질어질해진 부장님은 결국 야근을 취소하고 눈물로 퇴사를 수락하셨습니다... 😭"
퇴근길 스트레스 해소 웹게임 플레이하기!`;

  navigator.clipboard.writeText(reportText).then(() => {
    showToast("📋 성적표 복사 완료! 메신저나 SNS에 공유해보세요.");
  }).catch(err => {
    showToast("복사에 실패했습니다. 수동으로 복사하세요!");
  });
}
window.shareStressReport = shareStressReport;

/**
 * BGM Controls
 */
function toggleBgm() {
  if (isBgmPlaying) {
    stopProceduralBgm();
    elBgmToggleBtn.textContent = '🔇 BGM 끔';
    showToast('BGM이 정지되었습니다.');
  } else {
    startBgm();
  }
  playChirp(700, 0.06);
}

function startBgm() {
  startProceduralBgm();
  elBgmToggleBtn.textContent = '🎵 BGM 켬';
  showToast('로파이 힐링 BGM 연주를 시작합니다.');
}

/**
 * Toast Notifications
 */
function showToast(message) {
  elToastNotification.textContent = message;
  elToastNotification.classList.remove('show');
  elToastNotification.offsetHeight; // reflow
  elToastNotification.classList.add('show');
  
  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }
  window.toastTimeout = setTimeout(() => {
    elToastNotification.classList.remove('show');
  }, 3000);
}

/**
 * Background flying particles (Initialization helper)
 */
function initBgParticles() {
  const container = document.getElementById('particles-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Create 15 floating particles
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}vw`;
    p.style.animationDelay = `${Math.random() * 15}s`;
    p.style.opacity = Math.random() * 0.4;
    container.appendChild(p);
  }
}
