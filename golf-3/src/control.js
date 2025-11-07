export function setupControl(canvas, ballBody) {
  let isDragging = false;
  let start = null;

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    start = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    isDragging = true;
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const end = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const dx = start.x - end.x;
    const dy = start.y - end.y;

    const forceScale = 0.02; // 調整用係数（3D用に少し大きめ）
    const force = {
      x: dx * forceScale,
      y: 0,
      z: dy * forceScale
    };

    ballBody.applyForce(
      new CANNON.Vec3(force.x, force.y, force.z),
      ballBody.position
    );

    isDragging = false;
  });
}
