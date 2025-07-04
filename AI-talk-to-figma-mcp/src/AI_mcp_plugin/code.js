// 这是 Cursor MCP Figma 插件的主代码文件
// 负责处理 Figma API 命令

// Plugin state
const state = {
  serverPort: 3055, // Default port
};


// 进度更新辅助函数
function sendProgressUpdate(
  commandId,
  commandType,
  status,
  progress,
  totalItems,
  processedItems,
  message,
  payload = null
) {
  const update = {
    type: "command_progress",
    commandId,
    commandType,
    status,
    progress,
    totalItems,
    processedItems,
    message,
    timestamp: Date.now(),
  };

  // 如果存在可选的 chunk 信息，则添加
  if (payload) {
    if (
      payload.currentChunk !== undefined &&
      payload.totalChunks !== undefined
    ) {
      update.currentChunk = payload.currentChunk;
      update.totalChunks = payload.totalChunks;
      update.chunkSize = payload.chunkSize;
    }
    update.payload = payload;
  }

  // 发送给 UI
  figma.ui.postMessage(update);
  console.log(`Progress update: ${status} - ${progress}% - ${message}`);

  return update;
}

// 显示 UI
figma.showUI(__html__, { width: 350, height: 450 });

// 从 UI 接收插件命令
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'theme-change') {
    const theme = msg.theme; // 'dark' 或 'light'
    // 获取所有变量集合（变量模式）
    const collections = figma.variables.getLocalVariableCollections();
    for (const collection of collections) {
      // 查找目标模式
      const targetMode = collection.modes.find(mode => 
        mode.name.toLowerCase().includes(theme)
      );
      if (targetMode) {
        // 遍历所有页面和框架，设置变量模式
        for (const page of figma.root.children) {
          for (const node of page.findAll(n => n.type === 'FRAME')) {
            node.setExplicitVariableModeForCollection(collection, targetMode.modeId);
          }
        }
      }
    }
    return;
  }
  switch (msg.type) {
    case "update-settings":
      updateSettings(msg);
      break;
    case "notify":
      figma.notify(msg.message);
      break;
    case "close-plugin":
      figma.closePlugin();
      break;
    case "execute-command":
      // 执行从 UI 接收的命令（从 WebSocket 获取）
      try {
        const result = await handleCommand(msg.command, msg.params);
        // 发送结果回 UI
        figma.ui.postMessage({
          type: "command-result",
          id: msg.id,
          result,
        });
      } catch (error) {
        figma.ui.postMessage({
          type: "command-error",
          id: msg.id,
          error: error.message || "Error executing command",
        });
      }
      break;
  }
};

// 监听插件命令从菜单
figma.on("run", ({ command }) => {
  figma.ui.postMessage({ type: "auto-connect" });
});

// 更新插件设置
function updateSettings(settings) {
  if (settings.serverPort) {
    state.serverPort = settings.serverPort;
  }

  figma.clientStorage.setAsync("settings", {
    serverPort: state.serverPort,
  });
}

  // 处理从 UI 接收的命令
async function handleCommand(command, params) {
  switch (command) {
    case "get_document_info":
      return await getDocumentInfo();
    case "get_selection":
      return await getSelection();
    case "get_node_info":
      if (!params || !params.nodeId) {
        throw new Error("Missing nodeId parameter");
      }
      return await getNodeInfo(params.nodeId);
    case "get_nodes_info":
      if (!params || !params.nodeIds || !Array.isArray(params.nodeIds)) {
        throw new Error("Missing or invalid nodeIds parameter");
      }
      return await getNodesInfo(params.nodeIds);
    case "read_my_design":
      return await readMyDesign();
    case "create_rectangle":
      return await createRectangle(params);
    case "create_frame":
      return await createFrame(params);
    case "create_text":
      return await createText(params);
    case "set_fill_color":
      return await setFillColor(params);
    case "set_stroke_color":
      return await setStrokeColor(params);
    case "move_node":
      return await moveNode(params);
    case "resize_node":
      return await resizeNode(params);
    case "delete_node":
      return await deleteNode(params);
    case "delete_multiple_nodes":
      return await deleteMultipleNodes(params);
    case "get_styles":
      return await getStyles();
    case "get_local_components":
      return await getLocalComponents();
    // case "get_team_components":
    //   return await getTeamComponents();
    case "create_component_instance":
      return await createComponentInstance(params);
    case "export_node_as_image":
      return await exportNodeAsImage(params);
    case "set_corner_radius":
      return await setCornerRadius(params);
    case "set_text_content":
      return await setTextContent(params);
    case "clone_node":
      return await cloneNode(params);
    case "scan_text_nodes":
      return await scanTextNodes(params);
    case "set_multiple_text_contents":
      return await setMultipleTextContents(params);
    case "get_annotations":
      return await getAnnotations(params);
    case "set_annotation":
      return await setAnnotation(params);
    case "scan_nodes_by_types":
      return await scanNodesByTypes(params);
    case "set_multiple_annotations":
      return await setMultipleAnnotations(params);
    case "get_instance_overrides":
      // Check if instanceNode parameter is provided
      if (params && params.instanceNodeId) {
        // Get the instance node by ID
        const instanceNode = await figma.getNodeByIdAsync(params.instanceNodeId);
        if (!instanceNode) {
          throw new Error(`Instance node not found with ID: ${params.instanceNodeId}`);
        }
        return await getInstanceOverrides(instanceNode);
      }
      // Call without instance node if not provided
      return await getInstanceOverrides();

    case "set_instance_overrides":
      // Check if instanceNodeIds parameter is provided
      if (params && params.targetNodeIds) {
        // Validate that targetNodeIds is an array
        if (!Array.isArray(params.targetNodeIds)) {
          throw new Error("targetNodeIds must be an array");
        }

        // Get the instance nodes by IDs
        const targetNodes = await getValidTargetInstances(params.targetNodeIds);
        if (!targetNodes.success) {
          figma.notify(targetNodes.message);
          return { success: false, message: targetNodes.message };
        }

        if (params.sourceInstanceId) {

          // get source instance data
          let sourceInstanceData = null;
          sourceInstanceData = await getSourceInstanceData(params.sourceInstanceId);

          if (!sourceInstanceData.success) {
            figma.notify(sourceInstanceData.message);
            return { success: false, message: sourceInstanceData.message };
          }
          return await setInstanceOverrides(targetNodes.targetInstances, sourceInstanceData);
        } else {
          throw new Error("Missing sourceInstanceId parameter");
        }
      }
    case "set_layout_mode":
      return await setLayoutMode(params);
    case "set_padding":
      return await setPadding(params);
    case "set_axis_align":
      return await setAxisAlign(params);
    case "set_layout_sizing":
      return await setLayoutSizing(params);
    case "set_item_spacing":
      return await setItemSpacing(params);
    case "get_reactions":
      if (!params || !params.nodeIds || !Array.isArray(params.nodeIds)) {
        throw new Error("Missing or invalid nodeIds parameter");
      }
      return await getReactions(params.nodeIds);  
    case "set_default_connector":
      return await setDefaultConnector(params);
    case "create_connections":
      return await createConnections(params);
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

  // 命令实现

async function getDocumentInfo() {
  await figma.currentPage.loadAsync();
  const page = figma.currentPage;
  return {
    name: page.name,
    id: page.id,
    type: page.type,
    children: page.children.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
    })),
    currentPage: {
      id: page.id,
      name: page.name,
      childCount: page.children.length,
    },
    pages: [
      {
        id: page.id,
        name: page.name,
        childCount: page.children.length,
      },
    ],
  };
}

async function getSelection() {
  return {
    selectionCount: figma.currentPage.selection.length,
    selection: figma.currentPage.selection.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible,
    })),
  };
}

function rgbaToHex(color) {
  var r = Math.round(color.r * 255);
  var g = Math.round(color.g * 255);
  var b = Math.round(color.b * 255);
  var a = color.a !== undefined ? Math.round(color.a * 255) : 255;

  if (a === 255) {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          return x.toString(16).padStart(2, "0");
        })
        .join("")
    );
  }

  return (
    "#" +
    [r, g, b, a]
      .map((x) => {
        return x.toString(16).padStart(2, "0");
      })
      .join("")
  );
}

function filterFigmaNode(node) {
  if (node.type === "VECTOR") {
    return null;
  }

  var filtered = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if (node.fills && node.fills.length > 0) {
    filtered.fills = node.fills.map((fill) => {
      var processedFill = Object.assign({}, fill);
      delete processedFill.boundVariables;
      delete processedFill.imageRef;

      if (processedFill.gradientStops) {
        processedFill.gradientStops = processedFill.gradientStops.map(
          (stop) => {
            var processedStop = Object.assign({}, stop);
            if (processedStop.color) {
              processedStop.color = rgbaToHex(processedStop.color);
            }
            delete processedStop.boundVariables;
            return processedStop;
          }
        );
      }

      if (processedFill.color) {
        processedFill.color = rgbaToHex(processedFill.color);
      }

      return processedFill;
    });
  }

  if (node.strokes && node.strokes.length > 0) {
    filtered.strokes = node.strokes.map((stroke) => {
      var processedStroke = Object.assign({}, stroke);
      delete processedStroke.boundVariables;
      if (processedStroke.color) {
        processedStroke.color = rgbaToHex(processedStroke.color);
      }
      return processedStroke;
    });
  }

  if (node.cornerRadius !== undefined) {
    filtered.cornerRadius = node.cornerRadius;
  }

  if (node.absoluteBoundingBox) {
    filtered.absoluteBoundingBox = node.absoluteBoundingBox;
  }

  if (node.characters) {
    filtered.characters = node.characters;
  }

  if (node.style) {
    filtered.style = {
      fontFamily: node.style.fontFamily,
      fontStyle: node.style.fontStyle,
      fontWeight: node.style.fontWeight,
      fontSize: node.style.fontSize,
      textAlignHorizontal: node.style.textAlignHorizontal,
      letterSpacing: node.style.letterSpacing,
      lineHeightPx: node.style.lineHeightPx,
    };
  }

  if (node.children) {
    filtered.children = node.children
      .map((child) => {
        return filterFigmaNode(child);
      })
      .filter((child) => {
        return child !== null;
      });
  }

  return filtered;
}

async function getNodeInfo(nodeId) {
  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  const response = await node.exportAsync({
    format: "JSON_REST_V1",
  });

  return filterFigmaNode(response.document);
}

async function getNodesInfo(nodeIds) {
  try {
    // 并行加载所有节点
    const nodes = await Promise.all(
      nodeIds.map((id) => figma.getNodeByIdAsync(id))
    );

    // 过滤掉任何空值（未找到的节点）
    const validNodes = nodes.filter((node) => node !== null);

    // 并行导出所有有效节点
    const responses = await Promise.all(
      validNodes.map(async (node) => {
        const response = await node.exportAsync({
          format: "JSON_REST_V1",
        });
        return {
          nodeId: node.id,
          document: filterFigmaNode(response.document),
        };
      })
    );

    return responses;
  } catch (error) {
    throw new Error(`Error getting nodes info: ${error.message}`);
  }
}

