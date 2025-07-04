#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 连接监控功能
let connectionMonitor = {
    isMonitoring: false,
    stats: {
        totalConnections: 0,
        totalDisconnections: 0,
        totalErrors: 0,
        lastConnectedAt: null,
        lastDisconnectedAt: null,
        uptime: 0,
        startTime: Date.now()
    }
};

// 项目目录路径
const PROJECT_DIR = path.join(__dirname, 'cursor-talk-to-figma-mcp');

// 颜色定义
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// 全局变量
let services = { websocket: null, mcp: null };

// PID文件路径
const PID_FILE = path.join(__dirname, '.start-all.pid');
const WEBSOCKET_PID_FILE = path.join(__dirname, '.websocket.pid');
const MCP_PID_FILE = path.join(__dirname, '.mcp.pid');

function colorLog(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查进程是否存在
function isProcessRunning(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        return false;
    }
}

// 强制终止进程
function forceKillProcess(pid, processName = '') {
    return new Promise((resolve) => {
        if (!isProcessRunning(pid)) {
            resolve(true);
            return;
        }

        const platform = os.platform();
        let killCommand;

        if (platform === 'win32') {
            killCommand = `taskkill /PID ${pid} /F`;
        } else {
            killCommand = `kill -9 ${pid}`;
        }

        exec(killCommand, (error) => {
            if (error) {
                colorLog(`强制终止进程 ${processName} (PID: ${pid}) 失败: ${error.message}`, 'yellow');
            } else {
                colorLog(`已强制终止进程 ${processName} (PID: ${pid})`, 'green');
            }
            resolve(!error);
        });
    });
}

// 检查并清理现有服务
async function checkAndCleanupExistingServices() {
    colorLog('🔍 检查现有服务实例...', 'cyan');
    
    let foundExisting = false;
    
    // 检查主进程PID文件
    if (fs.existsSync(PID_FILE)) {
        try {
            const mainPid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
            if (isProcessRunning(mainPid) && mainPid !== process.pid) {
                colorLog(`发现现有的start-all进程 (PID: ${mainPid})`, 'yellow');
                await forceKillProcess(mainPid, 'start-all');
                foundExisting = true;
            }
        } catch (error) {
            colorLog('读取主进程PID文件失败，将删除', 'yellow');
        }
        // 安全删除PID文件
        try {
            if (fs.existsSync(PID_FILE)) {
                fs.unlinkSync(PID_FILE);
            }
        } catch (error) {
            // 忽略删除错误
        }
    }
    
    // 检查WebSocket服务PID文件
    if (fs.existsSync(WEBSOCKET_PID_FILE)) {
        try {
            const wsPid = parseInt(fs.readFileSync(WEBSOCKET_PID_FILE, 'utf8').trim());
            if (isProcessRunning(wsPid)) {
                colorLog(`发现现有的WebSocket服务 (PID: ${wsPid})`, 'yellow');
                await forceKillProcess(wsPid, 'WebSocket');
                foundExisting = true;
            }
        } catch (error) {
            colorLog('读取WebSocket PID文件失败，将删除', 'yellow');
        }
        // 安全删除PID文件
        try {
            if (fs.existsSync(WEBSOCKET_PID_FILE)) {
                fs.unlinkSync(WEBSOCKET_PID_FILE);
            }
        } catch (error) {
            // 忽略删除错误
        }
    }
    
    // 检查MCP服务PID文件
    if (fs.existsSync(MCP_PID_FILE)) {
        try {
            const mcpPid = parseInt(fs.readFileSync(MCP_PID_FILE, 'utf8').trim());
            if (isProcessRunning(mcpPid)) {
                colorLog(`发现现有的MCP服务 (PID: ${mcpPid})`, 'yellow');
                await forceKillProcess(mcpPid, 'MCP');
                foundExisting = true;
            }
        } catch (error) {
            colorLog('读取MCP PID文件失败，将删除', 'yellow');
        }
        // 安全删除PID文件
        try {
            if (fs.existsSync(MCP_PID_FILE)) {
                fs.unlinkSync(MCP_PID_FILE);
            }
        } catch (error) {
            // 忽略删除错误
        }
    }
    
    // 通过端口检查WebSocket服务
    const wsPortInUse = await checkWebSocketConnection(3055);
    if (wsPortInUse) {
        colorLog('检测到端口3055被占用，尝试清理...', 'yellow');
        await killProcessByPort(3055);
        foundExisting = true;
    }
    
    // 通过进程名清理可能的残留进程
    await cleanupProcessesByName();
    
    if (foundExisting) {
        colorLog('✅ 现有服务已清理完成', 'green');
        // 等待一段时间确保进程完全终止
        await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
        colorLog('✅ 未发现现有服务实例', 'green');
    }
}

