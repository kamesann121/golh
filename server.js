// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 現在のファイルの場所を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// public フォルダの絶対パスを指定（golf-3/public）
const publicDir = path.join(__dirname, 'golf-3', 'public');

const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイルを配信
app.use(express.static(publicDir));

// すべてのルートで index.html を返す（SPA対応）
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// サーバ起動
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
