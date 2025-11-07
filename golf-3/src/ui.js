export function updateScoreUI(players) {
  const scoreDiv = document.getElementById('scoreBoard');
  scoreDiv.innerHTML = players.map(p => {
    const scoreText = p.score.map((s, i) => `R${i + 1}: ${s}打`).join(', ');
    return `${p.name}<br>打数: ${p.shotCount}<br>スコア: ${scoreText}<br><br>`;
  }).join('');
}
