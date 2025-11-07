import * as THREE from 'https://cdn.skypack.dev/three';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';
import { setupControl } from './control.js';
import { updateScoreUI } from './ui.js';

// シーン・カメラ・レンダラー
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaddff);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 18, 28);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('displayCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ライト
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// 物理ワールド
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 8;

// 地面（物理・表示）
const groundBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane() });
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const groundGeo = new THREE.PlaneGeometry(80, 80);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x1f8b3b });
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// カップ（表示のみで判定は距離）
const cupGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 32);
const cupMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
const cupMesh = new THREE.Mesh(cupGeometry, cupMaterial);
cupMesh.position.set(12, 0.25, -6);
scene.add(cupMesh);

// 障害物（坂道と壁） — 事前に作って visible 切替でラウンドに応じて使う
const slopeGeometry = new THREE.PlaneGeometry(14, 14);
const slopeMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, side: THREE.DoubleSide });
const slopeMesh = new THREE.Mesh(slopeGeometry, slopeMaterial);
slopeMesh.rotation.x = -Math.PI / 6; // 傾斜
slopeMesh.position.set(-18, 4, -6);
slopeMesh.visible = false;
scene.add(slopeMesh);

// 壁
const wallGeometry = new THREE.BoxGeometry(1, 6, 12);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
wallMesh.position.set(4, 3, 0);
wallMesh.visible = false;
scene.add(wallMesh);

// 壁物理（静的ボディ） — always present but can be far away or moved per stage
const wallBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Box(new CANNON.Vec3(0.5, 3, 6)),
  position: new CANNON.Vec3(100, 3, 0) // start far away
});
world.addBody(wallBody);

// プレイヤー設定と複数ボール生成
const playerConfigs = [
  { name: 'プレイヤー1', color: 0xff4444, start: [-8, 1.2, 4] },
  { name: 'プレイヤー2', color: 0x4444ff, start: [8, 1.2, 4] },
  { name: 'プレイヤー3', color: 0x44ff44, start: [-4, 1.2, -8] }
];

const players = playerConfigs.map(cfg => {
  const body = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(1),
    position: new CANNON.Vec3(cfg.start[0], cfg.start[1], cfg.start[2]),
    linearDamping: 0.2,
    angularDamping: 0.4
  });
  world.addBody(body);

  const geo = new THREE.SphereGeometry(1, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color, metalness: 0.3, roughness: 0.6 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  return {
    name: cfg.name,
    color: cfg.color,
    start: cfg.start.slice(),
    ballBody: body,
    ballMesh: mesh,
    shotCount: 0,
    score: [],
    goalReached: false
  };
});

// 操作のセットアップ（同時操作対応）
setupControl(renderer.domElement, players, camera);

// ステージ設定関数（ラウンドごとの地形切替）
const gameState = {
  currentRound: 1,
  maxRounds: 3
};

function setupStage(round) {
  // まず全障害物をデフォルトで非表示/遠ざける
  slopeMesh.visible = false;
  wallMesh.visible = false;
  wallBody.position.set(100, 3, 0);

  if (round === 1) {
    cupMesh.position.set(12, 0.25, -6);
    players.forEach((p, i) => {
      p.ballBody.position.set(p.start[0], p.start[1], p.start[2]);
      p.ballBody.velocity.setZero();
      p.ballBody.angularVelocity.setZero();
      p.shotCount = 0;
      p.goalReached = false;
      p.score = [];
    });
  } else if (round === 2) {
    // 坂道あり、カップを別位置に
    slopeMesh.visible = true;
    slopeMesh.position.set(-10, 3, -2);
    slopeMesh.rotation.x = -Math.PI / 5;
    cupMesh.position.set(8, 0.25, 10);

    players.forEach((p, i) => {
      // start positions moved
      const sx = -12 + i * 6;
      const sz = 8;
      p.ballBody.position.set(sx, 1.2, sz);
      p.ballBody.velocity.setZero();
      p.ballBody.angularVelocity.setZero();
      p.shotCount = 0;
      p.goalReached = false;
    });
  } else if (round === 3) {
    // 壁あり
    wallMesh.visible = true;
    wallMesh.position.set(4, 3, 0);
    wallBody.position.set(4, 3, 0);

    cupMesh.position.set(-14, 0.25, -12);
    players.forEach((p, i) => {
      const sx = -6 + i * 6;
      p.ballBody.position.set(sx, 1.2, 6);
      p.ballBody.velocity.setZero();
      p.ballBody.angularVelocity.setZero();
      p.shotCount = 0;
      p.goalReached = false;
    });
  }
}

// 初期ステージセット
setupStage(gameState.currentRound);

// ゴール判定（ボール毎）
function checkGoals() {
  players.forEach(player => {
    if (player.goalReached) return;

    const dx = player.ballBody.position.x - cupMesh.position.x;
    const dz = player.ballBody.position.z - cupMesh.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 1.2 && player.ballBody.position.y < 1.2) {
      player.goalReached = true;
      player.score.push(player.shotCount);
      console.log(`${player.name} ゴール！ ${player.shotCount}打`);
    }
  });
}

// 全員ゴール判定（ラウンド終了判定）
function allPlayersFinished() {
  return players.every(p => p.goalReached);
}

function advanceRoundIfNeeded() {
  if (allPlayersFinished()) {
    // 全員スコアが揃ったら次ラウンドへ
    if (gameState.currentRound >= gameState.maxRounds) {
      // 終了処理：合計スコアを表示
      console.log('試合終了');
      players.forEach(p => {
        const total = p.score.reduce((a, b) => a + b, 0);
        console.log(`${p.name} 合計打数: ${total}`);
      });
      return;
    }
    gameState.currentRound++;
    setupStage(gameState.currentRound);
  }
}

// アニメーションループ
let lastTime;
function animate(time) {
  requestAnimationFrame(animate);
  const dt = lastTime ? (time - lastTime) / 1000 : 1 / 60;
  lastTime = time;

  // 固定ステップで物理更新
  world.step(1 / 60, dt, 3);

  // 各プレイヤーのメッシュを同期
  players.forEach(p => {
    p.ballMesh.position.copy(p.ballBody.position);
    p.ballMesh.quaternion.copy(p.ballBody.quaternion);
  });

  checkGoals();
  advanceRoundIfNeeded();
  updateScoreUI(players, { currentRound: gameState.currentRound, maxRounds: gameState.maxRounds });

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