async function getReactions(nodeIds) {
  try {
    const commandId = generateCommandId();
    sendProgressUpdate(
      commandId,
      "get_reactions",
      "started",
      0,
      nodeIds.length,
      0,
      `Starting deep search for reactions in ${nodeIds.length} nodes and their children`
    );

    // 从节点和所有子节点中找到具有反应的节点
    async function findNodesWithReactions(node, processedNodes = new Set(), depth = 0, results = []) {
      // 跳过已处理过的节点（防止循环引用）
      if (processedNodes.has(node.id)) {
        return results;
      }
      
      processedNodes.add(node.id);
      
      // 检查当前节点是否具有反应
      let filteredReactions = [];
      if (node.reactions && node.reactions.length > 0) {
        // 过滤掉导航为 'CHANGE_TO' 的反应
        filteredReactions = node.reactions.filter(r => {
          // 某些反应可能具有动作或动作数组
          if (r.action && r.action.navigation === 'CHANGE_TO') return false;
          if (Array.isArray(r.actions)) {
            // 如果动作数组中的任何动作是 CHANGE_TO，则排除
            return !r.actions.some(a => a.navigation === 'CHANGE_TO');
          }
          return true;
        });
      }
      const hasFilteredReactions = filteredReactions.length > 0;
      
      // 如果节点具有过滤后的反应，则将其添加到结果中并应用高亮效果
      if (hasFilteredReactions) {
        results.push({
          id: node.id,
          name: node.name,
          type: node.type,
          depth: depth,
          hasReactions: true,
          reactions: filteredReactions,
          path: getNodePath(node)
        });
          // 应用高亮效果（橙色边框）
        await highlightNodeWithAnimation(node);
      }
      
      // 如果节点有子节点，则递归搜索它们
      if (node.children) {
        for (const child of node.children) {
          await findNodesWithReactions(child, processedNodes, depth + 1, results);
        }
      }
      
      return results;
    }
    
    // 应用动画高亮效果到节点的函数
    async function highlightNodeWithAnimation(node) {
      // 保存原始笔划属性
      const originalStrokeWeight = node.strokeWeight;
      const originalStrokes = node.strokes ? [...node.strokes] : [];
      
      try {
        // 应用橙色边框笔划
        node.strokeWeight = 4;
        node.strokes = [{
          type: 'SOLID',
          color: { r: 1, g: 0.5, b: 0 }, // Orange color
          opacity: 0.8
        }];
        
        // 设置动画效果的超时时间（1.5秒后恢复原始状态）
        setTimeout(() => {
          try {
            // 恢复原始笔划属性
            node.strokeWeight = originalStrokeWeight;
            node.strokes = originalStrokes;
          } catch (restoreError) {
            console.error(`Error restoring node stroke: ${restoreError.message}`);
          }
        }, 1500);
      } catch (highlightError) {
        console.error(`Error highlighting node: ${highlightError.message}`);
        // 即使高亮失败，也继续
      }
    }
    
    // 获取节点层次路径作为字符串
    function getNodePath(node) {
      const path = [];
      let current = node;
      
      while (current && current.parent) {
        path.unshift(current.name);
        current = current.parent;
      }
      
      return path.join(' > ');
    }

    // 存储所有结果的数组
    let allResults = [];
    let processedCount = 0;
    const totalCount = nodeIds.length;
    
    // 遍历每个节点及其子节点以搜索反应
    for (let i = 0; i < nodeIds.length; i++) {
      try {
        const nodeId = nodeIds[i];
        const node = await figma.getNodeByIdAsync(nodeId);
        
        if (!node) {
          processedCount++;
          sendProgressUpdate(
            commandId,
            "get_reactions",
            "in_progress",
            processedCount / totalCount,
            totalCount,
            processedCount,
            `Node not found: ${nodeId}`
          );
          continue;
        }
        
        // 在节点及其子节点中搜索反应
        const processedNodes = new Set();
        const nodeResults = await findNodesWithReactions(node, processedNodes);
        
        // 添加结果
        allResults = allResults.concat(nodeResults);
        
        // 更新进度
        processedCount++;
        sendProgressUpdate(
          commandId,
          "get_reactions",
          "in_progress",
          processedCount / totalCount,
          totalCount,
          processedCount,
          `Processed node ${processedCount}/${totalCount}, found ${nodeResults.length} nodes with reactions`
        );
      } catch (error) {
        processedCount++;
        sendProgressUpdate(
          commandId,
          "get_reactions",
          "in_progress",
          processedCount / totalCount,
          totalCount,
          processedCount,
          `Error processing node: ${error.message}`
        );
      }
    }

    // 完成更新
    sendProgressUpdate(
      commandId,
      "get_reactions",
      "completed",
      1,
      totalCount,
      totalCount,
      `Completed deep search: found ${allResults.length} nodes with reactions.`
    );

    return {
      nodesCount: nodeIds.length,
      nodesWithReactions: allResults.length,
      nodes: allResults
    };
  } catch (error) {
    throw new Error(`Failed to get reactions: ${error.message}`);
  }
}

async function readMyDesign() {
  try {
    // 并行加载所有选定节点
    const nodes = await Promise.all(
      figma.currentPage.selection.map((node) => figma.getNodeByIdAsync(node.id))
    );

    // 过滤掉任何空值（未找到的节点）
    const validNodes = nodes.filter((node) => node !== null);

    // 并行导出所有有效节点
    const responses = await Promise.all(
      validNodes.map(async (node) => {
        const response = await node.exportAsync({
          format: "JSON_REST_V1",
        });
        return {
          nodeId: node.id,
          document: filterFigmaNode(response.document),
        };
      })
    );

    return responses;
  } catch (error) {
    throw new Error(`Error getting nodes info: ${error.message}`);
  }
}

async function createRectangle(params) {
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    name = "Rectangle",
    parentId,
  } = params || {};

  const rect = figma.createRectangle();
  rect.x = x;
  rect.y = y;
  rect.resize(width, height);
  rect.name = name;

  // 如果 parentId 提供，则附加到该节点，否则附加到当前页面
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }
    if (!("appendChild" in parentNode)) {
      throw new Error(`Parent node does not support children: ${parentId}`);
    }
    parentNode.appendChild(rect);
  } else {
    figma.currentPage.appendChild(rect);
  }

  return {
    id: rect.id,
    name: rect.name,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    parentId: rect.parent ? rect.parent.id : undefined,
  };
}

async function createFrame(params) {
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    name = "Frame",
    parentId,
    fillColor,
    strokeColor,
    strokeWeight,
    layoutMode = "NONE",
    layoutWrap = "NO_WRAP",
    paddingTop = 10,
    paddingRight = 10,
    paddingBottom = 10,
    paddingLeft = 10,
    primaryAxisAlignItems = "MIN",
    counterAxisAlignItems = "MIN",
    layoutSizingHorizontal = "FIXED",
    layoutSizingVertical = "FIXED",
    itemSpacing = 0,
  } = params || {};

  const frame = figma.createFrame();
  frame.x = x;
  frame.y = y;
  frame.resize(width, height);
  frame.name = name;

  // 如果提供，则设置布局模式
  if (layoutMode !== "NONE") {
    frame.layoutMode = layoutMode;
    frame.layoutWrap = layoutWrap;

    // 仅当 layoutMode 不是 NONE 时设置填充值
    frame.paddingTop = paddingTop;
    frame.paddingRight = paddingRight;
    frame.paddingBottom = paddingBottom;
    frame.paddingLeft = paddingLeft;

    // 仅当 layoutMode 不是 NONE 时设置轴对齐
    frame.primaryAxisAlignItems = primaryAxisAlignItems;
    frame.counterAxisAlignItems = counterAxisAlignItems;

    // 仅当 layoutMode 不是 NONE 时设置布局大小
    frame.layoutSizingHorizontal = layoutSizingHorizontal;
    frame.layoutSizingVertical = layoutSizingVertical;

    // 仅当 layoutMode 不是 NONE 时设置项目间距
    frame.itemSpacing = itemSpacing;
  }

  // 如果提供，则设置填充颜色
  if (fillColor) {
    const paintStyle = {
      type: "SOLID",
      color: {
        r: parseFloat(fillColor.r) || 0,
        g: parseFloat(fillColor.g) || 0,
        b: parseFloat(fillColor.b) || 0,
      },
      opacity: parseFloat(fillColor.a) || 1,
    };
    frame.fills = [paintStyle];
  }

  // 如果提供，则设置笔划颜色和粗细
  if (strokeColor) {
    const strokeStyle = {
      type: "SOLID",
      color: {
        r: parseFloat(strokeColor.r) || 0,
        g: parseFloat(strokeColor.g) || 0,
        b: parseFloat(strokeColor.b) || 0,
      },
      opacity: parseFloat(strokeColor.a) || 1,
    };
    frame.strokes = [strokeStyle];
  }

  // 如果提供，则设置笔划粗细
  if (strokeWeight !== undefined) {
    frame.strokeWeight = strokeWeight;
  }

  // 如果 parentId 提供，则附加到该节点，否则附加到当前页面
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }
    if (!("appendChild" in parentNode)) {
      throw new Error(`Parent node does not support children: ${parentId}`);
    }
    parentNode.appendChild(frame);
  } else {
    figma.currentPage.appendChild(frame);
  }

  return {
    id: frame.id,
    name: frame.name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    fills: frame.fills,
    strokes: frame.strokes,
    strokeWeight: frame.strokeWeight,
    layoutMode: frame.layoutMode,
    layoutWrap: frame.layoutWrap,
    parentId: frame.parent ? frame.parent.id : undefined,
  };
}

async function createText(params) {
  const {
    x = 0,
    y = 0,
    text = "Text",
    fontSize = 14,
    fontWeight = 400,
    fontColor = { r: 0, g: 0, b: 0, a: 1 }, // 默认黑色
    name = "",
    parentId,
  } = params || {};

  // 将常见的字体权重映射到 Figma 字体样式
  const getFontStyle = (weight) => {
    switch (weight) {
      case 100:
        return "Thin";
      case 200:
        return "Extra Light";
      case 300:
        return "Light";
      case 400:
        return "Regular";
      case 500:
        return "Medium";
      case 600:
        return "Semi Bold";
      case 700:
        return "Bold";
      case 800:
        return "Extra Bold";
      case 900:
        return "Black";
      default:
        return "Regular";
    }
  };

  const textNode = figma.createText();
  textNode.x = x;
  textNode.y = y;
  textNode.name = name || text;
  try {
    await figma.loadFontAsync({
      family: "Inter",
      style: getFontStyle(fontWeight),
    });
    textNode.fontName = { family: "Inter", style: getFontStyle(fontWeight) };
    textNode.fontSize = parseInt(fontSize);
  } catch (error) {
    console.error("Error setting font size", error);
  }
  setCharacters(textNode, text);

  // 设置文本颜色
  const paintStyle = {
    type: "SOLID",
    color: {
      r: parseFloat(fontColor.r) || 0,
      g: parseFloat(fontColor.g) || 0,
      b: parseFloat(fontColor.b) || 0,
    },
    opacity: parseFloat(fontColor.a) || 1,
  };
  textNode.fills = [paintStyle];

  // 如果 parentId 提供，则附加到该节点，否则附加到当前页面
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }
    if (!("appendChild" in parentNode)) {
      throw new Error(`Parent node does not support children: ${parentId}`);
    }
    parentNode.appendChild(textNode);
  } else {
    figma.currentPage.appendChild(textNode);
  }

  return {
    id: textNode.id,
    name: textNode.name,
    x: textNode.x,
    y: textNode.y,
    width: textNode.width,
    height: textNode.height,
    characters: textNode.characters,
    fontSize: textNode.fontSize,
    fontWeight: fontWeight,
    fontColor: fontColor,
    fontName: textNode.fontName,
    fills: textNode.fills,
    parentId: textNode.parent ? textNode.parent.id : undefined,
  };
}

async function setFillColor(params) {
  console.log("setFillColor", params);
  const {
    nodeId,
    color: { r, g, b, a },
  } = params || {};

  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (!("fills" in node)) {
    throw new Error(`Node does not support fills: ${nodeId}`);
  }

  // 创建 RGBA 颜色
  const rgbColor = {
    r: parseFloat(r) || 0,
    g: parseFloat(g) || 0,
    b: parseFloat(b) || 0,
    a: parseFloat(a) || 1,
  };

  // 设置填充
  const paintStyle = {
    type: "SOLID",
    color: {
      r: parseFloat(rgbColor.r),
      g: parseFloat(rgbColor.g),
      b: parseFloat(rgbColor.b),
    },
    opacity: parseFloat(rgbColor.a),
  };

  console.log("paintStyle", paintStyle);

  node.fills = [paintStyle];

  return {
    id: node.id,
    name: node.name,
    fills: [paintStyle],
  };
}

async function setStrokeColor(params) {
  const {
    nodeId,
    color: { r, g, b, a },
    weight = 1,
  } = params || {};

  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (!("strokes" in node)) {
    throw new Error(`Node does not support strokes: ${nodeId}`);
  }

  // 创建 RGBA 颜色
  const rgbColor = {
    r: r !== undefined ? r : 0,
    g: g !== undefined ? g : 0,
    b: b !== undefined ? b : 0,
    a: a !== undefined ? a : 1,
  };

  // 设置笔划
  const paintStyle = {
    type: "SOLID",
    color: {
      r: rgbColor.r,
      g: rgbColor.g,
      b: rgbColor.b,
    },
    opacity: rgbColor.a,
  };

  node.strokes = [paintStyle];

  // 如果可用，则设置笔划粗细
  if ("strokeWeight" in node) {
    node.strokeWeight = weight;
  }

  return {
    id: node.id,
    name: node.name,
    strokes: node.strokes,
    strokeWeight: "strokeWeight" in node ? node.strokeWeight : undefined,
  };
}

async function moveNode(params) {
  const { nodeId, x, y } = params || {};

  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }

  if (x === undefined || y === undefined) {
    throw new Error("Missing x or y parameters");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (!("x" in node) || !("y" in node)) {
    throw new Error(`Node does not support position: ${nodeId}`);
  }

  node.x = x;
  node.y = y;

  return {
    id: node.id,
    name: node.name,
    x: node.x,
    y: node.y,
  };
}

async function resizeNode(params) {
  const { nodeId, width, height } = params || {};

  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }

  if (width === undefined || height === undefined) {
    throw new Error("Missing width or height parameters");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (!("resize" in node)) {
    throw new Error(`Node does not support resizing: ${nodeId}`);
  }

  node.resize(width, height);

  return {
    id: node.id,
    name: node.name,
    width: node.width,
    height: node.height,
  };
}

async function deleteNode(params) {
  const { nodeId } = params || {};

  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  // 删除节点前保存节点信息
  const nodeInfo = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  node.remove();

  return nodeInfo;
}

