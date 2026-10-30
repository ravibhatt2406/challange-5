// Runs the repository's required quality gates in a consistent order.
import { spawnSync } from 'node:child_process';

const commands = [
  ['npm', ['run', 'type-check']],
  ['npm', ['run', 'lint']],
  ['npm', ['test']],
  ['npm', ['run', 'build']],
];

for (const [command, args] of commands) {
  const result = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', [command, ...args].join(' ')], { stdio: 'inherit' })
    : spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
