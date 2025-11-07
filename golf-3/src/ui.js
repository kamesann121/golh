export function updateScoreUI(gameState) {
  const scoreDiv = document.getElementById('scoreBoard');
  const scoreText = gameState.score
    .map((s, i) => `ラウンド ${i + 1}: ${s} 打`)
    .join('<br>');
  const current = `現在のラウンド: ${gameState.currentRound}<br>打数: ${gameState.shotCount}`;
  scoreDiv.innerHTML = current + '<br><br>' + scoreText;
}