async function getStyles() {
  const styles = {
    colors: await figma.getLocalPaintStylesAsync(),
    texts: await figma.getLocalTextStylesAsync(),
    effects: await figma.getLocalEffectStylesAsync(),
    grids: await figma.getLocalGridStylesAsync(),
  };

  return {
    colors: styles.colors.map((style) => ({
      id: style.id,
      name: style.name,
      key: style.key,
      paint: style.paints[0],
    })),
    texts: styles.texts.map((style) => ({
      id: style.id,
      name: style.name,
      key: style.key,
      fontSize: style.fontSize,
      fontName: style.fontName,
    })),
    effects: styles.effects.map((style) => ({
      id: style.id,
      name: style.name,
      key: style.key,
    })),
    grids: styles.grids.map((style) => ({
      id: style.id,
      name: style.name,
      key: style.key,
    })),
  };
}

async function getLocalComponents() {
  await figma.loadAllPagesAsync();

  const components = figma.root.findAllWithCriteria({
    types: ["COMPONENT"],
  });

  return {
    count: components.length,
    components: components.map((component) => ({
      id: component.id,
      name: component.name,
      key: "key" in component ? component.key : null,
    })),
  };
}

// async function getTeamComponents() {
//   try {
//     const teamComponents =
//       await figma.teamLibrary.getAvailableComponentsAsync();

//     return {
//       count: teamComponents.length,
//       components: teamComponents.map((component) => ({
//         key: component.key,
//         name: component.name,
//         description: component.description,
//         libraryName: component.libraryName,
//       })),
//     };
//   } catch (error) {
//     throw new Error(`Error getting team components: ${error.message}`);
//   }
// }

async function createComponentInstance(params) {
  const { componentKey, x = 0, y = 0 } = params || {};

  if (!componentKey) {
    throw new Error("Missing componentKey parameter");
  }

  try {
    // 首先检查本地组件库中是否存在该组件
    const localComponents = await getLocalComponents();
    const localComponent = localComponents.components.find(comp => comp.key === componentKey);
    
    let component;
    if (localComponent) {
      // 如果是本地组件，直接通过ID获取
      const componentNode = await figma.getNodeByIdAsync(localComponent.id);
      if (componentNode && componentNode.type === 'COMPONENT') {
        component = componentNode;
      } else {
        throw new Error(`Local component not found or invalid type: ${componentKey}`);
      }
    } else {
      // 如果不是本地组件，尝试从外部导入
      try {
        component = await figma.importComponentByKeyAsync(componentKey);
      } catch (importError) {
        throw new Error(`Failed to import component with key "${componentKey}". Error: ${importError.message}. Please check if the component key is correct and accessible.`);
      }
    }

    if (!component) {
      throw new Error(`Component not found with key: ${componentKey}`);
    }

    // 创建组件实例
    const instance = component.createInstance();
    
    if (!instance) {
      throw new Error(`Failed to create instance from component: ${componentKey}`);
    }

    // 添加到当前页面
    figma.currentPage.appendChild(instance);

    // 验证实例是否成功创建并添加到页面
    if (!instance.parent) {
      throw new Error("Failed to add instance to current page");
    }

    // 在添加到页面后设置位置（这样可以避免自动布局的干扰）
    instance.x = x;
    instance.y = y;

    // 再次验证位置是否设置正确
    if (instance.x !== x || instance.y !== y) {
      console.warn(`Position verification failed. Expected: (${x}, ${y}), Actual: (${instance.x}, ${instance.y})`);
      // 尝试再次设置位置
      instance.x = x;
      instance.y = y;
    }

    return {
      id: instance.id,
      name: instance.name,
      x: instance.x,
      y: instance.y,
      width: instance.width,
      height: instance.height,
      componentId: instance.componentId,
      componentKey: componentKey,
      success: true
    };
  } catch (error) {
    // 提供更详细的错误信息
    const errorMessage = error.message || String(error);
    console.error("createComponentInstance error:", errorMessage);
    
    throw new Error(`Error creating component instance: ${errorMessage}`);
  }
}

async function exportNodeAsImage(params) {
  const { nodeId, scale = 1 } = params || {};

  const format = "PNG";

  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (!("exportAsync" in node)) {
    throw new Error(`Node does not support exporting: ${nodeId}`);
  }

  try {
    const settings = {
      format: format,
      constraint: { type: "SCALE", value: scale },
    };

    const bytes = await node.exportAsync(settings);

    let mimeType;
    switch (format) {
      case "PNG":
        mimeType = "image/png";
        break;
      case "JPG":
        mimeType = "image/jpeg";
        break;
      case "SVG":
        mimeType = "image/svg+xml";
        break;
      case "PDF":
        mimeType = "application/pdf";
        break;
      default:
        mimeType = "application/octet-stream";
    }

    // 将 Uint8Array 转换为 base64 的正确方法
    const base64 = customBase64Encode(bytes);
    // const imageData = `data:${mimeType};base64,${base64}`;

    return {
      nodeId,
      format,
      scale,
      mimeType,
      imageData: base64,
    };
  } catch (error) {
    throw new Error(`Error exporting node as image: ${error.message}`);
  }
}
function customBase64Encode(bytes) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let base64 = "";

  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;

  let a, b, c, d;
  let chunk;

  // 主循环处理 3 字节的块
  for (let i = 0; i < mainLength; i = i + 3) {
    // 将三个字节组合成一个整数
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048 = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032 = (2^6 - 1) << 6
    d = chunk & 63; // 63 = 2^6 - 1

    // 将原始二进制段转换为适当的 ASCII 编码
    base64 += chars[a] + chars[b] + chars[c] + chars[d];
  }

  // 处理剩余的字节和填充
  if (byteRemainder === 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // 将 4 个最低有效位设置为零
    b = (chunk & 3) << 4; // 3 = 2^2 - 1

    base64 += chars[a] + chars[b] + "==";
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008 = (2^6 - 1) << 4

    // 将 2 个最低有效位设置为零
    c = (chunk & 15) << 2; // 15 = 2^4 - 1

    base64 += chars[a] + chars[b] + chars[c] + "=";
  }

  return base64;
}

async function setCornerRadius(params) {
  const { nodeId, radius, corners } = params || {};

  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }

  if (radius === undefined) {
    throw new Error("Missing radius parameter");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  // 检查节点是否支持圆角
  if (!("cornerRadius" in node)) {
    throw new Error(`Node does not support corner radius: ${nodeId}`);
  }

  // 如果 corners 数组提供，则设置单个圆角半径
  if (corners && Array.isArray(corners) && corners.length === 4) {
    if ("topLeftRadius" in node) {
      // 节点支持单个圆角半径
      if (corners[0]) node.topLeftRadius = radius;
      if (corners[1]) node.topRightRadius = radius;
      if (corners[2]) node.bottomRightRadius = radius;
      if (corners[3]) node.bottomLeftRadius = radius;
    } else {
      // 节点仅支持均匀圆角半径
      node.cornerRadius = radius;
    }
  } else {
    // 设置均匀圆角半径
    node.cornerRadius = radius;
  }

  return {
    id: node.id,
    name: node.name,
    cornerRadius: "cornerRadius" in node ? node.cornerRadius : undefined,
    topLeftRadius: "topLeftRadius" in node ? node.topLeftRadius : undefined,
    topRightRadius: "topRightRadius" in node ? node.topRightRadius : undefined,
    bottomRightRadius:
      "bottomRightRadius" in node ? node.bottomRightRadius : undefined,
    bottomLeftRadius:
      "bottomLeftRadius" in node ? node.bottomLeftRadius : undefined,
  };
}

