// World-space (x, z) perimeter shared by the slab, collision checks and
// overview framing. The recessed middle keeps the two southern plazas as
// connected wings without cutting across the existing route between them.
export const PARK_OUTLINE = [
  [-27.95, -17.95], [20.6, -17.95], [26, -17.95], [27.95, -14.85],
  [27.95, 4.45], [26.3, 7.5], [26.3, 14.5], [22.5, 17.95],
  [9, 17.95], [9, 13.35], [-3, 13.35], [-3, 17.95],
  [-19.7, 17.95], [-24.2, 13.55], [-24.2, 8.35], [-27.95, 4.45],
  [-27.95, -8.45], [-24, -12.45],
] as const satisfies readonly (readonly [number, number])[];

export const PARK_BOUNDS = PARK_OUTLINE.reduce((bounds, [x, z]) => ({
  minX: Math.min(bounds.minX, x), maxX: Math.max(bounds.maxX, x),
  minZ: Math.min(bounds.minZ, z), maxZ: Math.max(bounds.maxZ, z),
}), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });

const EDGE_MARGIN = .45;
// The rectangular values remain a cheap first-pass envelope; the polygon test
// below handles the new notches and wings precisely.
export const LIMIT_X = Math.max(Math.abs(PARK_BOUNDS.minX), Math.abs(PARK_BOUNDS.maxX)) - EDGE_MARGIN;
export const LIMIT_Z = Math.max(Math.abs(PARK_BOUNDS.minZ), Math.abs(PARK_BOUNDS.maxZ)) - EDGE_MARGIN;
export const SPAWN = { x: -18.2, z: 13.1 };

/** True only on the rideable slab, with a small buffer from its exposed edge. */
export function isInsidePark(x: number, z: number) {
  if (x < PARK_BOUNDS.minX + EDGE_MARGIN || x > PARK_BOUNDS.maxX - EDGE_MARGIN ||
      z < PARK_BOUNDS.minZ + EDGE_MARGIN || z > PARK_BOUNDS.maxZ - EDGE_MARGIN) return false;

  let inside = false;
  let nearestEdge = Infinity;
  for (let i = 0, j = PARK_OUTLINE.length - 1; i < PARK_OUTLINE.length; j = i++) {
    const [xi, zi] = PARK_OUTLINE[i];
    const [xj, zj] = PARK_OUTLINE[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;

    const dx = xj - xi, dz = zj - zi;
    const t = Math.max(0, Math.min(1, ((x - xi) * dx + (z - zi) * dz) / (dx * dx + dz * dz)));
    nearestEdge = Math.min(nearestEdge, Math.hypot(x - (xi + t * dx), z - (zi + t * dz)));
  }
  return inside && nearestEdge >= EDGE_MARGIN;
}

const smoothstep = (t: number) => {
  const v = Math.max(0, Math.min(1, t));
  return v * v * (3 - 2 * v);
};

/** The rideable concrete uses the same height function as the visible meshes. */
export function groundHeight(x: number, z: number): number {
  // Rideable approach banks use the same height function as their visible mesh.
  if (x >= -26.4 && x <= -21.1 && z >= -7.8 && z <= 2.2) {
    return .85 * smoothstep((-21.1 - x) / 4.1) *
      smoothstep((z + 7.8) / 1.35) * smoothstep((2.2 - z) / 1.35);
  }
  if (x >= 21.7 && x <= 26.4 && z >= -8.5 && z <= 3.1) {
    return .85 * smoothstep((x - 21.7) / 3.7) *
      smoothstep((z + 8.5) / 1.4) * smoothstep((3.1 - z) / 1.4);
  }
  // Career halfpipe: a level run with two continuous transitions.
  if (x >= -19.5 && x <= -10 && z >= -12.6 && z <= -2.2) {
    const distance = Math.abs(z + 7.4);
    const transition = distance <= 1.9 ? 0 : 2.65 * smoothstep((distance - 1.9) / 3.3);
    const entrance = smoothstep((z + 12.6) / .9) * smoothstep((-2.2 - z) / .9);
    return transition * entrance;
  }
  // The project funbox can be approached from all four sides.
  if (x >= -1.8 && x <= 7.6 && z >= -14.1 && z <= -7.5) {
    const cross = smoothstep((x + 1.8) / 1.7) * smoothstep((7.6 - x) / 1.7);
    const length = smoothstep((z + 14.1) / 1.65) * smoothstep((-7.5 - z) / 1.65);
    return 1.25 * cross * length;
  }
  // A broad ring-shaped transition surrounds the technical bowl.
  if (x >= 9.4 && x <= 21.6 && z >= -9.8 && z <= 4.8) {
    const r = Math.hypot((x - 15.5) / 6.1, (z + 2.5) / 7.3);
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
  if (!isInsidePark(nextX, nextZ)) return { x, z };
  if (groundHeight(nextX, nextZ) - groundHeight(x, z) > .42) return { x, z };
  return { x: nextX, z: nextZ };
}
