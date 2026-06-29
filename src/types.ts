/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_OVER = 'GAME_OVER'
}

export enum HookState {
  IDLE = 'IDLE',         // Swinging back and forth
  SHOOTING = 'SHOOTING', // Hook moving outwards
  RETRACTING = 'RETRACTING' // Hook pulling back (with or without item)
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameItem {
  id: string;
  type: 'trophy' | 'ball' | 'soccer' | 'red_card' | 'defender_boot' | 'mystery_bag' | 'gold_nugget';
  name: string;
  x: number;
  y: number;
  radius: number;
  width?: number;  // for box-like items
  height?: number; // for box-like items
  weight: number;  // affects retraction speed
  scoreValue: number;
  color: string;
  emoji: string;
  // Dynamic properties for defenders
  vx?: number;
  rangeX?: [number, number]; // running bounds
  sparkleTimer?: number;
}

export interface Hook {
  x: number;
  y: number;
  angle: number;       // in radians
  length: number;      // current length
  maxLength: number;   // maximum reach
  state: HookState;
  speed: number;       // extension/retraction speed
  targetItem: GameItem | null; // currently grabbed item
  swingDirection: number; // 1 or -1
  swingSpeed: number;  // angular speed
}

export interface PlayerStats {
  score: number;
  highScore: number;
  level: number;
  bombs: number;
  hasMateTea: boolean;       // pulls faster next level
  hasBootPolish: boolean;    // double value for gold/boot items
  hasRedCardWaiver: boolean; // red cards weight reduced
  mateTeaActive: boolean;
  bootPolishActive: boolean;
  redCardWaiverActive: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  chineseName: string;
  description: string;
  cost: number;
  icon: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  emoji?: string;
  rotation?: number;
  rotationSpeed?: number;
}
