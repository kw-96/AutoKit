/**
 * talk-to-figma-mcp 安装脚本
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}开始安装 talk-to-figma-mcp...${colors.reset}`);

// 检查是否已安装 bun
try {
  console.log(`${colors.yellow}检查 bun 是否已安装...${colors.reset}`);
  execSync('bun -v', { stdio: 'ignore' });
  console.log(`${colors.green}bun 已安装${colors.reset}`);
} catch (error) {
  console.log(`${colors.yellow}未检测到 bun，开始安装...${colors.reset}`);
  
  try {
    if (process.platform === 'win32') {
      console.log(`${colors.yellow}Windows 系统，使用 PowerShell 安装 bun...${colors.reset}`);
      execSync('powershell -Command "irm bun.sh/install.ps1 | iex"', { stdio: 'inherit' });
    } else {
      console.log(`${colors.yellow}Unix/Linux/MacOS 系统，使用 curl 安装 bun...${colors.reset}`);
      execSync('curl -fsSL https://bun.sh/install | bash', { stdio: 'inherit' });
    }
    console.log(`${colors.green}bun 安装成功${colors.reset}`);
  } catch (installError) {
    console.error(`${colors.red}bun 安装失败: ${installError.message}${colors.reset}`);
    console.log(`${colors.yellow}请访问 https://bun.sh 手动安装 bun${colors.reset}`);
    process.exit(1);
  }
}

// 创建临时目录
const tempDir = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 检查并删除已存在的仓库目录
const repoDir = path.join(tempDir, 'cursor-talk-to-figma-mcp');
if (fs.existsSync(repoDir)) {
  console.log(`${colors.yellow}删除已存在的仓库目录...${colors.reset}`);
  try {
    // 递归删除目录
    fs.rmSync(repoDir, { recursive: true, force: true });
    console.log(`${colors.green}已删除旧仓库目录${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}删除旧仓库目录失败: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// 克隆 talk-to-figma-mcp 仓库
console.log(`${colors.yellow}克隆 talk-to-figma-mcp 仓库...${colors.reset}`);
try {
  execSync('git clone https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp.git', 
    { cwd: tempDir, stdio: 'inherit' });
  console.log(`${colors.green}仓库克隆成功${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}仓库克隆失败: ${error.message}${colors.reset}`);
  process.exit(1);
}

// 安装依赖
console.log(`${colors.yellow}安装依赖...${colors.reset}`);
try {
  execSync('bun install', { cwd: repoDir, stdio: 'inherit' });
  console.log(`${colors.green}依赖安装成功${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}依赖安装失败: ${error.message}${colors.reset}`);
  process.exit(1);
}

// 运行 setup 命令
console.log(`${colors.yellow}运行 setup 命令...${colors.reset}`);
try {
  execSync('bun setup', { cwd: repoDir, stdio: 'inherit' });
  console.log(`${colors.green}setup 命令执行成功${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}setup 命令执行失败: ${error.message}${colors.reset}`);
}

// 复制必要文件到项目
console.log(`${colors.yellow}复制必要文件到项目...${colors.reset}`);
const figmaMcpDir = path.join(__dirname, '..', 'backend', 'src', 'figmaMCP');
if (!fs.existsSync(figmaMcpDir)) {
  fs.mkdirSync(figmaMcpDir, { recursive: true });
}

// 复制源码文件
try {
  const srcDir = path.join(repoDir, 'src', 'talk_to_figma_mcp');
  const destDir = path.join(figmaMcpDir, 'talk_to_figma_mcp');
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  copyDirectory(srcDir, destDir);
  console.log(`${colors.green}源码文件复制成功${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}源码文件复制失败: ${error.message}${colors.reset}`);
}

// 复制Figma插件
try {
  const pluginSrcDir = path.join(repoDir, 'src', 'cursor_mcp_plugin');
  const pluginDestDir = path.join(__dirname, '..', 'figma_plugin');
  
  if (!fs.existsSync(pluginDestDir)) {
    fs.mkdirSync(pluginDestDir, { recursive: true });
  }
  
  copyDirectory(pluginSrcDir, pluginDestDir);
  console.log(`${colors.green}Figma插件复制成功${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Figma插件复制失败: ${error.message}${colors.reset}`);
}

// 复制WebSocket服务器
try {
  const socketSrc = path.join(repoDir, 'src', 'socket.ts');
  const socketDest = path.join(figmaMcpDir, 'socket.ts');
  fs.copyFileSync(socketSrc, socketDest);
  console.log(`${colors.green}WebSocket服务器复制成功${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}WebSocket服务器复制失败: ${error.message}${colors.reset}`);
}

// 创建MCP配置文件
const mcpConfigPath = path.join(os.homedir(), '.cursor', 'mcp.json');
try {
  let mcpConfig = {};
  
  if (fs.existsSync(mcpConfigPath)) {
    const configContent = fs.readFileSync(mcpConfigPath, 'utf8');
    mcpConfig = JSON.parse(configContent);
  }
  
  if (!mcpConfig.mcpServers) {
    mcpConfig.mcpServers = {};
  }
  
  // 使用英文路径避免编码问题
  const serverPath = path.join(process.cwd(), 'backend', 'src', 'figmaMCP', 'talk_to_figma_mcp', 'server.ts')
    .replace(/[\u4e00-\u9fa5]/g, ''); // 移除中文字符
  
  mcpConfig.mcpServers.TalkToFigma = {
    command: 'bun',
    args: ['run', serverPath]
  };
  
  // 确保目录存在
  const mcpDir = path.dirname(mcpConfigPath);
  if (!fs.existsSync(mcpDir)) {
    fs.mkdirSync(mcpDir, { recursive: true });
  }
  
  fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
  console.log(`${colors.green}MCP配置文件创建成功${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}MCP配置文件创建失败: ${error.message}${colors.reset}`);
}

// 添加启动脚本到package.json
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  let packageJson = {};
  
  if (fs.existsSync(packageJsonPath)) {
    const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    packageJson = JSON.parse(packageContent);
  }
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts['start-figma-socket'] = 'bun run backend/src/figmaMCP/socket.ts';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`${colors.green}启动脚本添加成功${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}启动脚本添加失败: ${error.message}${colors.reset}`);
}

console.log(`${colors.green}talk-to-figma-mcp 安装完成!${colors.reset}`);
console.log(`${colors.yellow}
使用说明:
1. 启动WebSocket服务器: npm run start-figma-socket
2. 在Figma中安装插件: 打开Figma > 插件 > 开发 > 新建插件 > 链接现有插件 > 选择 ${path.join(__dirname, '..', 'figma_plugin', 'manifest.json')}
3. 在AutoKit项目中使用FigmaMCP API与Figma交互
${colors.reset}`);

// 辅助函数：复制目录
function copyDirectory(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
} 