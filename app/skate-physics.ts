export const LIMIT_X = 20.6;
export const LIMIT_Z = 13.4;
export const SPAWN = { x: -15.2, z: 10.7 };

const smoothstep = (t: number) => {
  const v = Math.max(0, Math.min(1, t));
  return v * v * (3 - 2 * v);
};

/** The rideable concrete uses the same height function as the visible meshes. */
export function groundHeight(x: number, z: number): number {
  // Career halfpipe: a level run with two continuous transitions.
  if (x >= -17 && x <= -8.5 && z >= -10.3 && z <= -1.2) {
    const distance = Math.abs(z + 5.75);
    const transition = distance <= 1.65 ? 0 : 2.65 * smoothstep((distance - 1.65) / 2.9);
    const entrance = smoothstep((z + 10.3) / .85) * smoothstep((-1.2 - z) / .85);
    return transition * entrance;
  }
  // The project funbox can be approached from all four sides.
  if (x >= -2.4 && x <= 6.3 && z >= -10.2 && z <= -3.5) {
    const cross = smoothstep((x + 2.4) / 1.6) * smoothstep((6.3 - x) / 1.6);
    const length = smoothstep((z + 10.2) / 1.65) * smoothstep((-3.5 - z) / 1.65);
    return 1.25 * cross * length;
  }
  // A broad ring-shaped transition surrounds the technical bowl.
  if (x >= 8.7 && x <= 18.7 && z >= -1 && z <= 9.3) {
    const r = Math.hypot((x - 13.7) / 5, (z - 4.15) / 5.15);
    if (r < .48 || r > 1) return 0;
    return 1.35 * Math.sin(Math.PI * (r - .48) / .52) ** 2;
  }
  return 0;
}

export function screenDirection(horizontal: number, vertical: number, angle = Math.PI / 4) {
  const length = Math.hypot(horizontal, vertical);
  if (!length) return { x: 0, z: 0 };
  return {
    x: (horizontal * Math.cos(angle) + vertical * Math.sin(angle)) / length,
    z: (-horizontal * Math.sin(angle) + vertical * Math.cos(angle)) / length,
  };
}

/** Push into the requested direction while preserving a short rolling coast. */
export function evolveMomentum(vx: number, vz: number, dx: number, dz: number, dt: number, targetSpeed = 7.2) {
  if (Math.hypot(dx, dz) <= .01) {
    const friction = Math.exp(-1.65 * dt);
    return { x: Math.abs(vx) < .025 ? 0 : vx * friction, z: Math.abs(vz) < .025 ? 0 : vz * friction };
  }
  const traction = Math.hypot(vx, vz) < 1 ? 5 : 2.7;
  const blend = 1 - Math.exp(-traction * dt);
  let nextX = vx + (dx * targetSpeed - vx) * blend;
  let nextZ = vz + (dz * targetSpeed - vz) * blend;
  const maximum = Math.max(7.2, targetSpeed);
  const speed = Math.hypot(nextX, nextZ);
  if (speed > maximum) { nextX *= maximum / speed; nextZ *= maximum / speed; }
  return { x: nextX, z: nextZ };
}

export function turnTowards(current: number, desired: number, maximumTurn: number) {
  const difference = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
  return current + Math.max(-maximumTurn, Math.min(maximumTurn, difference));
}

export function advancePosition(x: number, z: number, vx: number, vz: number, dt: number) {
  const nextX = Math.max(-LIMIT_X, Math.min(LIMIT_X, x + vx * dt));
  const nextZ = Math.max(-LIMIT_Z, Math.min(LIMIT_Z, z + vz * dt));
  if (groundHeight(nextX, nextZ) - groundHeight(x, z) > .42) return { x, z };
  return { x: nextX, z: nextZ };
}
