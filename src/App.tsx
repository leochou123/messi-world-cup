/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Clock,
  Target,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  ShoppingBag,
  Check,
  Flame,
  Coffee,
  Zap,
  Bomb,
  Award,
  BookOpen,
  ArrowRight,
  Shield,
  Star
} from 'lucide-react';

import {
  GameState,
  HookState,
  GameItem,
  Hook,
  PlayerStats,
  ShopItem,
  Particle,
  Vector2D
} from './types';
import { gameAudio } from './utils/audio';
import {
  getLevelGoal,
  generateLevelItems,
  checkCollision,
  updateDefenders,
  HOOK_ANCHOR,
  VIRTUAL_WIDTH,
  VIRTUAL_HEIGHT,
  GROUND_Y,
  getDistance
} from './utils/gameHelpers';

const getBgmNameForLevel = (level: number) => {
  const songs = [
    "🇿🇦 2010 《哇卡哇卡》",
    "🇮🇹 1990 《意大利之夏》",
    "🇫🇷 1998 《生命之杯》",
    "🇩🇪 2006 《七国军乐》",
    "🇶🇦 2022 《梦想家》"
  ];
  return songs[(level - 1) % songs.length];
};

// Available shop items in locker room
const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'mate_tea',
    name: 'mate_tea',
    chineseName: '阿根廷马黛茶 🧉',
    description: '极速震碎红牌，避免时间惩罚。',
    cost: 80,
    icon: 'coffee'
  },
  {
    id: 'boot_polish',
    name: 'boot_polish',
    chineseName: '黄金战靴润滑剂 ✨',
    description: '黄金制品、金球及防守球员得分翻倍。',
    cost: 220,
    icon: 'zap'
  },
  {
    id: 'red_card_waiver',
    name: 'red_card_waiver',
    chineseName: '主裁判免罚金牌 🟨',
    description: '红牌拉回速度翻倍，不扣时间且赠100分！',
    cost: 120,
    icon: 'shield'
  },
  {
    id: 'gold_speed',
    name: 'gold_speed',
    chineseName: '球王特浓马黛茶 ⚡',
    description: '拉回所有物品的额外速度永久提升 30%。',
    cost: 150,
    icon: 'zap'
  }
];

// Helper to calculate dynamic cost fluctuating by +/- 60% per level
const getItemCost = (id: string, baseCost: number, level: number) => {
  const seed = (level * 17 + id.charCodeAt(0) * 31 + id.charCodeAt(id.length - 1)) % 100;
  const fluctuation = (seed / 99) * 1.2 - 0.6; // value between -0.6 and +0.6
  const finalCost = Math.round(baseCost * (1 + fluctuation));
  return Math.max(20, finalCost); // Keep it at least 20 points
};

// High-fidelity enlarged visual representations of shop items
const MateTeaSVG = () => (
  <div className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-lg w-32 h-32 select-none mx-auto mb-2">
    <svg className="w-24 h-24 drop-shadow-[0_4px_12px_rgba(16,185,129,0.35)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 22 C 40 15, 45 10, 43 5 M50 22 C 50 12, 55 8, 52 3 M60 22 C 60 14, 65 11, 63 6" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" className="animate-pulse" />
      <line x1="32" y1="42" x2="18" y2="10" stroke="#cbd5e1" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="17" cy="8" r="3.5" fill="#facc15" />
      <path d="M30 45 C20 45, 18 85, 50 85 C82 85, 80 45, 70 45 C65 40, 35 40, 30 45 Z" fill="url(#gourdGrad)" stroke="#78350f" strokeWidth="2.5" />
      <path d="M22 65 C25 80, 75 80, 78 65" stroke="#f59e0b" strokeWidth="3" fill="none" />
      <ellipse cx="50" cy="45" rx="20" ry="6" fill="#475569" stroke="#cbd5e1" strokeWidth="2" />
      <ellipse cx="50" cy="45" rx="14" ry="4" fill="#064e3b" />
      <defs>
        <radialGradient id="gourdGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="70%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </radialGradient>
      </defs>
    </svg>
  </div>
);

