import { Server, ServerWebSocket } from "bun";

// Store clients by channel with connection metadata
interface ClientInfo {
  ws: ServerWebSocket<any>;
  lastPing: number;
  isAlive: boolean;
  joinedAt: number;
}

const channels = new Map<string, Map<string, ClientInfo>>();
const clientIds = new WeakMap<ServerWebSocket<any>, string>();

// 生成唯一客户端ID
function generateClientId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 心跳检测间隔（30秒）
const HEARTBEAT_INTERVAL = 30000;
// 客户端超时时间（60秒）
const CLIENT_TIMEOUT = 60000;

function handleConnection(ws: ServerWebSocket<any>) {
  const clientId = generateClientId();
  clientIds.set(ws, clientId);

  console.log(`[WebSocket] New client connected: ${clientId}`);

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: "system",
    message: "Connected to WebSocket server. Please join a channel to start.",
    clientId: clientId,
    timestamp: Date.now()
  }));

  // 发送初始ping
  ws.send(JSON.stringify({
    type: "ping",
    timestamp: Date.now()
  }));
}

// 心跳检测函数
function startHeartbeat() {
  setInterval(() => {
    const now = Date.now();
    
    channels.forEach((clients, channelName) => {
      clients.forEach((clientInfo, clientId) => {
        const { ws, lastPing, isAlive } = clientInfo;

        // 检查客户端是否超时
        if (now - lastPing > CLIENT_TIMEOUT) {
          console.log(`[WebSocket] Client ${clientId} timed out, removing from channel ${channelName}`);
          clients.delete(clientId);
          
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, "Connection timeout");
          }
          return;
        }
        
        // 发送心跳包
        if (ws.readyState === WebSocket.OPEN) {
          if (!isAlive) {
            console.log(`[WebSocket] Client ${clientId} not responding, terminating connection`);
            ws.terminate();
            clients.delete(clientId);
            return;
          }
          
          // 标记为等待响应
          clientInfo.isAlive = false;
          
          ws.send(JSON.stringify({
            type: "ping",
            timestamp: now
          }));
        } else {
          // 连接已关闭，从频道中移除
          clients.delete(clientId);
        }
      });
      
      // 如果频道为空，删除频道
      if (clients.size === 0) {
        channels.delete(channelName);
        console.log(`[WebSocket] Channel ${channelName} is empty, removing`);
          }
        });
  }, HEARTBEAT_INTERVAL);
}

