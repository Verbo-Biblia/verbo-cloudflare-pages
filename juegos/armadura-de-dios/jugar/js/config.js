// Valores globales del motor, traducidos 1:1 de config/GameConfig.kt (Sigrun's Eye).
// Todo el balance vive aquí para retocarlo sin buscar números sueltos.

export const GameConfig = {
  MAX_FRAME_DT: 0.033,
  DEFAULT_CAMPAIGN: 'campaign_01',
};

export const Balance = {
  MAX_ENERGY: 120,
  SHOT_ENERGY_COST: 7,
  ENERGY_REGEN_DELAY: 0.65,
  ENERGY_REGEN_RATE: 38,
  DETONATION_ENERGY_COST: 50,
  DETONATION_MIN_COST_RATIO: 0.45,
  ENERGY_EXHAUSTED_RESUME: 30,
  PLAYER_MAX_HP: 5,
  PLAYER_LIVES: 3,
  HP_REGEN_DELAY: 4.0,
  HP_REGEN_RATE: 0.75,
  INVULN_AFTER_HIT: 1.0,
  RESPAWN_INVULN: 1.4,
  RESPAWN_DELAY: 0.45,
  GAME_OVER_DELAY: 1.3,
  HEAL_PICKUP_AMOUNT: 2,
  SHOT_COOLDOWN: 0.18,
  BULLET_SPEED: 760,
  BULLET_LIFE: 1.3,
  SHOT_RECOIL: 18,
  DETONATION_CHARGE_MAX: 1.15,
  DETONATION_MIN_CHARGE: 0.08,
  DETONATION_RADIUS_BASE: 195,
  DETONATION_RADIUS_BONUS: 195,
  DETONATION_DAMAGE_BASE: 2,
  DETONATION_DAMAGE_BONUS: 4,
};

// Espada del Espíritu (X, en lugar de las flechas) y espada de fuego (V). Hack and slash: combo de tres golpes,
// tajo hacia arriba (↑ + X), tajo aéreo y picada (↓ + X en el aire, rebota y devuelve el salto de fe).
export const Espada = {
  DANO: [2, 2, 3],            // tajo, revés, remate
  DURACION: [0.2, 0.2, 0.3],  // segundos que dura cada golpe
  CANCELABLE: 0.07,           // la siguiente pulsación se guarda hasta que al golpe le queden estos segundos
  VENTANA: 0.3,               // tras el golpe, tiempo para encadenar el siguiente del combo
  ALCANCE: [120, 120, 150],   // unidades delante del centro del jugador
  EMPUJE: [16, 16, 60],       // empuje a los enemigos comunes
  AVANCE: [90, 90, 260],      // paso adelante del jugador en el suelo
  PAUSA: [0.045, 0.045, 0.09],// pausa de impacto (hitstop) al acertar
  ARRIBA_DANO: 2,
  AIRE_GOLPES: 3,             // golpes en el aire que lo mantienen suspendido (luego cae normal)
  AIRE_VY: -90,               // al acertar en el aire queda flotando un instante
  PICADA_VY: 1150, PICADA_DANO: 3, REBOTE_VY: -680, CHOQUE_DANO: 1, CHOQUE_RADIO: 95,
  FUEGO_COSTO: 25, FUEGO_DANO: 3, ONDA_DANO: 2, ONDA_VEL: 720, ONDA_VIDA: 0.75, FUEGO_ESPERA: 0.45,
};

// Cámara cercana (Juan, 2026-10-31): el soldado se dibuja a la medida del mundo de Sigrun (pasajes, plataformas y
// escaleras se diseñaron para su caja) y la cámara se acerca para que se vea grande; lo sigue también en vertical.
// En los duelos con jefes se aleja a ZOOM_JEFE para ver la pelea completa. ?zoom= para probar (1 = como antes).
export const ZOOM = (() => { const q = +new URLSearchParams(location.search).get('zoom'); return q > 0 ? q : 1.5; })();  // Juan: «aléjalo un poquito más» (antes 1,7)
// Velocidad general del juego (todo: jugador, enemigos, animaciones). ?velocidad=0.85 para probar.
export const VELOCIDAD = (() => { const q = +new URLSearchParams(location.search).get('velocidad'); return q > 0 ? q : 0.85; })();  // Juan: «un poco más lenta»
export const ZOOM_JEFE = Math.min(ZOOM, 1.3);

// Tamaño de dibujo de personajes y criaturas (no cambia las cajas de choque). ?escala= para probar otros.
export const ESCALA_PERSONAJES = (() => { const q = +new URLSearchParams(location.search).get('escala'); return q > 0 ? q : 0.85; })();  // Juan: personajes más grandes (solo el dibujo); primero al doble, luego 25 % menos

