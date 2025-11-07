import * as THREE from 'https://cdn.skypack.dev/three';
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';
import { setupControl } from './control.js';
import { updateScoreUI } from './ui.js';

// シーンとカメラ
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

// レンダラー
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('displayCanvas'),
});
renderer.setSize(window.innerWidth, window.innerHeight);

// ライト
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// 物理ワールド
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

// カップ（表示）
const cupGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 32);
const cupMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
const cupMesh = new THREE.Mesh(cupGeometry, cupMaterial);
cupMesh.position.set(10, 0.25, 0);
scene.add(cupMesh);

// 障害物：坂道（表示）
const slopeGeometry = new THREE.PlaneGeometry(10, 10);
const slopeMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
const slopeMesh = new THREE.Mesh(slopeGeometry, slopeMaterial);
slopeMesh.rotation.x = -Math.PI / 4;
slopeMesh.position.set(-15, 2.5, 0);
scene.add(slopeMesh);

// 坂道（物理）
const slopeBody = new CANNON.Body({
  shape: new CANNON.Plane(),
  type: CANNON.Body.STATIC
});
slopeBody.quaternion.setFromEuler(-Math.PI / 4, 0, 0);
slopeBody.position.set(-15, 2.5, 0);
world.addBody(slopeBody);

// 障害物：壁（表示）
const wallGeometry = new THREE.BoxGeometry(1, 5, 10);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
wallMesh.position.set(5, 2.5, 0);
scene.add(wallMesh);

// 壁（物理）
const wallBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(0.5, 2.5, 5)),
  type: CANNON.Body.STATIC,
  position: new CANNON.Vec3(5, 2.5, 0)
});
world.addBody(wallBody);

// プレイヤー初期化
const playerConfigs = [
  { name: "プレイヤー1", color: 0xff4444, start: [-5, 5, 0] },
  { name: "プレイヤー2", color: 0x4444ff, start: [5, 5, 0] }
];

const players = playerConfigs.map((config) => {
  const body = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(1),
    position: new CANNON.Vec3(...config.start)
  });
  world.addBody(body);

  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: config.color });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  return {
    name: config.name,
    color: config.color,
    ballBody: body,
    ballMesh: mesh,
    shotCount: 0,
    score: [],
    goalReached: false
  };
});

// 操作セットアップ
setupControl(renderer.domElement, players, camera);

// ゴール判定
function checkGoals() {
  players.forEach((player) => {
    if (player.goalReached) return;

    const dx = player.ballBody.position.x - cupMesh.position.x;
    const dz = player.ballBody.position.z - cupMesh.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 1.2 && player.ballBody.position.y < 1) {
      console.log(`${player.name} ゴール！`);
      player.goalReached = true;
      player.score.push(player.shotCount);
    }
  });
}

// アニメーション
function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  players.forEach((player) => {
    player.ballMesh.position.copy(player.ballBody.position);
    player.ballMesh.quaternion.copy
