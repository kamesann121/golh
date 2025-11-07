export function setupControl(canvas, players, camera) {
  let isDragging = false;
  let start = null;
  let targetPlayer = null;

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    start = { x, y };
    isDragging = true;

    const mouse = new THREE.Vector2(
      (x / canvas.width) * 2 - 1,
      -(y / canvas.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const meshes = players.map(p => p.ballMesh);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      targetPlayer = players.find(p => p.ballMesh === mesh);
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!isDragging || !targetPlayer || targetPlayer.goalReached) return;

    const rect = canvas.getBoundingClientRect();
    const end = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const dx = start.x - end.x;
    const dy = start.y - end.y;

    const forceScale = 0.02;
    const force = {
      x: dx * forceScale,
      y: 0,
      z: dy * forceScale
    };

    targetPlayer.ballBody.applyForce(
      new CANNON.Vec3(force.x, force.y, force.z),
      targetPlayer.ballBody.position
    );

    targetPlayer.shotCount++;
    isDragging = false;
    targetPlayer = null;
  });
}
