# Talk-to-Figma MCP安装教程

## 简介
本指南将帮助您配置Cursor与Figma的集成环境，实现通过代码操作设计稿。

你可以查看[github原网站](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp#)，或跟随此文档，分步安装：

**附.Win安装推荐路径（4月13日更新）：**
(可以参考[B站的视频教程](https://www.bilibili.com/video/BV1sERZYEEpK/?spm_id_from=333.337.search-card.all.click&vd_source=5385c81189b3bf2df05a54035afee760),这个是可以用figma市场的插件，就不需要manifest安装figma的插件了)

![image](media/image1.png)

**附. 如果安装的过程中出现报错（4月25日更新）**
安装过程中终端如果没有返回正确信息，就是出现了报错。有可能是网络、未安装语言、操作失误等等问题导致的。

可以先复制终端中的全部内容，优先到deepseek/cursor 的Ask模式/GPT问一下，一般都会给出具体操作步骤。

报错的原因有很多很多很多种可能性，直接问哪里报错了，黄白同学也是很难一下子就知道问题在哪里的。

黄白同学是纯兴趣分享，群里问题不一定都能及时回应（也不一定都有能力解决），不过问了的我都还是会尽力来帮忙的，如果实在解决不了请见谅～

希望大家优先问Deepseek老师、GPT老师...(因为这是最快的方法)

ps：其实figma mcp现在能力非常有限，还完全没办法形成生产力，博主只是觉得比较好玩，所以做了分享。如果你实在安装不上也没关系的！因为安装上可能也只能玩几次而已啦。

## 一. 环境准备

### 1. 安装必要软件

**Cursor编辑器**访问[官网下载页面](https://cursor.sh/)，选择适合您操作系统的版本安装
(cursor建议安装中文插件，配置参考：[B站教程](https://www.bilibili.com/video/BV1yorUYWEGD?spm_id_from=333.788.videopod.sections&vd_source=5385c81189b3bf2df05a54035afee760&p=3))

**Figma**访问[官网下载页面](https://www.figma.com/downloads/)，安装

打开Cursor，新建终端：

![image](media/image2.png)

**在终端中执行以下命令，以克隆此项目到本地：**
```bash
git clone https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp.git
安装完成

https://media/image3.png

【如果安装失败的处理办法】此步需要🪜.如果安装失败，可以通过github原网站下载Zip,解压后跳到【二-7】这一步，把文件夹cursor-talk-to-figma-mcp，拖到cursor中。（4月13日更新）

https://media/image4.png

定位到文件夹

bash
open .
把文件夹cursor-talk-to-figma-mcp，拖到cursor中，打开已经克隆的项目的文件夹，并打开read me文件。并再次打开cursor中一个新的终端。

https://media/image5.png

二. 安装bun和MCP
1. 安装必要软件
在终端中输入指令，以安装bun（Bun是一个高效工具，可以实现了快速响应和简化的开发流程。）：

如果你是 macOS/Linux:
安装bun

bash
curl -fsSL https://bun.sh/install | bash
如图显示即完成

https://media/image6.png

新开一个终端窗口，配置Cursor的MCP集成

bash
bun setup
如果你是 Windows:

1.在 Cursor 终端中安装 Bun

1.1 打开 Cursor 的集成终端
快捷键 Ctrl+`` （反引号键）或通过菜单 Terminal > New Terminal` 打开。

1.2 执行安装命令直接在终端中输入：

powershell
powershell -c "irm bun.sh/install.ps1|iex"
如果报错提示执行策略限制，先运行以下命令：

powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
然后重新执行安装命令。

如果提示需要管理员权限，需以管理员身份启动 Cursor：
关闭 Cursor
右键点击 Cursor 快捷方式，选择 以管理员身份运行
重新打开终端执行命令。

1.3 验证安装安装完成后，检查版本：

bash
bun --version
2.在 Cursor 中修改 src/socket.ts
方法1：直接编辑文件（推荐）
在 Cursor 中打开文件
快捷键 Ctrl+P，输入 src/socket.ts 并回车。

定位目标代码找到以下代码块（可使用 Ctrl+F 搜索 hostname）：

typescript
// uncomment this to allow connections in windows wsl
// hostname: "0.0.0.0",
取消注释删除第二行开头的 //：

typescript
// uncomment this to allow connections in windows wsl
hostname: "0.0.0.0",
保存文件按 Ctrl+S 保存更改。

方法2：通过终端命令修改
如果熟悉命令行，可以在 Cursor 终端中运行以下命令（需确保路径正确）：

bash
# 使用 sed 命令（适用于 WSL 环境或安装了 Unix 工具的 Windows）
sed -i 's/\/\/ hostname: "0.0.0.0",/hostname: "0.0.0.0",/g' src/socket.ts

# 或使用 PowerShell 命令（纯 Windows 环境）
(Get-Content src/socket.ts) -replace '// hostname: "0.0.0.0",', 'hostname: "0.0.0.0",' | Set-Content src/socket.ts
Ps: 修改文件时若提示权限不足，可在终端运行：

bash
chmod +w src/socket.ts # WSL/Linux
# 或
icacls src/socket.ts /grant Everyone:F # Windows
2.启动服务(安装完成之后再打开cursor只需要从这步开始)
需要保持两个终端窗口运行：

窗口1 - WebSocket服务:

bash
bun socket
窗口2 - MCP服务:

bash
bunx cursor-talk-to-figma-mcp
3.检查MCP开启情况
打开cursor setting

https://media/image7.png

选中MCP，将diable选为✅enable，打开 MCP Servers

https://media/image8.png

3.如果MCP显示链接不成功，没有显示绿色点。
则运行命令 which bunx 并将路径粘贴到 .coursor/mcp.json 的命令键中,关闭并保存json。

https://media/image9.png

三. Figma插件安装
在Figma中打开任意文件
点击插件菜单 → Plugins & widgets → 下滑至底部 → import from manifest

https://media/image10.png

在安装的cursor文件夹中找到：

text
cursor-talk-to-figma-mcp/src/cursor_mcp_plugin/manifest.json
在插件列表中找到Cursor MCP即可使用

https://media/image11.png

四. 连接配置
1. Figma端配置
打开设计文件
运行Cursor MCP插件,点击Connect
成功

https://media/image12.png

2. Cursor端连接
复制figma窗口中的channel名（例如：i9bvnr46）
在cursor的Agent模式下，发送

text
Talk to figma with channel : **[替换成你的channel名]**
链接成功

https://media/image13.png

3. Cursor Setting中打开自动执行
打开Features- Enable auto-run mode,打开后，Cursor就可以连续地执行指令控制Figma。

https://media/image14.png

六. 故障排查
连接问题
确认两个服务正在运行
检查Figma插件与控制台是否使用相同频道名
查看终端是否有错误输出

如需进一步帮助，请参考项目GitHub仓库的Issues页面或提交新问题。

附. Cursor无限续杯方法

text
首先，我们都应该支持正版
然后，链接：
https://github.com/fly8888/cursor_machine_id

附. Mac安装Bun失败
https://media/image15.png

可能与网络连接或curl的HTTP/2协议兼容性有关。以下是解决步骤：

尝试强制使用HTTP/1.1协议某些网络环境对HTTP/2支持不稳定，可以通过添加 --http1.1 参数绕过：

bash
curl -fsSL --http1.1 https://bun.sh/install | bash
检查网络连接确保没有防火墙、代理或DNS问题阻止访问 github.com。可尝试直接下载文件：

bash
curl -LO https://github.com/oven-sh/bun/releases/latest/download/bun-darwin-aarch64.zip
如果手动下载失败，可能是网络限制或GitHub服务暂时不可用。

使用npm安装（备用方案）如果已安装Node.js，可以通过npm全局安装Bun：

bash
npm install -g bun
手动安装若脚本仍失败，可手动下载并配置（推荐🌟🌟🌟）：

bash
# 下载并解压
curl -LO https://github.com/oven-sh/bun/releases/latest/download/bun-darwin-aarch64.zip
unzip bun-darwin-aarch64.zip
# 移动到可执行路径
mv bun /usr/local/bin/
# 验证安装
bun --version
检查系统兼容性确保你的设备系统版本较新。Bun要求macOS 10.15或更高版本。

附：win系统socket失败解决案例
https://media/image16.png
https://media/image17.png

bun socket ⽆法执⾏通常是因为 没有在 repo 根⽬录 里执⾏，Bun找不到写在 package.json/bunfig.toml 里的脚本；另外，把 README 里的

typescript
// hostname: "0.0.0.0", // uncomment this to allow connections in windows wsl
整段直接粘到终端也是不正确的。按下面顺序操作即可解决。

一步一步排查 & 修复
https://media/image18.png

点击图片可查看完整电子表格

text
为什么要 bun run socket？
bun <script-name> 只在当前目录的 package.json *或* bunfig.toml 里能找到同名脚本时才生效；否则就会出现你截图里的 *"Script not found \"socket\""*。
常见坑与对应方案
https://media/image19.png

点击图片可查看完整电子表格

如果还不行，可以这样快速验证
直接运行 TypeScript 文件，绕过脚本名

bash
bun run src/socket.ts
能正常启动就说明 Bun 没问题，脚本映射的问题；反之请检查 Bun 是否在 PATH，或将 bun.exe 所在目录（通常是 %USERPROFILE%.bun\bin）加入环境变量并重启终端。

进阶：手动添加脚本示例
bunfig.toml（或 package.json 的 "scripts" 字段）

toml
[scripts]
socket = "bun src/socket.ts"
保存后再执行 bun socket 即可。

全文评论
text

Note: 
1. The image references (`media/imageX.png`) are kept as-is. You'll need to ensure these image files are available in the `media` folder relative to where this markdown file is stored.
2. The formatting has been adjusted to proper Markdown syntax while preserving all the original content.
3. Some complex tables from the original document have been simplified to maintain readability in Markdown.