/**
 * Boss Stress Buster Web Game - Core Logic (AdSense & Feature Upgraded)
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

// Upgraded Mechanics State
let stressPoints = 0;
let isFeverMode = false;
let gameState = STATE_CUSTOMIZING;

// Customization Info
let bossInfo = {
  name: '김꼰대 부장',
  type: 'konda',
  quote: '"오늘 야근 다들 가능하지? 내일 아침 보고야."',
  customImg: null, // Holds FileReader DataURL
};

// Weapon base specs
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
    animationClass: 'hit-splash',
    emoji: '📄',
    particles: ['📄', '💸', '💥', '✨', '🔥'],
  }
};

// Weapon Upgrade Level and Base Cost Configurations
let weaponUpgrades = {
  paper: 1,
  hammer: 1,
  coffee: 1,
  resignation: 1
};

const UPGRADE_COSTS = {
  paper: 25,
  hammer: 80,
  coffee: 180,
  resignation: 400
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
    "내가 결정하기엔 리스크가 너무 크지 않나?",
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

// Upgraded Selectors
let elBossCustomImg;
let elShopPointsValue;
let elFeverBanner;

// New element selectors
let elTearLeft;
let elTearRight;
let elPainEmoji;
let elRandomEventOverlay;
let elEventIcon;
let elEventTitle;
let elEventDesc;
let elEventQuote;
let elEventTimerFill;

// Random Event State
let randomEventTimeout = null;
let activeEventEffect = null;
let isInvincible = false;
let damageMult = 1.0;
let clickBlocked = false;
let hpPhase = 'normal'; // 'normal' | 'warning' | 'danger'

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
  
  // Upgraded elements
  elBossCustomImg = document.getElementById('boss-custom-img');
  elShopPointsValue = document.getElementById('shop-points-value');
  elFeverBanner = document.getElementById('fever-banner');

  // New event/pain elements
  elTearLeft = document.getElementById('tear-left');
  elTearRight = document.getElementById('tear-right');
  elPainEmoji = document.getElementById('pain-emoji');
  elRandomEventOverlay = document.getElementById('random-event-overlay');
  elEventIcon = document.getElementById('event-icon');
  elEventTitle = document.getElementById('event-title');
  elEventDesc = document.getElementById('event-desc');
  elEventQuote = document.getElementById('event-quote');
  elEventTimerFill = document.getElementById('event-timer-fill');

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

  // Handle custom image uploads via FileReader
  elBossCustomImg.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        bossInfo.customImg = event.target.result;
        showToast("📸 부장님 얼굴 사진이 등록되었습니다!");
        playChirp(800, 0.1);
      };
      reader.readAsDataURL(file);
    } else {
      bossInfo.customImg = null;
    }
  });

  // Start floating background particles loop
  initBgParticles();

  // Start game loops for physics and cooldowns
  startLoop();
});

/**
 * Game State Switcher
 */
