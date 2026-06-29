/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameItem, Vector2D } from '../types';

export const VIRTUAL_WIDTH = 900;
export const VIRTUAL_HEIGHT = 650;
export const GROUND_Y = 130;
export const HOOK_ANCHOR: Vector2D = { x: VIRTUAL_WIDTH / 2, y: GROUND_Y + 16 };

// Get target score based on level
export function getLevelGoal(level: number): number {
  if (level === 1) return 1000;
  if (level === 2) return 2000;
  if (level === 3) return 3200;
  if (level === 4) return 4500;
  return 4500 + (level - 4) * 1500;
}

// Get distance between two points
export function getDistance(p1: Vector2D, p2: Vector2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Check if a new item overlaps with existing ones
function isOverlapping(newItem: { x: number; y: number; r: number }, items: GameItem[]): boolean {
  for (const item of items) {
    const dist = getDistance({ x: newItem.x, y: newItem.y }, { x: item.x, y: item.y });
    if (dist < (newItem.r + item.radius + 35)) {
      return true;
    }
  }
  // Also keep distance from the hook anchor
  const distToAnchor = getDistance({ x: newItem.x, y: newItem.y }, HOOK_ANCHOR);
  if (distToAnchor < 120) {
    return true;
  }
  return false;
}

// Generate items for a level
export function generateLevelItems(level: number): GameItem[] {
  const items: GameItem[] = [];
  
  // Configuration of items to generate based on level
  const trophyCount = level === 1 ? 1 : level === 2 ? 1 : level === 3 ? 2 : Math.min(3, 1 + Math.floor(level / 2));
  const goldenBallCount = level === 1 ? 2 : level === 2 ? 3 : level === 3 ? 3 : Math.min(4, 2 + Math.floor(level / 2));
  const soccerCount = level === 1 ? 4 : level === 2 ? 3 : level === 3 ? 4 : Math.min(5, 3 + Math.floor(level / 3));
  const redCardCount = level === 1 ? 3 : level === 2 ? 5 : level === 3 ? 6 : Math.min(8, 4 + level);
  const defenderCount = level === 1 ? 1 : level === 2 ? 1 : level === 3 ? 2 : Math.min(3, 1 + Math.floor(level / 2));
  const mysteryBagCount = level === 1 ? 1 : level === 2 ? 2 : level === 3 ? 2 : Math.min(3, 1 + Math.floor(level / 3));

  const addStaticItem = (
    type: GameItem['type'],
    name: string,
    radius: number,
    weight: number,
    scoreValue: number,
    color: string,
    emoji: string,
    width?: number,
    height?: number
  ) => {
    let attempts = 0;
    while (attempts < 150) {
      // Keep items within the underground sector
      const rx = 50 + Math.random() * (VIRTUAL_WIDTH - 100);
      const ry = GROUND_Y + 50 + Math.random() * (VIRTUAL_HEIGHT - GROUND_Y - 100);
      
      if (!isOverlapping({ x: rx, y: ry, r: radius }, items)) {
        items.push({
          id: `${type}_${Date.now()}_${Math.random()}`,
          type,
          name,
          x: rx,
          y: ry,
          radius,
          width,
          height,
          weight,
          scoreValue,
          color,
          emoji
        });
        break;
      }
      attempts++;
    }
  };

  // 1. Generate 大力神杯 (World Cup Trophy / Big Gold)
  for (let i = 0; i < trophyCount; i++) {
    addStaticItem('trophy', '大力神杯', 40, 115, 500, '#eab308', '🏆');
  }

  // 2. Generate 金球奖 (Golden Ball / Medium Gold)
  for (let i = 0; i < goldenBallCount; i++) {
    addStaticItem('ball', '金球奖', 28, 55, 250, '#facc15', '🟡');
  }

  // 3. Generate 足球 (Soccer / Small Gold)
  for (let i = 0; i < soccerCount; i++) {
    addStaticItem('soccer', '足球', 18, 18, 100, '#ffffff', '⚽');
  }

  // 4. Generate 大红牌 (Red Card / Big Rock) - heavier for slower pull as requested
  for (let i = 0; i < redCardCount; i++) {
    addStaticItem('red_card', '红牌', 25, 230, 10, '#ef4444', '🟥', 25, 35);
  }

  // 5. Generate 神秘福袋 (Mystery Bag)
  for (let i = 0; i < mysteryBagCount; i++) {
    addStaticItem('mystery_bag', '神秘包', 22, 40, 0, '#c084fc', '🎁'); // score generated dynamically on grab
  }

  // 6. Generate 防守球员 (Defender with Golden Boot)
  for (let i = 0; i < defenderCount; i++) {
    let attempts = 0;
    while (attempts < 150) {
      const rx = 100 + Math.random() * (VIRTUAL_WIDTH - 200);
      // Put them at horizontal bands
      const ry = GROUND_Y + 80 + Math.random() * (VIRTUAL_HEIGHT - GROUND_Y - 160);
      const radius = 25;

      if (!isOverlapping({ x: rx, y: ry, r: radius }, items)) {
        // Higher speed on higher levels, slowed down by 30% as requested
        const speedBase = (1.8 + Math.random() * 1.5 + (level * 0.25)) * 0.7;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const vx = direction * Math.min(5, speedBase);
        
        items.push({
          id: `defender_${Date.now()}_${Math.random()}`,
          type: 'defender_boot',
          name: '防守球员',
          x: rx,
          y: ry,
          radius,
          weight: 15, // Golden boot is very light and fast to pull!
          scoreValue: 600, // Very valuable golden boot
          color: '#3b82f6',
          emoji: '🏃‍♂️',
          vx,
          rangeX: [50, VIRTUAL_WIDTH - 50]
        });
        break;
      }
      attempts++;
    }
  }

  return items;
}

// Check collision between a point (hook tip) and an item
export function checkCollision(hookPos: Vector2D, item: GameItem): boolean {
  if (item.type === 'red_card' && item.width && item.height) {
    // Red card can be approximated as a circle of radius, or standard rectangle collision
    // For mining hook gameplay, simple circle distance collision is extremely reliable and robust,
    // but we can combine radius for ease of grab!
    return getDistance(hookPos, { x: item.x, y: item.y }) < (item.radius + 8);
  }
  
  // Defender is running, standard circle collision
  return getDistance(hookPos, { x: item.x, y: item.y }) < (item.radius + 10);
}

// Update running positions of defenders
export function updateDefenders(items: GameItem[], width: number = VIRTUAL_WIDTH): GameItem[] {
  return items.map(item => {
    if (item.type === 'defender_boot' && item.vx !== undefined) {
      let nx = item.x + item.vx;
      let nvx = item.vx;

      // Bounce off walls
      if (item.rangeX) {
        if (nx < item.rangeX[0]) {
          nx = item.rangeX[0];
          nvx = -item.vx;
        } else if (nx > item.rangeX[1]) {
          nx = item.rangeX[1];
          nvx = -item.vx;
        }
      } else {
        if (nx < 50) {
          nx = 50;
          nvx = -item.vx;
        } else if (nx > width - 50) {
          nx = width - 50;
          nvx = -item.vx;
        }
      }

      // Alternate emojis for animation effect
      const currentEmoji = item.emoji;
      let animatedEmoji = currentEmoji;
      
      // Rotate running emoji slightly
      if (Math.random() < 0.05) {
        animatedEmoji = currentEmoji === '🏃‍♂️' ? '🏃' : '🏃‍♂️';
      }

      return {
        ...item,
        x: nx,
        vx: nvx,
        emoji: animatedEmoji
      };
    }
    return item;
  });
}
