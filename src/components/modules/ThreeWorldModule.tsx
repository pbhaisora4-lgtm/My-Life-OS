import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  Box,
  Gamepad2,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trophy,
  Shield,
  Zap,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

type ThreeMode = 'sanctum' | 'game';
type SculpturePreset = 'astrolabe' | 'helix' | 'monolith';
type CameraPreset = 'overview' | 'closeup' | 'zenith' | 'low';
type GameState = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

// Procedural Web Audio Synthesizer for Game Juice
class ProceduralSynth {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private ensureCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playCollect() {
    if (this.muted) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.14); // C6
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playBoost() {
    if (this.muted) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.22);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  playHit() {
    if (this.muted) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.25);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playVictory() {
    if (this.muted) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    });
  }
}

const synth = new ProceduralSynth();

export const ThreeWorldModule: React.FC = () => {
  const { showIslandNotice } = useLifeOS();

  const [mode, setMode] = useState<ThreeMode>('sanctum');
  const [sculpturePreset, setSculpturePreset] = useState<SculpturePreset>('astrolabe');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [energySpeed, setEnergySpeed] = useState<number>(1.0);

  // Game UI State
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState<number>(0);
  const [coresCollected, setCoresCollected] = useState<number>(0);
  const [shields, setShields] = useState<number>(3);
  const [combo, setCombo] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Mutable refs for animation loop access without re-mounting WebGL context
  const modeRef = useRef<ThreeMode>(mode);
  const sculpturePresetRef = useRef<SculpturePreset>(sculpturePreset);
  const energySpeedRef = useRef<number>(energySpeed);
  const gameStateRef = useRef<GameState>(gameState);
  const cameraTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 3.2, 8.5));
  const cameraLookTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 0));
  const usePresetTransitionRef = useRef<boolean>(false);

  // Game entity state inside loop
  const playerLaneRef = useRef<number>(0); // -1 (left), 0 (center), 1 (right)
  const playerXRef = useRef<number>(0);
  const boostTimerRef = useRef<number>(0);
  const hitstopTimerRef = useRef<number>(0);
  const shakeIntensityRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const coresRef = useRef<number>(0);
  const shieldsRef = useRef<number>(3);
  const comboRef = useRef<number>(1);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    sculpturePresetRef.current = sculpturePreset;
  }, [sculpturePreset]);

  useEffect(() => {
    energySpeedRef.current = energySpeed;
  }, [energySpeed]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    synth.muted = next;
  };

  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    usePresetTransitionRef.current = true;
    if (preset === 'overview') {
      cameraTargetPosRef.current.set(0, 3.2, 8.5);
      cameraLookTargetRef.current.set(0, 1.2, 0);
    } else if (preset === 'closeup') {
      cameraTargetPosRef.current.set(0, 1.8, 4.2);
      cameraLookTargetRef.current.set(0, 1.6, 0);
    } else if (preset === 'zenith') {
      cameraTargetPosRef.current.set(0, 9.5, 1.2);
      cameraLookTargetRef.current.set(0, 0.8, 0);
    } else if (preset === 'low') {
      cameraTargetPosRef.current.set(3.8, 0.7, 5.2);
      cameraLookTargetRef.current.set(0, 2.0, 0);
    }
  };

  const startNewGame = useCallback(() => {
    scoreRef.current = 0;
    coresRef.current = 0;
    shieldsRef.current = 3;
    comboRef.current = 1;
    playerLaneRef.current = 0;
    playerXRef.current = 0;
    boostTimerRef.current = 0;
    hitstopTimerRef.current = 0;
    shakeIntensityRef.current = 0;

    setScore(0);
    setCoresCollected(0);
    setShields(3);
    setCombo(1);
    setGameState('playing');
    gameStateRef.current = 'playing';
    synth.playBoost();
  }, []);

  const triggerGameBoost = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    if (boostTimerRef.current <= 0) {
      boostTimerRef.current = 1.1;
      synth.playBoost();
    }
  }, []);

  const shiftPlayerLane = useCallback((delta: number) => {
    if (gameStateRef.current !== 'playing') return;
    playerLaneRef.current = Math.max(-1, Math.min(1, playerLaneRef.current + delta));
  }, []);

  // Keyboard Controls for Game
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (modeRef.current !== 'game') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        shiftPlayerLane(-1);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        shiftPlayerLane(1);
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (gameStateRef.current === 'title') {
          startNewGame();
        } else if (gameStateRef.current === 'playing') {
          triggerGameBoost();
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (gameStateRef.current === 'playing') {
          setGameState('paused');
        } else if (gameStateRef.current === 'paused') {
          setGameState('playing');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shiftPlayerLane, startNewGame, triggerGameBoost]);

  // Main Three.js Scene & Render Loop
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 480;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });

    // Detect Software WebGL renderer (SwiftShader / llvmpipe) per Three.js skill
    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    const isSoftwareRenderer = /SwiftShader|llvmpipe|Software/i.test(String(rendererStr));

    renderer.setPixelRatio(isSoftwareRenderer ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareRenderer;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a14);
    scene.fog = new THREE.FogExp2(0x070a14, 0.042);

    // PMREM Environment Lighting for realistic metallic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 120);
    camera.position.set(0, 3.2, 8.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 2.5;
    controls.maxDistance = 18;
    controls.target.set(0, 1.2, 0);

    controls.addEventListener('start', () => {
      usePresetTransitionRef.current = false;
    });

    // Warm Key Light + Cool Hemisphere Fill + Rim Accent
    const hemiLight = new THREE.HemisphereLight(0x6088ff, 0x151828, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.4);
    keyLight.position.set(6, 10, 7);
    if (!isSoftwareRenderer) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x06b6d4, 3.2, 16);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Shared Materials (PBR)
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.88,
      roughness: 0.18,
    });
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.82,
      roughness: 0.25,
    });
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.4,
      roughness: 0.2,
    });
    const cyanCoreMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.2,
    });
    const indigoGlowMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x4f46e5,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });

    // ==================== SANCTUM ROOT GROUP ====================
    const sanctumGroup = new THREE.Group();
    scene.add(sanctumGroup);

    // Architectural Pedestal Floor & Grid
    const floorGeo = new THREE.CylinderGeometry(8, 8.5, 0.3, 48);
    const floorMesh = new THREE.Mesh(floorGeo, obsidianMat);
    floorMesh.position.y = -0.15;
    floorMesh.receiveShadow = true;
    sanctumGroup.add(floorMesh);

    const gridHelper = new THREE.GridHelper(24, 24, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0.01;
    sanctumGroup.add(gridHelper);

    // 1. Chronos Astrolabe Composite Group (7 sub-parts)
    const astrolabeGroup = new THREE.Group();
    sanctumGroup.add(astrolabeGroup);

    const baseTier1 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.1, 0.25, 32), obsidianMat);
    baseTier1.position.y = 0.125;
    const baseTier2 = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.2, 32), goldMat);
    baseTier2.position.y = 0.35;
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.07, 24, 64), goldMat);
    outerRing.position.y = 2.1;
    const midRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.055, 24, 64), titaniumMat);
    midRing.position.y = 2.1;
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.045, 20, 48), goldMat);
    innerRing.position.y = 2.1;
    const coreSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 2), cyanCoreMat);
    coreSphere.position.y = 2.1;

    const satellitesGroup = new THREE.Group();
    satellitesGroup.position.y = 2.1;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const sat = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), indigoGlowMat);
      sat.position.set(Math.cos(angle) * 2.15, 0, Math.sin(angle) * 2.15);
      satellitesGroup.add(sat);
    }

    astrolabeGroup.add(
      baseTier1,
      baseTier2,
      outerRing,
      midRing,
      innerRing,
      coreSphere,
      satellitesGroup
    );

    // 2. Bio-Helix Resonator Composite Group (10 sub-parts)
    const helixGroup = new THREE.Group();
    helixGroup.visible = false;
    sanctumGroup.add(helixGroup);

    const helixBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.3, 32), titaniumMat);
    helixBase.position.y = 0.15;
    helixGroup.add(helixBase);

    const helixStrands = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const y = 0.5 + i * 0.28;
      const theta = i * 0.55;
      const nodeA = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), cyanCoreMat);
      nodeA.position.set(Math.cos(theta) * 1.1, y, Math.sin(theta) * 1.1);
      const nodeB = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), goldMat);
      nodeB.position.set(Math.cos(theta + Math.PI) * 1.1, y, Math.sin(theta + Math.PI) * 1.1);
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), titaniumMat);
      rung.position.set(0, y, 0);
      rung.rotation.z = Math.PI / 2;
      rung.rotation.y = -theta;
      helixStrands.add(nodeA, nodeB, rung);
    }
    helixGroup.add(helixStrands);

    // 3. Zenith Monolith Array Composite Group (6 sub-parts)
    const monolithGroup = new THREE.Group();
    monolithGroup.visible = false;
    sanctumGroup.add(monolithGroup);

    const monoAltar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 3.2), obsidianMat);
    monoAltar.position.y = 0.15;
    const centerObelisk = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), obsidianMat);
    centerObelisk.scale.set(0.65, 2.1, 0.65);
    centerObelisk.position.y = 2.3;
    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.05, 16, 64), cyanCoreMat);
    haloRing.rotation.x = Math.PI / 2;
    haloRing.position.y = 2.3;
    monolithGroup.add(monoAltar, centerObelisk, haloRing);

    const shardsGroup = new THREE.Group();
    shardsGroup.position.y = 2.3;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 4), goldMat);
      shard.position.set(Math.cos(a) * 2.1, 0, Math.sin(a) * 2.1);
      shardsGroup.add(shard);
    }
    monolithGroup.add(shardsGroup);

    // ==================== GAME ROOT GROUP ====================
    const gameGroup = new THREE.Group();
    gameGroup.visible = false;
    scene.add(gameGroup);

    // Neon Track Highway
    const trackGeo = new THREE.PlaneGeometry(7.5, 80, 6, 40);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x0b1021,
      roughness: 0.4,
      metalness: 0.6,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.position.z = -30;
    gameGroup.add(trackMesh);

    const trackGrid = new THREE.GridHelper(80, 40, 0x06b6d4, 0x1e293b);
    trackGrid.position.set(0, 0.02, -30);
    gameGroup.add(trackGrid);

    // Composite Player Ship (4 sub-parts: fuselage, left wing, right wing, engine thruster)
    const playerShip = new THREE.Group();
    playerShip.position.set(0, 0.45, 2.2);
    const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.35, 6), titaniumMat);
    fuselage.rotation.x = -Math.PI / 2;
    const wings = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.45), goldMat);
    wings.position.set(0, -0.05, 0.15);
    const engineCore = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), cyanCoreMat);
    engineCore.position.set(0, 0, 0.65);
    playerShip.add(fuselage, wings, engineCore);
    gameGroup.add(playerShip);

    // Pool of Energy Cores (Collectibles) & Entropy Barriers (Obstacles)
    const collectibles: THREE.Mesh[] = [];
    const obstacles: THREE.Mesh[] = [];
    const obstacleMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });

    for (let i = 0; i < 6; i++) {
      const coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 1), cyanCoreMat);
      const lane = (i % 3) - 1;
      coreMesh.position.set(lane * 2.1, 0.55, -8 - i * 8);
      gameGroup.add(coreMesh);
      collectibles.push(coreMesh);
    }

    for (let i = 0; i < 5; i++) {
      const obsMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.45), obstacleMat);
      const lane = ((i + 1) % 3) - 1;
      obsMesh.position.set(lane * 2.1, 0.45, -12 - i * 10);
      gameGroup.add(obsMesh);
      obstacles.push(obsMesh);
    }

    // Burst Particles Pool
    const burstGroup = new THREE.Group();
    gameGroup.add(burstGroup);
    const burstParticles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), cyanCoreMat);
      pMesh.visible = false;
      burstGroup.add(pMesh);
      burstParticles.push({ mesh: pMesh, vel: new THREE.Vector3(), life: 0 });
    }

    const spawnBurst = (pos: THREE.Vector3) => {
      burstParticles.forEach((p) => {
        p.mesh.position.copy(pos);
        p.mesh.visible = true;
        p.vel.set(
          (Math.random() - 0.5) * 6,
          Math.random() * 4 + 1,
          (Math.random() - 0.5) * 6
        );
        p.life = 0.45;
      });
    };

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop with Clamped dt & Software WebGL Pacing
    let lastTime = performance.now();
    let isDisposed = false;
    let rafId = 0;

    const animate = async (now: number) => {
      if (isDisposed) return;

      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Mandatory dt clamp per Three.js skill
      const elapsed = now * 0.001;

      const activeMode = modeRef.current;
      sanctumGroup.visible = activeMode === 'sanctum';
      gameGroup.visible = activeMode === 'game';
      controls.enabled = activeMode === 'sanctum';

      if (activeMode === 'sanctum') {
        const preset = sculpturePresetRef.current;
        astrolabeGroup.visible = preset === 'astrolabe';
        helixGroup.visible = preset === 'helix';
        monolithGroup.visible = preset === 'monolith';

        const spd = energySpeedRef.current;
        // Animate Chronos Astrolabe
        outerRing.rotation.y += dt * 0.55 * spd;
        outerRing.rotation.x = Math.sin(elapsed * 0.7) * 0.25;
        midRing.rotation.x += dt * 0.85 * spd;
        midRing.rotation.z += dt * 0.35 * spd;
        innerRing.rotation.y -= dt * 1.2 * spd;
        innerRing.rotation.z = Math.cos(elapsed * 1.1) * 0.4;
        coreSphere.scale.setScalar(1 + Math.sin(elapsed * 3.2) * 0.08);
        satellitesGroup.rotation.y -= dt * 0.65 * spd;

        // Animate Helix
        helixStrands.rotation.y += dt * 0.7 * spd;

        // Animate Monolith
        centerObelisk.position.y = 2.3 + Math.sin(elapsed * 2) * 0.18;
        centerObelisk.rotation.y += dt * 0.4 * spd;
        shardsGroup.rotation.y -= dt * 0.8 * spd;

        if (usePresetTransitionRef.current) {
          camera.position.lerp(cameraTargetPosRef.current, Math.min(1, dt * 4.5));
          controls.target.lerp(cameraLookTargetRef.current, Math.min(1, dt * 4.5));
        }
        controls.update();
      } else {
        // GAME MODE
        const gState = gameStateRef.current;

        // Position camera behind player ship with decaying shake
        const targetCamX = playerXRef.current * 0.35;
        const shakeOffset =
          shakeIntensityRef.current > 0
            ? (Math.random() - 0.5) * shakeIntensityRef.current
            : 0;
        if (shakeIntensityRef.current > 0) {
          shakeIntensityRef.current = Math.max(0, shakeIntensityRef.current - dt * 1.8);
        }

        camera.position.set(targetCamX + shakeOffset, 2.8 + shakeOffset * 0.5, 6.2);
        camera.lookAt(playerXRef.current * 0.5, 0.6, -6);

        if (gState === 'title') {
          // Idle hover animation on Title Screen
          playerShip.position.y = 0.45 + Math.sin(elapsed * 3) * 0.08;
          playerShip.rotation.z = Math.sin(elapsed * 1.5) * 0.1;
          trackGrid.position.z = -30 + ((elapsed * 6) % 2);
        } else if (gState === 'playing') {
          if (hitstopTimerRef.current > 0) {
            hitstopTimerRef.current -= dt;
          } else {
            const isBoosting = boostTimerRef.current > 0;
            if (isBoosting) {
              boostTimerRef.current = Math.max(0, boostTimerRef.current - dt);
            }
            const forwardSpeed = isBoosting ? 24 : 13.5;

            // Smooth lane interpolation
            const targetX = playerLaneRef.current * 2.1;
            playerXRef.current += (targetX - playerXRef.current) * Math.min(1, dt * 12);
            playerShip.position.x = playerXRef.current;
            playerShip.position.y = 0.45 + Math.sin(elapsed * 6) * 0.04;
            playerShip.rotation.z = (playerXRef.current - targetX) * 0.28;

            // Scroll grid
            trackGrid.position.z += forwardSpeed * dt;
            if (trackGrid.position.z > -28) trackGrid.position.z -= 2;

            // Move & collide Energy Cores
            for (const c of collectibles) {
              c.rotation.y += dt * 2.5;
              c.position.z += forwardSpeed * dt;

              // Check pickup
              const dz = Math.abs(c.position.z - playerShip.position.z);
              const dx = Math.abs(c.position.x - playerShip.position.x);
              if (dz < 0.85 && dx < 0.85) {
                synth.playCollect();
                spawnBurst(c.position);
                c.position.z = -48 - Math.random() * 12;
                c.position.x = (Math.floor(Math.random() * 3) - 1) * 2.1;

                coresRef.current += 1;
                scoreRef.current += 100 * comboRef.current;
                comboRef.current = Math.min(8, comboRef.current + 1);

                setCoresCollected(coresRef.current);
                setScore(scoreRef.current);
                setCombo(comboRef.current);

                if (coresRef.current >= 15) {
                  synth.playVictory();
                  setGameState('victory');
                  gameStateRef.current = 'victory';
                }
              } else if (c.position.z > 6) {
                c.position.z = -48 - Math.random() * 10;
                c.position.x = (Math.floor(Math.random() * 3) - 1) * 2.1;
              }
            }

            // Move & collide Obstacles
            for (const obs of obstacles) {
              obs.position.z += forwardSpeed * dt;
              const dz = Math.abs(obs.position.z - playerShip.position.z);
              const dx = Math.abs(obs.position.x - playerShip.position.x);

              if (dz < 0.75 && dx < 0.85) {
                if (isBoosting) {
                  // Phase boost shatters obstacle!
                  synth.playCollect();
                  spawnBurst(obs.position);
                  obs.position.z = -52 - Math.random() * 15;
                  scoreRef.current += 250;
                  setScore(scoreRef.current);
                } else {
                  synth.playHit();
                  hitstopTimerRef.current = 0.09; // Hitstop freeze
                  shakeIntensityRef.current = 0.35; // Camera shake
                  obs.position.z = -52 - Math.random() * 15;
                  comboRef.current = 1;
                  setCombo(1);

                  shieldsRef.current -= 1;
                  setShields(shieldsRef.current);
                  if (shieldsRef.current <= 0) {
                    setGameState('gameover');
                    gameStateRef.current = 'gameover';
                  }
                }
              } else if (obs.position.z > 6) {
                obs.position.z = -52 - Math.random() * 14;
                obs.position.x = (Math.floor(Math.random() * 3) - 1) * 2.1;
              }
            }

            // Update Burst Particles
            for (const p of burstParticles) {
              if (p.life > 0) {
                p.life -= dt;
                p.mesh.position.addScaledVector(p.vel, dt);
                p.mesh.scale.setScalar(Math.max(0.01, p.life * 2));
                if (p.life <= 0) p.mesh.visible = false;
              }
            }
          }
        }
      }

      renderer.render(scene, camera);

      // Software WebGL frame pacing per Three.js skill
      if (isSoftwareRenderer) {
        await new Promise((r) => setTimeout(r, 0));
      }

      if (!isDisposed) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="space-y-3 pb-20">
      {/* Top Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-indigo-500 dark:text-cyan-400">
            WebGL Spatial Engine
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            3D Sanctum & Focus Arena
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-white/10">
          <button
            onClick={() => setMode('sanctum')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              mode === 'sanctum'
                ? 'bg-white dark:bg-[#151924] text-indigo-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Scenes</span>
          </button>
          <button
            onClick={() => setMode('game')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              mode === 'game'
                ? 'bg-white dark:bg-[#151924] text-amber-500 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>3D Game</span>
          </button>
        </div>
      </div>

      {/* Viewport Shell (>= 85% unobstructed canvas area, zero backdrop-filter over WebGL) */}
      <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-[#070a14] shadow-xl select-none">
        {/* Dedicated Isolated Three.js Canvas Mount */}
        <div ref={canvasContainerRef} className="w-full h-full relative" />

        {/* ==================== MODE 1 OVERLAY: 3D SANCTUM DOCK ==================== */}
        {mode === 'sanctum' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
            {/* Top Minimal Pill */}
            <div className="flex items-center justify-between">
              <div className="pointer-events-auto px-3 py-1 rounded-xl bg-[#0b1020]/90 border border-white/10 text-[11px] font-mono text-cyan-400">
                Drag to Orbit · Scroll/Pinch to Zoom
              </div>
              <button
                onClick={() => setDockCollapsed(!dockCollapsed)}
                className="pointer-events-auto px-2.5 py-1 rounded-xl bg-[#0b1020]/90 border border-white/10 text-xs text-slate-300 flex items-center gap-1"
              >
                <span>{dockCollapsed ? 'Show Controls' : 'Hide Dock'}</span>
                {dockCollapsed ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Collapsible Bottom Control Dock (<= 15% height, solid dark background, NO backdrop-filter) */}
            {!dockCollapsed && (
              <div className="pointer-events-auto p-2.5 rounded-xl bg-[#0b1020]/95 border border-white/10 flex flex-wrap items-center justify-between gap-2">
                {/* Sculpture Selector */}
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'astrolabe', label: 'Astrolabe' },
                      { id: 'helix', label: 'Bio-Helix' },
                      { id: 'monolith', label: 'Monolith' },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSculpturePreset(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        sculpturePreset === s.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Camera Preset Pills */}
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'overview', label: 'Overview' },
                      { id: 'closeup', label: 'Core' },
                      { id: 'zenith', label: 'Zenith' },
                      { id: 'low', label: 'Hero' },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => applyCameraPreset(c.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase transition ${
                        cameraPreset === c.id
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== MODE 2 OVERLAY: 3D FOCUS RUNNER GAME SHELL ==================== */}
        {mode === 'game' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
            {/* Playing / Paused HUD */}
            {gameState !== 'title' && (
              <div className="flex items-center justify-between">
                {/* Top-Left Score & Cores */}
                <div className="px-3 py-1.5 rounded-xl bg-[#0b1020]/90 border border-white/10 flex items-center gap-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                      Score (x{combo})
                    </span>
                    <span className="text-sm font-mono font-bold text-white">
                      {score.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-5 w-px bg-white/10" />
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400 block">
                      Cores
                    </span>
                    <span className="text-sm font-mono font-bold text-cyan-400">
                      {coresCollected} / 15
                    </span>
                  </div>
                </div>

                {/* Top-Right Shields, Mute, Pause */}
                <div className="pointer-events-auto flex items-center gap-1.5">
                  <div className="px-2.5 py-1.5 rounded-xl bg-[#0b1020]/90 border border-white/10 flex items-center gap-1">
                    {[1, 2, 3].map((idx) => (
                      <Shield
                        key={idx}
                        className={`w-3.5 h-3.5 ${
                          idx <= shields ? 'text-emerald-400 fill-emerald-400/30' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleToggleMute}
                    className="p-2 rounded-xl bg-[#0b1020]/90 border border-white/10 text-slate-200 hover:text-white"
                    aria-label="Toggle Mute"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() =>
                      setGameState(gameState === 'paused' ? 'playing' : 'paused')
                    }
                    className="p-2 rounded-xl bg-[#0b1020]/90 border border-white/10 text-slate-200 hover:text-white"
                    aria-label="Pause Game"
                  >
                    {gameState === 'paused' ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Title Screen Overlay with Bespoke Inline SVG Title Lockup */}
            {gameState === 'title' && (
              <div className="my-auto mx-auto max-w-xs w-full p-5 rounded-2xl bg-[#0b1020]/95 border border-white/15 text-center space-y-4 pointer-events-auto shadow-2xl">
                {/* Bespoke Inline SVG Title Lockup */}
                <svg
                  viewBox="0 0 280 70"
                  className="w-full h-16 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="runnerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="140,4 162,24 140,18 118,24"
                    fill="url(#runnerGrad)"
                  />
                  <text
                    x="140"
                    y="45"
                    textAnchor="middle"
                    fill="url(#runnerGrad)"
                    fontFamily="monospace"
                    fontWeight="900"
                    fontSize="22"
                    letterSpacing="3"
                  >
                    NEURAL RUNNER
                  </text>
                  <text
                    x="140"
                    y="62"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontFamily="sans-serif"
                    fontWeight="700"
                    fontSize="9"
                    letterSpacing="4"
                  >
                    FOCUS ARENA · 15 CORES TO WIN
                  </text>
                </svg>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Pilot the Life OS Neural Interceptor. Collect <strong className="text-cyan-400">15 Energy Cores</strong> while dodging or phase-boosting through red entropy barriers.
                </p>

                <button
                  onClick={startNewGame}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition"
                >
                  Launch Focus Run
                </button>

                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">
                  A/D or Arrows Move · Space Phase Boost · Esc Pause
                </div>
              </div>
            )}

            {/* Pause / Victory / Game Over Modal */}
            {(gameState === 'paused' ||
              gameState === 'victory' ||
              gameState === 'gameover') && (
              <div className="my-auto mx-auto max-w-xs w-full p-5 rounded-2xl bg-[#0b1020]/95 border border-white/15 text-center space-y-3 pointer-events-auto shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
                  <Trophy
                    className={`w-6 h-6 ${
                      gameState === 'victory' ? 'text-amber-400' : 'text-cyan-400'
                    }`}
                  />
                </div>
                <h2 className="text-base font-bold text-white uppercase tracking-wide">
                  {gameState === 'victory'
                    ? 'Focus Mastery Achieved!'
                    : gameState === 'gameover'
                    ? 'Shields Depleted'
                    : 'Simulation Paused'}
                </h2>
                <p className="text-xs font-mono text-slate-300">
                  Final Score: <strong className="text-cyan-400">{score}</strong> · Cores:{' '}
                  <strong className="text-amber-400">{coresCollected}/15</strong>
                </p>

                <div className="flex gap-2 pt-1">
                  {gameState === 'paused' && (
                    <button
                      onClick={() => setGameState('playing')}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={startNewGame}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Play Again</span>
                  </button>
                </div>
              </div>
            )}

            {/* Touch-Friendly Mobile Controls Bar during Playing */}
            {gameState === 'playing' && (
              <div className="pointer-events-auto flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={() => shiftPlayerLane(-1)}
                  className="flex-1 py-3 rounded-xl bg-[#0b1020]/90 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Left Lane</span>
                </button>
                <button
                  onClick={triggerGameBoost}
                  className="px-4 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 shadow-md"
                >
                  <Zap className="w-4 h-4" />
                  <span>Boost</span>
                </button>
                <button
                  onClick={() => shiftPlayerLane(1)}
                  className="flex-1 py-3 rounded-xl bg-[#0b1020]/90 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
                >
                  <span>Right Lane</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
