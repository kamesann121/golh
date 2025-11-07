import * as THREE from 'https://cdn.skypack.dev/three';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';
import { setupControl } from './control.js';

// シーンとカメラの設定
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaddff);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// レンダラーの設定
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('displayCanvas'),
});
renderer.setSize(window.innerWidth, window.innerHeight);

// ライト
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// Cannon.js 物理ワールド
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

// 地面（物理）
const groundBody = new CANNON.Body({
  shape: new CANNON.Plane(),
  type: CANNON.Body.STATIC,
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// 地面（表示）
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228822 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ボール（物理）
const ballBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Sphere(1),
  position: new CANNON.Vec3(0, 5, 0),
});
world.addBody(ballBody);

// ボール（表示）
const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
scene.add(ballMesh);

// カップ（表示）
const cupGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 32);
const cupMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
const cupMesh = new THREE.Mesh(cupGeometry, cupMaterial);
cupMesh.position.set(10, 0.25, 0);
scene.add(cupMesh);

// ゲーム状態
const gameState = {
  currentRound: 1,
  maxRounds: 3,
  score: [],
  goalReached: false,
  shotCount: 0
};

// 操作処理をセットアップ
setupControl(renderer.domElement, ballBody, gameState);

// ゴール判定
function checkGoal() {
  if (gameState.goalReached) return;

  const dx = ballBody.position.x - cupMesh.position.x;
  const dz = ballBody.position.z - cupMesh.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance < 1.2 && ballBody.position.y < 1) {
    console.log("ゴール！");
    gameState.goalReached = true;
    gameState.score.push(gameState.shotCount);
    setTimeout(nextRound, 1500);
  }
}

// ラウンド進行
function nextRound() {
  if (gameState.currentRound >= gameState.maxRounds) {
    console.log("ラウンド終了！スコア:", gameState.score);
    const total = gameState.score.reduce((a, b) => a + b, 0);
    console.log("合計打数:", total);
    return;
  }

  gameState.currentRound++;
  gameState.goalReached = false;
  gameState.shotCount = 0;

  ballBody.velocity.setZero();
  ballBody.angularVelocity.setZero();
  ballBody.position.set(0, 5, 0);
}

// アニメーションループ
function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);
  ballMesh.position.copy(ballBody.position);
  ballMesh.quaternion.copy(ballBody.quaternion);
  checkGoal();
  renderer.render(scene, camera);
}
animate();
