import { writable } from 'svelte/store';

export interface ExplosionAnimation {
  id: string;
  x: number;
  y: number;
  timestamp: number;
}

export const explosions = writable<ExplosionAnimation[]>([]);

export function triggerExplosion(x: number, y: number) {
  const id = Math.random().toString(36).substr(2, 9);
  const animation: ExplosionAnimation = {
    id,
    x,
    y,
    timestamp: Date.now()
  };
  
  explosions.update(current => [...current, animation]);
  
  // Remove animation after 2 seconds
  setTimeout(() => {
    explosions.update(current => current.filter(anim => anim.id !== id));
  }, 2000);
}
