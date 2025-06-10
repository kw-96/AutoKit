/**
 * 一键启动所有服务的脚本
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const net = require('net');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 服务端口配置
const PORTS = {
  backend: 3001,
  frontend: 5173,
  websocket: 3055
};

console.log(`${colors.blue}正在启动所有服务...${colors.reset}`);

// 项目根目录
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

/**
 * 检查端口是否被占用
 * @param {number} port 要检查的端口
 * @returns {Promise<boolean>} 端口是否被占用
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        // 端口被占用
        resolve(true);
      })
      .once('listening', () => {
        // 端口可用
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

/**
 * 释放被占用的端口
 * @param {number} port 要释放的端口
 */
async function freePort(port) {
  try {
    console.log(`${colors.yellow}正在释放端口 ${port}...${colors.reset}`);
    
    if (process.platform === 'win32') {
      // Windows平台
      const findCommand = `netstat -ano | findstr :${port}`;
      const result = execSync(findCommand, { encoding: 'utf8' });
      
      if (result) {
        const lines = result.split('\n').filter(line => line.includes(`${port}`));
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parts[4];
            try {
              execSync(`taskkill /F /PID ${pid}`);
              console.log(`${colors.green}已终止进程 PID: ${pid}${colors.reset}`);
            } catch (err) {
              console.error(`${colors.red}无法终止进程 PID: ${pid} - ${err.message}${colors.reset}`);
            }
          }
        }
      }
    } else {
      // Linux/macOS平台
      const findCommand = `lsof -i :${port} -t`;
      try {
        const pids = execSync(findCommand, { encoding: 'utf8' }).trim().split('\n');
        
        for (const pid of pids) {
          if (pid) {
            try {
              execSync(`kill -9 ${pid}`);
              console.log(`${colors.green}已终止进程 PID: ${pid}${colors.reset}`);
            } catch (err) {
              console.error(`${colors.red}无法终止进程 PID: ${pid} - ${err.message}${colors.reset}`);
            }
          }
        }
      } catch (err) {
        // 如果没有找到进程，lsof会返回非零退出码
        console.log(`${colors.yellow}没有找到占用端口 ${port} 的进程${colors.reset}`);
      }
    }
    
    // 等待端口释放
    let attempts = 0;
    while (await isPortInUse(port) && attempts < 5) {
      console.log(`${colors.yellow}等待端口 ${port} 释放...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (await isPortInUse(port)) {
      console.error(`${colors.red}无法释放端口 ${port}，请手动关闭占用该端口的进程${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.green}端口 ${port} 已释放${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}释放端口 ${port} 时出错: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * 启动服务
 */
async function startServices() {
  // 检查并释放后端端口
  if (await isPortInUse(PORTS.backend)) {
    if (!await freePort(PORTS.backend)) {
      console.error(`${colors.red}无法释放后端端口 ${PORTS.backend}，启动失败${colors.reset}`);
      process.exit(1);
    }
  }
  
  // 检查并释放前端端口
  if (await isPortInUse(PORTS.frontend)) {
    if (!await freePort(PORTS.frontend)) {
      console.error(`${colors.red}无法释放前端端口 ${PORTS.frontend}，启动失败${colors.reset}`);
      process.exit(1);
    }
  }
  
  // 检查并释放WebSocket端口
  if (await isPortInUse(PORTS.websocket)) {
    if (!await freePort(PORTS.websocket)) {
      console.error(`${colors.red}无法释放WebSocket端口 ${PORTS.websocket}，启动失败${colors.reset}`);
      process.exit(1);
    }
  }
  
  // 启动后端服务
  console.log(`${colors.yellow}启动后端服务 (端口: ${PORTS.backend})...${colors.reset}`);
  const backendProcess = spawn('npx', ['cross-env', 'USE_MEMORY_DB=true', 'ts-node', 'src/index.ts'], {
    cwd: backendDir,
    shell: true,
    stdio: 'pipe',
    env: { ...process.env, PORT: PORTS.backend, FIGMA_SOCKET_PORT: PORTS.websocket, NODE_OPTIONS: '--no-deprecation' }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`${colors.green}[后端] ${data.toString().trim()}${colors.reset}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`${colors.red}[后端错误] ${data.toString().trim()}${colors.reset}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`${colors.yellow}后端服务已退出，退出码: ${code}${colors.reset}`);
  });

  // 启动前端服务
  console.log(`${colors.yellow}启动前端服务 (端口: ${PORTS.frontend})...${colors.reset}`);
  const frontendProcess = spawn('npx', ['vite', '--port', PORTS.frontend], {
    cwd: frontendDir,
    shell: true,
    stdio: 'pipe',
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation' }
  });

  frontendProcess.stdout.on('data', (data) => {
    console.log(`${colors.magenta}[前端] ${data.toString().trim()}${colors.reset}`);
  });

  frontendProcess.stderr.on('data', (data) => {
    console.error(`${colors.red}[前端错误] ${data.toString().trim()}${colors.reset}`);
  });

  frontendProcess.on('close', (code) => {
    console.log(`${colors.yellow}前端服务已退出，退出码: ${code}${colors.reset}`);
  });

  // 处理进程退出
  process.on('SIGINT', () => {
    console.log(`${colors.yellow}正在关闭所有服务...${colors.reset}`);
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  });
}

// 启动所有服务
startServices(); 