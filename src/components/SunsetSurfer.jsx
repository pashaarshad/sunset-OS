/* =====================================================================
 * 🏄 Sunset Surfer — Built-in Game for Sunset OS (Ghuroob OS)
 * An infinite runner set on a sunset ocean. Dodge obstacles, collect orbs!
 * ===================================================================== */
import React, { useRef, useEffect, useState, useCallback } from 'react';

// ─── Constants ───────────────────────────────────────────────────────
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_Y_RATIO = 0.75;
const SURFER_W = 36;
const SURFER_H = 44;
const ORB_SIZE = 18;
const MIN_OBSTACLE_GAP = 180;

// ─── Color Palette ───────────────────────────────────────────────────
const SKY_TOP = '#1a0533';
const SKY_MID = '#6b2fa0';
const SKY_BOT = '#e8651a';
const OCEAN_TOP = '#1a3a5c';
const OCEAN_BOT = '#0d1b2a';
const SUN_COLOR = '#ffb347';
const SURFER_BODY = '#fff';
const SURFER_BOARD = '#e8651a';
const ORB_COLOR = '#ffd700';
const ROCK_COLOR = '#3a3a4a';
const SEAGULL_COLOR = '#ddd';

export default function SunsetSurfer() {
  const canvasRef = useRef(null);
  const gameStateRef = useRef('menu'); // 'menu' | 'playing' | 'paused' | 'gameover'
  const animFrameRef = useRef(null);
  const keysRef = useRef({});
  const [displayState, setDisplayState] = useState('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('sunset_surfer_hs') || '0', 10);
  });

  // ─── Game Data (mutable refs for perf) ──────────────────────────────
  const gameRef = useRef({
    surfer: { x: 80, y: 0, vy: 0, ducking: false, grounded: true, w: SURFER_W, h: SURFER_H },
    obstacles: [],
    orbs: [],
    particles: [],
    clouds: [],
    score: 0,
    speed: 4,
    frameCount: 0,
    groundY: 0,
    spawnTimer: 0,
    orbTimer: 0,
    waveOffset: 0,
  });

  // ─── Initialize / Reset ─────────────────────────────────────────────
  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const groundY = canvas.height * GROUND_Y_RATIO;
    gameRef.current = {
      surfer: { x: 80, y: groundY - SURFER_H, vy: 0, ducking: false, grounded: true, w: SURFER_W, h: SURFER_H },
      obstacles: [],
      orbs: [],
      particles: [],
      clouds: Array.from({ length: 5 }, () => ({
        x: Math.random() * canvas.width,
        y: 30 + Math.random() * 80,
        w: 40 + Math.random() * 60,
        speed: 0.2 + Math.random() * 0.5,
        opacity: 0.15 + Math.random() * 0.25,
      })),
      score: 0,
      speed: 4,
      frameCount: 0,
      groundY,
      spawnTimer: 0,
      orbTimer: 0,
      waveOffset: 0,
    };
    setScore(0);
  }, []);

  // ─── Draw Helpers ───────────────────────────────────────────────────
  const drawSky = (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    grad.addColorStop(0, SKY_TOP);
    grad.addColorStop(0.45, SKY_MID);
    grad.addColorStop(1, SKY_BOT);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h * 0.75);
  };

  const drawSun = (ctx, w, h, frame) => {
    const sunY = h * 0.28 + Math.sin(frame * 0.005) * 5;
    const sunX = w * 0.75;
    // Glow
    const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 80);
    glow.addColorStop(0, 'rgba(255,179,71,0.6)');
    glow.addColorStop(0.5, 'rgba(255,179,71,0.15)');
    glow.addColorStop(1, 'rgba(255,179,71,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - 80, sunY - 80, 160, 160);
    // Sun disc
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fillStyle = SUN_COLOR;
    ctx.fill();
  };

  const drawOcean = (ctx, w, h, groundY, waveOffset) => {
    const grad = ctx.createLinearGradient(0, groundY, 0, h);
    grad.addColorStop(0, OCEAN_TOP);
    grad.addColorStop(1, OCEAN_BOT);
    ctx.fillStyle = grad;
    ctx.fillRect(0, groundY, w, h - groundY);
    // Wave lines
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    for (let row = 0; row < 4; row++) {
      ctx.beginPath();
      const baseY = groundY + 8 + row * 18;
      for (let x = 0; x <= w; x += 4) {
        const y = baseY + Math.sin((x + waveOffset + row * 40) * 0.03) * 4;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  const drawClouds = (ctx, clouds) => {
    clouds.forEach(c => {
      ctx.fillStyle = `rgba(255,255,255,${c.opacity})`;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w * 0.5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x - c.w * 0.2, c.y - 5, c.w * 0.3, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.25, c.y - 3, c.w * 0.25, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawSurfer = (ctx, surfer, frame) => {
    const { x, y, ducking } = surfer;
    const bodyH = ducking ? 22 : 36;
    const bodyY = ducking ? y + 22 : y + 8;
    // Board
    ctx.fillStyle = SURFER_BOARD;
    ctx.beginPath();
    ctx.ellipse(x + 18, y + SURFER_H - 2, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.fillStyle = SURFER_BODY;
    ctx.fillRect(x + 12, bodyY, 12, bodyH - 8);
    // Head
    ctx.beginPath();
    ctx.arc(x + 18, bodyY - 4, 7, 0, Math.PI * 2);
    ctx.fill();
    // Arms
    ctx.strokeStyle = SURFER_BODY;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const armAngle = Math.sin(frame * 0.1) * 0.15;
    ctx.moveTo(x + 12, bodyY + 8);
    ctx.lineTo(x + 2, bodyY + 12 + Math.sin(frame * 0.08) * 3);
    ctx.moveTo(x + 24, bodyY + 8);
    ctx.lineTo(x + 34, bodyY + 12 + Math.cos(frame * 0.08) * 3);
    ctx.stroke();
  };

  const drawObstacle = (ctx, obs) => {
    if (obs.type === 'rock') {
      ctx.fillStyle = ROCK_COLOR;
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y + obs.h);
      ctx.lineTo(obs.x + obs.w * 0.3, obs.y);
      ctx.lineTo(obs.x + obs.w * 0.7, obs.y + obs.h * 0.15);
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.w * 0.3, obs.y);
      ctx.lineTo(obs.x + obs.w * 0.45, obs.y + obs.h * 0.5);
      ctx.lineTo(obs.x + obs.w * 0.2, obs.y + obs.h);
      ctx.lineTo(obs.x, obs.y + obs.h);
      ctx.closePath();
      ctx.fill();
    } else if (obs.type === 'seagull') {
      ctx.strokeStyle = SEAGULL_COLOR;
      ctx.lineWidth = 2.5;
      const wingY = Math.sin(obs.x * 0.05) * 4;
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y + wingY);
      ctx.quadraticCurveTo(obs.x + 10, obs.y - 8 + wingY, obs.x + 20, obs.y + wingY);
      ctx.moveTo(obs.x + 20, obs.y + wingY);
      ctx.quadraticCurveTo(obs.x + 30, obs.y - 8 + wingY, obs.x + 40, obs.y + wingY);
      ctx.stroke();
    }
  };

  const drawOrb = (ctx, orb, frame) => {
    const pulse = 1 + Math.sin(frame * 0.1 + orb.x) * 0.15;
    const r = ORB_SIZE * 0.5 * pulse;
    // Glow
    const glow = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, r + 6);
    glow.addColorStop(0, 'rgba(255,215,0,0.5)');
    glow.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, r + 6, 0, Math.PI * 2);
    ctx.fill();
    // Orb
    ctx.fillStyle = ORB_COLOR;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
    ctx.fill();
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(orb.x - 2, orb.y - 2, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawParticles = (ctx, particles) => {
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const drawHUD = (ctx, w, score) => {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(w - 140, 10, 130, 36);
    ctx.strokeStyle = 'rgba(255,179,71,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(w - 140, 10, 130, 36);
    ctx.fillStyle = '#ffb347';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`☀ ${score}`, w - 20, 34);
    ctx.textAlign = 'left';
  };

  // ─── Game Loop ──────────────────────────────────────────────────────
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const g = gameRef.current;
    const keys = keysRef.current;

    if (gameStateRef.current !== 'playing') {
      animFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    g.frameCount++;
    g.waveOffset += g.speed * 0.8;

    // ── Speed scaling
    g.speed = 4 + Math.floor(g.score / 50) * 0.5;
    if (g.speed > 12) g.speed = 12;

    // ── Surfer physics
    const surfer = g.surfer;
    if ((keys['ArrowUp'] || keys[' ']) && surfer.grounded) {
      surfer.vy = JUMP_FORCE;
      surfer.grounded = false;
    }
    surfer.ducking = !!(keys['ArrowDown']);
    if (surfer.ducking) {
      surfer.h = 28;
    } else {
      surfer.h = SURFER_H;
    }

    surfer.vy += GRAVITY;
    surfer.y += surfer.vy;
    if (surfer.y >= g.groundY - surfer.h) {
      surfer.y = g.groundY - surfer.h;
      surfer.vy = 0;
      surfer.grounded = true;
    }

    // ── Spawn obstacles
    g.spawnTimer++;
    const gapNeeded = Math.max(MIN_OBSTACLE_GAP - g.score * 0.3, 80);
    if (g.spawnTimer > gapNeeded / g.speed * 6) {
      g.spawnTimer = 0;
      const r = Math.random();
      if (r < 0.6) {
        const rH = 25 + Math.random() * 20;
        g.obstacles.push({ type: 'rock', x: w + 20, y: g.groundY - rH, w: 30 + Math.random() * 20, h: rH });
      } else {
        g.obstacles.push({ type: 'seagull', x: w + 20, y: g.groundY - 50 - Math.random() * 30, w: 40, h: 16 });
      }
    }

    // ── Spawn orbs
    g.orbTimer++;
    if (g.orbTimer > 120) {
      g.orbTimer = 0;
      if (Math.random() < 0.5) {
        g.orbs.push({ x: w + 20, y: g.groundY - 30 - Math.random() * 50 });
      }
    }

    // ── Move obstacles
    g.obstacles.forEach(obs => { obs.x -= g.speed; });
    g.obstacles = g.obstacles.filter(obs => obs.x > -60);

    // ── Move orbs
    g.orbs.forEach(orb => { orb.x -= g.speed; });
    g.orbs = g.orbs.filter(orb => orb.x > -30);

    // ── Move clouds
    g.clouds.forEach(c => { c.x -= c.speed; if (c.x < -80) c.x = w + 80; });

    // ── Collision: obstacles
    const sx = surfer.x;
    const sy = surfer.y;
    const sw = surfer.w;
    const sh = surfer.h;
    for (const obs of g.obstacles) {
      let ox = obs.x, oy = obs.y, ow = obs.w, oh = obs.h;
      // Shrink hitbox slightly for fairness
      const pad = 6;
      if (sx + sw - pad > ox + pad && sx + pad < ox + ow - pad && sy + sh - pad > oy + pad && sy + pad < oy + oh - pad) {
        // Game Over!
        gameStateRef.current = 'gameover';
        setDisplayState('gameover');
        const hs = parseInt(localStorage.getItem('sunset_surfer_hs') || '0', 10);
        if (g.score > hs) {
          localStorage.setItem('sunset_surfer_hs', g.score.toString());
          setHighScore(g.score);
        }
        break;
      }
    }

    // ── Collision: orbs
    g.orbs = g.orbs.filter(orb => {
      const dist = Math.hypot(orb.x - (sx + sw / 2), orb.y - (sy + sh / 2));
      if (dist < 28) {
        g.score += 10;
        setScore(g.score);
        // Spawn particles
        for (let i = 0; i < 8; i++) {
          g.particles.push({
            x: orb.x, y: orb.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            size: 2 + Math.random() * 3,
            color: Math.random() > 0.5 ? '#ffd700' : '#ffb347',
          });
        }
        return false;
      }
      return true;
    });

    // ── Score tick
    if (g.frameCount % 6 === 0) {
      g.score++;
      setScore(g.score);
    }

    // ── Update particles
    g.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;
    });
    g.particles = g.particles.filter(p => p.life > 0);

    // ── DRAW EVERYTHING ──────────────────────────────────────────────
    ctx.clearRect(0, 0, w, h);
    drawSky(ctx, w, h);
    drawSun(ctx, w, h, g.frameCount);
    drawClouds(ctx, g.clouds);
    drawOcean(ctx, w, h, g.groundY, g.waveOffset);

    g.obstacles.forEach(obs => drawObstacle(ctx, obs));
    g.orbs.forEach(orb => drawOrb(ctx, orb, g.frameCount));
    drawSurfer(ctx, surfer, g.frameCount);
    drawParticles(ctx, g.particles);
    drawHUD(ctx, w, g.score);

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ─── Key Handlers ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();

      if (e.key === 'p' || e.key === 'P') {
        if (gameStateRef.current === 'playing') {
          gameStateRef.current = 'paused';
          setDisplayState('paused');
        } else if (gameStateRef.current === 'paused') {
          gameStateRef.current = 'playing';
          setDisplayState('playing');
        }
      }

      if ((e.key === ' ' || e.key === 'Enter') && gameStateRef.current === 'menu') {
        resetGame();
        gameStateRef.current = 'playing';
        setDisplayState('playing');
      }

      if ((e.key === ' ' || e.key === 'Enter') && gameStateRef.current === 'gameover') {
        resetGame();
        gameStateRef.current = 'playing';
        setDisplayState('playing');
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetGame]);

  // ─── Canvas setup & game loop start ─────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      if (gameRef.current) gameRef.current.groundY = canvas.height * GROUND_Y_RATIO;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    resetGame();
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      ro.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [resetGame, gameLoop]);

  // ─── Overlays ──────────────────────────────────────────────────────
  const Overlay = ({ children }) => (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'rgba(10,5,25,0.7)',
      backdropFilter: 'blur(6px)', zIndex: 10, color: '#fff', fontFamily: 'Outfit, sans-serif',
    }}>
      {children}
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0519', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {displayState === 'menu' && (
        <Overlay>
          <div style={{ fontSize: 36, fontWeight: 800, background: 'linear-gradient(135deg, #ffb347, #e8651a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
            🏄 Sunset Surfer
          </div>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 24 }}>Ride the golden waves. Dodge. Collect. Survive.</p>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, opacity: 0.5, marginBottom: 20 }}>
            <span>↑ / SPACE — Jump</span>
            <span>↓ — Duck</span>
            <span>P — Pause</span>
          </div>
          <button
            onClick={() => { resetGame(); gameStateRef.current = 'playing'; setDisplayState('playing'); }}
            style={{
              padding: '12px 36px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #e8651a, #ffb347)',
              color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(232,101,26,0.4)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            Press SPACE to Surf 🌊
          </button>
          {highScore > 0 && (
            <p style={{ marginTop: 16, fontSize: 12, opacity: 0.5 }}>🏆 Best: {highScore}</p>
          )}
        </Overlay>
      )}

      {displayState === 'paused' && (
        <Overlay>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>⏸ Paused</div>
          <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>Press P or click Resume to continue</p>
          <button
            onClick={() => { gameStateRef.current = 'playing'; setDisplayState('playing'); }}
            style={{
              padding: '10px 32px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #6b2fa0, #e8651a)',
              color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            Resume ▶
          </button>
        </Overlay>
      )}

      {displayState === 'gameover' && (
        <Overlay>
          <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, color: '#ff6b6b' }}>💥 Wipeout!</div>
          <div style={{ fontSize: 48, fontWeight: 800, background: 'linear-gradient(135deg, #ffd700, #ffb347)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '8px 0' }}>
            {score}
          </div>
          <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 4 }}>Score</p>
          {score >= highScore && score > 0 && (
            <p style={{ fontSize: 13, color: '#ffd700', fontWeight: 600, marginBottom: 12 }}>🏆 New High Score!</p>
          )}
          {score < highScore && (
            <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 12 }}>Best: {highScore}</p>
          )}
          <button
            onClick={() => { resetGame(); gameStateRef.current = 'playing'; setDisplayState('playing'); }}
            style={{
              padding: '12px 36px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #e8651a, #ffb347)',
              color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(232,101,26,0.4)',
            }}
          >
            Surf Again 🏄
          </button>
        </Overlay>
      )}
    </div>
  );
}