const BootPolishSVG = () => (
  <div className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-lg w-32 h-32 select-none mx-auto mb-2">
    <svg className="w-24 h-24 drop-shadow-[0_4px_12px_rgba(234,179,8,0.35)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 25 L18 18 L25 15 L18 12 L15 5 L12 12 L5 15 L12 18 Z" fill="#facc15" className="animate-bounce" style={{ animationDuration: '2s' }} />
      <path d="M85 35 L87 30 L92 28 L87 26 L85 21 L83 26 L78 28 L83 30 Z" fill="#facc15" className="animate-bounce" style={{ animationDuration: '3s' }} />
      <path d="M25 68 L45 75 C60 78, 80 72, 85 58 C88 50, 78 40, 68 42 L42 50 L28 40 L22 45 L20 60 Z" fill="url(#goldBootGrad)" stroke="#ca8a04" strokeWidth="2" />
      <rect x="25" y="68" width="4" height="4" fill="#facc15" />
      <rect x="38" y="73" width="4" height="4" fill="#facc15" />
      <rect x="52" y="75" width="4" height="4" fill="#facc15" />
      <rect x="68" y="72" width="4" height="4" fill="#facc15" />
      <path d="M50 48 L46 62 M55 47 L51 61 M60 46 L56 60" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="60" y="65" width="28" height="14" rx="4" fill="#475569" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="60" y="65" width="28" height="6" rx="2" fill="#e2e8f0" />
      <circle cx="74" cy="68" r="2" fill="#ef4444" />
      <defs>
        <linearGradient id="goldBootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const RedCardWaiverSVG = () => (
  <div className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-lg w-32 h-32 select-none mx-auto mb-2">
    <svg className="w-24 h-24 drop-shadow-[0_4px_12px_rgba(14,165,233,0.35)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15 C65 15, 80 10, 80 25 C80 55, 65 75, 50 85 C35 75, 20 55, 20 25 C20 10, 35 15, 50 15 Z" fill="url(#shieldGrad)" stroke="#0284c7" strokeWidth="2" />
      <rect x="38" y="30" width="24" height="34" rx="3" fill="#facc15" stroke="#eab308" strokeWidth="1.5" transform="rotate(-10 50 47)" />
      <path d="M44 48 L48 52 L57 42" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M62 55 L74 55 L74 65 L66 65 L66 60 L62 60 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
      <circle cx="66" cy="60" r="2" fill="#000000" />
      <circle cx="70" cy="58" r="4" fill="none" stroke="#475569" strokeWidth="1" />
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const GoldSpeedSVG = () => (
  <div className="flex items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-lg w-32 h-32 select-none mx-auto mb-2">
    <svg className="w-24 h-24 drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 45 L30 40 L25 55 L40 50" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
      <path d="M85 45 L70 40 L75 55 L60 50" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
      <line x1="32" y1="42" x2="15" y2="8" stroke="#ca8a04" strokeWidth="5" strokeLinecap="round" />
      <circle cx="14" cy="6" r="4.5" fill="#ca8a04" />
      <path d="M30 45 C20 45, 18 85, 50 85 C82 85, 80 45, 70 45 C65 40, 35 40, 30 45 Z" fill="url(#strongGourdGrad)" stroke="#1e293b" strokeWidth="2.5" />
      <path d="M22 65 C25 80, 75 80, 78 65" stroke="#fef08a" strokeWidth="4" fill="none" />
      <line x1="50" y1="45" x2="50" y2="85" stroke="#f59e0b" strokeWidth="2.5" />
      <ellipse cx="50" cy="45" rx="20" ry="6" fill="#eab308" stroke="#ca8a04" strokeWidth="2.5" />
      <ellipse cx="50" cy="45" rx="14" ry="4" fill="#022c22" />
      <defs>
        <radialGradient id="strongGourdGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="75%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>
    </svg>
  </div>
);

export default function App() {
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Player Stats
  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    highScore: 0,
    level: 1,
    bombs: 1,
    hasMateTea: false,
    hasBootPolish: false,
    hasRedCardWaiver: false,
    mateTeaActive: false,
    bootPolishActive: false,
    redCardWaiverActive: false
  });

  // Level status
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [scoreGoal, setScoreGoal] = useState<number>(1000);

  // Use refs for fast-changing visual items to prevent excessive React state updates and loop restarts
  const itemsRef = useRef<GameItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<{ id: string; x: number; y: number; text: string; color: string; age: number }[]>([]);

  // Keep a stable ref of stats to always read the latest score and boosters without closure issues
  const statsRef = useRef<PlayerStats>(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Hook physics reference (to run inside requestAnimationFrame without triggering heavy re-renders)
  const hookRef = useRef<Hook>({
    x: HOOK_ANCHOR.x,
    y: HOOK_ANCHOR.y,
    angle: 0,
    length: 30,
    maxLength: 620,
    state: HookState.IDLE,
    speed: 340, // pixels per second
    targetItem: null,
    swingDirection: 1,
    swingSpeed: 1.15 // angular speed (slower for better control)
  });

  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Load High Score
  useEffect(() => {
    const savedHighScore = localStorage.getItem('messi_worldcup_highscore');
    if (savedHighScore) {
      setStats((prev) => ({
        ...prev,
        highScore: parseInt(savedHighScore, 10)
      }));
    }
  }, []);

  // Synchronize background music with game state and levels
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      gameAudio.startBgm(stats.level);
    } else {
      gameAudio.stopBgm();
    }
    return () => {
      gameAudio.stopBgm();
    };
  }, [gameState, stats.level]);

  // Update mute state in audio utility
  const toggleMute = () => {
    const nextMute = gameAudio.toggleMute();
    setIsMuted(nextMute);
  };

  // Generate floating score text
  const addFloatingText = (x: number, y: number, text: string, color: string = '#facc15') => {
    floatingTextsRef.current.push({
      id: `text_${Date.now()}_${Math.random()}`,
      x,
      y: y - 10,
      text,
      color,
      age: 0
    });
  };

  // Generate confetti/star particles
  const spawnParticles = (x: number, y: number, count: number, type: 'gold' | 'explode' | 'green_dust') => {
    const newParticles: Particle[] = [];
    const colors =
      type === 'gold'
        ? ['#facc15', '#eab308', '#ffffff', '#fbbf24', '#f59e0b']
        : type === 'explode'
        ? ['#ef4444', '#f97316', '#facc15', '#4b5563', '#1f2937']
        : ['#4ade80', '#22c55e', '#16a34a', '#86efac'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = type === 'explode' ? 2 + Math.random() * 8 : 1 + Math.random() * 4;
      const radius = type === 'explode' ? 3 + Math.random() * 6 : 2 + Math.random() * 4;

      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'explode' ? 2 : 1), // slightly upward bias
        radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02
      });
    }

    particlesRef.current.push(...newParticles);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        triggerShoot();
      } else if (e.code === 'ArrowUp' || e.key === 'ArrowUp') {
        e.preventDefault();
        triggerBomb();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, stats.bombs]);

  // Hook shoot launcher
  const triggerShoot = () => {
    if (gameState !== GameState.PLAYING) return;
    const hook = hookRef.current;
    if (hook.state === HookState.IDLE) {
      hook.state = HookState.SHOOTING;
      gameAudio.playShoot();
    }
  };

  // Drink Yerba Mate Tea (Equivalent of dynamite trigger)
  const triggerBomb = () => {
    if (gameState !== GameState.PLAYING) return;
    const hook = hookRef.current;
    
    // Only allow drinking if hook is pulling something (typically a slow red card)
    if (hook.state === HookState.RETRACTING && hook.targetItem) {
      if (stats.bombs > 0) {
        const item = hook.targetItem;
        // Particle sparks for drinking power
        spawnParticles(item.x, item.y, 25, 'green_dust');
        addFloatingText(item.x, item.y, '喝下马黛茶，震碎红牌！🧉', '#4ade80');
        
        // Remove item and release hook back
        hook.targetItem = null;
        gameAudio.playExplode(); // play satisfying release audio
        
        // Decrement count
        setStats((prev) => ({
          ...prev,
          bombs: prev.bombs - 1
        }));
      } else {
        // No Mate Tea notice
        addFloatingText(hook.x, hook.y - 20, '马黛茶喝光了！🧉', '#ef4444');
        gameAudio.playClick();
      }
    }
  };

  // Initialize a new match/level
  const startNewLevel = useCallback((nextLevel: number, currentScore: number) => {
    // Generate fresh level goals & items
    const goal = getLevelGoal(nextLevel);
    setScoreGoal(goal);
    setTimeLeft(60);
    
    // Activate boosters from last shop
    setStats((prev) => ({
      ...prev,
      level: nextLevel,
      score: currentScore,
      mateTeaActive: prev.hasMateTea,
      bootPolishActive: prev.hasBootPolish,
      redCardWaiverActive: prev.hasRedCardWaiver
    }));

    // Generate items on grid
    const generatedItems = generateLevelItems(nextLevel);
    itemsRef.current = generatedItems;
    particlesRef.current = [];
    floatingTextsRef.current = [];

    // Reset hook state
    hookRef.current = {
      x: HOOK_ANCHOR.x,
      y: HOOK_ANCHOR.y,
      angle: 0,
      length: 30,
      maxLength: 620,
      state: HookState.IDLE,
      speed: 340,
      targetItem: null,
      swingDirection: 1,
      swingSpeed: 1.15 + Math.min(0.4, nextLevel * 0.05) // slightly faster swing as difficulty rises, but smooth and controlled
    };

    setGameState(GameState.PLAYING);
    gameAudio.playWhistle();
  }, []);

  // Total Tournament restart
  const restartTournament = () => {
    setStats({
      score: 0,
      highScore: stats.highScore,
      level: 1,
      bombs: 1,
      hasMateTea: false,
      hasBootPolish: false,
      hasRedCardWaiver: false,
      mateTeaActive: false,
      bootPolishActive: false,
      redCardWaiverActive: false
    });
    startNewLevel(1, 0);
  };

  // Handle Level Expiration Check
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Level concluded! Evaluate score
          handleLevelEnd();
          return 0;
        }

        // Warning click sounds in final 10 seconds
        if (prev <= 11) {
          gameAudio.playCountdown();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, stats.score, scoreGoal]);

  const handleLevelEnd = () => {
    if (stats.score >= scoreGoal) {
      // Success! Move to celebration
      setGameState(GameState.LEVEL_COMPLETE);
      gameAudio.playSuccess();
      
      // Update persistent high score if beaten
      if (stats.score > stats.highScore) {
        setStats(prev => ({ ...prev, highScore: stats.score }));
        localStorage.setItem('messi_worldcup_highscore', stats.score.toString());
      }
    } else {
      // Failed. Game over!
      setGameState(GameState.GAME_OVER);
      gameAudio.playFail();

      // Check for High Score update on fail too
      if (stats.score > stats.highScore) {
        setStats(prev => ({ ...prev, highScore: stats.score }));
        localStorage.setItem('messi_worldcup_highscore', stats.score.toString());
      }
    }
  };

  // Core physics & graphics draw loop
  useEffect(() => {
    if (gameState !== GameState.PLAYING) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    const canvas = canvasElement || canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = VIRTUAL_WIDTH;
    canvas.height = VIRTUAL_HEIGHT;

    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // Cap dt to avoid astronomical jumps on background tab switches
      const safeDt = Math.min(dt, 0.1);

      updateGamePhysics(safeDt);
      drawGame(ctx, time);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState, canvasElement]);

  // Handle all physics update inside animation frame
  const updateGamePhysics = (dt: number) => {
    const hook = hookRef.current;
    const currentStats = statsRef.current;

    // 1. Update defenders (dynamic items running horizontally)
    itemsRef.current = updateDefenders(itemsRef.current);

    // 2. Hook movement states
    if (hook.state === HookState.IDLE) {
      // Swing hook left & right
      hook.angle += hook.swingDirection * hook.swingSpeed * dt;
      
      const maxSwingAngle = Math.PI * 0.42; // ~75 degrees
      if (hook.angle > maxSwingAngle) {
        hook.angle = maxSwingAngle;
        hook.swingDirection = -1;
      } else if (hook.angle < -maxSwingAngle) {
        hook.angle = -maxSwingAngle;
        hook.swingDirection = 1;
      }
    } else if (hook.state === HookState.SHOOTING) {
      // Drive hook outwards
      hook.length += hook.speed * dt;

      // Calculate hook tip position
      const hx = HOOK_ANCHOR.x + hook.length * Math.sin(hook.angle);
      const hy = HOOK_ANCHOR.y + hook.length * Math.cos(hook.angle);

      // Boundary collision checks
      if (
        hx < 15 ||
        hx > VIRTUAL_WIDTH - 15 ||
        hy > VIRTUAL_HEIGHT - 15
      ) {
        hook.state = HookState.RETRACTING;
        hook.targetItem = null;
      } else {
        // Item overlap check
        let hitItem: GameItem | null = null;
        let hitIndex = -1;

        const currentItems = itemsRef.current;
        for (let i = 0; i < currentItems.length; i++) {
          if (checkCollision({ x: hx, y: hy }, currentItems[i])) {
            hitItem = currentItems[i];
            hitIndex = i;
            break;
          }
        }

        if (hitItem && hitIndex !== -1) {
          hook.state = HookState.RETRACTING;
          hook.targetItem = hitItem;
          
          // Remove from game items
          itemsRef.current = currentItems.filter((_, idx) => idx !== hitIndex);
          
          // Handle mystery box content generation instantly upon grab
          if (hitItem.type === 'mystery_bag') {
            const rand = Math.random();
            if (rand < 0.25) {
              // Free bomb!
              hitItem.scoreValue = 0;
              hitItem.name = '足球炸弹';
              setStats((prev) => ({ ...prev, bombs: Math.min(5, prev.bombs + 1) }));
              addFloatingText(hitItem.x, hitItem.y, '获得足球炸弹! 💣', '#ef4444');
            } else {
              // Custom points
              const baseReward = 100 + Math.floor(Math.random() * 300); // 100-400
              const finalReward = currentStats.bootPolishActive ? baseReward * 2 : baseReward;
              hitItem.scoreValue = finalReward;
              hitItem.name = '得分奖励';
              addFloatingText(hitItem.x, hitItem.y, `神秘奖励: +${finalReward}! 🎁`, '#c084fc');
            }
          } else {
            // Normal score item notice
            let finalValue = hitItem.scoreValue;
            if (currentStats.bootPolishActive && (hitItem.type === 'trophy' || hitItem.type === 'ball' || hitItem.type === 'defender_boot')) {
              finalValue *= 2;
            } else if (currentStats.redCardWaiverActive && hitItem.type === 'red_card') {
              finalValue = 100;
            }
            addFloatingText(hitItem.x, hitItem.y, `抓到: ${hitItem.name}!`, '#fbbf24');
          }
          
          gameAudio.playGrab();
        }
      }
    } else if (hook.state === HookState.RETRACTING) {
      // Calculate pulling weight
      let weight = 0;
      if (hook.targetItem) {
        weight = hook.targetItem.weight;
        // Apply shop item boosters
        if (currentStats.redCardWaiverActive && hook.targetItem.type === 'red_card') {
          weight = weight / 2.5; // Red cards are way lighter to pull
        }
      }

      // Speed decreases with weight
      let pullSpeed = hook.speed / (1 + weight / 30);
      
      // Energy drinks/Yerba mate tea multiplier
      if (currentStats.mateTeaActive) {
        pullSpeed *= 1.35; // 35% speed booster
      }

      hook.length -= pullSpeed * dt;

      // Update grabbed item coordinates to follow the claw tip
      if (hook.targetItem) {
        const hx = HOOK_ANCHOR.x + hook.length * Math.sin(hook.angle);
        const hy = HOOK_ANCHOR.y + hook.length * Math.cos(hook.angle);
        hook.targetItem.x = hx;
        hook.targetItem.y = hy;
      }

      // Pull tick sounds for heavy lifting
      if (hook.targetItem && weight > 30) {
        if (Math.random() < 0.08) {
          gameAudio.playPullTick(pullSpeed / hook.speed);
        }
      }

      if (hook.length <= 30) {
        hook.length = 30;
        hook.state = HookState.IDLE;

        // Reel-in complete! Award points
        if (hook.targetItem) {
          const item = hook.targetItem;
          let points = item.scoreValue;

          // Apply score booster factors
          if (currentStats.bootPolishActive && (item.type === 'trophy' || item.type === 'ball' || item.type === 'defender_boot')) {
            points *= 2;
          } else if (currentStats.redCardWaiverActive && item.type === 'red_card') {
            points = 100;
          }

          setStats((prev) => ({
            ...prev,
            score: prev.score + points
          }));

          // Success sparks (spawn above Messi for epic celebration)
          spawnParticles(VIRTUAL_WIDTH / 2, 40, 20, item.type === 'red_card' ? 'explode' : 'gold');
          
          if (item.type === 'red_card') {
            addFloatingText(VIRTUAL_WIDTH / 2, 40, `罚分: +${points} 🟥`, '#ef4444');
            gameAudio.playFail();
          } else {
            addFloatingText(VIRTUAL_WIDTH / 2, 40, `得分: +${points}! ⚽`, '#3b82f6');
            if (points >= 500) {
              gameAudio.playSuccess();
            } else {
              gameAudio.playNormalSuccess();
            }
          }
          
          hook.targetItem = null;
        }
      }
    }

    // 3. Update particles
    particlesRef.current = particlesRef.current
      .map((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        return p;
      })
      .filter((p) => p.alpha > 0);

    // 4. Update floating texts
    floatingTextsRef.current = floatingTextsRef.current
      .map((t) => {
        t.y -= 0.6;
        t.age += 1;
        return t;
      })
      .filter((t) => t.age < 60);
  };

  // Canvas drawing routine
  const drawGame = (ctx: CanvasRenderingContext2D, time: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // 1. Draw vibrant green soccer turf backdrop with rich 3D lawn texture and lighting depth
    // Create grass turf gradient simulating a 3D field receding under bright floodlights
    const turfGrad = ctx.createLinearGradient(0, GROUND_Y, 0, VIRTUAL_HEIGHT);
    turfGrad.addColorStop(0, '#15803d'); // brighter grass at the touchline
    turfGrad.addColorStop(0.5, '#166534'); // elegant mid green
    turfGrad.addColorStop(1, '#14532d'); // deep grass green bottom
    ctx.fillStyle = turfGrad;
    ctx.fillRect(0, GROUND_Y, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - GROUND_Y);

    // Draw 3D perspective mowing stripes converging towards the top horizon
    const lanesCount = 12;
    ctx.save();
    for (let i = 0; i < lanesCount; i++) {
      // Alternating light/dark lanes with converging perspective angles
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.025)';
      ctx.beginPath();
      
      // Calculate top and bottom coordinates for converging perspective lanes
      const topX1 = (VIRTUAL_WIDTH / 2) + (i - lanesCount / 2) * (VIRTUAL_WIDTH / lanesCount) * 0.45;
      const topX2 = (VIRTUAL_WIDTH / 2) + (i + 1 - lanesCount / 2) * (VIRTUAL_WIDTH / lanesCount) * 0.45;
      const botX1 = (VIRTUAL_WIDTH / 2) + (i - lanesCount / 2) * (VIRTUAL_WIDTH / lanesCount) * 1.3;
      const botX2 = (VIRTUAL_WIDTH / 2) + (i + 1 - lanesCount / 2) * (VIRTUAL_WIDTH / lanesCount) * 1.3;

      ctx.moveTo(topX1, GROUND_Y);
      ctx.lineTo(topX2, GROUND_Y);
      ctx.lineTo(botX2, VIRTUAL_HEIGHT);
      ctx.lineTo(botX1, VIRTUAL_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Draw soccer field pitch markings inside the turf area with premium volumetric stroke
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2.5;

    // Center Circle (translucent background helper)
    ctx.beginPath();
    ctx.ellipse(VIRTUAL_WIDTH / 2, GROUND_Y + 160, 110, 50, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Center Spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(VIRTUAL_WIDTH / 2, GROUND_Y + 160, 5, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Box Outline at the bottom of turf (with 3D perspective skew)
    ctx.beginPath();
    ctx.moveTo(VIRTUAL_WIDTH / 2 - 220, VIRTUAL_HEIGHT);
    ctx.lineTo(VIRTUAL_WIDTH / 2 - 160, VIRTUAL_HEIGHT - 130);
    ctx.lineTo(VIRTUAL_WIDTH / 2 + 160, VIRTUAL_HEIGHT - 130);
    ctx.lineTo(VIRTUAL_WIDTH / 2 + 220, VIRTUAL_HEIGHT);
    ctx.stroke();

    // Goal area outline (3D perspective)
    ctx.beginPath();
    ctx.moveTo(VIRTUAL_WIDTH / 2 - 110, VIRTUAL_HEIGHT);
    ctx.lineTo(VIRTUAL_WIDTH / 2 - 80, VIRTUAL_HEIGHT - 45);
    ctx.lineTo(VIRTUAL_WIDTH / 2 + 80, VIRTUAL_HEIGHT - 45);
    ctx.lineTo(VIRTUAL_WIDTH / 2 + 110, VIRTUAL_HEIGHT);
    ctx.stroke();

    // Penalty Spot bottom
    ctx.beginPath();
    ctx.arc(VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT - 90, 4, 0, Math.PI * 2);
    ctx.fill();

    // Penalty Box D-Arc (3D perspective)
    ctx.beginPath();
    ctx.ellipse(VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT - 130, 65, 25, 0, Math.PI, 0, true);
    ctx.stroke();

    // Field touchline
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y);
    ctx.stroke();

    // 2. Draw surface pitch (Argentina colors grass layer)
    const pitchGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    pitchGrad.addColorStop(0, '#062d17'); // darker near horizon / ads
    pitchGrad.addColorStop(0.6, '#15803d'); // vibrant stadium turf
    pitchGrad.addColorStop(1, '#0f5132'); // shadow under Touchline
    ctx.fillStyle = pitchGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, GROUND_Y);

    // Stadium center circle markings (above touchline)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(VIRTUAL_WIDTH / 2, GROUND_Y, 110, 45, 0, Math.PI, 0); // half center circle in perspective
    ctx.stroke();

    // 3. Draw Rotating Spotlights from stadium towers (creates 3D AAA volumetric atmosphere)
    ctx.save();
    const beamAngle1 = Math.sin(time / 1600) * 0.35 - Math.PI / 4;
    const beamAngle2 = Math.cos(time / 1400) * 0.35 + Math.PI / 4;

    const drawBeam = (sx: number, sy: number, angle: number) => {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const ex1 = sx + 850 * Math.sin(angle - 0.16);
      const ey1 = sy + 850 * Math.cos(angle - 0.16);
      const ex2 = sx + 850 * Math.sin(angle + 0.16);
      const ey2 = sy + 850 * Math.cos(angle + 0.16);
      ctx.lineTo(ex1, ey1);
      ctx.lineTo(ex2, ey2);
      ctx.closePath();

      const beamGrad = ctx.createRadialGradient(sx, sy, 30, sx, sy, 750);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.24)'); // warmer glowing core
      beamGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.1)'); // dust ray
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fill();

      // Glowing orb at source point (volumetric bulb)
      const sourceGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 40);
      sourceGrad.addColorStop(0, '#ffffff');
      sourceGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.8)');
      sourceGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = sourceGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, 40, 0, Math.PI * 2);
      ctx.fill();
    };

    drawBeam(60, 20, beamAngle1 + Math.PI / 4);
    drawBeam(VIRTUAL_WIDTH - 60, 20, beamAngle2 - Math.PI / 4);
    ctx.restore();

    // Ambient stadium glow overlay
    const ambientGrad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    ambientGrad.addColorStop(0, 'rgba(254, 240, 138, 0.05)'); // subtle overhead light scattering
    ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // 4. Draw Messi Realistic 3D model Sitting at Console
    drawMessiOnCanvas(ctx, time);

    // 5. Draw underground game items (highly detailed custom shapes replace emojis!)
    const itemsToDraw = [...itemsRef.current];
    if (hookRef.current.targetItem) {
      itemsToDraw.push(hookRef.current.targetItem);
    }
    itemsToDraw.forEach((item) => {
      ctx.save();

      // DRAW SOFT PHYSICAL 3D DROP SHADOW
      const shadowGrad = ctx.createRadialGradient(item.x, item.y + item.radius * 0.7, item.radius * 0.1, item.x, item.y + item.radius * 0.7, item.radius * 1.25);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
      shadowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.3)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + item.radius * 0.7, item.radius * 1.2, item.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gold item glowing auroras (gorgeous volumetric lights)
      if (item.type === 'trophy' || item.type === 'ball' || item.type === 'defender_boot') {
        const glowRad = item.radius * (1.8 + Math.sin(time / 180) * 0.25);
        const glowGrad = ctx.createRadialGradient(item.x, item.y, item.radius * 0.3, item.x, item.y, glowRad);
        glowGrad.addColorStop(0, 'rgba(253, 224, 71, 0.4)'); // gold center
        glowGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.12)'); // corona
        glowGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(item.x, item.y, glowRad, 0, Math.PI * 2);
        ctx.fill();
      }

      // CUSTOM 3D HIGH-FIDELITY ITEM RENDERING
      if (item.type === 'trophy') {
        // --- GENERIC GOLD CUP ("大力神杯") ---
        ctx.save();
        ctx.translate(item.x, item.y);
        
        // Solid weighted base with emerald malachite stripes
        const baseGrad = ctx.createLinearGradient(-15, 14, 15, 22);
        baseGrad.addColorStop(0, '#047857'); // Malachite deep green
        baseGrad.addColorStop(0.5, '#10b981'); // bright green striping
        baseGrad.addColorStop(1, '#064e3b');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.roundRect(-16, 12, 32, 11, 2);
        ctx.fill();

        // Extra gold ring on base
        const ringGrad = ctx.createLinearGradient(-16, 9, 16, 9);
        ringGrad.addColorStop(0, '#b45309');
        ringGrad.addColorStop(0.5, '#fef08a');
        ringGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = ringGrad;
        ctx.fillRect(-14, 8, 28, 4);

        // Cup upper body - 3D athletic columns
        const cupGrad = ctx.createLinearGradient(-15, -24, 15, 8);
        cupGrad.addColorStop(0, '#fef08a'); // golden specular
        cupGrad.addColorStop(0.3, '#fbbf24'); // gold
        cupGrad.addColorStop(0.7, '#d97706'); // shadow gold
        cupGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = cupGrad;

        // Draw curved trophy chalice columns
        ctx.beginPath();
        ctx.moveTo(-7, 8);
        ctx.bezierCurveTo(-14, 3, -16, -14, -13, -20);
        ctx.lineTo(13, -20);
        ctx.bezierCurveTo(16, -14, 14, 3, 7, 8);
        ctx.closePath();
        ctx.fill();

        // Draw athletic spiral arms
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Left arm curving up
        ctx.moveTo(-4, 6);
        ctx.quadraticCurveTo(-11, 0, -8, -10);
        // Right arm curving up
        ctx.moveTo(4, 6);
        ctx.quadraticCurveTo(11, 0, 8, -10);
        ctx.stroke();

        // Volumetric glowing golden sphere at top representing the World Cup globe
        const sphereGrad = ctx.createRadialGradient(-2, -18, 2, 0, -16, 12);
        sphereGrad.addColorStop(0, '#ffffff'); // glare
        sphereGrad.addColorStop(0.4, '#fef08a'); // bright yellow
        sphereGrad.addColorStop(0.8, '#d97706'); // golden brown
        sphereGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(0, -16, 11, 0, Math.PI * 2);
        ctx.fill();

        // Add map lines on the globe
        ctx.strokeStyle = 'rgba(120, 53, 15, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -16, 11, 0, Math.PI, true);
        ctx.stroke();

        ctx.restore();

      } else if (item.type === 'ball') {
        // --- 3D GOLDEN BALL TROPHY ("金球奖") ---
        ctx.save();
        ctx.translate(item.x, item.y);

        // Elegant dark wooden/marble hexagonal pedestal base
        const pedGrad = ctx.createLinearGradient(-14, 12, 14, 20);
        pedGrad.addColorStop(0, '#1e293b'); // charcoal marble
        pedGrad.addColorStop(0.5, '#475569'); // highlight
        pedGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = pedGrad;
        ctx.beginPath();
        ctx.moveTo(-15, 20);
        ctx.lineTo(-10, 10);
        ctx.lineTo(10, 10);
        ctx.lineTo(15, 20);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Golden support collar holding the ball
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-6, 6, 12, 4);

        // Spherical 3D Golden Ball on top
        const goldBallGrad = ctx.createRadialGradient(-4, -6, 2, 0, -2, 17);
        goldBallGrad.addColorStop(0, '#ffffff'); // bright sheen
        goldBallGrad.addColorStop(0.3, '#fef08a'); // golden yellow
        goldBallGrad.addColorStop(0.7, '#ca8a04'); // deep gold
        goldBallGrad.addColorStop(1, '#78350f'); // shadow
        ctx.fillStyle = goldBallGrad;
        ctx.beginPath();
        ctx.arc(0, -2, 16, 0, Math.PI * 2);
        ctx.fill();

        // Soccer patterns mapped onto the gold sphere in 3D perspective
        ctx.strokeStyle = 'rgba(120, 53, 15, 0.65)';
        ctx.lineWidth = 1.2;
        // Central hexagon
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, -4);
        ctx.lineTo(5, 2);
        ctx.lineTo(0, 5);
        ctx.lineTo(-5, 2);
        ctx.lineTo(-5, -4);
        ctx.closePath();
        ctx.stroke();

              } else if (item.type === 'soccer') {
        // --- CLASSIC PREMIUM SOCCER BALL (HIGHLY READABLE, CLEAR & SYMMETRIC AS IN IMAGE 1) ---
        ctx.save();
        ctx.translate(item.x, item.y);

        const r = item.radius;

        // 1. Clean, soft drop shadow under the ball on the pitch
        const shadowGrad = ctx.createRadialGradient(0, r * 0.9, 0, 0, r * 0.9, r * 1.3);
        shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.65)'); // intense soft core
        shadowGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.25)'); // soft roll-off
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.save();
        ctx.scale(1.2, 0.35);
        ctx.beginPath();
        ctx.arc(0, r * 2.4, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Set up clean circle clip for the sphere
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.clip();

        // 3. Pristine 3D white base with elegant, clean radial shadow (creates spherical depth)
        const baseGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
        baseGrad.addColorStop(0, '#ffffff'); // bright top-left specular reflection
        baseGrad.addColorStop(0.6, '#fafaf9'); // soft white leather midtone
        baseGrad.addColorStop(0.85, '#e2e8f0'); // clean grey volumetric shade
        baseGrad.addColorStop(1, '#cbd5e1'); // soft spherical border crease
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // 4. Calculate coordinates of perfect classic pentagonal pattern
        const cx0 = 0;
        const cy0 = 0;
        const baseAngle = -Math.PI / 2; // perfectly upright

        // A. Central Pentagon vertices
        const centerVertices: { x: number; y: number }[] = [];
        for (let i = 0; i < 5; i++) {
          const angle = baseAngle + i * 2 * Math.PI / 5;
          centerVertices.push({
            x: cx0 + Math.cos(angle) * r * 0.32,
            y: cy0 + Math.sin(angle) * r * 0.32
          });
        }

        // B. Outer Pentagons (Centers at radius r * 0.84, radius of pentagons is r * 0.28)
        const outerPentagons: { x: number; y: number }[][] = [];
        const inwardVertices: { x: number; y: number }[] = [];

        for (let i = 0; i < 5; i++) {
          const angle = baseAngle + i * 2 * Math.PI / 5;
          const ox = Math.cos(angle) * r * 0.84;
          const oy = Math.sin(angle) * r * 0.84;
          const outerBaseAngle = angle + Math.PI; // rotated to face center

          const pts: { x: number; y: number }[] = [];
          for (let j = 0; j < 5; j++) {
            const a = outerBaseAngle + j * 2 * Math.PI / 5;
            pts.push({
              x: ox + Math.cos(a) * r * 0.28,
              y: oy + Math.sin(a) * r * 0.28
            });
          }
          outerPentagons.push(pts);
          inwardVertices.push(pts[0]); // vertex 0 points directly to center
        }

        // 5. Draw Black Pentagons (Central and Outer)
        const fillBlackPentagon = (pts: { x: number; y: number }[]) => {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.closePath();

          // Subtle gradient on black panels for premium finish (Image 1 style)
          const blackGrad = ctx.createRadialGradient(pts[0].x, pts[0].y, 0, pts[0].x, pts[0].y, r * 0.4);
          blackGrad.addColorStop(0, '#1e293b'); // dark charcoal
          blackGrad.addColorStop(1, '#090d16'); // rich deep black
          ctx.fillStyle = blackGrad;
          ctx.fill();
        };

        // Draw Center
        fillBlackPentagon(centerVertices);

        // Draw 5 Outer
        for (let i = 0; i < 5; i++) {
          fillBlackPentagon(outerPentagons[i]);
        }

        // 6. Draw clean, crisp seam stitching lines (forming the standard hexagons mesh)
        ctx.beginPath();

        // Outline of central pentagon
        ctx.moveTo(centerVertices[0].x, centerVertices[0].y);
        for (let j = 1; j < 5; j++) {
          ctx.lineTo(centerVertices[j].x, centerVertices[j].y);
        }
        ctx.closePath();

        // Outline of outer pentagons & connection lines
        for (let i = 0; i < 5; i++) {
          const outer = outerPentagons[i];
          ctx.moveTo(outer[0].x, outer[0].y);
          for (let j = 1; j < 5; j++) {
            ctx.lineTo(outer[j].x, outer[j].y);
          }
          ctx.closePath();

          // Connect center vertex i with outer inward-facing vertex i
          ctx.moveTo(centerVertices[i].x, centerVertices[i].y);
          ctx.lineTo(inwardVertices[i].x, inwardVertices[i].y);

          // Connect outer pentagon i with outer pentagon i+1 to complete white hexagons
          const nextOuter = outerPentagons[(i + 1) % 5];
          ctx.moveTo(outer[1].x, outer[1].y);
          ctx.lineTo(nextOuter[4].x, nextOuter[4].y);
        }

        // Stroke seam lines with thin, sharp, crisp black color
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = r * 0.055;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 7. Ambient light highlight overlay for elegant gloss (clean, non-distracting)
        const shineGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, -r * 0.2, -r * 0.2, r * 0.8);
        shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        shineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shineGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // restore from circle clip

        // 8. Draw an extremely clean thin outer stroke on the whole ball for sharp definition
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = r * 0.04;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore(); // restore translated state

      } else if (item.type === 'red_card') {
        // --- 3D THICK PHYSICAL RED CARD ---
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(0.12); // stylish tilt

        const cw = 22;
        const ch = 32;
        const thickness = 4.5;

        // 3D Side edge thickness face
        const edgeGrad = ctx.createLinearGradient(-cw / 2, -ch / 2, -cw / 2 - thickness, -ch / 2 + ch);
        edgeGrad.addColorStop(0, '#7f1d1d'); // dark maroon edge
        edgeGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = edgeGrad;
        ctx.beginPath();
        ctx.moveTo(-cw / 2, -ch / 2);
        ctx.lineTo(-cw / 2 - thickness, -ch / 2 + 2);
        ctx.lineTo(-cw / 2 - thickness, ch / 2 + 2);
        ctx.lineTo(-cw / 2, ch / 2);
        ctx.closePath();
        ctx.fill();

        // Bottom thickness face
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.moveTo(-cw / 2, ch / 2);
        ctx.lineTo(-cw / 2 - thickness, ch / 2 + 2);
        ctx.lineTo(cw / 2 - thickness, ch / 2 + 2);
        ctx.lineTo(cw / 2, ch / 2);
        ctx.closePath();
        ctx.fill();

        // Front Face (Highly polished red card)
        const frontGrad = ctx.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2);
        frontGrad.addColorStop(0, '#f87171'); // highlight top
        frontGrad.addColorStop(0.3, '#ef4444'); // vibrant red
        frontGrad.addColorStop(1, '#dc2626'); // deep shadow
        ctx.fillStyle = frontGrad;
        ctx.beginPath();
        ctx.roundRect(-cw / 2, -ch / 2, cw, ch, 2);
        ctx.fill();

        // Fine silver glossy border line
        ctx.strokeStyle = '#fee2e2';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Glossy light glare diagonal streak across card
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-cw / 2 + 4, -ch / 2);
        ctx.lineTo(cw / 2, ch / 2 - 10);
        ctx.stroke();

        ctx.restore();

      } else if (item.type === 'mystery_bag') {
        // --- 3D PREMIUM GIFT BOX (CUBIC ISOMETRIC) ---
        ctx.save();
        ctx.translate(item.x, item.y);

        const sz = 16; // half dimension

        // Left Isometric Wall
        const leftGrad = ctx.createLinearGradient(-sz, -sz / 2, 0, sz);
        leftGrad.addColorStop(0, '#6d28d9'); // bright violet
        leftGrad.addColorStop(1, '#4c1d95'); // dark purple
        ctx.fillStyle = leftGrad;
        ctx.beginPath();
        ctx.moveTo(-sz, -sz / 2);
        ctx.lineTo(0, 0);
        ctx.lineTo(0, sz * 1.2);
        ctx.lineTo(-sz, sz * 0.7);
        ctx.closePath();
        ctx.fill();

        // Right Isometric Wall
        const rightGrad = ctx.createLinearGradient(0, 0, sz, sz / 2);
        rightGrad.addColorStop(0, '#4c1d95');
        rightGrad.addColorStop(1, '#2e1065'); // deep shadow
        ctx.fillStyle = rightGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(sz, -sz / 2);
        ctx.lineTo(sz, sz * 0.7);
        ctx.lineTo(0, sz * 1.2);
        ctx.closePath();
        ctx.fill();

        // Top Isometric Lid
        const topGrad = ctx.createLinearGradient(-sz, -sz, sz, sz);
        topGrad.addColorStop(0, '#a78bfa'); // pale purple peak
        topGrad.addColorStop(0.5, '#8b5cf6');
        topGrad.addColorStop(1, '#6d28d9');
        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.moveTo(0, -sz);
        ctx.lineTo(sz, -sz / 2);
        ctx.lineTo(0, 0);
        ctx.lineTo(-sz, -sz / 2);
        ctx.closePath();
        ctx.fill();

        // 3D Golden Ribbon bands wrapped on sides
        const goldRibbon = ctx.createLinearGradient(-sz, -sz, sz, sz);
        goldRibbon.addColorStop(0, '#fef08a');
        goldRibbon.addColorStop(0.5, '#fbbf24');
        goldRibbon.addColorStop(1, '#b45309');
        ctx.fillStyle = goldRibbon;

        // Left band
        ctx.beginPath();
        ctx.moveTo(-sz * 0.2, -sz * 0.6);
        ctx.lineTo(0, -sz * 0.5);
        ctx.lineTo(0, sz * 1.2);
        ctx.lineTo(-sz * 0.2, sz * 1.1);
        ctx.closePath();
        ctx.fill();

        // Right band
        ctx.beginPath();
        ctx.moveTo(0, -sz * 0.5);
        ctx.lineTo(sz * 0.2, -sz * 0.6);
        ctx.lineTo(sz * 0.2, sz * 1.1);
        ctx.lineTo(0, sz * 1.2);
        ctx.closePath();
        ctx.fill();

        // Golden Fluffy Bow tie on top lid center
        const bowGrad = ctx.createRadialGradient(-1, -sz - 1, 0.5, 0, -sz, 5);
        bowGrad.addColorStop(0, '#ffffff');
        bowGrad.addColorStop(0.4, '#fef08a');
        bowGrad.addColorStop(1, '#ca8a04');
        ctx.fillStyle = bowGrad;
        
        ctx.beginPath();
        ctx.arc(-3, -sz - 2, 4, 0, Math.PI * 2);
        ctx.arc(3, -sz - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

      } else if (item.type === 'defender_boot') {
        // --- 3D REALISTIC BRAZILIAN DEFENDER WITH MINI GOLDEN BALL ---
        ctx.save();
        ctx.translate(item.x, item.y);

        // Render circular aura outline base
        ctx.fillStyle = 'rgba(59, 130, 246, 0.16)';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Face movement scale orientation
        if (item.vx !== undefined && item.vx < 0) {
          ctx.scale(-1, 1);
        }

        // 1. Brazil Yellow/Green Jersey (3D volume)
        const shirtGrad = ctx.createLinearGradient(-15, 6, 15, 20);
        shirtGrad.addColorStop(0, '#fef08a'); // yellow shirt
        shirtGrad.addColorStop(0.5, '#eab308');
        shirtGrad.addColorStop(1, '#ca8a04');
        ctx.fillStyle = shirtGrad;
        ctx.beginPath();
        ctx.roundRect(-16, 6, 32, 16, [6, 6, 2, 2]);
        ctx.fill();

        // Green athletic collar
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.moveTo(-8, 6);
        ctx.lineTo(0, 11);
        ctx.lineTo(8, 6);
        ctx.lineTo(6, 6);
        ctx.lineTo(0, 8);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();

        // 2. Head with skin radial gradient & realistic athlete curly hair
        const defSkin = ctx.createRadialGradient(-2, -12, 1, 0, -10, 15);
        defSkin.addColorStop(0, '#ffeedb');
        defSkin.addColorStop(0.7, '#fcdcb6');
        defSkin.addColorStop(1, '#d97706'); // warm athletic skin
        ctx.fillStyle = defSkin;
        ctx.beginPath();
        ctx.arc(0, -10, 14, 0, Math.PI * 2);
        ctx.fill();

        // Black short curly hair spikes on top
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-8, -20, 5, 0, Math.PI * 2);
        ctx.arc(0, -22, 6, 0, Math.PI * 2);
        ctx.arc(8, -20, 5, 0, Math.PI * 2);
        ctx.arc(-11, -16, 4, 0, Math.PI * 2);
        ctx.arc(11, -16, 4, 0, Math.PI * 2);
        ctx.fill();

        // Green-and-yellow striped athlete sweatband across hair
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(-13, -17, 26, 4);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-13, -15.5, 26, 1.2);

        // Smiling focused eyes & eyebrow
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-5, -11, 2, 0, Math.PI * 2);
        ctx.arc(5, -11, 2, 0, Math.PI * 2);
        ctx.fill();
        // Eyebrows
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-8, -14); ctx.lineTo(-2, -13.5);
        ctx.moveTo(8, -14); ctx.lineTo(2, -13.5);
        ctx.stroke();

        // Broad natural smile
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -5, 5, 0, Math.PI);
        ctx.stroke();

        // 3. Mini Upgraded 3D Gold Ball Trophy held in hand
        ctx.save();
        ctx.translate(14, -13);
        const trophyBall = ctx.createRadialGradient(-1, -1, 0.5, 0, 0, 7);
        trophyBall.addColorStop(0, '#ffffff'); // shiny spec
        trophyBall.addColorStop(0.3, '#fef08a');
        trophyBall.addColorStop(0.8, '#eab308');
        trophyBall.addColorStop(1, '#854d0e');
        ctx.fillStyle = trophyBall;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Base of mini trophy
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-3, 6, 6, 4);
        ctx.restore();

        ctx.restore();

        // Floating '🛡️ 防守队员' Label on top of his blue aura sphere
        ctx.save();
        ctx.fillStyle = '#93c5fd';
        ctx.font = 'bold 10px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ 防守队员', item.x, item.y - item.radius - 8);
        ctx.restore();
      }

      ctx.restore();
    });

    // 6. Draw Hook mechanics
    drawHookOnCanvas(ctx);

    // 7. Draw particle FX
    particlesRef.current.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 8. Draw floating score/action text
    floatingTextsRef.current.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = 1 - t.age / 60;
      ctx.fillStyle = t.color;
      ctx.font = 'bold 15px "Outfit"';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  };

  // Highly realistic 3D Messi model drawing with volumetric shading, sitting behind a detailed 3D metal control console
  const drawMessiOnCanvas = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    // Anchor at GROUND_Y - 14 to fit the full-body caricature standing on the podium
    ctx.translate(VIRTUAL_WIDTH / 2, GROUND_Y - 14);

    const hook = hookRef.current;
    
    let bounceY = 0;
    let rotation = 0;
    let struggle = false;

    if (hook.state === HookState.IDLE) {
      bounceY = Math.sin(time / 200) * 1.8;
    } else if (hook.state === HookState.SHOOTING) {
      rotation = hook.angle * 0.15; // slight natural lean
    } else if (hook.state === HookState.RETRACTING) {
      bounceY = Math.sin(time / 80) * 1.2;
      struggle = hook.targetItem ? hook.targetItem.weight > 40 : false;
    }

    ctx.translate(0, bounceY);
    ctx.rotate(rotation);

    // 1. DOUBLE-TIERED CIRCULAR GREY MARBLE PEDESTAL (Image 1 style)
    ctx.save();
    // Bottom Slab Thickness (y = 18 to 24)
    const bottomThicknessGrad = ctx.createLinearGradient(-55, 18, 55, 24);
    bottomThicknessGrad.addColorStop(0, '#94a3b8');
    bottomThicknessGrad.addColorStop(0.5, '#cbd5e1');
    bottomThicknessGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = bottomThicknessGrad;
    ctx.beginPath();
    ctx.ellipse(0, 24, 55, 12, 0, 0, Math.PI);
    ctx.lineTo(-55, 18);
    ctx.ellipse(0, 18, 55, 12, 0, Math.PI, 0);
    ctx.lineTo(55, 24);
    ctx.closePath();
    ctx.fill();

    // Bottom Slab Top Surface
    const bottomTopGrad = ctx.createRadialGradient(0, 18, 10, 0, 18, 55);
    bottomTopGrad.addColorStop(0, '#f1f5f9'); // bright light grey polished
    bottomTopGrad.addColorStop(0.7, '#cbd5e1');
    bottomTopGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bottomTopGrad;
    ctx.beginPath();
    ctx.ellipse(0, 18, 55, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bottom Slab Outline
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Top Slab Thickness (y = 10 to 14)
    const topThicknessGrad = ctx.createLinearGradient(-46, 10, 46, 14);
    topThicknessGrad.addColorStop(0, '#cbd5e1');
    topThicknessGrad.addColorStop(0.5, '#f1f5f9');
    topThicknessGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = topThicknessGrad;
    ctx.beginPath();
    ctx.ellipse(0, 14, 46, 10, 0, 0, Math.PI);
    ctx.lineTo(-46, 10);
    ctx.ellipse(0, 10, 46, 10, 0, Math.PI, 0);
    ctx.lineTo(46, 14);
    ctx.closePath();
    ctx.fill();

    // Top Slab Top Surface
    const topTopGrad = ctx.createRadialGradient(-10, 8, 5, 0, 10, 46);
    topTopGrad.addColorStop(0, '#ffffff'); // pure polished white marble reflection
    topTopGrad.addColorStop(0.6, '#f1f5f9');
    topTopGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = topTopGrad;
    ctx.beginPath();
    ctx.ellipse(0, 10, 46, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Top Slab Outline
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Golden sparkles on the pedestal (trophy aura!)
    ctx.fillStyle = 'rgba(234, 179, 8, 0.45)';
    const drawSparkle = (sx: number, sy: number, sz: number) => {
      ctx.beginPath();
      ctx.moveTo(sx, sy - sz);
      ctx.lineTo(sx + sz * 0.4, sy - sz * 0.4);
      ctx.lineTo(sx + sz, sy);
      ctx.lineTo(sx + sz * 0.4, sy + sz * 0.4);
      ctx.lineTo(sx, sy + sz);
      ctx.lineTo(sx - sz * 0.4, sy + sz * 0.4);
      ctx.lineTo(sx - sz, sy);
      ctx.lineTo(sx - sz * 0.4, sy - sz * 0.4);
      ctx.closePath();
      ctx.fill();
    };
    drawSparkle(-34, 18, 5);
    drawSparkle(32, 22, 6);
    ctx.restore();

    // 2. BOOTS, SOCKS & LEGS (Standing firmly on the top slab of the marble pedestal)
    const skinColor = '#ffebd4';
    const darkSkinColor = '#e5be93';
    const skinGrad = ctx.createLinearGradient(-15, -4, 15, -4);
    skinGrad.addColorStop(0, darkSkinColor);
    skinGrad.addColorStop(0.5, skinColor);
    skinGrad.addColorStop(1, darkSkinColor);

    const drawStandingLegAndBoot = (lx: number, isLeft: boolean) => {
      // A. Bare skin thigh segment (from bottom of shorts y = -18 to top of socks y = -6)
      ctx.fillStyle = skinGrad;
      ctx.fillRect(lx - 4, -18, 8, 12);

      // B. White folded socks with sky-blue bands (y = -6 to y = 8)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(lx - 4.5, -6, 9, 14, [1.5]);
      ctx.fill();

      // Sky-blue bands at top of socks
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(lx - 4.5, -4, 9, 1.8);
      ctx.fillRect(lx - 4.5, -0.8, 9, 1.8);

      // Gold WC star/badge printed on socks (Image 1 style)
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(lx, 3, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // C. High-fidelity blue football boots (resting on pedestal at y = 8 to 13)
      const bootGrad = ctx.createLinearGradient(lx - 6, 8, lx + 6, 13);
      bootGrad.addColorStop(0, '#1e3a8a');
      bootGrad.addColorStop(0.5, '#3b82f6');
      bootGrad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = bootGrad;
      ctx.beginPath();
      if (isLeft) {
        // Left shoe pointing slightly left-forward
        ctx.roundRect(lx - 7.5, 8, 12, 5.5, [3, 5, 2, 2]);
      } else {
        // Right shoe pointing slightly right-forward
        ctx.roundRect(lx - 4.5, 8, 12, 5.5, [5, 3, 2, 2]);
      }
      ctx.fill();

      // Sharp white details/stripes on the boots (Image 1 style)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(isLeft ? lx - 4 : lx + 1, 9, 1.2, 3);
      ctx.fillRect(isLeft ? lx - 1 : lx + 4, 9, 1.2, 3);
    };

    drawStandingLegAndBoot(-11, true);
    drawStandingLegAndBoot(11, false);

    // 3. BLACK FOOTBALL SHORTS (adidas style with gold badge - Image 1)
    ctx.fillStyle = '#18181b'; // matte black
    ctx.beginPath();
    ctx.roundRect(-14.5, -31, 29, 13, [1.5, 1.5, 2, 2]);
    ctx.fill();

    // Center divider
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-2, -22, 4, 4);

    // Three side stripes on shorts (white, Adidas style)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-14, -30, 1.2, 10);
    ctx.fillRect(12.8, -30, 1.2, 10);

    // White "10" number on left thigh (our right)
    ctx.font = 'bold 5px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('10', 8, -23);

    // Gold AFA Badge on right thigh (our left)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-7.5, -23.5, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // 4. ARGENTINA JERSEY TORSO (Classic vertical sky-blue and white stripes - Image 1)
    ctx.fillStyle = '#ffffff'; // white vertical stripes base
    ctx.beginPath();
    ctx.roundRect(-13.5, -57, 27, 27, [4, 4, 1.5, 1.5]);
    ctx.fill();

    // Sky-blue vertical stripes (championship design)
    ctx.fillStyle = '#74acdf';
    ctx.fillRect(-13.5, -57, 4.5, 27);
    ctx.fillRect(-2.25, -57, 4.5, 27);
    ctx.fillRect(9.0, -57, 4.5, 27);

    // Black collar ring & sleeve hems
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(0, -57, 4.2, 0, Math.PI);
    ctx.fill();

    // Gold WC Champion chest badge (center, Image 1)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -46, 2.3, 0, Math.PI * 2);
    ctx.fill();

    // Gold AFA Badge on left chest (our right side)
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(4.5, -51, 3.0, 3.5);

    // Brand print on right chest
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-7.5, -51, 3.0, 1.3);

    // Number 10 print on the center
    ctx.fillStyle = '#18181b';
    ctx.font = 'black 900 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10', 0, -38);

    // 5. DOUBLE THUMBS UP ARMS (👍 😄 👍 - Messi's signature posture)
    // Left Arm (Messi's right with sleeve tattoo)
    ctx.save();
    ctx.strokeStyle = skinGrad;
    ctx.lineWidth = 4.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-13, -51);
    ctx.lineTo(-21, -45);
    ctx.lineTo(-23, -51); // raised forearm
    ctx.stroke();

    // Hand fist
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.arc(-23, -52, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Upright thumb!
    ctx.beginPath();
    ctx.ellipse(-23, -56, 1.2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sleeve Tattoo pattern overlay
    ctx.strokeStyle = 'rgba(40, 40, 50, 0.55)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-13.5, -50);
    ctx.lineTo(-19.5, -46);
    ctx.stroke();
    ctx.restore();

    // Right Arm (Messi's left - clean skin)
    ctx.save();
    ctx.strokeStyle = skinGrad;
    ctx.lineWidth = 4.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(13, -51);
    ctx.lineTo(21, -45);
    ctx.lineTo(23, -51);
    ctx.stroke();

    // Hand fist
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.arc(23, -52, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Upright thumb!
    ctx.beginPath();
    ctx.ellipse(23, -56, 1.2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Captain Armband on right arm (our left side)
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(-16.5, -50, 4.2, 4.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-16.5, -48.5, 4.2, 1.2);

    // 6. CHIBI HEAD & JOYFUL CONFIDENT SMILE (Image 1 style)
    const faceCenterY = -74;
    const faceRadius = 17.5;

    // Face skin core
    const faceGrad = ctx.createRadialGradient(-1.5, faceCenterY - 1.5, 2, 0, faceCenterY, faceRadius);
    faceGrad.addColorStop(0, '#ffebd4');
    faceGrad.addColorStop(0.7, '#fddcb4');
    faceGrad.addColorStop(1, '#e5be93');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.arc(0, faceCenterY, faceRadius, 0, Math.PI * 2);
    ctx.fill();

    // Ear Left & Ear Right
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.arc(-faceRadius - 1.2, faceCenterY, 3.5, 0, Math.PI * 2);
    ctx.arc(faceRadius + 1.2, faceCenterY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Beard and mustache (sculpted brown beard - Image 1 style)
    const beardGrad = ctx.createLinearGradient(-faceRadius, faceCenterY + 4, faceRadius, faceCenterY + 4);
    beardGrad.addColorStop(0, '#3b2314');
    beardGrad.addColorStop(0.5, '#5c3116');
    beardGrad.addColorStop(1, '#3b2314');
    ctx.fillStyle = beardGrad;
    ctx.beginPath();
    ctx.arc(0, faceCenterY + 3.0, faceRadius - 1, 0, Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, faceCenterY + 6.5, 8.5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Re-fill cheek for beard shape
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.arc(0, faceCenterY, faceRadius - 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw sparkling eyes tracking hook angle
    const drawEye = (ex: number, ey: number) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 3.5, 2.0, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pupil tracks the hook!
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(ex + (hook.angle * 1.1), ey, 1.8, 0, Math.PI * 2);
      ctx.fill();
      // Shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + (hook.angle * 1.1) - 0.6, ey - 0.6, 0.6, 0, Math.PI * 2);
      ctx.fill();
      // Eyebrow
      ctx.strokeStyle = '#291305';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(ex - 3.5, ey - 4.0);
      ctx.quadraticCurveTo(ex, ey - 5.5, ex + 3.5, ey - 4.0);
      ctx.stroke();
    };

    if (struggle) {
      ctx.strokeStyle = '#291305';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-10, faceCenterY - 2); ctx.lineTo(-3, faceCenterY);
      ctx.moveTo(10, faceCenterY - 2); ctx.lineTo(3, faceCenterY);
      ctx.stroke();
    } else {
      drawEye(-6.5, faceCenterY - 2);
      drawEye(6.5, faceCenterY - 2);
    }

    // Joyful confident open smile with white teeth (Image 1)
    ctx.save();
    ctx.translate(0, faceCenterY + 7.5);
    ctx.beginPath();
    ctx.arc(0, 0, 5.0, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#5c1913';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.rect(-3.5, 0, 7, 2.0);
    ctx.fill();
    ctx.restore();

    // Nose
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, faceCenterY - 3.5);
    ctx.lineTo(1.0, faceCenterY + 1.2);
    ctx.lineTo(-0.4, faceCenterY + 1.2);
    ctx.stroke();

    // Hair: Spiked Brown hair swept to the right (Image 1 style)
    const hairGrad = ctx.createLinearGradient(-faceRadius, faceCenterY - 16, faceRadius, faceCenterY - 9);
    hairGrad.addColorStop(0, '#3b2314');
    hairGrad.addColorStop(0.5, '#7c4a27');
    hairGrad.addColorStop(1, '#291305');
    ctx.fillStyle = hairGrad;
    ctx.beginPath();
    ctx.moveTo(-faceRadius + 1, faceCenterY - 3);
    ctx.quadraticCurveTo(-faceRadius - 2, faceCenterY - 14, -9, faceCenterY - 17);
    ctx.quadraticCurveTo(-5, faceCenterY - 22, -1, faceCenterY - 20);
    ctx.quadraticCurveTo(3, faceCenterY - 23, 9, faceCenterY - 19);
    ctx.quadraticCurveTo(faceRadius, faceCenterY - 17, faceRadius - 1, faceCenterY - 3);
    ctx.quadraticCurveTo(faceRadius + 1.8, faceCenterY + 1, faceRadius - 2.5, faceCenterY + 2.5);
    ctx.quadraticCurveTo(0, faceCenterY - 4.5, -faceRadius + 2.5, faceCenterY + 2.5);
    ctx.closePath();
    ctx.fill();

    // Highlights in hair
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-10, faceCenterY - 13); ctx.quadraticCurveTo(-3, faceCenterY - 16, -1, faceCenterY - 11);
    ctx.moveTo(-1, faceCenterY - 15); ctx.quadraticCurveTo(4, faceCenterY - 17, 6, faceCenterY - 11);
    ctx.stroke();

    if (struggle && Math.random() < 0.35) {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.95)';
      ctx.beginPath();
      ctx.arc(-faceRadius + 2 + Math.random() * 3, faceCenterY + 4 + Math.random() * 5, 1.5, 0, Math.PI * 2);
      ctx.arc(faceRadius - 2 - Math.random() * 3, faceCenterY + 4 + Math.random() * 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. 3D MECHANICAL WINCH REEL (Image 1 style) - Centered at the hook's anchor (0, 30)
    ctx.save();
    ctx.translate(0, 30); // local coordinate space of the winch reel

    // A. Side steel supporting brackets
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-18, 12);
    ctx.moveTo(16, 0);
    ctx.lineTo(18, 12);
    ctx.stroke();

    // B. Cylindrical Reel Spool (Spindle)
    const spoolGrad = ctx.createLinearGradient(-12, 0, 12, 0);
    spoolGrad.addColorStop(0, '#1e293b');
    spoolGrad.addColorStop(0.3, '#334155');
    spoolGrad.addColorStop(0.7, '#334155');
    spoolGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = spoolGrad;
    ctx.fillRect(-12, -10, 24, 20);

    // C. Golden-Brown Coiled Rope Lines (dense horizontal ridges representing realistic wound rope)
    const ropeColor = '#d97706';
    const shadowRopeColor = '#78350f';
    ctx.lineWidth = 2.0;
    for (let rx = -9; rx <= 9; rx += 2.2) {
      const ropeGrad = ctx.createLinearGradient(0, -9, 0, 9);
      ropeGrad.addColorStop(0, shadowRopeColor);
      ropeGrad.addColorStop(0.4, ropeColor);
      ropeGrad.addColorStop(0.6, '#f59e0b');
      ropeGrad.addColorStop(1, shadowRopeColor);
      ctx.fillStyle = ropeGrad;
      ctx.fillRect(rx - 1, -9.5, 2, 19);
    }

    // D. Rounded Steel Flanges (Left and Right ends of the reel)
    const drawFlange = (fx: number) => {
      const flangeGrad = ctx.createRadialGradient(fx - 2 * Math.sign(fx), -2, 2, fx, 0, 13);
      flangeGrad.addColorStop(0, '#cbd5e1');
      flangeGrad.addColorStop(0.6, '#475569');
      flangeGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = flangeGrad;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(fx, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(fx, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    };
    drawFlange(-12);
    drawFlange(12);

    // E. Dynamic steel Crank/Winder Handle on the left side (spins slowly when retracting!)
    ctx.save();
    ctx.translate(-12, 0);
    if (hook.state === HookState.SHOOTING || hook.state === HookState.RETRACTING) {
      ctx.rotate(time * 0.04 * (hook.state === HookState.SHOOTING ? 1 : -1));
    }
    // Crank lever
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-8, -12);
    ctx.lineTo(-14, -12);
    ctx.stroke();
    // Crank grip
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-14, -12, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    ctx.restore();
  };

  // Drawing mechanical winch hook on Canvas
  const drawHookOnCanvas = (ctx: CanvasRenderingContext2D) => {
    const hook = hookRef.current;
    const hx = HOOK_ANCHOR.x + hook.length * Math.sin(hook.angle);
    const hy = HOOK_ANCHOR.y + hook.length * Math.cos(hook.angle);

    // 1. Draw reel pulley base at anchor (3D steel style)
    const pulleyGrad = ctx.createRadialGradient(HOOK_ANCHOR.x - 3, HOOK_ANCHOR.y - 3, 2, HOOK_ANCHOR.x, HOOK_ANCHOR.y, 12);
    pulleyGrad.addColorStop(0, '#94a3b8');
    pulleyGrad.addColorStop(0.6, '#475569');
    pulleyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = pulleyGrad;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(HOOK_ANCHOR.x, HOOK_ANCHOR.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pulley center brass core
    const boltGrad = ctx.createRadialGradient(HOOK_ANCHOR.x - 1, HOOK_ANCHOR.y - 1, 0.5, HOOK_ANCHOR.x, HOOK_ANCHOR.y, 5);
    boltGrad.addColorStop(0, '#fef08a');
    boltGrad.addColorStop(1, '#854d0e');
    ctx.fillStyle = boltGrad;
    ctx.beginPath();
    ctx.arc(HOOK_ANCHOR.x, HOOK_ANCHOR.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw segmented chrome metallic chain links along line
    ctx.save();
    const segmentsCount = Math.floor(hook.length / 15);
    for (let i = 0; i <= segmentsCount; i++) {
      const ratio = i / segmentsCount;
      const cx = HOOK_ANCHOR.x + (hx - HOOK_ANCHOR.x) * ratio;
      const cy = HOOK_ANCHOR.y + (hy - HOOK_ANCHOR.y) * ratio;

      // Chrome metallic style links with dual tone
      const linkGrad = ctx.createLinearGradient(cx - 3, cy - 3, cx + 3, cy + 3);
      linkGrad.addColorStop(0, '#f8fafc'); // specular highlight
      linkGrad.addColorStop(0.4, '#cbd5e1'); // light steel
      linkGrad.addColorStop(0.8, '#475569'); // shadow
      linkGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = linkGrad;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Shiny center pin
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 1, cy - 1, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Draw mechanical 3D Golden-Claw jaws at hook tip
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-hook.angle); // align jaws with the pulling direction

    let jawOpenAngle = Math.PI * 0.22;
    if (hook.state === HookState.SHOOTING) {
      jawOpenAngle = Math.PI * 0.28;
    } else if (hook.state === HookState.RETRACTING && hook.targetItem) {
      jawOpenAngle = Math.PI * 0.08;
    }

    // Heavy golden steel style
    const goldClawGrad = ctx.createLinearGradient(-15, -6, 15, 12);
    goldClawGrad.addColorStop(0, '#fef08a'); // shiny gold top
    goldClawGrad.addColorStop(0.5, '#ca8a04'); // deep yellow gold
    goldClawGrad.addColorStop(1, '#78350f'); // heavy amber shadow

    ctx.strokeStyle = goldClawGrad;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Left curved grabber jaw
    ctx.beginPath();
    ctx.arc(-8, 0, 18, Math.PI * 1.5, Math.PI * 0.5 - jawOpenAngle, false);
    ctx.stroke();

    // Right curved grabber jaw
    ctx.beginPath();
    ctx.arc(8, 0, 18, Math.PI * 1.5, Math.PI * 0.5 + jawOpenAngle, true);
    ctx.stroke();

    // Detailed claw tip pointers (heavy teeth)
    const lx = -8 + 18 * Math.cos(Math.PI * 0.5 - jawOpenAngle);
    const ly = 18 * Math.sin(Math.PI * 0.5 - jawOpenAngle);
    const tipGradL = ctx.createLinearGradient(lx - 4, ly, lx + 4, ly + 8);
    tipGradL.addColorStop(0, '#fef08a');
    tipGradL.addColorStop(1, '#854d0e');
    ctx.fillStyle = tipGradL;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx - 5, ly + 9);
    ctx.lineTo(lx + 4, ly + 3);
    ctx.closePath();
    ctx.fill();

    const rx = 8 + 18 * Math.cos(Math.PI * 0.5 + jawOpenAngle);
    const ry = 18 * Math.sin(Math.PI * 0.5 + jawOpenAngle);
    const tipGradR = ctx.createLinearGradient(rx - 4, ry, rx + 4, ry + 8);
    tipGradR.addColorStop(0, '#fef08a');
    tipGradR.addColorStop(1, '#854d0e');
    ctx.fillStyle = tipGradR;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 5, ry + 9);
    ctx.lineTo(rx - 4, ry + 3);
    ctx.closePath();
    ctx.fill();

    // Heavy industrial steel cap
    const capGrad = ctx.createLinearGradient(-8, -6, 8, 0);
    capGrad.addColorStop(0, '#64748b');
    capGrad.addColorStop(0.5, '#cbd5e1');
    capGrad.addColorStop(1, '#334155');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.roundRect(-8, -7, 16, 7, [3, 3, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center pivot bolt in cap
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -3.5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Locker room shop purchases
  const buyShopItem = (item: ShopItem) => {
    const cost = getItemCost(item.id, item.cost, stats.level);
    if (stats.score < cost) {
      // Can't afford
      gameAudio.playClick();
      return;
    }

    // Process Purchase
    setStats((prev) => {
      const nextScore = prev.score - cost;
      const nextStats = { ...prev, score: nextScore };

      if (item.id === 'mate_tea') nextStats.bombs = Math.min(5, prev.bombs + 1); // incremental tea drinks
      if (item.id === 'boot_polish') nextStats.hasBootPolish = true;
      if (item.id === 'red_card_waiver') nextStats.hasRedCardWaiver = true;
      if (item.id === 'gold_speed') nextStats.hasMateTea = true; // pull speed booster

      return nextStats;
    });

    gameAudio.playPurchase();
  };

  return (
    <div className="relative w-full h-screen bg-[#070b11] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Background Ambience Crowds */}
      <div className="absolute inset-0 bg-stadium-grid bg-repeat opacity-40 pointer-events-none" />

      {/* Floating Sparkles across app */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#10b981]/10 to-transparent pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* START SCREEN */}
        {gameState === GameState.START && (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="z-10 flex flex-col items-center max-w-xl sm:max-w-2xl w-full px-6 py-8 rounded-2xl border border-emerald-900/40 bg-slate-950/85 backdrop-blur-md shadow-2xl shadow-emerald-950/25 text-center"
            id="start-card"
          >
            {/* Argentina Flag Banner Ribbon */}
            <div className="flex h-1.5 w-full max-w-[200px] mb-4 rounded-full overflow-hidden">
              <div className="w-1/3 bg-[#74acdf]" />
              <div className="w-1/3 bg-white flex items-center justify-center relative">
                <div className="absolute w-2 h-2 rounded-full bg-[#f59e0b]" />
              </div>
              <div className="w-1/3 bg-[#74acdf]" />
            </div>

            {/* HIGH-FIDELITY INTERACTIVE MINE CAVERN COVER ILLUSTRATION (MIMICKING IMAGE 2) */}
            <div className="relative w-full h-60 sm:h-72 rounded-xl overflow-hidden bg-gradient-to-b from-[#110c08] via-[#1a120b] to-[#0c0805] border-2 border-amber-900/40 mb-5 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8),0_10px_25px_rgba(0,0,0,0.6)] flex flex-col items-center justify-between p-4 select-none">
              
              {/* Layer 1: Rocky Cave Walls SVG Overlays (Creates the 3D cavern depth from Image 2) */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
              
              {/* Left Jagged Cave Rocks (SVG Vector) */}
              <svg className="absolute left-0 inset-y-0 w-24 sm:w-28 h-full text-stone-800/90 fill-current drop-shadow-[4px_0_12px_rgba(0,0,0,0.7)] z-10 pointer-events-none" viewBox="0 0 100 200" preserveAspectRatio="none">
                <path d="M0,0 Q25,30 10,50 T30,90 T15,130 T28,170 T0,200 L0,0 Z" />
                {/* Rock detail lines */}
                <path d="M0,45 Q15,55 5,65 M0,110 Q20,115 10,125 M0,165 Q18,175 8,185" stroke="#443b35" strokeWidth="1.5" fill="none" />
              </svg>

              {/* Right Jagged Cave Rocks (SVG Vector) */}
              <svg className="absolute right-0 inset-y-0 w-24 sm:w-28 h-full text-stone-800/90 fill-current drop-shadow-[-4px_0_12px_rgba(0,0,0,0.7)] z-10 pointer-events-none" viewBox="0 0 100 200" preserveAspectRatio="none">
                <path d="M100,0 Q75,30 90,50 T70,90 T85,130 T72,170 T100,200 L100,0 Z" />
                {/* Rock detail lines */}
                <path d="M100,35 Q85,45 95,55 M100,105 Q80,110 90,120 M100,155 Q82,165 92,175" stroke="#443b35" strokeWidth="1.5" fill="none" />
              </svg>

              {/* Sparkling gold ores and gemstones embedded on the rock faces */}
              <div className="absolute left-4 top-10 text-[10px] animate-pulse z-20">✨</div>
              <div className="absolute left-10 top-24 text-xs animate-pulse text-yellow-400 z-20">🟡</div>
              <div className="absolute left-6 top-40 text-xs animate-bounce z-20">💎</div>
              <div className="absolute right-6 top-12 text-xs animate-pulse text-yellow-400 z-20">✨</div>
              <div className="absolute right-12 top-28 text-[10px] animate-bounce z-20">💎</div>
              <div className="absolute right-8 top-44 text-xs animate-pulse z-20">🟡</div>

              {/* Layer 2: Warm Lantern Lightings Casting Ambient Glow (As seen in Image 2) */}
              {/* Left Lantern Warm Glow */}
              <div className="absolute top-4 left-10 w-44 h-44 rounded-full bg-amber-500/20 blur-[40px] pointer-events-none z-10 animate-flicker" />
              {/* Right Lantern Warm Glow */}
              <div className="absolute top-6 right-10 w-44 h-44 rounded-full bg-amber-500/20 blur-[40px] pointer-events-none z-10 animate-flicker" />

              {/* Hanging Oil Lanterns */}
              {/* Left Lantern */}
              <div className="absolute top-3 left-12 flex flex-col items-center z-20">
                {/* Hang Rope */}
                <div className="w-0.5 h-10 bg-gradient-to-b from-stone-800 to-stone-600" />
                {/* Lantern Housing */}
                <div className="w-6 h-8 rounded-md bg-stone-900 border border-amber-800/50 flex flex-col items-center justify-center relative shadow-lg">
                  {/* Metal Bars */}
                  <div className="absolute inset-x-1.5 inset-y-1 border-x border-stone-700/80 pointer-events-none" />
                  {/* Glowing Flame Core */}
                  <div className="w-3 h-4 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 animate-flicker shadow-[0_0_15px_rgba(245,158,11,1)]" />
                  {/* Glass tint */}
                  <div className="absolute inset-0 bg-yellow-500/10 rounded-md pointer-events-none" />
                </div>
                {/* Bottom Base */}
                <div className="w-7 h-1.5 bg-stone-800 rounded-sm -mt-0.5" />
              </div>

              {/* Right Lantern */}
              <div className="absolute top-4 right-12 flex flex-col items-center z-20">
                {/* Hang Rope */}
                <div className="w-0.5 h-8 bg-gradient-to-b from-stone-800 to-stone-600" />
                {/* Lantern Housing */}
                <div className="w-6 h-8 rounded-md bg-stone-900 border border-amber-800/50 flex flex-col items-center justify-center relative shadow-lg">
                  {/* Metal Bars */}
                  <div className="absolute inset-x-1.5 inset-y-1 border-x border-stone-700/80 pointer-events-none" />
                  {/* Glowing Flame Core */}
                  <div className="w-3 h-4 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 animate-flicker shadow-[0_0_15px_rgba(245,158,11,1)]" />
                  {/* Glass tint */}
                  <div className="absolute inset-0 bg-yellow-500/10 rounded-md pointer-events-none" />
                </div>
                {/* Bottom Base */}
                <div className="w-7 h-1.5 bg-stone-800 rounded-sm -mt-0.5" />
              </div>

              {/* Hanging Argentina Flag and Wooden Copa sign */}
              {/* Left Side Wooden Sign board: "COPA DEL MUNDO 2026" */}
              <div className="absolute left-2 top-28 hidden md:flex flex-col items-center rotate-[-5deg] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] z-20">
                <div className="w-0.5 h-4 bg-stone-700" />
                <div className="px-2 py-1 bg-gradient-to-b from-amber-800 to-amber-950 border border-amber-900 rounded-md shadow-md text-stone-300 font-serif font-bold text-[7px] leading-tight text-center">
                  <div>COPA DEL</div>
                  <div>MUNDO</div>
                  <div className="text-yellow-400 text-[9px] tracking-wider font-sans font-black">2026</div>
                </div>
              </div>

              {/* Right Side Argentina Shield Crest */}
              <div className="absolute right-2 top-24 hidden md:flex flex-col items-center rotate-[4deg] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] z-20">
                <div className="w-0.5 h-4 bg-stone-700" />
                <div className="w-7 h-9 border-2 border-white/80 bg-gradient-to-b from-[#74acdf] via-white to-[#74acdf] shadow-md flex flex-col items-center justify-center rounded-b-lg overflow-hidden">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500 flex items-center justify-center animate-pulse shadow-[0_0_4px_rgba(251,191,36,0.8)]">
                    <span className="text-[5px] font-black text-amber-900 leading-none">★</span>
                  </div>
                  <span className="text-[6px] font-black text-sky-900 font-sans tracking-tighter mt-0.5">AFA</span>
                </div>
              </div>

              {/* Layer 3: Central Cave Perspective Depth Tunnel */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-36 bg-black/60 rounded-full blur-2xl pointer-events-none" />

              {/* MIDDLE STAGE AREA */}
              <div className="relative flex-1 w-full flex items-end justify-center select-none pt-4 z-20">
                
                {/* PERSPECTIVE RAILROAD TRACKS (Converging lines for depth) */}
                <div className="absolute bottom-4 inset-x-10 h-6 flex flex-col justify-end">
                  {/* Steel rails in perspective */}
                  <svg className="w-full h-4 text-stone-600 stroke-current fill-none" viewBox="0 0 200 20">
                    <line x1="20" y1="20" x2="60" y2="0" strokeWidth="2" strokeLinecap="round" />
                    <line x1="180" y1="20" x2="140" y2="0" strokeWidth="2" strokeLinecap="round" />
                    {/* Railroad wooden ties */}
                    <line x1="24" y1="18" x2="176" y2="18" stroke="#78350f" strokeWidth="2.5" />
                    <line x1="40" y1="14" x2="160" y2="14" stroke="#78350f" strokeWidth="2.2" />
                    <line x1="56" y1="10" x2="144" y2="10" stroke="#78350f" strokeWidth="1.9" />
                    <line x1="72" y1="6" x2="128" y2="6" stroke="#78350f" strokeWidth="1.6" />
                    <line x1="88" y1="2" x2="112" y2="2" stroke="#78350f" strokeWidth="1.3" />
                  </svg>
                </div>

                {/* THE MINE CART OVERFLOWING WITH WORLD CUP TROPHIES (Match Image 2) */}
                <div className="relative z-20 w-48 h-18 bg-gradient-to-b from-[#4e341f] via-[#2f1f13] to-[#1c120a] border-2 border-[#5c3e25] rounded-b-xl rounded-t-sm shadow-2xl flex items-start justify-center p-1.5 overflow-visible">
                  
                  {/* Metal Corner Brackets and Rivets on Cart */}
                  <div className="absolute inset-y-0 left-0 w-2 bg-stone-700/90 border-r border-stone-800 rounded-l-sm" />
                  <div className="absolute inset-y-0 right-0 w-2 bg-stone-700/90 border-l border-stone-800 rounded-r-sm" />
                  <div className="absolute top-1 left-3 w-1 h-1 rounded-full bg-stone-300 shadow" />
                  <div className="absolute top-1 right-3 w-1 h-1 rounded-full bg-stone-300 shadow" />
                  <div className="absolute bottom-2 left-3 w-1 h-1 rounded-full bg-stone-300 shadow" />
                  <div className="absolute bottom-2 right-3 w-1 h-1 rounded-full bg-stone-300 shadow" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-stone-600 border border-stone-400" />

                  {/* Overflowing Golden Trophies and Ball Treasures inside Cart */}
                  <div className="absolute -top-7 left-3 text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-bounce-slow">🏆</div>
                  <div className="absolute -top-5 left-9 text-lg filter drop-shadow animate-pulse">⚽</div>
                  <div className="absolute -top-7 left-14 text-xl filter drop-shadow">🏆</div>
                  <div className="absolute -top-6 right-12 text-xl filter drop-shadow">🟡</div>
                  <div className="absolute -top-5 right-7 text-lg filter drop-shadow">⚽</div>
                  <div className="absolute -top-8 right-2 text-2xl filter drop-shadow animate-bounce-slow">🏆</div>

                  {/* LIOMEL MESSI SITTING COMFORTABLY IN CART OPERATING JOYSTICK (Replicating Image 2) */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                    
                    {/* Messi Smiling Cartoon Face & Brown Styled Hair/Beard */}
                    <div className="relative flex flex-col items-center">
                      {/* Premium styled brown hair spikes */}
                      <div className="absolute -top-2 w-10 h-5 bg-[#3a2516] rounded-t-full rounded-b-sm border-b border-stone-900 shadow" />
                      {/* Detailed Happy Face with Beard */}
                      <div className="text-4xl z-10 filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)]">🧔</div>
                    </div>

                    {/* Highly Detailed Argentina Striped Captain Jersey #10 */}
                    <div className="w-10 h-7 border-t-2 border-x border-sky-300 bg-white rounded-t-md flex overflow-hidden relative shadow-md -mt-1.5 justify-around items-center">
                      <div className="w-1.5 h-full bg-[#74acdf]" />
                      <div className="w-1.5 h-full bg-white flex items-center justify-center">
                        {/* Number 10 chest print */}
                        <span className="text-[7px] font-black font-mono text-stone-950 absolute -bottom-0.5 leading-none">10</span>
                      </div>
                      <div className="w-1.5 h-full bg-[#74acdf]" />
                    </div>
                  </div>

                  {/* Mechanical Controller Lever Joystick Panel */}
                  <div className="absolute bottom-1 right-5 w-6 h-7 bg-stone-800 border-2 border-stone-600 rounded-sm flex flex-col justify-around p-0.5 z-20 shadow">
                    <div className="w-full h-1 bg-stone-500 rounded-full" />
                    {/* Animated joystick lever held by Messi's right side direction */}
                    <div className="w-1 h-3.5 bg-stone-400 mx-auto origin-bottom rotate-[-20deg] relative animate-pulse">
                      {/* Red lever handle ball */}
                      <div className="absolute -top-1.5 -left-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-red-700 shadow" />
                    </div>
                  </div>

                  {/* Left hand thumbs up of approval */}
                  <div className="absolute -left-2 -top-4 text-xl z-20 animate-bounce-slow">👍</div>

                  {/* Heavy Iron Minecart Wheels sitting on track */}
                  <div className="absolute bottom-[-11px] inset-x-5 flex justify-between">
                    {/* Left Wheel */}
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 border-2 border-stone-600 flex items-center justify-center shadow-lg animate-spin-slow">
                      <div className="w-2 h-2 rounded-full bg-stone-400" />
                    </div>
                    {/* Right Wheel */}
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 border-2 border-stone-600 flex items-center justify-center shadow-lg animate-spin-slow">
                      <div className="w-2 h-2 rounded-full bg-stone-400" />
                    </div>
                  </div>
                </div>

                {/* THE MIGHTY MECHANICAL CLAW CRANE GRABBING TROPHY (Match Image 2 right side) */}
                <div className="absolute right-12 bottom-12 w-32 h-36 flex flex-col items-center origin-top rotate-[18deg] animate-crane-sway z-10">
                  {/* Heavy Lattice steel crane arm girder */}
                  <div className="w-3.5 h-20 bg-gradient-to-b from-stone-600 to-stone-500 border border-stone-700 relative shadow-inner flex flex-col justify-around items-center py-1">
                    {/* Inner lattice trusses */}
                    <div className="w-2 h-0.5 bg-stone-800" />
                    <div className="w-2 h-0.5 bg-stone-800 rotate-[45deg]" />
                    <div className="w-2 h-0.5 bg-stone-800 rotate-[-45deg]" />
                    <div className="w-2 h-0.5 bg-stone-800" />
                  </div>
                  
                  {/* Heavy Industrial Joint */}
                  <div className="w-6 h-6 rounded-full bg-stone-700 border-2 border-stone-500 flex items-center justify-center -mt-1 shadow-md z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                  </div>

                  {/* Joint Connector and Hydraulic Cylinder */}
                  <div className="w-1.5 h-4 bg-stone-800 border border-stone-600" />

                  {/* The Powerful Golden Grabber Claw (Clamped securely around the World Cup) */}
                  <div className="relative w-12 h-8 flex justify-between -mt-1">
                    {/* Left Heavy curved claw finger */}
                    <div className="w-3.5 h-8 border-l-3 border-b-3 border-amber-500 rounded-bl-xl origin-top rotate-[-10deg] shadow-[inset_1px_0_0_rgba(255,255,255,0.2)]" />
                    {/* Right Heavy curved claw finger */}
                    <div className="w-3.5 h-8 border-r-3 border-b-3 border-amber-500 rounded-br-xl origin-top rotate-[10deg] shadow-[inset_-1px_0_0_rgba(255,255,255,0.2)]" />
                  </div>

                  {/* Golden World Cup Trophy caught in the Claw! */}
                  <div className="absolute bottom-[-18px] flex flex-col items-center animate-bounce-slow">
                    <div className="text-2xl filter drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] animate-gold-glow">🏆</div>
                  </div>
                </div>

              </div>


              {/* Sparkling Gold Dust Ores at bottom */}
              <div className="w-full flex justify-around text-[10px] sm:text-xs opacity-80 z-10 px-6 font-mono text-amber-500">
                <span className="animate-pulse">✨ 黄金矿脉</span>
                <span className="hidden sm:inline opacity-30">------------------------------------</span>
                <span className="animate-pulse">💎 传奇之夜</span>
              </div>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-sky-300 to-yellow-100">
              梅西世界杯
            </h1>
            <p className="font-display text-xs sm:text-sm tracking-widest text-sky-400/80 font-semibold uppercase mt-0.5 mb-5">
              黄金矿工 · 传奇球王版
            </p>

            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-md">
              助梅西一臂之力，在卡塔尔地下寻找深藏的黄金荣誉！抓取大力神杯和金球，避开拖慢速度的大红牌与防守球员！
            </p>

            {/* High score */}
            {stats.highScore > 0 && (
              <div className="mb-5 px-4 py-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg inline-flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-yellow-400 font-mono font-medium">
                  历史最佳积分: {stats.highScore}
                </span>
              </div>
            )}

            {/* Main actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mb-6">
              <button
                onClick={() => startNewLevel(1, 0)}
                className="flex-1 py-3.5 px-6 rounded-xl font-display font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 border border-emerald-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                id="btn-start"
              >
                <Play className="w-5 h-5 fill-current" />
                开启淘汰赛
              </button>

              <button
                onClick={() => {
                  gameAudio.playClick();
                  setShowTutorial(true);
                }}
                className="py-3.5 px-5 rounded-xl font-medium text-gray-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                id="btn-tutorial"
              >
                <BookOpen className="w-5 h-5 text-gray-400" />
                规则说明
              </button>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleMute}
              className="p-2.5 rounded-full bg-slate-900/60 border border-slate-800/40 text-gray-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="声音开关"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-sky-400" />}
            </button>
          </motion.div>
        )}

        {/* RULE MODAL OVERLAY */}
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-950 border border-slate-800 p-6 rounded-2xl w-full max-w-lg text-left shadow-2xl relative"
            >
              <h3 className="font-display font-bold text-xl text-yellow-400 mb-4 flex items-center gap-2">
                🏆 绿茵传奇游戏玩法说明
              </h3>

              <div className="space-y-4 text-sm text-gray-300 mb-6 font-sans">
                <div className="p-3 bg-slate-900 rounded-lg flex gap-3 border border-slate-800">
                  <span className="text-xl">🕹️</span>
                  <div>
                    <h4 className="font-semibold text-white">核心操作</h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      梅西脚下的黄金吊钩作 180 度左右摆动。点击<b>屏幕下半部</b>或按下<b>空格键(Space)</b>发射钩子，抓取下方埋藏的物品并拉回！
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg flex gap-3 border border-slate-800">
                  <span className="text-xl">⚽</span>
                  <div>
                    <h4 className="font-semibold text-white">抓取目标</h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      <b>大力神杯:</b> 500分，体积大极重。| <b>金球奖:</b> 250分，中重。<br />
                      <b>足球:</b> 100分，轻巧拉回极快。| <b>神秘福袋:</b> 随机奖励分数或足球炸弹。<br />
                      <span className="text-sky-300 font-medium">金靴防守球员:</span> 跑来跑去的球员头顶闪耀金靴，抓到立即得 <b>600分</b> 且拉扯极快！
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg flex gap-3 border border-slate-800">
                  <span className="text-xl">🟥</span>
                  <div>
                    <h4 className="font-semibold text-white">规避风险与防守</h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      <b>大红牌:</b> 只值 10 分，且异常沉重，极大浪费拉扯时间。如果不慎抓到，拥有炸弹时可在拉回途中按<b>键盘 ↑ 键</b>或点击<b>炸弹按钮</b>瞬间炸毁，保全通关大局！
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  gameAudio.playClick();
                  setShowTutorial(false);
                }}
                className="w-full py-2.5 rounded-xl font-bold text-slate-950 bg-yellow-400 hover:bg-yellow-300 active:scale-[0.98] transition-all text-center cursor-pointer"
              >
                我已准备，返回
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ACTIVE GAME PLAYING */}
        {gameState === GameState.PLAYING && (
          <motion.div
            key="playing-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex flex-col items-center bg-[#070b11] select-none"
          >
            {/* UPPER HUD - STADIUM WORLD CUP LED SCOREBOARD */}
            <div className="w-full max-w-[900px] px-5 py-3.5 bg-slate-950 border-b-2 border-amber-400/80 flex items-center justify-between z-10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-4">
                {/* Level Tag */}
                <div className="flex flex-col bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                  <span className="text-[9px] text-sky-400 font-extrabold uppercase tracking-widest font-sans">ROUND 赛段</span>
                  <span className="text-sm text-sky-200 font-black font-sans leading-tight">第 {stats.level} 关</span>
                </div>

                {/* Score and Goal info */}
                <div className="flex items-center gap-3 bg-black/40 border border-slate-900 px-3.5 py-1 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-amber-400 font-extrabold uppercase tracking-widest font-sans">ARG SCORE 积分</span>
                    <span className="text-2xl font-black text-yellow-400 font-sans tracking-tight leading-none drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]">
                      {stats.score} <span className="text-xs font-normal text-gray-400">/ {scoreGoal}</span>
                    </span>
                  </div>
                </div>

                {/* Level BGM Tag */}
                <div className="hidden lg:flex items-center gap-2 bg-slate-900/60 border border-slate-800/40 px-3 py-1.5 rounded-lg text-emerald-300">
                  <span className="text-xs animate-bounce" style={{ animationDuration: '2s' }}>🎵</span>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-emerald-400 font-bold uppercase font-sans tracking-wider">BGM 世界杯主题曲</span>
                    <span className="text-[11px] font-extrabold font-sans text-gray-200 leading-none">
                      {getBgmNameForLevel(stats.level)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center progress indicator */}
              <div className="hidden md:flex flex-col items-center w-36">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest font-sans mb-1">PROMOTION 晋级进度</span>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (stats.score / scoreGoal) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Countdown Timer with LED Styling */}
                <div className="flex items-center gap-2 px-3.5 py-1 bg-black/60 border border-red-500/20 rounded-lg shadow-inner">
                  <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-red-400'}`} />
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-red-500 font-extrabold uppercase tracking-widest font-sans">TIME 倒计时</span>
                    <span className={`text-xl font-black font-sans leading-none tracking-wider ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-red-300'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                </div>

                {/* Mate Tea Stockpile Count (Fitted to user's dynamite replacement) */}
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg" title="可用马黛茶数量">
                  <span className="text-lg">🧉</span>
                  <div className="flex flex-col leading-none">
                    <span className="text-[8px] text-emerald-400 font-bold uppercase font-sans">TEA 马黛茶</span>
                    <span className="text-xs font-black text-gray-200">x{stats.bombs}</span>
                  </div>
                </div>

                {/* Mute Toggle */}
                <button
                  onClick={toggleMute}
                  className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
                </button>
              </div>
            </div>

            {/* Active boost indicator banner */}
            {(stats.mateTeaActive || stats.bootPolishActive || stats.redCardWaiverActive) && (
              <div className="w-full max-w-[900px] px-4 py-1.5 bg-sky-950/30 border-b border-sky-950/60 flex items-center gap-3 z-10 text-[11px] text-sky-300">
                <span className="font-semibold uppercase tracking-wider text-[9px] px-1.5 py-0.5 bg-sky-900/60 border border-sky-800/40 rounded">状态加成:</span>
                {stats.mateTeaActive && (
                  <span className="inline-flex items-center gap-1 bg-emerald-950/60 border border-emerald-900/40 px-1.5 py-0.5 rounded text-emerald-300">
                    <Coffee className="w-3 h-3" /> 马黛茶 (速度 +30%)
                  </span>
                )}
                {stats.bootPolishActive && (
                  <span className="inline-flex items-center gap-1 bg-yellow-950/60 border border-yellow-900/40 px-1.5 py-0.5 rounded text-yellow-300">
                    <Zap className="w-3 h-3" /> 战靴喷雾 (黄金价值 x2)
                  </span>
                )}
                {stats.redCardWaiverActive && (
                  <span className="inline-flex items-center gap-1 bg-red-950/60 border border-red-900/40 px-1.5 py-0.5 rounded text-red-300">
                    <Shield className="w-3 h-3" /> 裁判免罚 (红牌100分)
                  </span>
                )}
              </div>
            )}

            {/* CORE GAME WINDOW (CANVAS CONTAINER) */}
            <div className="relative w-full max-w-[900px] border-x border-b border-slate-900 shadow-2xl overflow-hidden rounded-b-xl bg-slate-950">
              <canvas
                ref={(node) => {
                  canvasRef.current = node;
                  setCanvasElement(node);
                }}
                onClick={triggerShoot}
                className="block w-full h-[650px] cursor-crosshair bg-slate-950"
              />

              {/* Click / Tap to Shoot Overlay Indicator (Lower zone helper) */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 pointer-events-none z-10 opacity-75">
                <span className="hidden sm:inline text-xs text-gray-300 font-mono">
                  💡 操作秘籍: 按「空格键」射出吊钩，按「上方向键 ↑」喝马黛茶震碎红牌
                </span>
                <span className="sm:hidden text-xs text-gray-300 font-mono">
                  💡 操作提示: 触碰屏幕射出吊钩
                </span>
              </div>
            </div>

            {/* ACTION TRIGGERS BAR (FOR MOBILE & EASY TOUCH PLAYING) */}
            <div className="w-full max-w-[900px] py-4 px-2 flex justify-center gap-4 z-10 bg-slate-950 border-t border-slate-900">
              {/* Trigger Hook Button */}
              <button
                onClick={triggerShoot}
                className="flex-1 py-3.5 px-6 rounded-xl font-display font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 active:scale-[0.97] border border-sky-400/20 shadow-md shadow-sky-950/30 text-center transition-transform cursor-pointer"
                id="btn-shoot-action"
              >
                ⚽ 发射金钩 (空格键)
              </button>

              {/* Trigger Bomb Button (now styled as Drinking Yerba Mate tea) */}
              <button
                onClick={triggerBomb}
                disabled={stats.bombs <= 0 || hookRef.current.state !== HookState.RETRACTING || !hookRef.current.targetItem}
                className={`py-3.5 px-6 rounded-xl font-display font-bold border flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  stats.bombs > 0 && hookRef.current.state === HookState.RETRACTING && hookRef.current.targetItem
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 border-emerald-400/20 active:scale-[0.97] text-white animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-gray-500 cursor-not-allowed opacity-40'
                }`}
                id="btn-bomb-action"
              >
                <span className="text-xl leading-none">🧉</span>
                喝马黛茶 (↑ 键)
              </button>
            </div>
          </motion.div>
        )}

        {/* RECREATION LOCKER ROOM SHOP (SHOP State) */}
        {gameState === GameState.SHOP && (
          <div className="relative w-full min-h-screen flex items-center justify-center py-12 px-4 overflow-hidden">
            {/* LOCKER ROOM BACKGROUND SCENERY */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-around overflow-hidden select-none pointer-events-none opacity-40 z-0">
              {/* locker rows background */}
              <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-950" />
              
              {/* Ambient glowing ceiling lights */}
              <div className="absolute top-0 left-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px]" />
              <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]" />

              {/* A rows of wood-metallic lockers */}
              <div className="absolute bottom-0 inset-x-0 h-[450px] flex justify-center gap-6 px-12 max-w-5xl mx-auto">
                {[
                  { num: "11", name: "DI MARIA", color: "from-sky-500 to-white" },
                  { num: "10", name: "MESSI", color: "from-sky-400 via-white to-sky-400" },
                  { num: "7", name: "DE PAUL", color: "from-sky-500 to-white" },
                  { num: "24", name: "ENZO", color: "from-sky-500 to-white" }
                ].map((locker, idx) => (
                  <div key={idx} className="hidden md:flex flex-col w-40 h-full bg-gradient-to-b from-slate-900 to-slate-950 border-t border-x border-slate-800 rounded-t-xl overflow-hidden relative shadow-lg shadow-black/40">
                    {/* Top gold/neon shelf light */}
                    <div className="h-2 w-full bg-sky-500/25 animate-pulse" />
                    <div className="p-2 text-center border-b border-slate-800/50">
                      <span className="text-[10px] text-gray-500 font-mono">LOCKER {locker.num}</span>
                    </div>
                    
                    {/* Hanging Jersey */}
                    <div className="flex-1 flex flex-col items-center justify-start pt-6 relative">
                      {/* Hanger line */}
                      <div className="w-10 h-6 border-b-2 border-slate-700 rounded-b-full mb-1" />
                      {/* Jersey visual body */}
                      <div className={`w-16 h-24 bg-gradient-to-r ${locker.color} border border-slate-300/10 rounded-b-md flex flex-col justify-between items-center py-2 shadow-md relative`}>
                        {/* Jersey Stripes if Argentina */}
                        <div className="absolute inset-y-0 left-[25%] w-[10%] bg-sky-300/30" />
                        <div className="absolute inset-y-0 right-[25%] w-[10%] bg-sky-300/30" />
                        
                        {/* Short Sleeves */}
                        <div className={`absolute -left-3 top-0 w-4 h-8 bg-gradient-to-r ${locker.color} rounded-l border-l border-slate-300/10`} />
                        <div className={`absolute -right-3 top-0 w-4 h-8 bg-gradient-to-r ${locker.color} rounded-r border-r border-slate-300/10`} />
                        
                        {/* Number on chest */}
                        <span className="text-xs font-black text-slate-950 tracking-tighter relative z-10">{locker.num}</span>
                        {/* Name & Number on Back */}
                        <div className="flex flex-col items-center scale-90 relative z-10">
                          <span className="text-[7px] font-bold text-slate-950 tracking-wider leading-none">{locker.name}</span>
                          <span className="text-base font-black text-slate-950 leading-none">{locker.num}</span>
                        </div>
                      </div>

                      {/* Golden boots placed neatly in locker */}
                      {idx === 1 && (
                        <div className="absolute bottom-4 flex gap-1">
                          {/* Left boot */}
                          <div className="w-6 h-3 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l shadow" />
                          {/* Right boot */}
                          <div className="w-6 h-3 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-l shadow transform rotate-12" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Player Characters sitting on the Bench in the locker room */}
              <div className="absolute bottom-0 left-4 sm:left-10 w-48 h-64 flex flex-col items-center justify-end">
                {/* Messi caricature illustration sitting on a bench */}
                <div className="relative w-24 h-40 flex flex-col items-center">
                  {/* Brown Hair & Beard */}
                  <div className="w-12 h-14 bg-[#5c4033] rounded-t-full relative flex items-center justify-center">
                    {/* Face */}
                    <div className="w-10 h-10 bg-[#fbcfe8] rounded-b-full absolute bottom-1 flex flex-col items-center justify-end">
                      {/* Beard */}
                      <div className="w-10 h-4 bg-[#7c5043] rounded-b-full" />
                    </div>
                  </div>
                  {/* Jersey Body */}
                  <div className="w-16 h-20 bg-sky-400 border border-white/20 rounded-t-md flex flex-col items-center justify-between py-1 relative">
                    <div className="absolute inset-y-0 left-1/2 w-2 bg-white -translate-x-1/2" />
                    <span className="text-[8px] font-bold text-slate-900 z-10">ARG</span>
                    <span className="text-[10px] font-black text-slate-900 z-10">10</span>
                  </div>
                  {/* Legs */}
                  <div className="flex gap-2">
                    <div className="w-3 h-12 bg-sky-200 border-b-4 border-yellow-500 rounded-b" />
                    <div className="w-3 h-12 bg-sky-200 border-b-4 border-yellow-500 rounded-b" />
                  </div>
                  {/* Holding Mate Tea Cup */}
                  <div className="absolute right-0 top-16 w-4 h-4 bg-emerald-700 border border-yellow-500 rounded-full flex items-center justify-center">
                    <div className="w-1 h-3 bg-slate-300 -rotate-45 -translate-y-1" />
                  </div>
                </div>
                {/* Bench board */}
                <div className="w-56 h-3 bg-amber-800 rounded shadow border border-amber-900" />
                <div className="w-4 h-12 bg-slate-800" />
              </div>

              {/* Another Player Character doing stretches in background right */}
              <div className="absolute bottom-0 right-4 sm:right-10 w-48 h-64 flex flex-col items-center justify-end">
                <div className="relative w-20 h-44 flex flex-col items-center">
                  {/* Head */}
                  <div className="w-10 h-10 bg-[#e0a96d] rounded-full relative">
                    {/* Hair */}
                    <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 rounded-t-full" />
                  </div>
                  {/* Stretching torso */}
                  <div className="w-14 h-18 bg-sky-400 border border-white/20 rounded-t-md flex flex-col items-center justify-between py-1 relative transform rotate-12 origin-bottom">
                    <div className="absolute inset-y-0 left-1/2 w-2 bg-white -translate-x-1/2" />
                    <span className="text-[10px] font-black text-slate-900 z-10">7</span>
                  </div>
                  {/* Legs doing a stretch */}
                  <div className="flex gap-4">
                    <div className="w-3 h-10 bg-sky-200 border-b-4 border-black rounded-b transform -rotate-12" />
                    <div className="w-3 h-10 bg-sky-200 border-b-4 border-black rounded-b transform rotate-45" />
                  </div>
                </div>
                <div className="w-56 h-3 bg-amber-800 rounded shadow border border-amber-900" />
                <div className="w-4 h-12 bg-slate-800" />
              </div>
            </div>

            <motion.div
              key="shop-screen-fg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="z-10 flex flex-col max-w-3xl w-full px-6 py-8 rounded-2xl border border-slate-800 bg-slate-950/85 backdrop-blur-md shadow-2xl shadow-black/80"
              id="shop-card"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-900 pb-5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-2xl text-white">阿根廷球星更衣室</h2>
                    <p className="text-gray-400 text-xs font-mono">第 {stats.level} 关结束 · 中场休息调整</p>
                  </div>
                </div>

                {/* Points Wallet Display */}
                <div className="mt-4 sm:mt-0 px-5 py-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-mono font-medium">可用积分余额</span>
                    <span className="text-xl font-bold text-yellow-400 font-mono leading-tight">{stats.score}</span>
                  </div>
                  <div className="text-2xl">🪙</div>
                </div>
              </div>

              {/* Messi Relaxing with Yerba Mate Tea bubble */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl mb-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="text-4xl animate-bounce" style={{ animationDuration: '3s' }}>🧉</div>
                <p className="text-xs text-gray-300 leading-relaxed text-center sm:text-left flex-1">
                  梅西在更衣室端起了一杯温热的马黛茶，笑着说：<i>“下半场比赛还要继续加油，买点装备能帮我们更轻松地带走大力神杯！”</i>
                </p>
              </div>

              {/* Shop Goods Cards with Enlarged Graphics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {SHOP_ITEMS.map((item) => {
                  let isOwned = false;
                  let limitReached = false;

                  if (item.id === 'mate_tea') limitReached = stats.bombs >= 5;
                  if (item.id === 'boot_polish') isOwned = stats.hasBootPolish;
                  if (item.id === 'red_card_waiver') isOwned = stats.hasRedCardWaiver;
                  if (item.id === 'gold_speed') isOwned = stats.hasMateTea;

                  // Calculate level specific dynamic cost fluctuating by up to 60%
                  const dynamicCost = getItemCost(item.id, item.cost, stats.level);
                  const canAfford = stats.score >= dynamicCost;
                  const priceDiff = dynamicCost - item.cost;
                  const pctDiff = Math.round((priceDiff / item.cost) * 100);

                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 shadow-lg ${
                        isOwned
                          ? 'bg-emerald-950/20 border-emerald-500/30 shadow-inner'
                          : limitReached
                          ? 'bg-slate-900/40 border-slate-800 opacity-60'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        {/* ENLARGED ITEM ILLUSTRATION */}
                        {item.id === 'mate_tea' && <MateTeaSVG />}
                        {item.id === 'boot_polish' && <BootPolishSVG />}
                        {item.id === 'red_card_waiver' && <RedCardWaiverSVG />}
                        {item.id === 'gold_speed' && <GoldSpeedSVG />}

                        {/* Card Title & Fluctuation Badge */}
                        <div className="flex items-center gap-2 mt-3 mb-1">
                          <span className="text-base font-black text-white font-display">{item.chineseName}</span>
                          {!isOwned && !limitReached && pctDiff !== 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono ${
                              pctDiff < 0 
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20' 
                                : 'bg-red-950/60 text-red-400 border-red-500/20'
                            }`}>
                              {pctDiff < 0 ? `↓ ${Math.abs(pctDiff)}% 降价` : `↑ +${pctDiff}% 溢价`}
                            </span>
                          )}
                        </div>

                        {/* Card Description - BRIEF/CONCISE */}
                        <p className="text-gray-400 text-xs leading-relaxed mb-4 max-w-[240px]">{item.description}</p>
                      </div>

                      {/* Cost / Purchase CTA */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-900">
                        <div className="flex flex-col">
                          {priceDiff !== 0 && !isOwned && !limitReached && (
                            <span className="text-[10px] text-gray-500 line-through font-mono">原价 {item.cost}</span>
                          )}
                          <span className="text-sm font-black font-mono text-yellow-400">
                            {isOwned ? '已购买' : limitReached ? '已达上限' : `${dynamicCost} 积分`}
                          </span>
                        </div>

                        {isOwned ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> 装备中
                          </span>
                        ) : limitReached ? (
                          <span className="text-xs text-gray-500">最大值(5)</span>
                        ) : (
                          <button
                            onClick={() => buyShopItem(item)}
                            disabled={!canAfford}
                            className={`py-1.5 px-4 rounded-lg font-display text-xs font-black transition-all cursor-pointer ${
                              canAfford
                                ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 active:scale-[0.97] shadow-md shadow-yellow-950/20'
                                : 'bg-slate-950 border border-slate-800 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            购买装备
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Soccer Ball "Next Match" Button */}
              <div className="flex flex-col items-center justify-center mt-2">
                <button
                  onClick={() => startNewLevel(stats.level + 1, stats.score)}
                  className="relative group w-36 h-36 rounded-full flex flex-col items-center justify-center font-display font-black text-white cursor-pointer select-none transition-all duration-500 hover:scale-110 active:scale-95 shadow-2xl shadow-black/80"
                  id="btn-next-match"
                >
                  {/* Soccer Ball Background Graphic with spinning hover animation */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-slate-300 via-white to-slate-100 border border-slate-400 flex items-center justify-center overflow-hidden transition-transform duration-[1500ms] group-hover:rotate-[360deg] shadow-[inset_0_-8px_20px_rgba(0,0,0,0.15)]">
                    {/* Centered pentagon */}
                    <div className="absolute w-8 h-8 bg-slate-900 rotate-12" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                    {/* Surrounding panels */}
                    <div className="absolute top-1 left-3 w-5 h-5 bg-slate-900" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                    <div className="absolute bottom-1 right-4 w-5 h-5 bg-slate-900" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                    <div className="absolute top-8 right-1 w-5 h-5 bg-slate-900" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                    <div className="absolute bottom-8 left-1 w-5 h-5 bg-slate-900" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                    
                    {/* Seam lines overlay */}
                    <div className="absolute inset-0 border border-slate-300 rounded-full opacity-35" />
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-400 rotate-45 opacity-55" />
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-400 -rotate-45 opacity-55" />
                    
                    {/* Glossy overlay for 3D sphere shine */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/40 rounded-full" />
                  </div>

                  {/* Button text overlay */}
                  <div className="absolute inset-0 bg-black/45 hover:bg-black/30 rounded-full flex flex-col items-center justify-center text-center p-3 transition-colors duration-300 z-10 border border-white/10 shadow-lg">
                    <span className="text-[9px] text-yellow-300 font-mono tracking-wider animate-pulse font-bold">KICK OFF</span>
                    <span className="text-base font-black tracking-tight leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">登场比赛</span>
                    <span className="text-[10px] font-black text-gray-200 mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">第 {stats.level + 1} 关</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* LEVEL COMPLETE (LEVEL_COMPLETE State) */}
        {gameState === GameState.LEVEL_COMPLETE && (
          <motion.div
            key="success-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="z-10 flex flex-col items-center max-w-lg w-full px-6 py-10 rounded-2xl border border-emerald-900/40 bg-slate-950/90 backdrop-blur-md text-center shadow-2xl"
            id="success-card"
          >
            {/* Celebration Emojis floating */}
            <div className="relative w-24 h-24 mb-5 flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-5xl animate-bounce">🏆</span>
              <Sparkles className="absolute top-0 right-0 text-yellow-300 animate-pulse w-6 h-6" />
              <Star className="absolute bottom-0 left-0 text-sky-400 animate-pulse w-5 h-5" />
            </div>

            <h2 className="font-display font-extrabold text-3xl text-emerald-400">晋级成功！</h2>
            <p className="text-gray-400 text-xs font-mono tracking-widest mt-1 mb-6">MATCH DAY COMPLETE</p>

            {/* Stats Summary Panel */}
            <div className="w-full bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 mb-8 space-y-3 font-mono text-sm text-left">
              <div className="flex justify-between">
                <span className="text-gray-400">本关小组赛:</span>
                <span className="text-white font-bold">第 {stats.level} 关</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">晋级目标分数:</span>
                <span className="text-sky-300">{scoreGoal}</span>
              </div>
              <div className="flex justify-between border-t border-slate-950 pt-3">
                <span className="text-gray-400">梅西当前累积积分:</span>
                <span className="text-yellow-400 font-extrabold text-base">{stats.score}</span>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              恭喜！梅西成功带队晋级下一轮！在进入下场比赛之前，不妨前往更衣室购置一些战术装备！
            </p>

            {/* Next buttons */}
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => {
                  gameAudio.playClick();
                  setGameState(GameState.SHOP);
                }}
                className="w-full py-3.5 rounded-xl font-display font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="btn-to-shop"
              >
                <ShoppingBag className="w-5 h-5" />
                进入球员更衣室商店
              </button>

              <button
                onClick={() => {
                  // Direct skip shop
                  // Keep boosters disabled
                  setStats((prev) => ({
                    ...prev,
                    hasMateTea: false,
                    hasBootPolish: false,
                    hasRedCardWaiver: false
                  }));
                  startNewLevel(stats.level + 1, stats.score);
                }}
                className="w-full py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-slate-900 transition-all text-xs font-mono cursor-pointer"
              >
                直接跳过，开启下关赛程 &gt;
              </button>
            </div>
          </motion.div>
        )}

        {/* GAME OVER SCREEN (GAME_OVER State) */}
        {gameState === GameState.GAME_OVER && (
          <motion.div
            key="game-over-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="z-10 flex flex-col items-center max-w-lg w-full px-6 py-10 rounded-2xl border border-red-950/40 bg-slate-950/90 backdrop-blur-md text-center shadow-2xl"
            id="game-over-card"
          >
            {/* Sad Red Card Head */}
            <div className="relative w-24 h-24 mb-5 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
              <span className="text-5xl animate-pulse">🟥</span>
              <VolumeX className="absolute top-0 right-0 text-red-500 w-5 h-5 animate-bounce" />
            </div>

            <h2 className="font-display font-extrabold text-3xl text-red-400">终场哨响，遗憾淘汰</h2>
            <p className="text-gray-500 text-xs font-mono tracking-widest mt-1 mb-6">ELIMINATED FROM TOURNAMENT</p>

            <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-sm">
              很遗憾，梅西率领的阿根廷队在<b>第 {stats.level} 关</b>折戟，由于未能达成 <b>{scoreGoal} 分</b>的晋级目标，被迫提前离开了卡塔尔世界杯舞台！
            </p>

            {/* Stats Summary Panel */}
            <div className="w-full bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 mb-8 space-y-3 font-mono text-sm text-left">
              <div className="flex justify-between">
                <span className="text-gray-400">最终淘汰关卡:</span>
                <span className="text-white font-bold">第 {stats.level} 关</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">终场结算总分:</span>
                <span className="text-yellow-400 font-extrabold">{stats.score}</span>
              </div>
              <div className="flex justify-between border-t border-slate-950 pt-3">
                <span className="text-gray-400">你的历史最高得分:</span>
                <span className="text-sky-300 font-bold">{stats.highScore}</span>
              </div>
            </div>

            {/* Restart button */}
            <button
              onClick={restartTournament}
              className="w-full py-3.5 rounded-xl font-display font-bold text-slate-950 bg-gradient-to-r from-yellow-400 to-amber-300 hover:from-yellow-300 hover:to-amber-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-950/10 cursor-pointer"
              id="btn-restart"
            >
              <RotateCcw className="w-5 h-5" />
              重新开启世界杯征程
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