async function setTextContent(params) {
  const { nodeId, text } = params || {};

  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }

  if (text === undefined) {
    throw new Error("Missing text parameter");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (node.type !== "TEXT") {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  try {
    await figma.loadFontAsync(node.fontName);

    await setCharacters(node, text);

    return {
      id: node.id,
      name: node.name,
      characters: node.characters,
      fontName: node.fontName,
    };
  } catch (error) {
    throw new Error(`Error setting text content: ${error.message}`);
  }
}

// 初始化设置加载
(async function initializePlugin() {
  try {
    const savedSettings = await figma.clientStorage.getAsync("settings");
    if (savedSettings) {
      if (savedSettings.serverPort) {
        state.serverPort = savedSettings.serverPort;
      }
    }

    // 发送初始设置到 UI
    figma.ui.postMessage({
      type: "init-settings",
      settings: {
        serverPort: state.serverPort,
      },
    });
  } catch (error) {
    console.error("Error loading settings:", error);
  }
})();

function uniqBy(arr, predicate) {
  const cb = typeof predicate === "function" ? predicate : (o) => o[predicate];
  return [
    ...arr
      .reduce((map, item) => {
        const key = item === null || item === undefined ? item : cb(item);

        map.has(key) || map.set(key, item);

        return map;
      }, new Map())
      .values(),
  ];
}
const setCharacters = async (node, characters, options) => {
  const fallbackFont = (options && options.fallbackFont) || {
    family: "Inter",
    style: "Regular",
  };
  try {
    if (node.fontName === figma.mixed) {
      if (options && options.smartStrategy === "prevail") {
        const fontHashTree = {};
        for (let i = 1; i < node.characters.length; i++) {
          const charFont = node.getRangeFontName(i - 1, i);
          const key = `${charFont.family}::${charFont.style}`;
          fontHashTree[key] = fontHashTree[key] ? fontHashTree[key] + 1 : 1;
        }
        const prevailedTreeItem = Object.entries(fontHashTree).sort(
          (a, b) => b[1] - a[1]
        )[0];
        const [family, style] = prevailedTreeItem[0].split("::");
        const prevailedFont = {
          family,
          style,
        };
        await figma.loadFontAsync(prevailedFont);
        node.fontName = prevailedFont;
      } else if (options && options.smartStrategy === "strict") {
        return setCharactersWithStrictMatchFont(node, characters, fallbackFont);
      } else if (options && options.smartStrategy === "experimental") {
        return setCharactersWithSmartMatchFont(node, characters, fallbackFont);
      } else {
        const firstCharFont = node.getRangeFontName(0, 1);
        await figma.loadFontAsync(firstCharFont);
        node.fontName = firstCharFont;
      }
    } else {
      await figma.loadFontAsync({
        family: node.fontName.family,
        style: node.fontName.style,
      });
    }
  } catch (err) {
    console.warn(
      `Failed to load "${node.fontName["family"]} ${node.fontName["style"]}" font and replaced with fallback "${fallbackFont.family} ${fallbackFont.style}"`,
      err
    );
    await figma.loadFontAsync(fallbackFont);
    node.fontName = fallbackFont;
  }
  try {
    node.characters = characters;
    return true;
  } catch (err) {
    console.warn(`Failed to set characters. Skipped.`, err);
    return false;
  }
};

const setCharactersWithStrictMatchFont = async (
  node,
  characters,
  fallbackFont
) => {
  const fontHashTree = {};
  for (let i = 1; i < node.characters.length; i++) {
    const startIdx = i - 1;
    const startCharFont = node.getRangeFontName(startIdx, i);
    const startCharFontVal = `${startCharFont.family}::${startCharFont.style}`;
    while (i < node.characters.length) {
      i++;
      const charFont = node.getRangeFontName(i - 1, i);
      if (startCharFontVal !== `${charFont.family}::${charFont.style}`) {
        break;
      }
    }
    fontHashTree[`${startIdx}_${i}`] = startCharFontVal;
  }
  await figma.loadFontAsync(fallbackFont);
  node.fontName = fallbackFont;
  node.characters = characters;
  console.log(fontHashTree);
  await Promise.all(
    Object.keys(fontHashTree).map(async (range) => {
      console.log(range, fontHashTree[range]);
      const [start, end] = range.split("_");
      const [family, style] = fontHashTree[range].split("::");
      const matchedFont = {
        family,
        style,
      };
      await figma.loadFontAsync(matchedFont);
      return node.setRangeFontName(Number(start), Number(end), matchedFont);
    })
  );
  return true;
};

const getDelimiterPos = (str, delimiter, startIdx = 0, endIdx = str.length) => {
  const indices = [];
  let temp = startIdx;
  for (let i = startIdx; i < endIdx; i++) {
    if (
      str[i] === delimiter &&
      i + startIdx !== endIdx &&
      temp !== i + startIdx
    ) {
      indices.push([temp, i + startIdx]);
      temp = i + startIdx + 1;
    }
  }
  temp !== endIdx && indices.push([temp, endIdx]);
  return indices.filter(Boolean);
};

const buildLinearOrder = (node) => {
  const fontTree = [];
  const newLinesPos = getDelimiterPos(node.characters, "\n");
  newLinesPos.forEach(([newLinesRangeStart, newLinesRangeEnd], n) => {
    const newLinesRangeFont = node.getRangeFontName(
      newLinesRangeStart,
      newLinesRangeEnd
    );
    if (newLinesRangeFont === figma.mixed) {
      const spacesPos = getDelimiterPos(
        node.characters,
        " ",
        newLinesRangeStart,
        newLinesRangeEnd
      );
      spacesPos.forEach(([spacesRangeStart, spacesRangeEnd], s) => {
        const spacesRangeFont = node.getRangeFontName(
          spacesRangeStart,
          spacesRangeEnd
        );
        if (spacesRangeFont === figma.mixed) {
          const spacesRangeFont = node.getRangeFontName(
            spacesRangeStart,
            spacesRangeStart[0]
          );
          fontTree.push({
            start: spacesRangeStart,
            delimiter: " ",
            family: spacesRangeFont.family,
            style: spacesRangeFont.style,
          });
        } else {
          fontTree.push({
            start: spacesRangeStart,
            delimiter: " ",
            family: spacesRangeFont.family,
            style: spacesRangeFont.style,
          });
        }
      });
    } else {
      fontTree.push({
        start: newLinesRangeStart,
        delimiter: "\n",
        family: newLinesRangeFont.family,
        style: newLinesRangeFont.style,
      });
    }
  });
  return fontTree
    .sort((a, b) => +a.start - +b.start)
    .map(({ family, style, delimiter }) => ({ family, style, delimiter }));
};

const setCharactersWithSmartMatchFont = async (
  node,
  characters,
  fallbackFont
) => {
  const rangeTree = buildLinearOrder(node);
  const fontsToLoad = uniqBy(
    rangeTree,
    ({ family, style }) => `${family}::${style}`
  ).map(({ family, style }) => ({
    family,
    style,
  }));

  await Promise.all([...fontsToLoad, fallbackFont].map(figma.loadFontAsync));

  node.fontName = fallbackFont;
  node.characters = characters;

  let prevPos = 0;
  rangeTree.forEach(({ family, style, delimiter }) => {
    if (prevPos < node.characters.length) {
      const delimeterPos = node.characters.indexOf(delimiter, prevPos);
      const endPos =
        delimeterPos > prevPos ? delimeterPos : node.characters.length;
      const matchedFont = {
        family,
        style,
      };
      node.setRangeFontName(prevPos, endPos, matchedFont);
      prevPos = endPos + 1;
    }
  });
  return true;
};

// 添加 cloneNode 函数实现
async function cloneNode(params) {
  const { nodeId, x, y } = params || {};

  if (!nodeId) {
    throw new Error("Missing nodeId parameter");
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  // 克隆节点
  const clone = node.clone();

  // 如果 x 和 y 提供，则将克隆移动到该位置
  if (x !== undefined && y !== undefined) {
    if (!("x" in clone) || !("y" in clone)) {
      throw new Error(`Cloned node does not support position: ${nodeId}`);
    }
    clone.x = x;
    clone.y = y;
  }

  // 将克隆添加到与原始节点相同的父节点
  if (node.parent) {
    node.parent.appendChild(clone);
  } else {
    figma.currentPage.appendChild(clone);
  }

  return {
    id: clone.id,
    name: clone.name,
    x: "x" in clone ? clone.x : undefined,
    y: "y" in clone ? clone.y : undefined,
    width: "width" in clone ? clone.width : undefined,
    height: "height" in clone ? clone.height : undefined,
  };
}

async function scanTextNodes(params) {
  console.log(`Starting to scan text nodes from node ID: ${params.nodeId}`);
  const {
    nodeId,
    useChunking = true,
    chunkSize = 10,
    commandId = generateCommandId(),
  } = params || {};

  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    console.error(`Node with ID ${nodeId} not found`);
    // 发送错误进度更新
    sendProgressUpdate(
      commandId,
      "scan_text_nodes",
      "error",
      0,
      0,
      0,
      `Node with ID ${nodeId} not found`,
      { error: `Node not found: ${nodeId}` }
    );
    throw new Error(`Node with ID ${nodeId} not found`);
  }

  // 如果分块未启用，则使用原始实现
  if (!useChunking) {
    const textNodes = [];
    try {
      // 发送开始进度更新
      sendProgressUpdate(
        commandId,
        "scan_text_nodes",
        "started",
        0,
        1, // 尚不知道有多少节点
        0,
        `Starting scan of node "${node.name || nodeId}" without chunking`,
        null
      );

      await findTextNodes(node, [], 0, textNodes);

      // 发送完成进度更新
      sendProgressUpdate(
        commandId,
        "scan_text_nodes",
        "completed",
        100,
        textNodes.length,
        textNodes.length,
        `Scan complete. Found ${textNodes.length} text nodes.`,
        { textNodes }
      );

      return {
        success: true,
        message: `Scanned ${textNodes.length} text nodes.`,
        count: textNodes.length,
        textNodes: textNodes,
        commandId,
      };
    } catch (error) {
      console.error("Error scanning text nodes:", error);

      // 发送错误进度更新
      sendProgressUpdate(
        commandId,
        "scan_text_nodes",
        "error",
        0,
        0,
        0,
        `Error scanning text nodes: ${error.message}`,
        { error: error.message }
      );

      throw new Error(`Error scanning text nodes: ${error.message}`);
    }
  }

  // 分块实现
  console.log(`使用分块扫描，块大小: ${chunkSize}`);

  // 首先，收集所有要处理的节点（尚未处理它们）
  const nodesToProcess = [];

  // Send started progress update
  sendProgressUpdate(
    commandId,
    "scan_text_nodes",
    "started",
    0,
    0, // 尚不知道有多少节点
    0,
    `Starting chunked scan of node "${node.name || nodeId}"`,
    { chunkSize }
  );

  await collectNodesToProcess(node, [], 0, nodesToProcess);

  const totalNodes = nodesToProcess.length;
  console.log(`Found ${totalNodes} total nodes to process`);

  // 计算需要的块数
  const totalChunks = Math.ceil(totalNodes / chunkSize);
  console.log(`Will process in ${totalChunks} chunks`);

  // 发送更新后节点收集
  sendProgressUpdate(
    commandId,
    "scan_text_nodes",
    "in_progress",
    5, // 收集阶段的 5% 进度
    totalNodes,
    0,
    `Found ${totalNodes} nodes to scan. Will process in ${totalChunks} chunks.`,
    {
      totalNodes,
      totalChunks,
      chunkSize,
    }
  );

  // 分块处理节点
  const allTextNodes = [];
  let processedNodes = 0;
  let chunksProcessed = 0;

  for (let i = 0; i < totalNodes; i += chunkSize) {
    const chunkEnd = Math.min(i + chunkSize, totalNodes);
    console.log(
      `Processing chunk ${chunksProcessed + 1}/${totalChunks} (nodes ${i} to ${chunkEnd - 1
      })`
    );

    // 发送更新前处理块
    sendProgressUpdate(
      commandId,
      "scan_text_nodes",
      "in_progress",
      Math.round(5 + (chunksProcessed / totalChunks) * 90), // 处理阶段的 5-95% 进度
      totalNodes,
      processedNodes,
      `Processing chunk ${chunksProcessed + 1}/${totalChunks}`,
      {
        currentChunk: chunksProcessed + 1,
        totalChunks,
        textNodesFound: allTextNodes.length,
      }
    );

    const chunkNodes = nodesToProcess.slice(i, chunkEnd);
    const chunkTextNodes = [];

    // 处理此块中的每个节点
    for (const nodeInfo of chunkNodes) {
      if (nodeInfo.node.type === "TEXT") {
        try {
          const textNodeInfo = await processTextNode(
            nodeInfo.node,
            nodeInfo.parentPath,
            nodeInfo.depth
          );
          if (textNodeInfo) {
            chunkTextNodes.push(textNodeInfo);
          }
        } catch (error) {
          console.error(`Error processing text node: ${error.message}`);
          // 继续处理其他节点
        }
      }

      // 短暂的延迟以允许 UI 更新并防止冻结
      await delay(5);
    }

    // 添加此块的结果
    allTextNodes.push(...chunkTextNodes);
    processedNodes += chunkNodes.length;
    chunksProcessed++;

    // 发送更新后处理块
    sendProgressUpdate(
      commandId,
      "scan_text_nodes",
      "in_progress",
      Math.round(5 + (chunksProcessed / totalChunks) * 90), // 处理阶段的 5-95% 进度
      totalNodes,
      processedNodes,
      `Processed chunk ${chunksProcessed}/${totalChunks}. Found ${allTextNodes.length} text nodes so far.`,
      {
        currentChunk: chunksProcessed,
        totalChunks,
        processedNodes,
        textNodesFound: allTextNodes.length,
        chunkResult: chunkTextNodes,
      }
    );

    // 小块之间的短暂延迟以防止 UI 冻结
    if (i + chunkSize < totalNodes) {
      await delay(50);
    }
  }

  // 发送完成进度更新
  sendProgressUpdate(
    commandId,
    "scan_text_nodes",
    "completed",
    100,
    totalNodes,
    processedNodes,
    `Scan complete. Found ${allTextNodes.length} text nodes.`,
    {
      textNodes: allTextNodes,
      processedNodes,
      chunks: chunksProcessed,
    }
  );

  return {
    success: true,
    message: `Chunked scan complete. Found ${allTextNodes.length} text nodes.`,
    totalNodes: allTextNodes.length,
    processedNodes: processedNodes,
    chunks: chunksProcessed,
    textNodes: allTextNodes,
    commandId,
  };
}

// 辅助函数，收集所有需要处理的节点
async function collectNodesToProcess(
  node,
  parentPath = [],
  depth = 0,
  nodesToProcess = []
) {
  // 跳过不可见节点
  if (node.visible === false) return;

  // 获取此节点的路径
  const nodePath = [...parentPath, node.name || `Unnamed ${node.type}`];

  // 将此节点添加到处理列表
  nodesToProcess.push({
    node: node,
    parentPath: nodePath,
    depth: depth,
  });

  // 递归添加子节点
  if ("children" in node) {
    for (const child of node.children) {
      await collectNodesToProcess(child, nodePath, depth + 1, nodesToProcess);
    }
  }
}

// 处理单个文本节点
async function processTextNode(node, parentPath, depth) {
  if (node.type !== "TEXT") return null;

  try {
    // 安全提取字体信息
    let fontFamily = "";
    let fontStyle = "";

    if (node.fontName) {
      if (typeof node.fontName === "object") {
        if ("family" in node.fontName) fontFamily = node.fontName.family;
        if ("style" in node.fontName) fontStyle = node.fontName.style;
      }
    }

    // 创建文本节点的安全表示
    const safeTextNode = {
      id: node.id,
      name: node.name || "Text",
      type: node.type,
      characters: node.characters,
      fontSize: typeof node.fontSize === "number" ? node.fontSize : 0,
      fontFamily: fontFamily,
      fontStyle: fontStyle,
      x: typeof node.x === "number" ? node.x : 0,
      y: typeof node.y === "number" ? node.y : 0,
      width: typeof node.width === "number" ? node.width : 0,
      height: typeof node.height === "number" ? node.height : 0,
      path: parentPath.join(" > "),
      depth: depth,
    };

    // 短暂高亮节点（可选视觉反馈）
    try {
      const originalFills = JSON.parse(JSON.stringify(node.fills));
      node.fills = [
        {
          type: "SOLID",
          color: { r: 1, g: 0.5, b: 0 },
          opacity: 0.3,
        },
      ];

      // 短暂的延迟以使高亮可见
      await delay(100);

      try {
        node.fills = originalFills;
      } catch (err) {
        console.error("Error resetting fills:", err);
      }
    } catch (highlightErr) {
      console.error("Error highlighting text node:", highlightErr);
      // 继续，高亮只是视觉反馈
    }

    return safeTextNode;
  } catch (nodeErr) {
    console.error("Error processing text node:", nodeErr);
    return null;
  }
}

// 返回一个延迟函数的函数
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 保持原始的 findTextNodes 用于向后兼容
async function findTextNodes(node, parentPath = [], depth = 0, textNodes = []) {
  // 跳过不可见节点
  if (node.visible === false) return;

  // 获取此节点的路径，包括其名称
  const nodePath = [...parentPath, node.name || `Unnamed ${node.type}`];

  if (node.type === "TEXT") {
    try {
      // 安全提取字体信息以避免 Symbol 序列化问题
      let fontFamily = "";
      let fontStyle = "";

      if (node.fontName) {
        if (typeof node.fontName === "object") {
          if ("family" in node.fontName) fontFamily = node.fontName.family;
          if ("style" in node.fontName) fontStyle = node.fontName.style;
        }
      }

      // 创建文本节点的安全表示，仅包含可序列化的属性
      const safeTextNode = {
        id: node.id,
        name: node.name || "Text",
        type: node.type,
        characters: node.characters,
        fontSize: typeof node.fontSize === "number" ? node.fontSize : 0,
        fontFamily: fontFamily,
        fontStyle: fontStyle,
        x: typeof node.x === "number" ? node.x : 0,
        y: typeof node.y === "number" ? node.y : 0,
        width: typeof node.width === "number" ? node.width : 0,
        height: typeof node.height === "number" ? node.height : 0,
        path: nodePath.join(" > "),
        depth: depth,
      };

      // 仅当不是通过 API 高亮时才高亮节点
      try {
        // 安全创建临时高亮，不会导致序列化问题
        const originalFills = JSON.parse(JSON.stringify(node.fills));
        node.fills = [
          {
            type: "SOLID",
            color: { r: 1, g: 0.5, b: 0 },
            opacity: 0.3,
          },
        ];

        // 使用 Promise 延迟而不是 setTimeout
        await delay(500);

        try {
          node.fills = originalFills;
        } catch (err) {
          console.error("Error resetting fills:", err);
        }
      } catch (highlightErr) {
        console.error("Error highlighting text node:", highlightErr);
        // 继续，高亮只是视觉反馈
      }

      textNodes.push(safeTextNode);
    } catch (nodeErr) {
      console.error("Error processing text node:", nodeErr);
      // 跳过此节点，但继续处理其他节点
    }
  }

  // 递归处理容器节点的子节点
  if ("children" in node) {
    for (const child of node.children) {
      await findTextNodes(child, nodePath, depth + 1, textNodes);
    }
  }
}

// 替换特定节点的文本
async function setMultipleTextContents(params) {
  const { nodeId, text } = params || {};
  const commandId = params.commandId || generateCommandId();

  if (!nodeId || !text || !Array.isArray(text)) {
    const errorMsg = "Missing required parameters: nodeId and text array";

    // 发送错误进度更新
    sendProgressUpdate(
      commandId,
      "set_multiple_text_contents",
      "error",
      0,
      0,
      0,
      errorMsg,
      { error: errorMsg }
    );

    throw new Error(errorMsg);
  }

  console.log(
    `Starting text replacement for node: ${nodeId} with ${text.length} text replacements`
  );

  // 发送开始进度更新
  sendProgressUpdate(
    commandId,
    "set_multiple_text_contents",
    "started",
    0,
    text.length,
    0,
    `Starting text replacement for ${text.length} nodes`,
    { totalReplacements: text.length }
  );

  // 定义结果数组和计数器
  const results = [];
  let successCount = 0;
  let failureCount = 0;

  // 将文本替换分为 5 个块
  const CHUNK_SIZE = 5;
  const chunks = [];

  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  console.log(`Split ${text.length} replacements into ${chunks.length} chunks`);

  // 发送分块信息更新
  sendProgressUpdate(
    commandId,
    "set_multiple_text_contents",
    "in_progress",
    5, // 规划阶段的 5% 进度
    text.length,
    0,
    `Preparing to replace text in ${text.length} nodes using ${chunks.length} chunks`,
    {
      totalReplacements: text.length,
      chunks: chunks.length,
      chunkSize: CHUNK_SIZE,
    }
  );

  // 顺序处理每个块
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    console.log(
      `Processing chunk ${chunkIndex + 1}/${chunks.length} with ${chunk.length
      } replacements`
    );

    // 发送块处理开始更新
    sendProgressUpdate(
      commandId,
      "set_multiple_text_contents",
      "in_progress",
      Math.round(5 + (chunkIndex / chunks.length) * 90), // 处理阶段的 5-95% 进度
      text.length,
      successCount + failureCount,
      `Processing text replacements chunk ${chunkIndex + 1}/${chunks.length}`,
      {
        currentChunk: chunkIndex + 1,
        totalChunks: chunks.length,
        successCount,
        failureCount,
      }
    );

    // 并行处理块中的替换
    const chunkPromises = chunk.map(async (replacement) => {
      if (!replacement.nodeId || replacement.text === undefined) {
        console.error(`Missing nodeId or text for replacement`);
        return {
          success: false,
          nodeId: replacement.nodeId || "unknown",
          error: "Missing nodeId or text in replacement entry",
        };
      }

      try {
        console.log(
          `Attempting to replace text in node: ${replacement.nodeId}`
        );

        // 获取要更新的文本节点（仅检查它是否存在并获取原始文本）
        const textNode = await figma.getNodeByIdAsync(replacement.nodeId);

        if (!textNode) {
          console.error(`Text node not found: ${replacement.nodeId}`);
          return {
            success: false,
            nodeId: replacement.nodeId,
            error: `Node not found: ${replacement.nodeId}`,
          };
        }

        if (textNode.type !== "TEXT") {
          console.error(
            `Node is not a text node: ${replacement.nodeId} (type: ${textNode.type})`
          );
          return {
            success: false,
            nodeId: replacement.nodeId,
            error: `Node is not a text node: ${replacement.nodeId} (type: ${textNode.type})`,
          };
        }

        // 保存原始文本以用于结果
        const originalText = textNode.characters;
        console.log(`Original text: "${originalText}"`);
        console.log(`Will translate to: "${replacement.text}"`);

        // 在更改文本之前高亮节点
        let originalFills;
        try {
          // 保存原始填充以稍后恢复
          originalFills = JSON.parse(JSON.stringify(textNode.fills));
          // 应用高亮颜色（橙色，30% 不透明度）
          textNode.fills = [
            {
              type: "SOLID",
              color: { r: 1, g: 0.5, b: 0 },
              opacity: 0.3,
            },
          ];
        } catch (highlightErr) {
          console.error(
            `Error highlighting text node: ${highlightErr.message}`
          );
          // 继续，高亮只是视觉反馈
        }

        // 使用现有的 setTextContent 函数处理字体加载和文本设置
        await setTextContent({
          nodeId: replacement.nodeId,
          text: replacement.text,
        });

        // 在文本更改后保持高亮一段时间，然后恢复原始填充
        if (originalFills) {
          try {
            // 使用延迟函数以一致的计时
            await delay(500);
            textNode.fills = originalFills;
          } catch (restoreErr) {
            console.error(`Error restoring fills: ${restoreErr.message}`);
          }
        }

        console.log(
          `Successfully replaced text in node: ${replacement.nodeId}`
        );
        return {
          success: true,
          nodeId: replacement.nodeId,
          originalText: originalText,
          translatedText: replacement.text,
        };
      } catch (error) {
        console.error(
          `Error replacing text in node ${replacement.nodeId}: ${error.message}`
        );
        return {
          success: false,
          nodeId: replacement.nodeId,
          error: `Error applying replacement: ${error.message}`,
        };
      }
    });

    // 等待此块中的所有替换完成
    const chunkResults = await Promise.all(chunkPromises);

    // 处理此块的结果
    chunkResults.forEach((result) => {
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      results.push(result);
    });

    // 发送块处理完成更新，带有部分结果
    sendProgressUpdate(
      commandId,
      "set_multiple_text_contents",
      "in_progress",
      Math.round(5 + ((chunkIndex + 1) / chunks.length) * 90), // 处理阶段的 5-95% 进度
      text.length,
      successCount + failureCount,
      `Completed chunk ${chunkIndex + 1}/${chunks.length
      }. ${successCount} successful, ${failureCount} failed so far.`,
      {
        currentChunk: chunkIndex + 1,
        totalChunks: chunks.length,
        successCount,
        failureCount,
        chunkResults: chunkResults,
      }
    );

    // 在块之间添加一个小延迟以避免过载 Figma
    if (chunkIndex < chunks.length - 1) {
      console.log("Pausing between chunks to avoid overloading Figma...");
      await delay(1000); // 1 second delay between chunks
    }
  }

  console.log(
    `Replacement complete: ${successCount} successful, ${failureCount} failed`
  );

  // 发送完成进度更新
  sendProgressUpdate(
    commandId,
    "set_multiple_text_contents",
    "completed",
    100,
    text.length,
    successCount + failureCount,
    `Text replacement complete: ${successCount} successful, ${failureCount} failed`,
    {
      totalReplacements: text.length,
      replacementsApplied: successCount,
      replacementsFailed: failureCount,
      completedInChunks: chunks.length,
      results: results,
    }
  );

  return {
    success: successCount > 0,
    nodeId: nodeId,
    replacementsApplied: successCount,
    replacementsFailed: failureCount,
    totalReplacements: text.length,
    results: results,
    completedInChunks: chunks.length,
    commandId,
  };
}

