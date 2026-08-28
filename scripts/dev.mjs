// server と client をまとめて起動する。依存パッケージは追加せず child_process だけで動かす。
import { spawn, spawnSync } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const COLORS = { server: '\x1b[36m', client: '\x1b[35m', warn: '\x1b[33m', reset: '\x1b[0m' };

const prefixed = (name, color) => (chunk) => {
  chunk.toString().split(/\r?\n/).filter(Boolean).forEach((line) => {
    console.log(`${color}[${name}]${COLORS.reset} ${line}`);
  });
};

// MongoDB が起動しているかを先に確認する（未起動だとサーバーが待ち受けを開始しない）
const isMongoUp = () => new Promise((resolve) => {
  const socket = net.connect({ port: 27017, host: '127.0.0.1' });
  const done = (result) => { socket.destroy(); resolve(result); };
  socket.setTimeout(1500);
  socket.on('connect', () => done(true));
  socket.on('error', () => done(false));
  socket.on('timeout', () => done(false));
});

const start = (name, color) => {
  // name は 'server' / 'client' の固定値。shell:true では引数配列ではなく
  // コマンド文字列で渡す（DEP0190 の警告を避けるため）。
  const child = spawn(`npm run dev --prefix ${name}`, {
    cwd: root,
    shell: true,
    env: process.env,
  });
  child.stdout.on('data', prefixed(name, color));
  child.stderr.on('data', prefixed(name, color));
  child.on('exit', (code) => {
    console.log(`${color}[${name}]${COLORS.reset} 終了しました (code ${code})`);
  });
  return child;
};

const main = async () => {
  if (!(await isMongoUp())) {
    console.log(`${COLORS.warn}[!]${COLORS.reset} MongoDB (127.0.0.1:27017) に接続できません。`);
    console.log(`${COLORS.warn}[!]${COLORS.reset} 管理者権限の PowerShell で次を実行してください: Start-Service MongoDB`);
    console.log(`${COLORS.warn}[!]${COLORS.reset} 起動後、初回のみ  npm run seed  で初期データを投入してください。`);
    console.log(`${COLORS.warn}[!]${COLORS.reset} （このまま続行します。画面はサンプルデータ表示になります）\n`);
  }

  const children = [start('server', COLORS.server), start('client', COLORS.client)];

  // Windows では child.kill() が孫プロセス（vite / nodemon）を残すため、
  // プロセスツリーごと終了させる。
  const killTree = (child) => {
    if (child.killed || child.pid == null) return;
    if (process.platform === 'win32') {
      // 終了直前に呼ぶため、完了を待つ同期版を使う
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill();
    }
  };

  const shutdown = () => {
    children.forEach(killTree);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

main();