function setGameState(state) {
  gameState = state;
  elBody.classList.remove(STATE_CUSTOMIZING, STATE_PLAYING, STATE_VICTORY);
  elBody.classList.add(state);
  
  if (state === STATE_CUSTOMIZING) {
    elEditBossBtn.style.display = 'none';
    stopBossAutoSpeeches();
    deactivateFever();
  } else if (state === STATE_PLAYING) {
    elEditBossBtn.style.display = 'inline-block';
    startBossAutoSpeeches();
  } else if (state === STATE_VICTORY) {
    elEditBossBtn.style.display = 'none';
    stopBossAutoSpeeches();
    deactivateFever();
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
  stressPoints = 0;
  isFeverMode = false;
  weaponUpgrades = { paper: 1, hammer: 1, coffee: 1, resignation: 1 };
  
  // Reset weapon cooldowns
  lastUsed = { paper: 0, hammer: 0, coffee: 0, resignation: 0 };

  // Set Custom Boss Image or Default image
  elBossImage.style.filter = 'none';
  if (bossInfo.customImg) {
    elBossImage.src = bossInfo.customImg;
  } else {
    elBossImage.src = 'assets/boss_angry.png';
  }
  elBossAvatarWrapper.classList.remove('dizzy');

  // Update UI Stats & Shop Upgrade states
  updateStatsUI();
  updateShopUI();

  // Clear existing splats/hits
  elHitEffectsLayer.innerHTML = '';
  
  // Initialize speech bubble
  elBossSpeech.textContent = bossInfo.quote;
  elBossSpeech.classList.add('show');
  setTimeout(() => {
    if (gameState === STATE_PLAYING) {
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

  // Reset event state and start random event engine
  isInvincible = false;
  damageMult = 1.0;
  clickBlocked = false;
  hpPhase = 'normal';
  elBody.classList.remove('hp-phase-warning', 'hp-phase-danger');
  elBossAvatarWrapper.classList.remove('shielded', 'invincible');
  stopRandomEvents();
  scheduleRandomEvent();
}
window.startGame = startGame;

/**
 * Handle Target Whacking Clicks
 */
function handleBossClick(e) {
  if (gameState !== STATE_PLAYING) return;
  if (clickBlocked) {
    // Show boss taunting during click block
    triggerBossSpeech("여보세요?! 잠깐이요! 전화 중이에요!");
    return;
  }

  const now = Date.now();
  const weapon = WEAPONS[activeWeapon];
  
  // Upgraded: Cooldown calculation (decreases with weapon level)
  let cdCoeff = Math.pow(0.85, weaponUpgrades[activeWeapon] - 1);
  let weaponCooldown = Math.max(activeWeapon === 'resignation' ? 3000 : (activeWeapon === 'paper' ? 0 : 80), Math.round(weapon.cooldown * cdCoeff));
  
  // Fever Mode bypasses cooldowns to create a satisfying click-frenzy (except 50ms anti-spam lock)
  let effectiveCooldown = isFeverMode ? 50 : weaponCooldown;

  // Cooldown validation
  if (now - lastUsed[activeWeapon] < effectiveCooldown) {
    // Play quick error chirp
    playChirp(150, 0.08);
    return;
  }

  // Update cooldown timestamp
  lastUsed[activeWeapon] = now;

  // Upgraded: Damage calculation (increases with weapon level and doubles in Fever Mode)
  let dmgCoeff = 1 + (weaponUpgrades[activeWeapon] - 1) * 0.35;
  let baseDamage = Math.round(weapon.damage * dmgCoeff);
  let rawDamage = isFeverMode ? baseDamage * 2 : baseDamage;
  // Apply event damage multiplier (mercy plea debuff etc)
  let damage = isInvincible ? 0 : Math.max(1, Math.round(rawDamage * damageMult));

  currentHp = Math.max(0, currentHp - damage);
  totalHits++;
  
  // Update HP phase for visual effects
  updateHpPhase();
  
  // Gain Stress Points (SP) based on damage dealt
  stressPoints += damage;
  updateShopUI();

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

  // Trigger Fever Mode if Combo reaches 15
  if (comboCount >= 15 && !isFeverMode) {
    activateFever();
  }

  // High pitch chirp variation during Fever Time click speed
  if (isFeverMode) {
    playChirp(800 + Math.min(200, comboCount * 6), 0.05);
  }

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
  spawnFloatingText(clickX, clickY, damage);

  // Splat overlay for coffee weapon
  if (activeWeapon === 'coffee') {
    spawnCoffeeSplat(clickX, clickY);
  }

  // Resignation Ultimate camera flash & heavy shake
  if (activeWeapon === 'resignation') {
    triggerHeavyArenaShake();
  }

  // Dynamic Boss Speech bubble response
  if (totalHits % 5 === 0 || damage >= 30) {
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
 * Upgraded Shop UI updates
 */
function updateShopUI() {
  elShopPointsValue.textContent = stressPoints + " SP";
  
  Object.keys(UPGRADE_COSTS).forEach(w => {
    const lvl = weaponUpgrades[w];
    const cost = Math.round(UPGRADE_COSTS[w] * Math.pow(1.5, lvl - 1));
    
    // Update labels
    const elLevel = document.getElementById(`level-${w}`);
    const elCost = document.getElementById(`cost-${w}`);
    if (elLevel) elLevel.textContent = `Lv.${lvl}`;
    if (elCost) elCost.textContent = `${cost}`;
    
    // Enable or disable upgrade buttons
    const btn = document.querySelector(`.shop-item[data-weapon="${w}"] .shop-upgrade-btn`);
    if (btn) {
      if (stressPoints >= cost) {
        btn.disabled = false;
      } else {
        btn.disabled = true;
      }
    }
  });
}

/**
 * Upgraded Weapon Level up purchase handler
 */
function upgradeWeapon(weaponType) {
  if (gameState !== STATE_PLAYING) return;
  
  const lvl = weaponUpgrades[weaponType];
  const cost = Math.round(UPGRADE_COSTS[weaponType] * Math.pow(1.5, lvl - 1));
  
  if (stressPoints >= cost) {
    stressPoints -= cost;
    weaponUpgrades[weaponType]++;
    
    // Play shop sound effect (high pitch)
    playChirp(900, 0.15);
    
    showToast(`⚡ ${WEAPONS[weaponType].emoji} 무기가 레벨 ${weaponUpgrades[weaponType]}(으)로 강화되었습니다! (공격력 증가 + 쿨다운 감소)`);
    
    // Refresh Shop & HUD values
    updateShopUI();
    updateStatsUI();
  }
}
window.upgradeWeapon = upgradeWeapon;

/**
 * Activate combo Fever Time
 */
function activateFever() {
  isFeverMode = true;
  elBody.classList.add('fever-active');
  elFeverBanner.classList.add('active');
  
  playUltimateBreak(); // Dramatic siren sweep
  showToast("🔥 피버 타임 활성화! 공격속도 극대화 + 데미지 2배! 🔥");
}

/**
 * Deactivate Fever mode
 */
function deactivateFever() {
  isFeverMode = false;
  if (elBody) elBody.classList.remove('fever-active');
  if (elFeverBanner) elFeverBanner.classList.remove('active');
}

/**
 * Trigger boss avatar visual hits
 */
function triggerBossHitAnimation(animClass) {
  // Remove all hit classes and force reflow so animation re-triggers on rapid clicks
  elBossAvatarWrapper.classList.remove('hit-light', 'hit-heavy', 'hit-splash', 'boss-pain');
  void elBossAvatarWrapper.offsetWidth; // force reflow
  elBossAvatarWrapper.classList.add(animClass);
  // Always add pain class for the shiver + tint effect
  elBossAvatarWrapper.classList.add('boss-pain');

  // Auto-remove the class when animation finishes (allows re-triggering)
  const onEnd = () => {
    elBossAvatarWrapper.classList.remove(animClass, 'boss-pain');
    elBossAvatarWrapper.removeEventListener('animationend', onEnd);
  };
  elBossAvatarWrapper.addEventListener('animationend', onEnd, { once: true });

  // Red tint flash filter on boss image
  elBossImage.style.filter = 'brightness(1.4) sepia(1) hue-rotate(-45deg) saturate(4) contrast(1.1)';
  setTimeout(() => {
    if (gameState === STATE_VICTORY && bossInfo.customImg) {
      elBossImage.style.filter = 'grayscale(0.5) sepia(0.5) rotate(10deg)';
    } else {
      elBossImage.style.filter = 'none';
    }
  }, animClass === 'hit-heavy' ? 280 : 160);

  // Show pain emoji on heavy/splash hits
  if (animClass !== 'hit-light' || Math.random() < 0.3) {
    triggerPainEmoji(animClass);
  }

  // Tears on heavy hits or below 50% HP
  if (animClass === 'hit-heavy' || animClass === 'hit-splash' || currentHp < MAX_HP * 0.5) {
    if (Math.random() < (currentHp < MAX_HP * 0.25 ? 0.85 : 0.4)) {
      triggerBossTears();
    }
  }
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

  // Stylized slogans
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
  
  if (isFeverMode) {
    displayContent = `🔥 피버 크리티컬! -${damage} HP`;
    textEl.style.color = 'var(--color-red)';
    textEl.style.fontSize = '1.3rem';
  } else if (damage >= 30 || Math.random() < 0.35) {
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
  splat.style.left = `${x - 30}px`;
  splat.style.top = `${y - 30}px`;

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

    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    
    particles.push({
      element: pEl,
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
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

  if (window.speechTimeout) {
    clearTimeout(window.speechTimeout);
  }
  window.speechTimeout = setTimeout(() => {
    if (gameState === STATE_PLAYING) {
      elBossSpeech.classList.remove('show');
    }
  }, 2200);
}

// Auto quotes routine
let autoSpeechInterval = null;
function startBossAutoSpeeches() {
  stopBossAutoSpeeches();
  autoSpeechInterval = setInterval(() => {
    if (gameState === STATE_PLAYING && Math.random() < 0.7) {
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
  
  // Resignation Letter Cooldown (Bypassed in Fever mode)
  const resCooldwn = WEAPONS.resignation.cooldown;
  let cdCoeff = Math.pow(0.85, weaponUpgrades.resignation - 1);
  let effectiveResCd = Math.max(3000, Math.round(resCooldwn * cdCoeff));

  const resElapsed = now - lastUsed.resignation;
  
  if (resElapsed < effectiveResCd && !isFeverMode) {
    const remainingPercent = Math.max(0, 100 - (resElapsed / effectiveResCd) * 100);
    elResignationCooldownOverlay.style.width = remainingPercent + "%";
    
    const secsRemaining = ((effectiveResCd - resElapsed) / 1000).toFixed(1);
    elCooldownTimer.textContent = `데미지: 100 | 쿨다운 중 (${secsRemaining}s)`;
    elCooldownTimer.style.color = 'var(--color-cyan)';
    document.getElementById('weapon-resignation').classList.add('cooling-down');
  } else {
    elResignationCooldownOverlay.style.width = "0%";
    elCooldownTimer.textContent = "데미지: 100 | 쿨타임: 10s";
    elCooldownTimer.style.color = '';
    document.getElementById('weapon-resignation').classList.remove('cooling-down');
  }

  // Visual opacity filters on hammer & coffee cooldowns
  const weapons = ['hammer', 'coffee'];
  weapons.forEach(wName => {
    const card = document.getElementById(`weapon-${wName}`);
    const elapsed = now - lastUsed[wName];
    let coeff = Math.pow(0.85, weaponUpgrades[wName] - 1);
    let cd = Math.max(80, Math.round(WEAPONS[wName].cooldown * coeff));

    if (elapsed < cd && !isFeverMode) {
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
    if (comboCount > 0 && now - lastHitTime > 2000) {
      comboCount = 0;
      elComboCount.textContent = 0;
      
      // End Fever mode when combo drops to 0
      if (isFeverMode) {
        deactivateFever();
        showToast("피버 타임이 종료되었습니다.");
      }
    }
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

  // Set dizzy boss face
  if (bossInfo.customImg) {
    elBossImage.src = bossInfo.customImg;
    elBossImage.style.filter = 'grayscale(0.5) sepia(0.5) rotate(10deg)';
  } else {
    elBossImage.src = 'assets/boss_dizzy.png';
  }
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
  stressPoints = 0;
  isFeverMode = false;
  weaponUpgrades = { paper: 1, hammer: 1, coffee: 1, resignation: 1 };

  // Reset event state
  stopRandomEvents();
  isInvincible = false;
  damageMult = 1.0;
  clickBlocked = false;
  hpPhase = 'normal';
  elBody.classList.remove('hp-phase-warning', 'hp-phase-danger');
  if (elBossAvatarWrapper) elBossAvatarWrapper.classList.remove('shielded', 'invincible', 'boss-pain');
  if (elRandomEventOverlay) elRandomEventOverlay.style.display = 'none';
  
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

/**
 * Legal Modal overlays toggle helpers
 */
function openModal(id) {
  playChirp(700, 0.08);
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}
function closeModal(id) {
  playChirp(400, 0.08);
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}
window.openModal = openModal;
window.closeModal = closeModal;

/* ============================================
   HP PHASE TRACKER
   ============================================ */
function updateHpPhase() {
  const hpRatio = currentHp / MAX_HP;
  if (hpRatio <= 0.25 && hpPhase !== 'danger') {
    hpPhase = 'danger';
    elBody.classList.remove('hp-phase-warning');
    elBody.classList.add('hp-phase-danger');
    triggerBossTears();
    triggerBossSpeech('이... 이러다 내가 정말 쓰러지겠어... 도와줘요... 😭');
    showToast('⚠️ 부장님 HP 25% 돌파! 거의 다 왔어요!');
  } else if (hpRatio <= 0.5 && hpPhase === 'normal') {
    hpPhase = 'warning';
    elBody.classList.add('hp-phase-warning');
    triggerBossSpeech('흑... 설마 내가 지는 건가... 이럴 수가...');
    showToast('⚡ 부장님 HP 50%! 흔들리고 있어요!');
  }
}

/* ============================================
   BOSS TEARS EFFECT
   ============================================ */
function triggerBossTears() {
  if (!elTearLeft || !elTearRight) return;
  
  // Restart animations by removing/re-adding class
  elTearLeft.classList.remove('crying');
  elTearRight.classList.remove('crying');
  void elTearLeft.offsetWidth; // reflow
  void elTearRight.offsetWidth;
  
  elTearLeft.classList.add('crying');
  // Slight delay for right tear for natural stagger
  setTimeout(() => { elTearRight.classList.add('crying'); }, 180);
  
  // Clean up
  setTimeout(() => {
    elTearLeft.classList.remove('crying');
    elTearRight.classList.remove('crying');
  }, 1300);
}

/* ============================================
   PAIN EMOJI FLOATING OVERLAY
   ============================================ */
const PAIN_EMOJIS_LIGHT = ['😣', '🥴', '😤', '😖'];
const PAIN_EMOJIS_HEAVY = ['😱', '💀', '🤯', '😵', '😭'];
const PAIN_EMOJIS_SPLASH = ['🌊😭', '☕😱', '💧😤'];

function triggerPainEmoji(animClass) {
  if (!elPainEmoji) return;
  let pool = PAIN_EMOJIS_LIGHT;
  if (animClass === 'hit-heavy')  pool = PAIN_EMOJIS_HEAVY;
  if (animClass === 'hit-splash') pool = PAIN_EMOJIS_SPLASH;
  
  elPainEmoji.textContent = pool[Math.floor(Math.random() * pool.length)];
  elPainEmoji.classList.remove('show');
  void elPainEmoji.offsetWidth; // reflow
  elPainEmoji.classList.add('show');
  
  setTimeout(() => { elPainEmoji.classList.remove('show'); }, 900);
}

/* ============================================
   RANDOM SURPRISE EVENT ENGINE
   ============================================ */
const RANDOM_EVENTS = [
  {
    id: 'shield',
    icon: '🛡️',
    title: '긴급 방어막 발동!',
    desc: '부장님이 회의 자료 더미를 방패로 세웠습니다! HP가 50 회복됩니다.',
    quotes: [
      '"라떼는 말이야... 이 정도 타격은 기합으로 버텼어! (부들부들)"',
      '"아직 안 끝났어! 운동 좀 했거든! 3층 계단 올라다니는 것도 운동이야!"',
      '"30년 경력이 그냥 생긴 줄 알아?! ...아, 아파..."',
    ],
    duration: 2500,
    apply: () => {
      currentHp = Math.min(MAX_HP, currentHp + 50);
      elBossAvatarWrapper.classList.add('shielded');
      updateStatsUI();
      setTimeout(() => elBossAvatarWrapper.classList.remove('shielded'), 2500);
    }
  },
  {
    id: 'invincible',
    icon: '💊',
    title: '진통제 긴급 복용!',
    desc: '부장님이 두통약을 꺼내 먹고 있습니다... 3초간 무적!',
    quotes: [
      '"잠깐만요! 머리가 너무 아파서... 이건 업무상 재해예요... 흑흑"',
      '"두통약 좀 먹고 다시 해요! 제발! 저도 힘들다고요!"',
      '"이러다 내가 산재 신청하겠어... 그럼 회사 망해... 우리 둘 다 길바닥이야!"',
    ],
    duration: 3000,
    apply: () => {
      isInvincible = true;
      elBossAvatarWrapper.classList.add('invincible');
      setTimeout(() => {
        isInvincible = false;
        elBossAvatarWrapper.classList.remove('invincible');
        showToast('💊 진통제 효과가 끝났습니다! 계속 공격하세요!');
      }, 3000);
    }
  },
  {
    id: 'mercy',
    icon: '😭',
    title: '불쌍한 애원 발동!',
    desc: '부장님이 눈물을 흘리며 애원하고 있습니다... 5초간 데미지 50% 감소!',
    quotes: [
      '"나도 내 부장한테 엄청 맞았어... 다 자네를 위한 거야... 진심이야, 흑흑..."',
      '"김대리... 딱 한 대만 참아줄 수 없겠나? 나 내일 사위 상견례 있어... 제발..."',
      '"이러다 나 병원 입원하면 누가 결재 해줘?! 김대리 너도 피해야!"',
    ],
    duration: 5000,
    apply: () => {
      damageMult = 0.5;
      triggerBossTears();
      setTimeout(() => {
        damageMult = 1.0;
        showToast('😤 부장님 애원 끝! 다시 정상 공격 가능!');
      }, 5000);
    }
  },
  {
    id: 'phone',
    icon: '📞',
    title: '긴급 전화 수신!',
    desc: '부장님이 본부장님께 전화를 받고 있습니다! 5초간 공격 불가!',
    quotes: [
      '"여보세요?! 본부장님이세요?! 살려주세요 제발...! 아니 그게 아니라..."',
      '"지금 통화 중이에요! 잠깐만요! 아 이거 뭐야!!! (번호를 누른다)"',
      '"여보... 나야... 오늘 야근 못 할 것 같아... 집에 일찍 가도 돼? (눈물 줄줄)"',
    ],
    duration: 5000,
    apply: () => {
      clickBlocked = true;
      setTimeout(() => {
        clickBlocked = false;
        showToast('📞 통화 종료! 이제 다시 공격 가능!');
      }, 5000);
    }
  },
  {
    id: 'regen',
    icon: '💪',
    title: '분노의 각성!',
    desc: '부장님이 30년 경력의 오기로 버티고 있습니다! 8초간 HP가 자동 회복됩니다!',
    quotes: [
      '"내가 30년 버틴 건 괜히가 아니야!!! ...하지만 이미 눈물이... 흑흑"',
      '"이 정도로 쓰러질 내가 아니야! ...다리가 후들거리지만!"',
      '"사람이... 한계까지 몰리면... 각성하는 거야... (하지만 실제로는 좀 무서움)"',
    ],
    duration: 4000, // popup shows for 4s, regen runs 8s
    apply: () => {
      const regenInterval = setInterval(() => {
        if (gameState !== STATE_PLAYING || currentHp <= 0) {
          clearInterval(regenInterval);
          return;
        }
        currentHp = Math.min(MAX_HP, currentHp + 8);
        updateStatsUI();
        updateHpPhase();
      }, 400);
      setTimeout(() => {
        clearInterval(regenInterval);
        showToast('💪 각성 효과 종료! 더 세게 공격하세요!');
      }, 8000);
    }
  },
];

function scheduleRandomEvent() {
  if (gameState !== STATE_PLAYING) return;
  // Random delay: 20–55 seconds
  const delay = 20000 + Math.random() * 35000;
  randomEventTimeout = setTimeout(() => {
    if (gameState !== STATE_PLAYING) return;
    // Pick a random event
    const evt = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    showEventPopup(evt);
  }, delay);
}

function stopRandomEvents() {
  if (randomEventTimeout) {
    clearTimeout(randomEventTimeout);
    randomEventTimeout = null;
  }
  if (elRandomEventOverlay) elRandomEventOverlay.style.display = 'none';
}

function showEventPopup(evt) {
  if (!elRandomEventOverlay) return;
  
  // Populate popup content
  elEventIcon.textContent = evt.icon;
  elEventTitle.textContent = evt.title;
  elEventDesc.textContent = evt.desc;
  elEventQuote.textContent = evt.quotes[Math.floor(Math.random() * evt.quotes.length)];
  
  // Timer bar animation
  elEventTimerFill.style.transition = 'none';
  elEventTimerFill.style.width = '100%';
  elRandomEventOverlay.style.display = 'flex';
  
  // Sound
  playChirp(300, 0.12);
  setTimeout(() => { playChirp(500, 0.1); }, 120);
  setTimeout(() => { playChirp(700, 0.08); }, 240);
  
  // Animate timer draining
  requestAnimationFrame(() => {
    elEventTimerFill.style.transition = `width ${evt.duration}ms linear`;
    elEventTimerFill.style.width = '0%';
  });
  
  // Apply the event effect
  evt.apply();
  
  // Trigger tears for mercy/phone events
  if (evt.id === 'mercy' || evt.id === 'phone') {
    triggerBossTears();
    setTimeout(() => triggerBossTears(), 600);
  }
  
  // Show boss speech
  triggerBossSpeech(evt.quotes[Math.floor(Math.random() * evt.quotes.length)].replace(/"/g, ''));
  
  // Close popup after duration and schedule next event
  setTimeout(() => {
    elRandomEventOverlay.style.display = 'none';
    // Schedule next event (if still playing)
    if (gameState === STATE_PLAYING) {
      scheduleRandomEvent();
    }
  }, evt.duration);
}
