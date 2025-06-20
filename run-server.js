const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Vite development server...');

const viteProcess = spawn('node', [
  path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js'),
  '--port', '8080',
  '--host', '0.0.0.0'
], {
  stdio: 'inherit',
  shell: true
});

viteProcess.on('error', (error) => {
  console.error('❌ Error starting server:', error);
});

viteProcess.on('close', (code) => {
  console.log(`🔄 Server process exited with code ${code}`);
});

console.log('✅ Server starting... Check http://localhost:8080');