// 生成简单 UUID 的函数，用于命令 ID
function generateCommandId() {
  return (
    "cmd_" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

async function getAnnotations(params) {
  try {
    const { nodeId, includeCategories = true } = params;

    // 如果需要，首先获取类别
    let categoriesMap = {};
    if (includeCategories) {
      const categories = await figma.annotations.getAnnotationCategoriesAsync();
      categoriesMap = categories.reduce((map, category) => {
        map[category.id] = {
          id: category.id,
          label: category.label,
          color: category.color,
          isPreset: category.isPreset,
        };
        return map;
      }, {});
    }

    if (nodeId) {
      // 获取特定节点的注释
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      if (!("annotations" in node)) {
        throw new Error(`Node type ${node.type} does not support annotations`);
      }

      const result = {
        nodeId: node.id,
        name: node.name,
        annotations: node.annotations || [],
      };

      if (includeCategories) {
        result.categories = Object.values(categoriesMap);
      }

      return result;
    } else {
      // 获取当前页面的所有注释
      const annotations = [];
      const processNode = async (node) => {
        if (
          "annotations" in node &&
          node.annotations &&
          node.annotations.length > 0
        ) {
          annotations.push({
            nodeId: node.id,
            name: node.name,
            annotations: node.annotations,
          });
        }
        if ("children" in node) {
          for (const child of node.children) {
            await processNode(child);
          }
        }
      };

      // 从当前页面开始
      await processNode(figma.currentPage);

      const result = {
        annotatedNodes: annotations,
      };

      if (includeCategories) {
        result.categories = Object.values(categoriesMap);
      }

      return result;
    }
  } catch (error) {
    console.error("Error in getAnnotations:", error);
    throw error;
  }
}

async function setAnnotation(params) {
  try {
    console.log("=== setAnnotation Debug Start ===");
    console.log("Input params:", JSON.stringify(params, null, 2));

    const { nodeId, annotationId, labelMarkdown, categoryId, properties } =
      params;

    // 验证必需的参数
    if (!nodeId) {
      console.error("Validation failed: Missing nodeId");
      return { success: false, error: "Missing nodeId" };
    }

    if (!labelMarkdown) {
      console.error("Validation failed: Missing labelMarkdown");
      return { success: false, error: "Missing labelMarkdown" };
    }

    console.log("Attempting to get node:", nodeId);
    // 获取并验证节点
    const node = await figma.getNodeByIdAsync(nodeId);
    console.log("Node lookup result:", {
      id: nodeId,
      found: !!node,
      type: node ? node.type : undefined,
      name: node ? node.name : undefined,
      hasAnnotations: node ? "annotations" in node : false,
    });

    if (!node) {
      console.error("Node lookup failed:", nodeId);
      return { success: false, error: `Node not found: ${nodeId}` };
    }

    // 验证节点是否支持注释
    if (!("annotations" in node)) {
      console.error("Node annotation support check failed:", {
        nodeType: node.type,
        nodeId: node.id,
      });
      return {
        success: false,
        error: `Node type ${node.type} does not support annotations`,
      };
    }

    // 创建注释对象
    const newAnnotation = {
      labelMarkdown,
    };

    // 验证并添加 categoryId 如果提供
    if (categoryId) {
      console.log("Adding categoryId to annotation:", categoryId);
      newAnnotation.categoryId = categoryId;
    }

    // 验证并添加属性如果提供
    if (properties && Array.isArray(properties) && properties.length > 0) {
      console.log(
        "Adding properties to annotation:",
        JSON.stringify(properties, null, 2)
      );
      newAnnotation.properties = properties;
    }

    // 记录更新前的注释
    console.log("Current node annotations:", node.annotations);

    // 覆盖注释
    console.log(
      "Setting new annotation:",
      JSON.stringify(newAnnotation, null, 2)
    );
    node.annotations = [newAnnotation];

    // 验证更新
    console.log("Updated node annotations:", node.annotations);
    console.log("=== setAnnotation Debug End ===");

    return {
      success: true,
      nodeId: node.id,
      name: node.name,
      annotations: node.annotations,
    };
  } catch (error) {
    console.error("=== setAnnotation Error ===");
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      params: JSON.stringify(params, null, 2),
    });
    return { success: false, error: error.message };
  }
}

/**
 * 扫描特定类型的节点
 * @param {Object} params - 参数对象
 * @param {string} params.nodeId - 要扫描的节点的 ID
 * @param {Array<string>} params.types - 要查找的节点类型数组（例如 ['COMPONENT', 'FRAME']）
 * @returns {Object} - 包含找到的节点的对象
 */
