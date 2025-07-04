const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 颜色定义
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

function colorLog(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkCommand(command) {
    return new Promise((resolve) => {
        exec(`${command} --version`, (error, stdout) => {
            resolve({ exists: !error, version: error ? null : stdout.trim() });
        });
    });
}

function checkProjectStructure() {
    const projectDir = path.join(__dirname, 'cursor-talk-to-figma-mcp');
    const requiredFiles = [
        'package.json',
        'src/talk_to_figma_mcp/server.ts',
        'src/socket.ts',
        'src/cursor_mcp_plugin/code.js'
    ];
    
    const results = {
        projectExists: fs.existsSync(projectDir),
        missingFiles: []
    };
    
    if (results.projectExists) {
        for (const file of requiredFiles) {
            const filePath = path.join(projectDir, file);
            if (!fs.existsSync(filePath)) {
                results.missingFiles.push(file);
            }
        }
    }
    
    return results;
}

function checkMCPConfig() {
    const mcpConfigPath = path.join(os.homedir(), '.cursor', 'mcp.json');
    
    if (!fs.existsSync(mcpConfigPath)) {
        return { exists: false, configured: false };
    }
    
    try {
        const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
        const hasTalkToFigma = config.mcpServers && config.mcpServers.TalkToFigma;
        
        return { 
            exists: true, 
            configured: hasTalkToFigma,
            config: config
        };
    } catch (error) {
        return { exists: true, configured: false, error: error.message };
    }
}

async function main() {
    console.log('');
    colorLog('========================================', 'cyan');
    colorLog('    环境检查 - Cursor Talk to Figma', 'cyan');
    colorLog('========================================', 'cyan');
    console.log('');
    
    // 1. 检查 Node.js
    colorLog('1. 检查 Node.js...', 'blue');
    const nodeResult = await checkCommand('node');
    if (nodeResult.exists) {
        const version = nodeResult.version;
        const majorVersion = parseInt(version.substring(1).split('.')[0]);
        
        if (majorVersion >= 16) {
            colorLog(`   ✓ Node.js ${version}`, 'green');
        } else {
            colorLog(`   ✗ Node.js 版本过低: ${version} (需要 >= 16.0.0)`, 'red');
        }
    } else {
        colorLog('   ✗ Node.js 未安装', 'red');
    }
    
    // 2. 检查 npm
    colorLog('2. 检查 npm...', 'blue');
    const npmResult = await checkCommand('npm');
    if (npmResult.exists) {
        colorLog(`   ✓ npm ${npmResult.version}`, 'green');
    } else {
        colorLog('   ✗ npm 未安装', 'red');
    }
    
    // 3. 检查 Bun
    colorLog('3. 检查 Bun...', 'blue');
    const bunResult = await checkCommand('bun');
    if (bunResult.exists) {
        colorLog(`   ✓ Bun ${bunResult.version}`, 'green');
    } else {
        colorLog('   ✗ Bun 未安装 (可选，但推荐使用)', 'yellow');
        colorLog('     安装地址: https://bun.sh/', 'yellow');
    }
    
    // 4. 检查项目结构
    colorLog('4. 检查项目结构...', 'blue');
    const projectResult = checkProjectStructure();
    if (projectResult.projectExists) {
        colorLog('   ✓ 项目目录存在', 'green');
        
        if (projectResult.missingFiles.length === 0) {
            colorLog('   ✓ 所有必需文件存在', 'green');
        } else {
            colorLog('   ✗ 缺少以下文件:', 'red');
            projectResult.missingFiles.forEach(file => {
                colorLog(`     - ${file}`, 'red');
            });
        }
    } else {
        colorLog('   ✗ 项目目录不存在: cursor-talk-to-figma-mcp/', 'red');
    }
    
    // 5. 检查 MCP 配置
    colorLog('5. 检查 Cursor MCP 配置...', 'blue');
    const mcpResult = checkMCPConfig();
    if (mcpResult.exists) {
        if (mcpResult.configured) {
            colorLog('   ✓ MCP 配置文件存在且已配置 TalkToFigma', 'green');
        } else {
            colorLog('   ⚠ MCP 配置文件存在但未配置 TalkToFigma', 'yellow');
        }
    } else {
        colorLog('   ⚠ MCP 配置文件不存在', 'yellow');
        colorLog('     位置: ~/.cursor/mcp.json', 'yellow');
    }
    
    // 6. 检查系统信息
    colorLog('6. 系统信息...', 'blue');
    colorLog(`   操作系统: ${os.platform()} ${os.release()}`, 'white');
    colorLog(`   架构: ${os.arch()}`, 'white');
    colorLog(`   Node.js 架构: ${process.arch}`, 'white');
    
    console.log('');
    colorLog('========================================', 'cyan');
    
    // 总结和建议
    const issues = [];
    
    if (!nodeResult.exists) {
        issues.push('需要安装 Node.js (https://nodejs.org/)');
    } else {
        const majorVersion = parseInt(nodeResult.version.substring(1).split('.')[0]);
        if (majorVersion < 16) {
            issues.push('需要升级 Node.js 到 16.0.0 或更高版本');
        }
    }
    
    if (!npmResult.exists) {
        issues.push('需要安装 npm (通常随 Node.js 一起安装)');
    }
    
    if (!projectResult.projectExists) {
        issues.push('需要下载或克隆项目代码');
    } else if (projectResult.missingFiles.length > 0) {
        issues.push('项目文件不完整，需要重新下载');
    }
    
    if (issues.length > 0) {
        colorLog('需要解决的问题:', 'red');
        issues.forEach((issue, index) => {
            colorLog(`  ${index + 1}. ${issue}`, 'red');
        });
    } else {
        colorLog('✓ 环境检查通过！可以运行 npm start 启动服务', 'green');
    }
    
    console.log('');
}

main().catch(console.error); 