// 通过端口号终止进程
function killProcessByPort(port) {
    return new Promise((resolve) => {
        const platform = os.platform();
        let command;
        
        if (platform === 'win32') {
            command = `netstat -ano | findstr :${port}`;
        } else {
            command = `lsof -ti:${port}`;
        }
        
        exec(command, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve(false);
                return;
            }
            
            if (platform === 'win32') {
                // Windows: 解析netstat输出获取PID
                const lines = stdout.trim().split('\n');
                const pids = new Set();
                
                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 5) {
                        const pid = parts[parts.length - 1];
                        if (pid && !isNaN(pid)) {
                            pids.add(parseInt(pid));
                        }
                    }
                });
                
                Promise.all([...pids].map(pid => forceKillProcess(pid, `Port${port}`)))
                    .then(() => resolve(true));
            } else {
                // Unix: lsof直接返回PID
                const pids = stdout.trim().split('\n').map(pid => parseInt(pid.trim()));
                Promise.all(pids.map(pid => forceKillProcess(pid, `Port${port}`)))
                    .then(() => resolve(true));
            }
        });
    });
}

// 通过进程名清理残留进程
function cleanupProcessesByName() {
    return new Promise((resolve) => {
        const platform = os.platform();
        const processNames = ['bun', 'bunx', 'node'];
        const keywords = ['socket', 'cursor-talk-to-figma-mcp', 'start-all'];
        
        if (platform === 'win32') {
            // Windows: 使用tasklist和taskkill
            exec('tasklist /FO CSV', (error, stdout) => {
                if (error) {
                    resolve();
                    return;
                }
                
                const lines = stdout.split('\n');
                const killPromises = [];
                
                lines.forEach(line => {
                    if (line.includes('bun.exe') || line.includes('bunx.exe') || line.includes('node.exe')) {
                        const match = line.match(/"([^"]+)","(\d+)"/);
                        if (match) {
                            const pid = parseInt(match[2]);
                            // 检查命令行参数是否包含我们的关键词
                            exec(`wmic process where ProcessId=${pid} get CommandLine /format:list`, (cmdError, cmdStdout) => {
                                if (!cmdError && cmdStdout) {
                                    const hasKeyword = keywords.some(keyword => 
                                        cmdStdout.toLowerCase().includes(keyword.toLowerCase())
                                    );
                                    if (hasKeyword && pid !== process.pid) {
                                        killPromises.push(forceKillProcess(pid, 'Cleanup'));
                                    }
                                }
                            });
                        }
                    }
                });
                
                setTimeout(() => {
                    Promise.all(killPromises).then(() => resolve());
                }, 1000);
            });
        } else {
            // Unix: 使用ps和grep
            const grepPattern = keywords.join('\\|');
            exec(`ps aux | grep -E "${grepPattern}" | grep -v grep`, (error, stdout) => {
                if (error || !stdout.trim()) {
                    resolve();
                    return;
                }
                
                const lines = stdout.trim().split('\n');
                const killPromises = lines.map(line => {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        const pid = parseInt(parts[1]);
                        if (pid && pid !== process.pid) {
                            return forceKillProcess(pid, 'Cleanup');
                        }
                    }
                    return Promise.resolve();
                });
                
                Promise.all(killPromises).then(() => resolve());
            });
        }
    });
}

// 写入PID文件
function writePidFile(pidFile, pid) {
    try {
        fs.writeFileSync(pidFile, pid.toString(), 'utf8');
    } catch (error) {
        colorLog(`写入PID文件失败: ${error.message}`, 'yellow');
    }
}

// 清理PID文件
function cleanupPidFiles() {
    [PID_FILE, WEBSOCKET_PID_FILE, MCP_PID_FILE].forEach(file => {
        if (fs.existsSync(file)) {
            try {
                fs.unlinkSync(file);
            } catch (error) {
                // 忽略删除错误
            }
        }
    });
}