export const Physics = {
  CAMERA_FOLLOW_X: 0.5,
  WORLD_HEIGHT: 760,
  GRAVITY: 2100,
  FALL_DEATH_MARGIN: 160,
  PLAYER_W: 34,
  PLAYER_STAND_H: 52,
  PLAYER_CROUCH_H: 32,
  WALK_SPEED: 200,
  RUN_SPEED: 390,
  SLIDE_SPEED: 480,
  ACCEL_GROUND: 1900,
  ACCEL_AIR: 1050,
  DECEL_GROUND: 2300,
  DECEL_AIR: 420,
  JUMP_VELOCITY: -700,
  JUMP_MIN_HOLD: 0.15,
  DOUBLE_JUMP_VELOCITY: -570,
  MAX_FALL_SPEED: 950,
  VARIABLE_JUMP_GRAVITY_MULT: 1.35,
  COYOTE_TIME: 0.11,
  JUMP_BUFFER: 0.13,
  GLIDE_GRAVITY_MULT: 0.18,
  GLIDE_MAX_FALL: 115,
  GLIDE_MIN_VY: -180,
  WALL_CLIMB_SPEED: 155,
  LADDER_SPEED: 150,
  LADDER_SIDE_SPEED: 95,
  LADDER_JUMP_VY: -470,
  LADDER_JUMP_VX: 190,
  SLIDE_TIME: 0.52,
  SLIDE_MIN_SPEED: 230,
  SLIDE_BOOST: 1.16,
  SLIDE_END_SPEED: 90,
  DROP_THROUGH_TIME: 0.25,
  DASH_SPEED: 820,
  DASH_SPEED_DROP: 170,
  DASH_DURATION: 0.22,
  DASH_EXIT_SPEED: 430,
  STOMP_MIN_VY: 180,
  STOMP_BOUNCE: -420,
  STOMP_DAMAGE: 2,
};

// 2026-10-31: con la cámara cercana (soldado a la medida del mundo) vuelven los valores de Sigrun (1): los aumentos
// eran para el soldado gigante y ahora se veía acelerado. Antes: correr 1,25, saltar 1,35, caida 1,8, bajada 1,15.
// Juan: con el personaje al doble, correr y saltar se sentían cortos. El jugador corre 1,25× más rápido y salta 1,35× más
// alto (velocidad × √1,35); el resto del mundo no cambia. Para probar otros valores: ?correr=1.3&saltar=1.5
{
  const q = new URLSearchParams(location.search), correr = +q.get('correr') || 1, saltar = Math.sqrt(+q.get('saltar') || 1);
  for (const k of ['WALK_SPEED', 'RUN_SPEED', 'SLIDE_SPEED', 'ACCEL_GROUND', 'ACCEL_AIR', 'LADDER_SIDE_SPEED', 'LADDER_JUMP_VX',
    'SLIDE_MIN_SPEED', 'DASH_SPEED', 'DASH_EXIT_SPEED']) Physics[k] *= correr;
  // Salto en «cámara lenta» (Juan): el jugador cae con más gravedad (?caida=, 1 = como antes) y las velocidades
  // verticales suben en proporción (× √caida), así la altura no cambia pero el salto dura menos.
  const caida = +q.get('caida') || 1, vert = Math.sqrt(caida);
  Physics.PLAYER_GRAVITY_MULT = caida; Physics.PLAYER_VERT = vert; Physics.PLAYER_MAX_FALL = Physics.MAX_FALL_SPEED * vert;
  Physics.STOMP_BOUNCE *= vert;
  // Juan: la bajada un poco menos rápida que la subida (el impulso sube rápido; al caer manda la gravedad): ?bajada=
  const bajada = +q.get('bajada') || 1;
  Physics.PLAYER_FALL_GRAVITY_MULT = bajada; Physics.PLAYER_MAX_FALL = Physics.MAX_FALL_SPEED * Math.sqrt(bajada);
  for (const k of ['JUMP_VELOCITY', 'DOUBLE_JUMP_VELOCITY', 'LADDER_JUMP_VY']) Physics[k] *= saltar * vert;
}
// Juan: hay plataformas muy altas y se quitó el agarre a la pared → con el doble salto, hasta 4 saltos seguidos (?saltos=).
Physics.MAX_JUMPS = +new URLSearchParams(location.search).get('saltos') || 4;

export const ControlsConfig = {
  JOYSTICK_DEADZONE: 0.18,
  JOYSTICK_RUN_THRESHOLD: 0.88,
  JOYSTICK_DOWN_THRESHOLD: 0.6,
  JOYSTICK_UP_THRESHOLD: 0.55,
  JOYSTICK_LADDER_THRESHOLD: 0.3,
  AIM_MIN_TILT: 0.5,
  AIM_DIAGONAL_DEG: 28,
  AIM_UP_DEG: 66,
};

// Constantes privadas de GameSession.kt usadas en esta fase.
export const K = {
  WALL_RELEASE_PUSH: 0.6,
  WALL_MANTLE_VY: -400,
  WALL_MANTLE_VX: 200,
  CROUCH_SPEED: 200,
  STICK_DOWN_DEG: 30,
  STICK_CROUCH_STILL_DEG: 62,
  STICK_DOWN_MIN: 0.3,
  RAMP_SPEED: 520,
  RAMP_FAST: 620,
  RAMP_SLOW: 400,
  RAMP_ACCEL: 1400,
  CRUMBLE_DELAY: 0.5,
  CRUMBLE_RESPAWN: 3.2,
  LASER_WARN: 0.7,
  LASER_WAKE_RANGE: 520,
  DOOR_OPEN_TIME: 0.9,
  RECOVERED_TIME: 3.6,
  ZONE_MAX_RISE: 400,
  ZONE_MAX_SINK: 240,
  GATE_EXTRA_UP: 4000,
};

/** Dirección de disparo por valor de player.aim (x relativo a la cara, y hacia abajo). */
export const AIM_DIRS = [[1, 0], [0.7071, -0.7071], [0, -1]];
/** Hombro sobre el que gira el cañón al apuntar. */
export const AIM_PIVOT_X = [3, 9, 15];
/** Ángulo de giro del cañón en el sprite (grados, mirando a la derecha). */
export const AIM_ROT_DEG = [0, -45, -90];