async function scanNodesByTypes(params) {
  console.log(`Starting to scan nodes by types from node ID: ${params.nodeId}`);
  const { nodeId, types = [] } = params || {};

  if (!types || types.length === 0) {
    throw new Error("No types specified to search for");
  }

  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node with ID ${nodeId} not found`);
  }

  // 简单的实现，没有分块
  const matchingNodes = [];

  // 发送单个进度更新以通知开始
  const commandId = generateCommandId();
  sendProgressUpdate(
    commandId,
    "scan_nodes_by_types",
    "started",
    0,
    1,
    0,
    `Starting scan of node "${node.name || nodeId}" for types: ${types.join(
      ", "
    )}`,
    null
  );

  // 递归查找指定类型的节点
  await findNodesByTypes(node, types, matchingNodes);

  // 发送完成更新
  sendProgressUpdate(
    commandId,
    "scan_nodes_by_types",
    "completed",
    100,
    matchingNodes.length,
    matchingNodes.length,
    `Scan complete. Found ${matchingNodes.length} matching nodes.`,
    { matchingNodes }
  );

  return {
    success: true,
    message: `Found ${matchingNodes.length} matching nodes.`,
    count: matchingNodes.length,
    matchingNodes: matchingNodes,
    searchedTypes: types,
  };
}

/**
 * 辅助函数，递归查找特定类型的节点
 * @param {SceneNode} node - 要从中开始搜索的根节点
 * @param {Array<string>} types - 要查找的节点类型数组
 * @param {Array} matchingNodes - 存储找到的节点的数组
 */
async function findNodesByTypes(node, types, matchingNodes = []) {
  // 跳过不可见节点
  if (node.visible === false) return;

  // 检查此节点是否是指定类型之一
  if (types.includes(node.type)) {
    // 创建一个最小表示，仅包含 ID、类型和 bbox
    matchingNodes.push({
      id: node.id,
      name: node.name || `Unnamed ${node.type}`,
      type: node.type,
      // 基本边界框信息
      bbox: {
        x: typeof node.x === "number" ? node.x : 0,
        y: typeof node.y === "number" ? node.y : 0,
        width: typeof node.width === "number" ? node.width : 0,
        height: typeof node.height === "number" ? node.height : 0,
      },
    });
  }

  // 递归处理容器节点的子节点
  if ("children" in node) {
    for (const child of node.children) {
      await findNodesByTypes(child, types, matchingNodes);
    }
  }
}

// 设置多个注释，使用异步进度更新
async function setMultipleAnnotations(params) {
  console.log("=== setMultipleAnnotations Debug Start ===");
  console.log("Input params:", JSON.stringify(params, null, 2));

  const { nodeId, annotations } = params;

  if (!annotations || annotations.length === 0) {
    console.error("Validation failed: No annotations provided");
    return { success: false, error: "No annotations provided" };
  }

  console.log(
    `Processing ${annotations.length} annotations for node ${nodeId}`
  );

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  // 顺序处理注释
  for (let i = 0; i < annotations.length; i++) {
    const annotation = annotations[i];
    console.log(
      `\nProcessing annotation ${i + 1}/${annotations.length}:`,
      JSON.stringify(annotation, null, 2)
    );

    try {
      console.log("Calling setAnnotation with params:", {
        nodeId: annotation.nodeId,
        labelMarkdown: annotation.labelMarkdown,
        categoryId: annotation.categoryId,
        properties: annotation.properties,
      });

      const result = await setAnnotation({
        nodeId: annotation.nodeId,
        labelMarkdown: annotation.labelMarkdown,
        categoryId: annotation.categoryId,
        properties: annotation.properties,
      });

      console.log("setAnnotation result:", JSON.stringify(result, null, 2));

      if (result.success) {
        successCount++;
        results.push({ success: true, nodeId: annotation.nodeId });
        console.log(`✓ Annotation ${i + 1} applied successfully`);
      } else {
        failureCount++;
        results.push({
          success: false,
          nodeId: annotation.nodeId,
          error: result.error,
        });
        console.error(`✗ Annotation ${i + 1} failed:`, result.error);
      }
    } catch (error) {
      failureCount++;
      const errorResult = {
        success: false,
        nodeId: annotation.nodeId,
        error: error.message,
      };
      results.push(errorResult);
      console.error(`✗ Annotation ${i + 1} failed with error:`, error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
  }

  const summary = {
    success: successCount > 0,
    annotationsApplied: successCount,
    annotationsFailed: failureCount,
    totalAnnotations: annotations.length,
    results: results,
  };

  console.log("\n=== setMultipleAnnotations Summary ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log("=== setMultipleAnnotations Debug End ===");

  return summary;
}

async function deleteMultipleNodes(params) {
  const { nodeIds } = params || {};
  const commandId = generateCommandId();

  if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
    const errorMsg = "Missing or invalid nodeIds parameter";
    sendProgressUpdate(
      commandId,
      "delete_multiple_nodes",
      "error",
      0,
      0,
      0,
      errorMsg,
      { error: errorMsg }
    );
    throw new Error(errorMsg);
  }

  console.log(`Starting deletion of ${nodeIds.length} nodes`);

  // 发送开始进度更新
  sendProgressUpdate(
    commandId,
    "delete_multiple_nodes",
    "started",
    0,
    nodeIds.length,
    0,
    `Starting deletion of ${nodeIds.length} nodes`,
    { totalNodes: nodeIds.length }
  );

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  // 将节点分为 5 个块以避免过载 Figma
  const CHUNK_SIZE = 5;
  const chunks = [];

  for (let i = 0; i < nodeIds.length; i += CHUNK_SIZE) {
    chunks.push(nodeIds.slice(i, i + CHUNK_SIZE));
  }

  console.log(`Split ${nodeIds.length} deletions into ${chunks.length} chunks`);

  // 发送分块信息更新
  sendProgressUpdate(
    commandId,
    "delete_multiple_nodes",
    "in_progress",
    5,
    nodeIds.length,
    0,
    `Preparing to delete ${nodeIds.length} nodes using ${chunks.length} chunks`,
    {
      totalNodes: nodeIds.length,
      chunks: chunks.length,
      chunkSize: CHUNK_SIZE,
    }
  );

  // 顺序处理每个块
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    console.log(
      `Processing chunk ${chunkIndex + 1}/${chunks.length} with ${chunk.length
      } nodes`
    );

    // 发送块处理开始更新
    sendProgressUpdate(
      commandId,
      "delete_multiple_nodes",
      "in_progress",
      Math.round(5 + (chunkIndex / chunks.length) * 90),
      nodeIds.length,
      successCount + failureCount,
      `Processing deletion chunk ${chunkIndex + 1}/${chunks.length}`,
      {
        currentChunk: chunkIndex + 1,
        totalChunks: chunks.length,
        successCount,
        failureCount,
      }
    );

    // 并行处理块中的删除
    const chunkPromises = chunk.map(async (nodeId) => {
      try {
        const node = await figma.getNodeByIdAsync(nodeId);

        if (!node) {
          console.error(`Node not found: ${nodeId}`);
          return {
            success: false,
            nodeId: nodeId,
            error: `Node not found: ${nodeId}`,
          };
        }

        // 保存节点信息以用于删除
        const nodeInfo = {
          id: node.id,
          name: node.name,
          type: node.type,
        };

        // 删除节点
        node.remove();

        console.log(`Successfully deleted node: ${nodeId}`);
        return {
          success: true,
          nodeId: nodeId,
          nodeInfo: nodeInfo,
        };
      } catch (error) {
        console.error(`Error deleting node ${nodeId}: ${error.message}`);
        return {
          success: false,
          nodeId: nodeId,
          error: error.message,
        };
      }
    });

    // 等待此块中的所有删除完成
    const chunkResults = await Promise.all(chunkPromises);

    // 处理此块的结果
    chunkResults.forEach((result) => {
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      results.push(result);
    });

    // 发送块处理完成更新
    sendProgressUpdate(
      commandId,
      "delete_multiple_nodes",
      "in_progress",
      Math.round(5 + ((chunkIndex + 1) / chunks.length) * 90),
      nodeIds.length,
      successCount + failureCount,
      `Completed chunk ${chunkIndex + 1}/${chunks.length
      }. ${successCount} successful, ${failureCount} failed so far.`,
      {
        currentChunk: chunkIndex + 1,
        totalChunks: chunks.length,
        successCount,
        failureCount,
        chunkResults: chunkResults,
      }
    );

    // 在块之间添加一个小延迟以避免过载 Figma
    if (chunkIndex < chunks.length - 1) {
      console.log("Pausing between chunks...");
      await delay(1000);
    }
  }

  console.log(
    `Deletion complete: ${successCount} successful, ${failureCount} failed`
  );

  // 发送完成进度更新
  sendProgressUpdate(
    commandId,
    "delete_multiple_nodes",
    "completed",
    100,
    nodeIds.length,
    successCount + failureCount,
    `Node deletion complete: ${successCount} successful, ${failureCount} failed`,
    {
      totalNodes: nodeIds.length,
      nodesDeleted: successCount,
      nodesFailed: failureCount,
      completedInChunks: chunks.length,
      results: results,
    }
  );

  return {
    success: successCount > 0,
    nodesDeleted: successCount,
    nodesFailed: failureCount,
    totalNodes: nodeIds.length,
    results: results,
    completedInChunks: chunks.length,
    commandId,
  };
}

// 实现 getInstanceOverrides 函数
async function getInstanceOverrides(instanceNode = null) {
  console.log("=== getInstanceOverrides called ===");

  let sourceInstance = null;

  // 检查是否直接传递了实例节点
  if (instanceNode) {
    console.log("Using provided instance node");

    // 验证提供的节点是否是实例
    if (instanceNode.type !== "INSTANCE") {
      console.error("Provided node is not an instance");
      figma.notify("Provided node is not a component instance");
      return { success: false, message: "Provided node is not a component instance" };
    }

    sourceInstance = instanceNode;
  } else {
    // 没有提供节点，使用选择
    console.log("No node provided, using current selection");

    // 获取当前选择
    const selection = figma.currentPage.selection;

    // 检查是否有任何选择
    if (selection.length === 0) {
      console.log("No nodes selected");
      figma.notify("Please select at least one instance");
      return { success: false, message: "No nodes selected" };
    }

    // 过滤选择中的实例
    const instances = selection.filter(node => node.type === "INSTANCE");

    if (instances.length === 0) {
      console.log("No instances found in selection");
      figma.notify("Please select at least one component instance");
      return { success: false, message: "No instances found in selection" };
    }

    // 从选择中获取第一个实例
    sourceInstance = instances[0];
  }

  try {
    console.log(`Getting instance information:`);
    console.log(sourceInstance);

    // 获取组件覆盖和主组件
    const overrides = sourceInstance.overrides || [];
    console.log(`  Raw Overrides:`, overrides);

    // 获取主组件
    const mainComponent = await sourceInstance.getMainComponentAsync();
    if (!mainComponent) {
      console.error("Failed to get main component");
      figma.notify("Failed to get main component");
      return { success: false, message: "Failed to get main component" };
    }

    // 返回数据到 MCP 服务器
    const returnData = {
      success: true,
      message: `Got component information from "${sourceInstance.name}" for overrides.length: ${overrides.length}`,
      sourceInstanceId: sourceInstance.id,
      mainComponentId: mainComponent.id,
      overridesCount: overrides.length
    };

    console.log("Data to return to MCP server:", returnData);
    figma.notify(`Got component information from "${sourceInstance.name}"`);

    return returnData;
  } catch (error) {
    console.error("Error in getInstanceOverrides:", error);
    figma.notify(`Error: ${error.message}`);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
}

/**
 * 辅助函数，验证并获取目标实例
 * @param {string[]} targetNodeIds - 实例节点 ID 数组
 * @returns {instanceNode[]} targetInstances - 目标实例数组
 */
async function getValidTargetInstances(targetNodeIds) {
  let targetInstances = [];

  // 处理实例数组或单个实例
  if (Array.isArray(targetNodeIds)) {
    if (targetNodeIds.length === 0) {
      return { success: false, message: "No instances provided" };
    }
    for (const targetNodeId of targetNodeIds) {
      const targetNode = await figma.getNodeByIdAsync(targetNodeId);
      if (targetNode && targetNode.type === "INSTANCE") {
        targetInstances.push(targetNode);
      }
    }
    if (targetInstances.length === 0) {
      return { success: false, message: "No valid instances provided" };
    }
  } else {
    return { success: false, message: "Invalid target node IDs provided" };
  }


  return { success: true, message: "Valid target instances provided", targetInstances };
}

/**
 * 辅助函数，验证并获取保存的覆盖数据
 * @param {string} sourceInstanceId - 源实例 ID
 * @returns {Promise<Object>} - 验证结果，包含源实例数据或错误
 */
async function getSourceInstanceData(sourceInstanceId) {
  if (!sourceInstanceId) {
    return { success: false, message: "Missing source instance ID" };
  }

  // 通过 ID 获取源实例
  const sourceInstance = await figma.getNodeByIdAsync(sourceInstanceId);
  if (!sourceInstance) {
    return {
      success: false,
      message: "Source instance not found. The original instance may have been deleted."
    };
  }

  // 验证它是否是实例
  if (sourceInstance.type !== "INSTANCE") {
    return {
      success: false,
      message: "Source node is not a component instance."
    };
  }

  // 获取主组件
  const mainComponent = await sourceInstance.getMainComponentAsync();
  if (!mainComponent) {
    return {
      success: false,
      message: "Failed to get main component from source instance."
    };
  }

  return {
    success: true,
    sourceInstance,
    mainComponent,
    overrides: sourceInstance.overrides || []
  };
}

/**
 * 将保存的覆盖设置为选定的组件实例(s)
 * @param {InstanceNode[] | null} targetInstances - 要设置覆盖的实例节点数组
 * @param {Object} sourceResult - 从 getSourceInstanceData 获取的源实例数据
 * @returns {Promise<Object>} - 设置操作的结果
 */
async function setInstanceOverrides(targetInstances, sourceResult) {
  try {


    const { sourceInstance, mainComponent, overrides } = sourceResult;

    console.log(`Processing ${targetInstances.length} instances with ${overrides.length} overrides`);
    console.log(`Source instance: ${sourceInstance.id}, Main component: ${mainComponent.id}`);
    console.log(`Overrides:`, overrides);

    // 处理所有实例
    const results = [];
    let totalAppliedCount = 0;

    for (const targetInstance of targetInstances) {
      try {
        // // 如果尝试应用到源实例本身，则跳过
        // if (targetInstance.id === sourceInstance.id) {
        //   console.log(`Skipping source instance itself: ${targetInstance.id}`);
        //   results.push({
        //     success: false,
        //     instanceId: targetInstance.id,
        //     instanceName: targetInstance.name,
        //     message: "This is the source instance itself, skipping"
        //   });
        //   continue;
        // }

        // 交换组件
        try {
          targetInstance.swapComponent(mainComponent);
          console.log(`Swapped component for instance "${targetInstance.name}"`);
        } catch (error) {
          console.error(`Error swapping component for instance "${targetInstance.name}":`, error);
          results.push({
            success: false,
            instanceId: targetInstance.id,
            instanceName: targetInstance.name,
            message: `Error: ${error.message}`
          });
        }

        // 准备覆盖，通过替换节点 ID
        let appliedCount = 0;

        // 应用每个覆盖
        for (const override of overrides) {
          // 如果没有 ID 或 overriddenFields，则跳过
          if (!override.id || !override.overriddenFields || override.overriddenFields.length === 0) {
            continue;
          }

          // 替换源实例 ID 为目标实例 ID 在节点路径中
          const overrideNodeId = override.id.replace(sourceInstance.id, targetInstance.id);
          const overrideNode = await figma.getNodeByIdAsync(overrideNodeId);

          if (!overrideNode) {
            console.log(`Override node not found: ${overrideNodeId}`);
            continue;
          }

          // 获取源节点以复制属性
          const sourceNode = await figma.getNodeByIdAsync(override.id);
          if (!sourceNode) {
            console.log(`Source node not found: ${override.id}`);
            continue;
          }

          // 应用每个覆盖的字段
          let fieldApplied = false;
          for (const field of override.overriddenFields) {
            try {
              if (field === "componentProperties") {
                // 应用组件属性
                if (sourceNode.componentProperties && overrideNode.componentProperties) {
                  const properties = {};
                  for (const key in sourceNode.componentProperties) {
                    // 如果 INSTANCE_SWAP 使用 id，否则使用值
                    if (sourceNode.componentProperties[key].type === 'INSTANCE_SWAP') {
                      properties[key] = sourceNode.componentProperties[key].value;
                    
                    } else {
                      properties[key] = sourceNode.componentProperties[key].value;
                    }
                  }
                  overrideNode.setProperties(properties);
                  fieldApplied = true;
                }
              } else if (field === "characters" && overrideNode.type === "TEXT") {
                // 对于文本节点，需要先加载字体
                await figma.loadFontAsync(overrideNode.fontName);
                overrideNode.characters = sourceNode.characters;
                fieldApplied = true;
              } else if (field in overrideNode) {
                // 直接属性赋值
                overrideNode[field] = sourceNode[field];
                fieldApplied = true;
              }
            } catch (fieldError) {
              console.error(`Error applying field ${field}:`, fieldError);
            }
          }

          if (fieldApplied) {
            appliedCount++;
          }
        }

        if (appliedCount > 0) {
          totalAppliedCount += appliedCount;
          results.push({
            success: true,
            instanceId: targetInstance.id,
            instanceName: targetInstance.name,
            appliedCount
          });
          console.log(`Applied ${appliedCount} overrides to "${targetInstance.name}"`);
        } else {
          results.push({
            success: false,
            instanceId: targetInstance.id,
            instanceName: targetInstance.name,
            message: "No overrides were applied"
          });
        }
      } catch (instanceError) {
        console.error(`Error processing instance "${targetInstance.name}":`, instanceError);
        results.push({
          success: false,
          instanceId: targetInstance.id,
          instanceName: targetInstance.name,
          message: `Error: ${instanceError.message}`
        });
      }
    }

    // 返回结果
    if (totalAppliedCount > 0) {
      const instanceCount = results.filter(r => r.success).length;
      const message = `Applied ${totalAppliedCount} overrides to ${instanceCount} instances`;
      figma.notify(message);
      return {
        success: true,
        message,
        totalCount: totalAppliedCount,
        results
      };
    } else {
      const message = "No overrides applied to any instance";
      figma.notify(message);
      return { success: false, message, results };
    }

  } catch (error) {
    console.error("Error in setInstanceOverrides:", error);
    const message = `Error: ${error.message}`;
    figma.notify(message);
    return { success: false, message };
  }
}

async function setLayoutMode(params) {
  const { nodeId, layoutMode = "NONE", layoutWrap = "NO_WRAP" } = params || {};

  // 获取目标节点
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node with ID ${nodeId} not found`);
  }

  // 检查节点是否是支持 layoutMode 的帧或组件
  if (
    node.type !== "FRAME" &&
    node.type !== "COMPONENT" &&
    node.type !== "COMPONENT_SET" &&
    node.type !== "INSTANCE"
  ) {
    throw new Error(`Node type ${node.type} does not support layoutMode`);
  }

  // 设置布局模式
  node.layoutMode = layoutMode;

  // 如果适用，设置 layoutWrap
  if (layoutMode !== "NONE") {
    node.layoutWrap = layoutWrap;
  }

  return {
    id: node.id,
    name: node.name,
    layoutMode: node.layoutMode,
    layoutWrap: node.layoutWrap,
  };
}