const server = Bun.serve({
  port: 3055,
  hostname: "0.0.0.0",
  fetch(req: Request, server: Server) {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Handle WebSocket upgrade
    const success = server.upgrade(req, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });

    if (success) {
      return; // Upgraded to WebSocket
    }

    // Return response for non-WebSocket requests
    return new Response("WebSocket server running with heartbeat monitoring", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
    });
  },
  websocket: {
    open: handleConnection,
    message(ws: ServerWebSocket<any>, message: string | Buffer) {
      try {
        const clientId = clientIds.get(ws);
        if (!clientId) {
          console.error("[WebSocket] Received message from unknown client");
          return;
        }

        console.log(`[WebSocket] Received message from client ${clientId}:`, message.toString().substring(0, 200));
        const data = JSON.parse(message as string);

        // 处理pong响应
        if (data.type === "pong") {
          // 更新客户端状态
          channels.forEach((clients) => {
            const clientInfo = clients.get(clientId);
            if (clientInfo) {
              clientInfo.isAlive = true;
              clientInfo.lastPing = Date.now();
            }
          });
          return;
        }

        // 处理加入频道请求
        if (data.type === "join") {
          const channelName = data.channel;
          if (!channelName || typeof channelName !== "string") {
            ws.send(JSON.stringify({
              type: "error",
              message: "Channel name is required",
              timestamp: Date.now()
            }));
            return;
          }

          // 创建频道（如果不存在）
          if (!channels.has(channelName)) {
            channels.set(channelName, new Map());
          }

          // 将客户端添加到频道
          const channelClients = channels.get(channelName)!;
          const clientInfo: ClientInfo = {
            ws,
            lastPing: Date.now(),
            isAlive: true,
            joinedAt: Date.now()
          };
          
          channelClients.set(clientId, clientInfo);

          // 通知客户端成功加入
          ws.send(JSON.stringify({
            type: "system",
            message: {
              id: data.id,
              result: `Successfully joined channel: ${channelName}`,
            },
            channel: channelName,
            clientId: clientId,
            timestamp: Date.now()
          }));

          console.log(`[WebSocket] Client ${clientId} joined channel ${channelName}`);

          // 通知频道内其他客户端
          channelClients.forEach((otherClientInfo, otherClientId) => {
            if (otherClientId !== clientId && otherClientInfo.ws.readyState === WebSocket.OPEN) {
              otherClientInfo.ws.send(JSON.stringify({
                type: "system",
                message: `Client ${clientId} joined the channel`,
                channel: channelName,
                timestamp: Date.now()
              }));
            }
          });
          return;
        }

        // 处理常规消息
        if (data.type === "message") {
          const channelName = data.channel;
          if (!channelName || typeof channelName !== "string") {
            ws.send(JSON.stringify({
              type: "error",
              message: "Channel name is required",
              timestamp: Date.now()
            }));
            return;
          }

          const channelClients = channels.get(channelName);
          if (!channelClients || !channelClients.has(clientId)) {
            ws.send(JSON.stringify({
              type: "error",
              message: "You must join the channel first",
              timestamp: Date.now()
            }));
            return;
          }

          // 更新客户端活动时间
          const clientInfo = channelClients.get(clientId)!;
          clientInfo.lastPing = Date.now();
          clientInfo.isAlive = true;

          // 广播到频道内所有客户端
          let broadcastCount = 0;
          channelClients.forEach((targetClientInfo, targetClientId) => {
            if (targetClientInfo.ws.readyState === WebSocket.OPEN) {
              console.log(`[WebSocket] Broadcasting message to client: ${targetClientId}`);
              targetClientInfo.ws.send(JSON.stringify({
                type: "broadcast",
                message: data.message,
                sender: targetClientId === clientId ? "You" : clientId,
                channel: channelName,
                timestamp: Date.now()
              }));
              broadcastCount++;
            }
          });

          console.log(`[WebSocket] Message broadcasted to ${broadcastCount} clients in channel ${channelName}`);
        }
      } catch (err) {
        console.error("[WebSocket] Error handling message:", err);
        const clientId = clientIds.get(ws);
        ws.send(JSON.stringify({
          type: "error",
          message: "Invalid message format",
          clientId: clientId,
          timestamp: Date.now()
        }));
      }
    },
    close(ws: ServerWebSocket<any>) {
      const clientId = clientIds.get(ws);
      console.log(`[WebSocket] Client disconnected: ${clientId || 'unknown'}`);

      if (clientId) {
        // 从所有频道中移除客户端
        channels.forEach((clients, channelName) => {
          if (clients.has(clientId)) {
            clients.delete(clientId);
            console.log(`[WebSocket] Removed client ${clientId} from channel ${channelName}`);

            // 通知频道内其他客户端
            clients.forEach((clientInfo) => {
              if (clientInfo.ws.readyState === WebSocket.OPEN) {
                clientInfo.ws.send(JSON.stringify({
                  type: "system",
                  message: `Client ${clientId} left the channel`,
                  channel: channelName,
                  timestamp: Date.now()
                }));
              }
            });
          }
        });

        // 清理客户端ID映射
        clientIds.delete(ws);
      }
    }
  }
});

// 启动心跳检测
startHeartbeat();

console.log(`[WebSocket] Server running on port ${server.port} with heartbeat monitoring`);
console.log(`[WebSocket] Heartbeat interval: ${HEARTBEAT_INTERVAL}ms`);
console.log(`[WebSocket] Client timeout: ${CLIENT_TIMEOUT}ms`);