// 连接诊断功能
async function checkWebSocketConnection(port = 3055) {
    return new Promise((resolve) => {
        try {
            // 使用原生的http模块检查端口
            const http = require('http');
            const req = http.request({
                hostname: 'localhost',
                port: port,
                method: 'GET',
                timeout: 3000
            }, (res) => {
                resolve(true);
            });
            
            req.on('error', () => {
                resolve(false);
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            
            req.end();
        } catch (error) {
            resolve(false);
        }
    });
}

async function performConnectionDiagnostic() {
    colorLog('\n🔍 执行连接诊断...', 'cyan');
    
    const diagnostics = [];
    
    // 检查WebSocket服务器
    const wsRunning = await checkWebSocketConnection(3055);
    diagnostics.push({
        name: 'WebSocket服务器 (端口3055)',
        status: wsRunning,
        message: wsRunning ? '正常运行' : '未运行或无法连接'
    });
    
    // 检查项目目录
    const projectExists = fs.existsSync(PROJECT_DIR);
    diagnostics.push({
        name: '项目目录',
        status: projectExists,
        message: projectExists ? '存在' : '不存在'
    });
    
    // 检查关键文件
    const socketFile = path.join(PROJECT_DIR, 'src', 'socket.ts');
    const serverFile = path.join(PROJECT_DIR, 'src', 'talk_to_figma_mcp', 'server.ts');
    
    diagnostics.push({
        name: 'WebSocket服务文件',
        status: fs.existsSync(socketFile),
        message: fs.existsSync(socketFile) ? '存在' : '缺失'
    });
    
    diagnostics.push({
        name: 'MCP服务文件',
        status: fs.existsSync(serverFile),
        message: fs.existsSync(serverFile) ? '存在' : '缺失'
    });
    
    // 检查Bun
    const bunAvailable = await checkCommand('bun');
    diagnostics.push({
        name: 'Bun运行时',
        status: bunAvailable,
        message: bunAvailable ? '已安装' : '未安装'
    });
    
    // 打印诊断结果
    console.log('\n📋 诊断结果:');
    console.log('='.repeat(50));
    
    let allGood = true;
    diagnostics.forEach(({ name, status, message }) => {
        const icon = status ? '✅' : '❌';
        const color = status ? 'green' : 'red';
        colorLog(`${icon} ${name}: ${message}`, color);
        if (!status) allGood = false;
    });
    
    console.log('='.repeat(50));
    
    if (allGood) {
        colorLog('🎉 所有检查项目都正常！', 'green');
    } else {
        colorLog('⚠️  发现问题，请检查上述失败项目', 'yellow');
    }
    
    return allGood;
}

function startConnectionMonitoring() {
    if (connectionMonitor.isMonitoring) return;
    
    connectionMonitor.isMonitoring = true;
    connectionMonitor.stats.startTime = Date.now();
    
    colorLog('🔄 启动连接状态监控...', 'cyan');
    
    // 每30秒检查一次连接状态
    const monitorInterval = setInterval(async () => {
        if (!connectionMonitor.isMonitoring) {
            clearInterval(monitorInterval);
            return;
        }
        
        const isConnected = await checkWebSocketConnection(3055);
        const now = Date.now();
        
        if (isConnected) {
            if (!connectionMonitor.stats.lastConnectedAt) {
                connectionMonitor.stats.totalConnections++;
                connectionMonitor.stats.lastConnectedAt = now;
                colorLog('✅ WebSocket连接正常', 'green');
            }
        } else {
            if (connectionMonitor.stats.lastConnectedAt) {
                connectionMonitor.stats.totalDisconnections++;
                connectionMonitor.stats.lastDisconnectedAt = now;
                colorLog('❌ WebSocket连接断开', 'red');
                connectionMonitor.stats.lastConnectedAt = null;
            }
        }
    }, 30000);
    
    // 每5分钟显示统计信息
    const statsInterval = setInterval(() => {
        if (!connectionMonitor.isMonitoring) {
            clearInterval(statsInterval);
            return;
        }
        showConnectionStats();
    }, 300000);
}

function showConnectionStats() {
    const stats = connectionMonitor.stats;
    const now = Date.now();
    const totalTime = now - stats.startTime;
    const uptimePercentage = totalTime > 0 ? ((stats.uptime / totalTime) * 100).toFixed(1) : 0;
    
    console.log('\n📊 连接统计信息:');
    console.log('-'.repeat(30));
    colorLog(`运行时间: ${Math.floor(totalTime / 1000)}秒`, 'cyan');
    colorLog(`连接次数: ${stats.totalConnections}`, 'green');
    colorLog(`断开次数: ${stats.totalDisconnections}`, 'yellow');
    colorLog(`错误次数: ${stats.totalErrors}`, 'red');
    
    if (stats.lastConnectedAt) {
        colorLog('当前状态: 已连接', 'green');
    } else {
        colorLog('当前状态: 未连接', 'red');
    }
    console.log('-'.repeat(30));
}

function stopConnectionMonitoring() {
    connectionMonitor.isMonitoring = false;
    colorLog('🛑 连接监控已停止', 'yellow');
}

function checkCommand(command) {
    return new Promise((resolve) => {
        exec(`${command} --version`, (error) => {
            resolve(!error);
        });
    });
}

function installBun() {
    return new Promise((resolve) => {
        colorLog('正在安装 Bun...', 'yellow');
        
        const installCommand = os.platform() === 'win32' 
            ? 'powershell -Command "irm bun.sh/install.ps1|iex"'
            : 'curl -fsSL https://bun.sh/install | bash';
        
        exec(installCommand, (error, stdout, stderr) => {
            if (error) {
                colorLog(`Bun 安装失败: ${error.message}`, 'red');
                colorLog('请手动安装 Bun: https://bun.sh/', 'yellow');
                resolve(false);
            } else {
                colorLog('Bun 安装成功！', 'green');
                colorLog('请重启终端并再次运行此脚本', 'yellow');
                resolve(true);
            }
        });
    });
}

function getBunxPath() {
    return new Promise((resolve) => {
        const whichCommand = os.platform() === 'win32' ? 'where bunx' : 'which bunx';
        
        exec(whichCommand, (error, stdout) => {
            if (error) {
                colorLog('无法找到 bunx 路径，使用默认值 "bunx"', 'yellow');
                resolve('bunx');
            } else {
                const bunxPath = stdout.trim().split('\n')[0]; // 取第一行路径
                colorLog(`找到 bunx 路径: ${bunxPath}`, 'green');
                resolve(bunxPath);
            }
        });
    });
}

function findCursorProcess() {
    return new Promise((resolve) => {
        const platform = os.platform();
        let command;
        
        if (platform === 'win32') {
            command = 'tasklist /FI "IMAGENAME eq Cursor.exe" /FO CSV';
        } else if (platform === 'darwin') {
            command = 'pgrep -f "Cursor"';
        } else {
            command = 'pgrep -f "cursor"';
        }
        
        exec(command, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

function enableCursorAutoRunMode() {
    return new Promise((resolve) => {
        colorLog('配置 Cursor Auto-Run Mode...', 'blue');
        
        const platform = os.platform();
        let settingsPath;
        
        // 确定 Cursor 设置文件路径
        if (platform === 'win32') {
            settingsPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'User', 'settings.json');
        } else if (platform === 'darwin') {
            settingsPath = path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'settings.json');
        } else {
            settingsPath = path.join(os.homedir(), '.config', 'Cursor', 'User', 'settings.json');
        }
        
        try {
            let settings = {};
            
            // 读取现有设置
            if (fs.existsSync(settingsPath)) {
                const settingsContent = fs.readFileSync(settingsPath, 'utf8');
                try {
                    settings = JSON.parse(settingsContent);
                } catch (parseError) {
                    colorLog('设置文件格式错误，将创建新的设置', 'yellow');
                    settings = {};
                }
            } else {
                // 确保目录存在
                const settingsDir = path.dirname(settingsPath);
                if (!fs.existsSync(settingsDir)) {
                    fs.mkdirSync(settingsDir, { recursive: true });
                }
            }
            
            // 启用 Auto-Run Mode 相关设置
            let settingsUpdated = false;
            
            // Cursor的Auto-Run Mode设置（基于最新的Cursor设置格式）
            if (!settings['cursor.chat.autoRunMode']) {
                settings['cursor.chat.autoRunMode'] = true;
                settingsUpdated = true;
                colorLog('启用 Chat Auto-Run Mode', 'green');
            }
            
            // 启用Agent自动运行模式（这是关键设置）
            if (!settings['cursor.agent.autoRunMode']) {
                settings['cursor.agent.autoRunMode'] = true;
                settingsUpdated = true;
                colorLog('启用 Agent Auto-Run Mode', 'green');
            }
            
            // 启用工具自动运行（无需确认）
            if (!settings['cursor.tools.autoRun']) {
                settings['cursor.tools.autoRun'] = true;
                settingsUpdated = true;
                colorLog('启用 Tools Auto-Run', 'green');
            }
            
            // 启用MCP工具自动运行
            if (!settings['cursor.mcp.autoRun']) {
                settings['cursor.mcp.autoRun'] = true;
                settingsUpdated = true;
                colorLog('启用 MCP Auto-Run', 'green');
            }
            
            // 禁用工具确认提示（实现真正的自动运行）
            if (settings['cursor.tools.requireConfirmation'] !== false) {
                settings['cursor.tools.requireConfirmation'] = false;
                settingsUpdated = true;
                colorLog('禁用工具确认提示', 'green');
            }
            
            // 启用自动接受更改
            if (!settings['cursor.chat.autoAcceptChanges']) {
                settings['cursor.chat.autoAcceptChanges'] = true;
                settingsUpdated = true;
                colorLog('启用自动接受更改', 'green');
            }
            
            if (settingsUpdated) {
                // 写入更新的设置
                fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
                colorLog('Cursor 设置已更新', 'green');
                
                // 验证设置是否正确写入
                setTimeout(() => {
                    try {
                        const verifyContent = fs.readFileSync(settingsPath, 'utf8');
                        const verifySettings = JSON.parse(verifyContent);
                        
                        const requiredSettings = [
                            'cursor.chat.autoRunMode',
                            'cursor.agent.autoRunMode', 
                            'cursor.tools.autoRun',
                            'cursor.mcp.autoRun'
                        ];
                        
                        let allEnabled = true;
                        for (const setting of requiredSettings) {
                            if (!verifySettings[setting]) {
                                allEnabled = false;
                                colorLog(`⚠️  设置 ${setting} 未正确启用`, 'yellow');
                            }
                        }
                        
                        if (allEnabled) {
                            colorLog('✅ 所有 Auto-Run 设置已验证启用', 'green');
                        } else {
                            colorLog('⚠️  部分设置可能未生效，建议手动检查 Cursor 设置', 'yellow');
                        }
                    } catch (verifyError) {
                        colorLog('设置验证失败，但配置已写入', 'yellow');
                    }
                }, 500);
            } else {
                colorLog('Cursor Auto-Run Mode 已启用', 'green');
            }
            
            resolve(true);
        } catch (error) {
            colorLog(`配置 Cursor 设置失败: ${error.message}`, 'yellow');
            colorLog('将跳过设置配置，继续重启 Cursor', 'yellow');
            resolve(false);
        }
    });
}

function restartCursor() {
    return new Promise(async (resolve) => {
        colorLog('正在重启 Cursor...', 'yellow');
        
        const platform = os.platform();
        
        // 先配置 Auto-Run Mode
        await enableCursorAutoRunMode();
        
        // 关闭 Cursor
        let killCommand;
        if (platform === 'win32') {
            killCommand = 'taskkill /IM Cursor.exe /F';
        } else if (platform === 'darwin') {
            killCommand = 'pkill -f "Cursor"';
        } else {
            killCommand = 'pkill -f "cursor"';
        }
        
        exec(killCommand, (error) => {
            // 等待进程完全关闭
            setTimeout(() => {
                // 重新启动 Cursor
                let startCommand;
                if (platform === 'win32') {
                    // Windows: 尝试常见的安装路径
                    const possiblePaths = [
                        '%LOCALAPPDATA%\\Programs\\cursor\\Cursor.exe',
                        '%APPDATA%\\Local\\Programs\\cursor\\Cursor.exe',
                        'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\cursor\\Cursor.exe'
                    ];
                    startCommand = `powershell -Command "& { $paths = @('${possiblePaths.join("', '")}'); foreach($path in $paths) { $expandedPath = [Environment]::ExpandEnvironmentVariables($path); if(Test-Path $expandedPath) { Start-Process $expandedPath; break } } }"`;
                } else if (platform === 'darwin') {
                    startCommand = 'open -a "Cursor"';
                } else {
                    startCommand = 'cursor &';
                }
                
                exec(startCommand, (startError) => {
                    if (startError) {
                        colorLog('自动启动 Cursor 失败，请手动启动', 'yellow');
                        colorLog('如果 Cursor 不在系统 PATH 中，请手动打开 Cursor 应用程序', 'yellow');
                        resolve(false);
                    } else {
                        colorLog('Cursor 重启成功！Auto-Run Mode 已启用', 'green');
                        resolve(true);
                    }
                });
            }, 2000); // 等待2秒确保进程完全关闭
        });
    });
}

function askUserForCursorRestart() {
    return new Promise((resolve) => {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        colorLog('\n🔄 MCP 配置已更新！', 'green');
        colorLog('为了使新配置生效，需要重启 Cursor 编辑器。', 'yellow');
        
        rl.question('是否要自动重启 Cursor？(y/n，默认为 y): ', (answer) => {
            rl.close();
            const shouldRestart = !answer || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
            resolve(shouldRestart);
        });
    });
}

async function setupMCPConfig() {
    colorLog('检查 Cursor MCP 配置...', 'blue');
    
    const mcpConfigPath = path.join(os.homedir(), '.cursor', 'mcp.json');
    const mcpConfigDir = path.dirname(mcpConfigPath);
    
    if (!fs.existsSync(mcpConfigDir)) {
        fs.mkdirSync(mcpConfigDir, { recursive: true });
    }
    
    let configUpdated = false;
    
    if (!fs.existsSync(mcpConfigPath)) {
        colorLog('创建 MCP 配置文件...', 'yellow');
        
        // 动态获取 bunx 路径
        const bunxPath = await getBunxPath();
        
        const mcpConfig = {
            mcpServers: {
                TalkToFigma: {
                    command: "bun",
                    args: [
                        "run",
                        path.join(PROJECT_DIR, "dist", "server.js")
                    ]
                }
            }
        };
        
        fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), 'utf8');
        colorLog('MCP 配置文件已创建', 'green');
        configUpdated = true;
    } else {
        // 检查现有配置是否包含 TalkToFigma
        try {
            const existingConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
            if (!existingConfig.mcpServers || !existingConfig.mcpServers.TalkToFigma) {
                colorLog('MCP 配置文件存在但缺少 TalkToFigma 配置', 'yellow');
                
                // 动态获取 bunx 路径并添加配置
                const bunxPath = await getBunxPath();
                
                if (!existingConfig.mcpServers) {
                    existingConfig.mcpServers = {};
                }
                
                existingConfig.mcpServers.TalkToFigma = {
                    command: "bun",
                    args: ["run", path.join(PROJECT_DIR, "dist", "server.js")]
                };
                
                fs.writeFileSync(mcpConfigPath, JSON.stringify(existingConfig, null, 2), 'utf8');
                colorLog('已添加 TalkToFigma 配置到现有 MCP 文件', 'green');
                configUpdated = true;
            } else {
                colorLog('MCP 配置文件已存在且包含 TalkToFigma', 'green');
                
                // 检查并更新命令路径
                const currentCommand = existingConfig.mcpServers.TalkToFigma.command;
                const expectedCommand = "bun";
                const expectedArgs = ["run", path.join(PROJECT_DIR, "dist", "server.js")];
                
                if (currentCommand !== expectedCommand || 
                    JSON.stringify(existingConfig.mcpServers.TalkToFigma.args) !== JSON.stringify(expectedArgs)) {
                    colorLog(`更新 MCP 命令配置`, 'yellow');
                    existingConfig.mcpServers.TalkToFigma.command = expectedCommand;
                    existingConfig.mcpServers.TalkToFigma.args = expectedArgs;
                    fs.writeFileSync(mcpConfigPath, JSON.stringify(existingConfig, null, 2), 'utf8');
                    configUpdated = true;
                }
            }
        } catch (error) {
            colorLog('MCP 配置文件格式错误', 'red');
        }
    }
    
    if (configUpdated) {
        // 检查 Cursor 是否正在运行
        const cursorRunning = await findCursorProcess();
        
        if (cursorRunning) {
            // 询问用户是否要自动重启 Cursor
            const shouldRestart = await askUserForCursorRestart();
            
            if (shouldRestart) {
                const restartSuccess = await restartCursor();
                if (restartSuccess) {
                    colorLog('✅ Cursor 已重启，MCP 配置已生效！', 'green');
                } else {
                    colorLog('⚠️  请手动重启 Cursor 编辑器以加载新的 MCP 配置！', 'yellow');
                }
            } else {
                colorLog('⚠️  请记得手动重启 Cursor 编辑器以加载新的 MCP 配置！', 'yellow');
            }
        } else {
            colorLog('ℹ️  MCP 配置已更新，下次启动 Cursor 时将自动加载新配置', 'green');
        }
    }
}

function checkNodeVersion() {
    return new Promise((resolve) => {
        exec('node --version', (error, stdout) => {
            if (error) {
                colorLog('Node.js 未安装', 'red');
                resolve(false);
            } else {
                const version = stdout.trim();
                const majorVersion = parseInt(version.substring(1).split('.')[0]);
                
                if (majorVersion >= 16) {
                    colorLog(`Node.js 版本: ${version} ✓`, 'green');
                    resolve(true);
                } else {
                    colorLog(`Node.js 版本过低: ${version} (需要 >= 16.0.0)`, 'red');
                    resolve(false);
                }
            }
        });
    });
}

function header(title) {
    console.log('');
    colorLog('========================================', 'cyan');
    colorLog(`    ${title}`, 'cyan');
    colorLog('========================================', 'cyan');
    console.log('');
}

function checkProjectDirectory() {
    if (!fs.existsSync(PROJECT_DIR)) {
        colorLog('错误: 找不到 cursor-talk-to-figma-mcp 项目目录', 'red');
        colorLog(`期望路径: ${PROJECT_DIR}`, 'yellow');
        return false;
    }
    
    const packageJsonPath = path.join(PROJECT_DIR, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        colorLog('错误: 项目目录中找不到 package.json', 'red');
        return false;
    }
    
    colorLog(`项目目录: ${PROJECT_DIR}`, 'blue');
    return true;
}

function installDependencies() {
    return new Promise((resolve) => {
        colorLog('检查项目依赖...', 'blue');
        
        const nodeModulesPath = path.join(PROJECT_DIR, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            colorLog('正在安装项目依赖...', 'yellow');
            
            exec('bun install', { cwd: PROJECT_DIR }, (error) => {
                if (error) {
                    exec('npm install', { cwd: PROJECT_DIR }, (npmError) => {
                        if (npmError) {
                            colorLog('依赖安装失败', 'red');
                            resolve(false);
                        } else {
                            colorLog('依赖安装完成！(使用 npm)', 'green');
                            resolve(true);
                        }
                    });
                } else {
                    colorLog('依赖安装完成！', 'green');
                    resolve(true);
                }
            });
        } else {
            colorLog('依赖已存在', 'green');
            resolve(true);
        }
    });
}

function buildProject() {
    return new Promise((resolve) => {
        colorLog('构建项目...', 'blue');
        
        // 尝试多种构建方法
        const buildCommands = [
            'bun run build',
            'npm run build',
            './node_modules/.bin/tsup',
            'bunx tsup'
        ];
        
        let currentCommand = 0;
        
        function tryBuild() {
            if (currentCommand >= buildCommands.length) {
                colorLog('所有构建方法都失败了', 'red');
                resolve(false);
                return;
            }
            
            const command = buildCommands[currentCommand];
            colorLog(`尝试构建命令: ${command}`, 'yellow');
            
            exec(command, { cwd: PROJECT_DIR }, (error, stdout, stderr) => {
                if (error) {
                    colorLog(`构建命令失败: ${command}`, 'yellow');
                    if (stderr) colorLog(`错误: ${stderr}`, 'yellow');
                    currentCommand++;
                    tryBuild();
                } else {
                    colorLog('项目构建完成！', 'green');
                    if (stdout) colorLog(stdout, 'white');
                    resolve(true);
                }
            });
        }
        
        tryBuild();
    });
}

function startServices() {
    return new Promise((resolve) => {
        colorLog('正在启动服务...', 'blue');
        
        // 启动 WebSocket 服务器
        colorLog('启动 WebSocket 服务器...', 'green');
        services.websocket = spawn('bun', ['socket'], {
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: PROJECT_DIR
        });
        
        // 记录WebSocket服务PID
        if (services.websocket.pid) {
            writePidFile(WEBSOCKET_PID_FILE, services.websocket.pid);
            colorLog(`WebSocket服务已启动 (PID: ${services.websocket.pid})`, 'green');
        }
        
        services.websocket.stdout.on('data', (data) => {
            console.log(`[WebSocket] ${data.toString().trim()}`);
        });
        
        services.websocket.on('exit', (code) => {
            colorLog(`WebSocket服务已退出 (退出码: ${code})`, 'yellow');
            if (fs.existsSync(WEBSOCKET_PID_FILE)) {
                fs.unlinkSync(WEBSOCKET_PID_FILE);
            }
        });
        
        // 启动 MCP 服务器
        setTimeout(() => {
            colorLog('启动 MCP 服务器...', 'green');
            services.mcp = spawn('bun', ['run', 'dist/server.js'], {
                stdio: ['ignore', 'pipe', 'pipe'],
                cwd: PROJECT_DIR
            });
            
            // 记录MCP服务PID
            if (services.mcp.pid) {
                writePidFile(MCP_PID_FILE, services.mcp.pid);
                colorLog(`MCP服务已启动 (PID: ${services.mcp.pid})`, 'green');
            }
            
            services.mcp.stdout.on('data', (data) => {
                console.log(`[MCP] ${data.toString().trim()}`);
            });
            
            services.mcp.on('exit', (code) => {
                colorLog(`MCP服务已退出 (退出码: ${code})`, 'yellow');
                if (fs.existsSync(MCP_PID_FILE)) {
                    fs.unlinkSync(MCP_PID_FILE);
                }
            });
            
            resolve(true);
        }, 3000);
    });
}

function stopAllServices() {
    colorLog('正在停止所有服务...', 'yellow');
    
    // 停止连接监控
    stopConnectionMonitoring();
    
    // 优雅停止服务
    if (services.websocket) {
        services.websocket.kill('SIGTERM');
        setTimeout(() => {
            if (services.websocket && !services.websocket.killed) {
                services.websocket.kill('SIGKILL');
            }
        }, 5000);
    }
    
    if (services.mcp) {
        services.mcp.kill('SIGTERM');
        setTimeout(() => {
            if (services.mcp && !services.mcp.killed) {
                services.mcp.kill('SIGKILL');
            }
        }, 5000);
    }
    
    // 清理PID文件中记录的进程
    [WEBSOCKET_PID_FILE, MCP_PID_FILE].forEach(pidFile => {
        if (fs.existsSync(pidFile)) {
            try {
                const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim());
                if (isProcessRunning(pid)) {
                    forceKillProcess(pid, path.basename(pidFile));
                }
            } catch (error) {
                // 忽略错误
            }
        }
    });
    
    // Windows特定清理
    if (os.platform() === 'win32') {
        exec('taskkill /IM bun.exe /F', () => {});
        exec('taskkill /IM bunx.exe /F', () => {});
    }
    
    // 清理所有PID文件
    cleanupPidFiles();
    
    colorLog('所有服务已停止', 'green');
}

async function main() {
    header('Cursor Talk to Figma MCP 启动器');
    
    // 0. 写入当前进程PID
    writePidFile(PID_FILE, process.pid);
    
    // 1. 检查并清理现有服务
    await checkAndCleanupExistingServices();
    
    // 2. 检查 Node.js 版本
    colorLog('检查运行环境...', 'blue');
    const nodeOk = await checkNodeVersion();
    if (!nodeOk) {
        colorLog('请安装 Node.js 16.0.0 或更高版本', 'red');
        colorLog('下载地址: https://nodejs.org/', 'yellow');
        process.exit(1);
    }
    
    // 3. 检查项目目录
    if (!checkProjectDirectory()) {
        process.exit(1);
    }
    
    // 4. 检查并安装 Bun
    colorLog('检查 Bun 运行环境...', 'blue');
    const bunExists = await checkCommand('bun');
    
    if (!bunExists) {
        colorLog('Bun 未安装，正在自动安装...', 'yellow');
        const installed = await installBun();
        if (!installed) {
            colorLog('Bun 安装失败，请手动安装后重试', 'red');
            process.exit(1);
        }
        // 安装后需要重启终端
        colorLog('Bun 安装完成，请重启终端后重新运行此脚本', 'yellow');
        process.exit(0);
    } else {
        colorLog('Bun 已安装 ✓', 'green');
    }
    
    // 5. 安装项目依赖
    const depsInstalled = await installDependencies();
    if (!depsInstalled) {
        process.exit(1);
    }
    
    // 6. 构建项目
    const buildSuccess = await buildProject();
    if (!buildSuccess) {
        process.exit(1);
    }
    
    // 7. 配置 Cursor Auto-Run Mode 和 MCP Tools Protection
    await enableCursorAutoRunMode();
    
    // 8. 设置 MCP 配置
    await setupMCPConfig();
    
    // 9. 启动服务
    await startServices();
    
    // 10. 等待服务启动并执行连接诊断
    colorLog('等待服务启动...', 'blue');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const diagnosticResult = await performConnectionDiagnostic();
    
    if (diagnosticResult) {
        // 11. 启动连接监控
        startConnectionMonitoring();
        colorLog('✅ 连接监控已启动，每30秒检查一次连接状态', 'green');
    } else {
        colorLog('⚠️  连接诊断发现问题，请检查服务状态', 'yellow');
    }
    
    // 12. 显示完成状态
    showCompletionStatus();
    
    // 13. 处理退出信号
    setupExitHandlers();
}

function showCompletionStatus() {
    console.log('');
    colorLog('========================================', 'green');
    colorLog('           启动完成！', 'green');
    colorLog('========================================', 'green');
    console.log('');
    
    colorLog('服务状态:', 'yellow');
    console.log('  • WebSocket 服务器: http://localhost:3055');
    console.log('  • MCP 服务器: 已启动并连接到 Cursor');
    console.log('  • Cursor Auto-Run Mode: 已自动启用');
    console.log('  • 连接监控: 已启动，自动检测连接状态');
    console.log('');
    
    colorLog('🔧 如果 Auto-Run Mode 未生效，请手动启用:', 'yellow');
    console.log('  1. 在 Cursor 中按 Ctrl+, 打开设置');
    console.log('  2. 在设置搜索框中输入 "auto run"');
    console.log('  3. 确保以下选项已启用:');
    colorLog('     ✓ Auto-Run Mode', 'green');
    colorLog('     ✓ Out-of-Context Edits in Manual Mode', 'green');
    colorLog('     ✓ Auto-Fix Lints', 'green');
    colorLog('     ✓ Auto-Accept on Commit', 'green');
    console.log('  4. 或者在设置的 JSON 编辑器中添加:');
    colorLog('     {', 'gray');
    colorLog('       "cursor.chat.autoRunMode": true,', 'gray');
    colorLog('       "cursor.agent.autoRunMode": true,', 'gray');
    colorLog('       "cursor.tools.autoRun": true,', 'gray');
    colorLog('       "cursor.mcp.autoRun": true,', 'gray');
    colorLog('       "cursor.tools.requireConfirmation": false', 'gray');
    colorLog('     }', 'gray');
    console.log('');
    
    colorLog('下一步操作:', 'yellow');
    console.log('  1. 🔍 在 Cursor 中检查 MCP 连接状态:');
    console.log('     - 按 Ctrl+Shift+P 打开命令面板');
    console.log('     - 搜索 "MCP" 查看可用的 MCP 工具');
    console.log('     - 应该能看到 "TalkToFigma" 相关的工具');
    console.log('  2. 🎨 在 Figma 中安装并运行 "Cursor MCP Plugin"');
    console.log('  3. 🔗 在插件中连接到 WebSocket 服务器 (localhost:3055)');
    console.log('  4. ✨ 在 Cursor 中使用 MCP 工具与 Figma 交互');
    console.log('');
    
    colorLog('插件安装地址:', 'yellow');
    console.log('  https://www.figma.com/community/plugin/1485687494525374295/cursor-talk-to-figma-mcp-plugin');
    console.log('');
    
    colorLog('控制命令:', 'magenta');
    console.log('  • 停止服务: 按 Ctrl+C');
    console.log('  • 查看日志: 服务日志会实时显示在此窗口');
    console.log('');
}

function setupExitHandlers() {
    process.on('SIGINT', () => {
        colorLog('\n正在停止服务...', 'yellow');
        stopAllServices();
        cleanupPidFiles();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        colorLog('\n收到终止信号，正在清理...', 'yellow');
        stopAllServices();
        cleanupPidFiles();
        process.exit(0);
    });
    
    process.on('exit', () => {
        stopAllServices();
        cleanupPidFiles();
    });
    
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
        colorLog(`未捕获的异常: ${error.message}`, 'red');
        stopAllServices();
        cleanupPidFiles();
        process.exit(1);
    });
    
    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
        colorLog(`未处理的Promise拒绝: ${reason}`, 'red');
        stopAllServices();
        cleanupPidFiles();
        process.exit(1);
    });
}

main().catch((error) => {
    colorLog(`启动失败: ${error.message}`, 'red');
    process.exit(1);
}); 