async function setPadding(params) {
  const { nodeId, paddingTop, paddingRight, paddingBottom, paddingLeft } =
    params || {};

  // 获取目标节点
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node with ID ${nodeId} not found`);
  }

  // 检查节点是否是支持 padding 的帧或组件
  if (
    node.type !== "FRAME" &&
    node.type !== "COMPONENT" &&
    node.type !== "COMPONENT_SET" &&
    node.type !== "INSTANCE"
  ) {
    throw new Error(`Node type ${node.type} does not support padding`);
  }

  // 检查节点是否启用了自动布局
  if (node.layoutMode === "NONE") {
    throw new Error(
      "Padding can only be set on auto-layout frames (layoutMode must not be NONE)"
    );
  }

  // 如果提供，设置 padding 值
  if (paddingTop !== undefined) node.paddingTop = paddingTop;
  if (paddingRight !== undefined) node.paddingRight = paddingRight;
  if (paddingBottom !== undefined) node.paddingBottom = paddingBottom;
  if (paddingLeft !== undefined) node.paddingLeft = paddingLeft;

  return {
    id: node.id,
    name: node.name,
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,
  };
}

async function setAxisAlign(params) {
  const { nodeId, primaryAxisAlignItems, counterAxisAlignItems } = params || {};

  // 获取目标节点
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node with ID ${nodeId} not found`);
  }

  // 检查节点是否是支持轴对齐的帧或组件
  if (
    node.type !== "FRAME" &&
    node.type !== "COMPONENT" &&
    node.type !== "COMPONENT_SET" &&
    node.type !== "INSTANCE"
  ) {
    throw new Error(`Node type ${node.type} does not support axis alignment`);
  }

  // 检查节点是否启用了自动布局
  if (node.layoutMode === "NONE") {
    throw new Error(
      "Axis alignment can only be set on auto-layout frames (layoutMode must not be NONE)"
    );
  }

  // 如果提供，验证并设置 primaryAxisAlignItems
  if (primaryAxisAlignItems !== undefined) {
    if (
      !["MIN", "MAX", "CENTER", "SPACE_BETWEEN"].includes(primaryAxisAlignItems)
    ) {
      throw new Error(
        "Invalid primaryAxisAlignItems value. Must be one of: MIN, MAX, CENTER, SPACE_BETWEEN"
      );
    }
    node.primaryAxisAlignItems = primaryAxisAlignItems;
  }

  // 如果提供，验证并设置 counterAxisAlignItems
  if (counterAxisAlignItems !== undefined) {
    if (!["MIN", "MAX", "CENTER", "BASELINE"].includes(counterAxisAlignItems)) {
      throw new Error(
        "Invalid counterAxisAlignItems value. Must be one of: MIN, MAX, CENTER, BASELINE"
      );
    }
    // BASELINE 仅适用于水平布局
    if (
      counterAxisAlignItems === "BASELINE" &&
      node.layoutMode !== "HORIZONTAL"
    ) {
      throw new Error(
        "BASELINE alignment is only valid for horizontal auto-layout frames"
      );
    }
    node.counterAxisAlignItems = counterAxisAlignItems;
  }

  return {
    id: node.id,
    name: node.name,
    primaryAxisAlignItems: node.primaryAxisAlignItems,
    counterAxisAlignItems: node.counterAxisAlignItems,
    layoutMode: node.layoutMode,
  };
}

async function setLayoutSizing(params) {
  const { nodeId, layoutSizingHorizontal, layoutSizingVertical } = params || {};

  // 获取目标节点
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node with ID ${nodeId} not found`);
  }

  // 检查节点是否是支持 layout sizing 的帧或组件
  if (
    node.type !== "FRAME" &&
    node.type !== "COMPONENT" &&
    node.type !== "COMPONENT_SET" &&
    node.type !== "INSTANCE"
  ) {
    throw new Error(`Node type ${node.type} does not support layout sizing`);
  }

  // 检查节点是否启用了自动布局
  if (node.layoutMode === "NONE") {
    throw new Error(
      "Layout sizing can only be set on auto-layout frames (layoutMode must not be NONE)"
    );
  }

  // 如果提供，验证并设置 layoutSizingHorizontal
  if (layoutSizingHorizontal !== undefined) {
    if (!["FIXED", "HUG", "FILL"].includes(layoutSizingHorizontal)) {
      throw new Error(
        "Invalid layoutSizingHorizontal value. Must be one of: FIXED, HUG, FILL"
      );
    }
    // HUG 仅适用于自动布局帧和文本节点
    if (
      layoutSizingHorizontal === "HUG" &&
      !["FRAME", "TEXT"].includes(node.type)
    ) {
      throw new Error(
        "HUG sizing is only valid on auto-layout frames and text nodes"
      );
    }
    // FILL 仅适用于自动布局子节点
    if (
      layoutSizingHorizontal === "FILL" &&
      (!node.parent || node.parent.layoutMode === "NONE")
    ) {
      throw new Error("FILL sizing is only valid on auto-layout children");
    }
    node.layoutSizingHorizontal = layoutSizingHorizontal;
  }

  // 如果提供，验证并设置 layoutSizingVertical
  if (layoutSizingVertical !== undefined) {
    if (!["FIXED", "HUG", "FILL"].includes(layoutSizingVertical)) {
      throw new Error(
        "Invalid layoutSizingVertical value. Must be one of: FIXED, HUG, FILL"
      );
    }
    // HUG 仅适用于自动布局帧和文本节点
    if (
      layoutSizingVertical === "HUG" &&
      !["FRAME", "TEXT"].includes(node.type)
    ) {
      throw new Error(
        "HUG sizing is only valid on auto-layout frames and text nodes"
      );
    }
    // FILL 仅适用于自动布局子节点
    if (
      layoutSizingVertical === "FILL" &&
      (!node.parent || node.parent.layoutMode === "NONE")
    ) {
      throw new Error("FILL sizing is only valid on auto-layout children");
    }
    node.layoutSizingVertical = layoutSizingVertical;
  }

  return {
    id: node.id,
    name: node.name,
    layoutSizingHorizontal: node.layoutSizingHorizontal,
    layoutSizingVertical: node.layoutSizingVertical,
    layoutMode: node.layoutMode,
  };
}

async function setItemSpacing(params) {
  const { nodeId, itemSpacing } = params || {};

  // 获取目标节点
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node with ID ${nodeId} not found`);
  }

  // 检查节点是否是支持 item spacing 的帧或组件
  if (
    node.type !== "FRAME" &&
    node.type !== "COMPONENT" &&
    node.type !== "COMPONENT_SET" &&
    node.type !== "INSTANCE"
  ) {
    throw new Error(`Node type ${node.type} does not support item spacing`);
  }

  // 检查节点是否启用了自动布局
  if (node.layoutMode === "NONE") {
    throw new Error(
      "Item spacing can only be set on auto-layout frames (layoutMode must not be NONE)"
    );
  }

  // 设置 item spacing
  if (itemSpacing !== undefined) {
    if (typeof itemSpacing !== "number") {
      throw new Error("Item spacing must be a number");
    }
    node.itemSpacing = itemSpacing;
  }

  return {
    id: node.id,
    name: node.name,
    itemSpacing: node.itemSpacing,
    layoutMode: node.layoutMode,
  };
}

async function setDefaultConnector(params) {
  const { connectorId } = params || {};
  
  // 如果提供 connectorId，则搜索并设置为该 ID（不检查现有存储）
  if (connectorId) {
    // 通过指定 ID 获取节点
    const node = await figma.getNodeByIdAsync(connectorId);
    if (!node) {
      throw new Error(`Connector node not found with ID: ${connectorId}`);
    }
    
    // 检查节点类型
    if (node.type !== 'CONNECTOR') {
      throw new Error(`Node is not a connector: ${connectorId}`);
    }
    
    // 将找到的连接器设置为默认连接器
    await figma.clientStorage.setAsync('defaultConnectorId', connectorId);
    
    return {
      success: true,
      message: `Default connector set to: ${connectorId}`,
      connectorId: connectorId
    };
  } 
  // 如果未提供 connectorId，则检查现有存储
  else {
    // 检查客户端存储中是否存在默认连接器
    try {
      const existingConnectorId = await figma.clientStorage.getAsync('defaultConnectorId');
      
      // 如果存在连接器 ID，则检查节点是否仍然有效
      if (existingConnectorId) {
        try {
          const existingConnector = await figma.getNodeByIdAsync(existingConnectorId);
          
          // 如果存储的连接器仍然存在并且是类型 CONNECTOR
          if (existingConnector && existingConnector.type === 'CONNECTOR') {
            return {
              success: true,
              message: `Default connector is already set to: ${existingConnectorId}`,
              connectorId: existingConnectorId,
              exists: true
            };
          }
          // 存储的连接器不再有效 - 找到一个新的连接器
          else {
            console.log(`Stored connector ID ${existingConnectorId} is no longer valid, finding a new connector...`);
          }
        } catch (error) {
          console.log(`Error finding stored connector: ${error.message}. Will try to set a new one.`);
        }
      }
    } catch (error) {
      console.log(`Error checking for existing connector: ${error.message}`);
    }
    
    // 如果存储的默认连接器不存在或无效，则在当前页面上找到一个
    try {
      // 在当前页面上查找 CONNECTOR 类型的节点
      const currentPageConnectors = figma.currentPage.findAllWithCriteria({ types: ['CONNECTOR'] });
      
      if (currentPageConnectors && currentPageConnectors.length > 0) {
        // 使用找到的第一个连接器
        const foundConnector = currentPageConnectors[0];
        const autoFoundId = foundConnector.id;
        
        // 将找到的连接器设置为默认连接器
        await figma.clientStorage.setAsync('defaultConnectorId', autoFoundId);
        
        return {
          success: true,
          message: `Automatically found and set default connector to: ${autoFoundId}`,
          connectorId: autoFoundId,
          autoSelected: true
        };
      } else {
        // 如果当前页面上没有找到连接器，则显示一个指导消息
        throw new Error('No connector found in the current page. Please create a connector in Figma first or specify a connector ID.');
      }
    } catch (error) {
      // 运行 findAllWithCriteria 时发生错误
      throw new Error(`Failed to find a connector: ${error.message}`);
    }
  }
}

async function createCursorNode(targetNodeId) {
  const svgString = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8V35.2419L22 28.4315L27 39.7823C27 39.7823 28.3526 40.2722 29 39.7823C29.6474 39.2924 30.2913 38.3057 30 37.5121C28.6247 33.7654 25 26.1613 25 26.1613H32L16 8Z" fill="#202125" />
  </svg>`;
  try {
    const targetNode = await figma.getNodeByIdAsync(targetNodeId);
    if (!targetNode) throw new Error("Target node not found");

    // targetNodeId 有分号，因为它是一个嵌套节点。
    // 因此，我们需要从 targetNodeId 获取父节点 ID 并检查是否可以 appendChild 到它
    let parentNodeId = targetNodeId.includes(';') 
      ? targetNodeId.split(';')[0] 
      : targetNodeId;
    if (!parentNodeId) throw new Error("Could not determine parent node ID");

    // 找到父节点以将光标节点附加为子节点
    let parentNode = await figma.getNodeByIdAsync(parentNodeId);
    if (!parentNode) throw new Error("Parent node not found");

    // 如果父节点不可附加为子节点，则将父节点设置为父节点的父节点
    if (parentNode.type === 'INSTANCE' || parentNode.type === 'COMPONENT' || parentNode.type === 'COMPONENT_SET') {
      parentNode = parentNode.parent;
      if (!parentNode) throw new Error("Parent node not found");
    }

    // 创建cursor节点
    const importedNode = await figma.createNodeFromSvg(svgString);
    if (!importedNode || !importedNode.id) {
      throw new Error("Failed to create imported cursor node");
    }
    importedNode.name = "TTF_Connector / Mouse Cursor";
    importedNode.resize(48, 48);

    const cursorNode = importedNode.findOne(node => node.type === 'VECTOR');
    if (cursorNode) {
      cursorNode.fills = [{
        type: 'SOLID',
        color: { r: 0, g: 0, b: 0 },
        opacity: 1
      }];
      cursorNode.strokes = [{
        type: 'SOLID',
        color: { r: 1, g: 1, b: 1 },
        opacity: 1
      }];
      cursorNode.strokeWeight = 2;
      cursorNode.strokeAlign = 'OUTSIDE';
      cursorNode.effects = [{
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.3 },
        offset: { x: 1, y: 1 },
        radius: 2,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }];
    }

    // 将光标节点附加到父节点
    parentNode.appendChild(importedNode);

    // 如果父节点启用了自动布局，则将 layoutPositioning 设置为 ABSOLUTE
    if ('layoutMode' in parentNode && parentNode.layoutMode !== 'NONE') {
      importedNode.layoutPositioning = 'ABSOLUTE';
    }

    // 调整 importedNode 的位置到 targetNode 的位置
    if (
      targetNode.absoluteBoundingBox &&
      parentNode.absoluteBoundingBox
    ) {
      // 如果 targetNode 有 absoluteBoundingBox，则将 importedNode 的 absoluteBoundingBox 设置为 targetNode 的 absoluteBoundingBox
      console.log('targetNode.absoluteBoundingBox', targetNode.absoluteBoundingBox);
      console.log('parentNode.absoluteBoundingBox', parentNode.absoluteBoundingBox);
      importedNode.x = targetNode.absoluteBoundingBox.x - parentNode.absoluteBoundingBox.x  + targetNode.absoluteBoundingBox.width / 2 - 48 / 2
      importedNode.y = targetNode.absoluteBoundingBox.y - parentNode.absoluteBoundingBox.y + targetNode.absoluteBoundingBox.height / 2 - 48 / 2;
    } else if (
      'x' in targetNode && 'y' in targetNode && 'width' in targetNode && 'height' in targetNode) {
        // 如果 targetNode 有 x, y, width, height，则根据相对位置计算中心
        console.log('targetNode.x/y/width/height', targetNode.x, targetNode.y, targetNode.width, targetNode.height);
        importedNode.x = targetNode.x + targetNode.width / 2 - 48 / 2;
        importedNode.y = targetNode.y + targetNode.height / 2 - 48 / 2;
    } else {
      // 回退：如果可能，放置在 target 的左上角，否则相对于父节点放置在 (0,0)
      if ('x' in targetNode && 'y' in targetNode) {
        console.log('Fallback to targetNode x/y');
        importedNode.x = targetNode.x;
        importedNode.y = targetNode.y;
      } else {
        console.log('Fallback to (0,0)');
        importedNode.x = 0;
        importedNode.y = 0;
      }
    }

    // 获取 importedNode ID 和 importedNode
    console.log('importedNode', importedNode);


    return { id: importedNode.id, node: importedNode };
    
  } catch (error) {
    console.error("Error creating cursor from SVG:", error);
    return { id: null, node: null, error: error.message };
  }
}

async function createConnections(params) {
  if (!params || !params.connections || !Array.isArray(params.connections)) {
    throw new Error('Missing or invalid connections parameter');
  }
  
  const { connections } = params;
  
  // 命令 ID 用于进度跟踪
  const commandId = generateCommandId();
  sendProgressUpdate(
    commandId,
    "create_connections",
    "started",
    0,
    connections.length,
    0,
    `Starting to create ${connections.length} connections`
  );
  
  // 从客户端存储中获取默认连接器 ID
  const defaultConnectorId = await figma.clientStorage.getAsync('defaultConnectorId');
  if (!defaultConnectorId) {
    throw new Error('No default connector set. Please try one of the following options to create connections:\n1. Create a connector in FigJam and copy/paste it to your current page, then run the "set_default_connector" command.\n2. Select an existing connector on the current page, then run the "set_default_connector" command.');
  }
  
  // 获取默认连接器
  const defaultConnector = await figma.getNodeByIdAsync(defaultConnectorId);
  if (!defaultConnector) {
    throw new Error(`Default connector not found with ID: ${defaultConnectorId}`);
  }
  if (defaultConnector.type !== 'CONNECTOR') {
    throw new Error(`Node is not a connector: ${defaultConnectorId}`);
  }
  
  // 结果数组用于连接创建
  const results = [];
  let processedCount = 0;
  const totalCount = connections.length;
  
  // 预加载字体（如果提供，用于文本）
  let fontLoaded = false;
  
  for (let i = 0; i < connections.length; i++) {
    try {
      const { startNodeId: originalStartId, endNodeId: originalEndId, text } = connections[i];
      let startId = originalStartId;
      let endId = originalEndId;

      // 检查并可能替换 start node ID
      if (startId.includes(';')) {
        console.log(`Nested start node detected: ${startId}. Creating cursor node.`);
        const cursorResult = await createCursorNode(startId);
        if (!cursorResult || !cursorResult.id) {
          throw new Error(`Failed to create cursor node for nested start node: ${startId}`);
        }
        startId = cursorResult.id; 
      }  
      
      const startNode = await figma.getNodeByIdAsync(startId);
      if (!startNode) throw new Error(`Start node not found with ID: ${startId}`);

      // 检查并可能替换 end node ID
      if (endId.includes(';')) {
        console.log(`Nested end node detected: ${endId}. Creating cursor node.`);
        const cursorResult = await createCursorNode(endId);
        if (!cursorResult || !cursorResult.id) {
          throw new Error(`Failed to create cursor node for nested end node: ${endId}`);
        }
        endId = cursorResult.id;
      }
      const endNode = await figma.getNodeByIdAsync(endId);
      if (!endNode) throw new Error(`End node not found with ID: ${endId}`);

      
      // 克隆默认连接器
      const clonedConnector = defaultConnector.clone();
      
      // 使用可能替换的节点名称更新连接器名称
      clonedConnector.name = `TTF_Connector/${startNode.id}/${endNode.id}`;
      
      // 使用可能替换的 ID 设置 start 和 end 点
      clonedConnector.connectorStart = {
        endpointNodeId: startId,
        magnet: 'AUTO'
      };
      
      clonedConnector.connectorEnd = {
        endpointNodeId: endId,
        magnet: 'AUTO'
      };
      
      // 添加文本（如果提供）
      if (text) {
        try {
          // 尝试加载必要的字体
          try {
            // 首先检查默认连接器是否有字体并使用相同的字体
            if (defaultConnector.text && defaultConnector.text.fontName) {
              const fontName = defaultConnector.text.fontName;
              await figma.loadFontAsync(fontName);
              clonedConnector.text.fontName = fontName;
            } else {
              // 尝试默认 Inter 字体
              await figma.loadFontAsync({ family: "Inter", style: "Regular" });
            }
          } catch (fontError) {
            // 如果第一个字体加载失败，则尝试另一种字体样式
            try {
              await figma.loadFontAsync({ family: "Inter", style: "Medium" });
            } catch (mediumFontError) {
              // 如果第二个字体失败，则尝试系统字体
              try {
                await figma.loadFontAsync({ family: "System", style: "Regular" });
              } catch (systemFontError) {
                // 如果所有字体加载尝试失败，则抛出错误
                throw new Error(`Failed to load any font: ${fontError.message}`);
              }
            }
          }
          
          // 设置文本
          clonedConnector.text.characters = text;
        } catch (textError) {
          console.error("Error setting text:", textError);
          // 即使文本设置失败，也继续连接
          results.push({
            id: clonedConnector.id,
            startNodeId: startNodeId,
            endNodeId: endNodeId,
            text: "",
            textError: textError.message
          });
          
          // 继续到下一个连接
          continue;
        }
      }
      
      // 添加到结果（如果需要，使用 *original* ID 作为参考）
      results.push({
        id: clonedConnector.id,
        originalStartNodeId: originalStartId,
        originalEndNodeId: originalEndId,
        usedStartNodeId: startId, // 实际用于连接的 ID
        usedEndNodeId: endId,     // 实际用于连接的 ID
        text: text || ""
      });
      
      // 更新进度
      processedCount++;
      sendProgressUpdate(
        commandId,
        "create_connections",
        "in_progress",
        processedCount / totalCount,
        totalCount,
        processedCount,
        `Created connection ${processedCount}/${totalCount}`
      );
      
    } catch (error) {
      console.error("Error creating connection", error);
      // 即使发生错误，也继续处理剩余的连接
      processedCount++;
      sendProgressUpdate(
        commandId,
        "create_connections",
        "in_progress",
        processedCount / totalCount,
        totalCount,
        processedCount,
        `Error creating connection: ${error.message}`
      );
      
      results.push({
        error: error.message,
        connectionInfo: connections[i]
      });
    }
  }
  
  // 完成更新
  sendProgressUpdate(
    commandId,
    "create_connections",
    "completed",
    1,
    totalCount,
    totalCount,
    `Completed creating ${results.length} connections`
  );
  
  return {
    success: true,
    count: results.length,
    connections: results
  };
}
