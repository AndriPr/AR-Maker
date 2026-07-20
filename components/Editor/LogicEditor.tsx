"use client";

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Handle, 
  Position,
  Connection,
  Edge,
  Node,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEditorStore } from '@/lib/store';
import { X, MousePointerClick, Zap, Play, Timer, AlignLeft, Search } from 'lucide-react';

// --- NODE COMPONENTS --- //

const TriggerNode = ({ data, selected }: any) => {
  const typeLabel = data.triggerType === 'on_scene_start' ? 'On Scene Start' : 'On Click';
  return (
    <div className={`bg-[#1e1e1e] border-2 ${selected ? 'border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'border-orange-500/30'} rounded shadow-lg min-w-[140px] overflow-hidden transition-all`}>
      <div className="bg-gradient-to-r from-orange-600/30 to-orange-500/10 text-orange-400 font-bold text-[10px] p-2 flex items-center gap-1.5 border-b border-orange-500/20">
        <MousePointerClick size={12} /> TRIGGER
      </div>
      <div className="p-2 text-center text-xs text-gray-200 font-medium">
        {typeLabel}
      </div>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-orange-500 border-2 border-[#1e1e1e]" />
    </div>
  );
};

const ActionNode = ({ data, selected }: any) => {
  const typeLabel = data.actionType ? data.actionType.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Action';
  return (
    <div className={`bg-[#1e1e1e] border-2 ${selected ? 'border-pln-blue shadow-[0_0_15px_rgba(30,136,229,0.4)]' : 'border-pln-blue/30'} rounded shadow-lg min-w-[140px] overflow-hidden transition-all`}>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-pln-blue border-2 border-[#1e1e1e]" />
      <div className="bg-gradient-to-r from-pln-blue/30 to-pln-blue/10 text-pln-blue font-bold text-[10px] p-2 flex items-center gap-1.5 border-b border-pln-blue/20">
        <Zap size={12} /> ACTION
      </div>
      <div className="p-2 text-center text-xs text-gray-200 font-medium">
        {typeLabel}
      </div>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-pln-blue border-2 border-[#1e1e1e]" />
    </div>
  );
};

const ControlNode = ({ data, selected }: any) => {
  return (
    <div className={`bg-[#1e1e1e] border-2 ${selected ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'border-yellow-500/30'} rounded shadow-lg min-w-[140px] overflow-hidden transition-all`}>
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-yellow-500 border-2 border-[#1e1e1e]" />
      <div className="bg-gradient-to-r from-yellow-600/30 to-yellow-500/10 text-yellow-500 font-bold text-[10px] p-2 flex items-center gap-1.5 border-b border-yellow-500/20">
        <Timer size={12} /> CONTROL
      </div>
      <div className="p-2 text-center text-xs text-gray-200 font-medium">
        Delay ({data.delayTime || 1}s)
      </div>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-yellow-500 border-2 border-[#1e1e1e]" />
    </div>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  control: ControlNode
};

// --- PROPERTIES PANEL --- //
function PropertiesPanel({ selectedNodeId }: { selectedNodeId: string | null }) {
  const nodes = useEditorStore(state => state.nodes);
  const elements = useEditorStore(state => state.elements);
  const updateNodeData = useEditorStore(state => state.updateNodeData);
  
  const node = nodes.find(n => n.id === selectedNodeId);
  if (!node) return (
    <div className="w-72 bg-[#161618] border-l border-[#2b2d31] flex flex-col items-center justify-center text-gray-500 text-xs p-6 text-center">
      <AlignLeft size={24} className="mb-2 opacity-50" />
      Select a node to view its properties
    </div>
  );

  const { data, type } = node;

  return (
    <div className="w-72 bg-[#161618] border-l border-[#2b2d31] flex flex-col h-full">
      <div className="h-12 border-b border-[#2b2d31] flex items-center px-4">
        <h3 className="text-white font-bold text-xs">Properties</h3>
      </div>
      <div className="p-4 flex flex-col gap-4 overflow-y-auto">
        
        {/* Trigger Properties */}
        {type === 'trigger' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Trigger Event</label>
              <select 
                value={data.triggerType || 'on_scene_start'} 
                onChange={(e) => updateNodeData(node.id, { triggerType: e.target.value })}
                className="bg-[#0a0a0b] border border-[#333] text-gray-200 text-xs rounded p-2 focus:border-orange-500 outline-none w-full"
              >
                <option value="on_scene_start">On Scene Start</option>
                <option value="on_click">On Click Object</option>
                <option value="on_proximity">On Proximity (Near Object)</option>
              </select>
            </div>
            
            {(data.triggerType === 'on_click' || data.triggerType === 'on_proximity') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Target Object</label>
                <select 
                  value={data.targetId || ''} 
                  onChange={(e) => updateNodeData(node.id, { targetId: e.target.value })}
                  className="bg-[#0a0a0b] border border-[#333] text-gray-200 text-xs rounded p-2 focus:border-orange-500 outline-none w-full"
                >
                  <option value="">-- Select Object --</option>
                  {elements.map(el => (
                    <option key={el.id} value={el.id}>{el.name} ({el.type})</option>
                  ))}
                </select>
              </div>
            )}
            
            {data.triggerType === 'on_proximity' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Distance Threshold (m)</label>
                <input 
                  type="number" 
                  step="0.5"
                  min="0.5"
                  value={data.distance || 2} 
                  onChange={(e) => updateNodeData(node.id, { distance: parseFloat(e.target.value) || 2 })}
                  className="bg-[#0a0a0b] border border-[#333] text-gray-200 text-xs rounded p-2 focus:border-orange-500 outline-none w-full"
                />
              </div>
            )}
          </>
        )}

        {/* Action Properties */}
        {type === 'action' && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Action Type</label>
              <select 
                value={data.actionType || 'play_animation'} 
                onChange={(e) => updateNodeData(node.id, { actionType: e.target.value })}
                className="bg-[#0a0a0b] border border-[#333] text-gray-200 text-xs rounded p-2 focus:border-pln-blue outline-none w-full"
              >
                <option value="play_animation">Play Animation</option>
                <option value="toggle_visibility">Toggle Visibility</option>
                <option value="open_url">Open URL</option>
                <option value="play_audio">Play Audio</option>
                <option value="change_scene">Change Scene</option>
                <option value="api_call">API Request (Fetch Data)</option>
              </select>
            </div>

            {['play_animation', 'toggle_visibility', 'play_audio'].includes(data.actionType || 'play_animation') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Target Object</label>
                <select 
                  value={data.targetId || ''} 
                  onChange={(e) => updateNodeData(node.id, { targetId: e.target.value })}
                  className="bg-[#0a0a0b] border border-[#333] text-gray-200 text-xs rounded p-2 focus:border-pln-blue outline-none w-full"
                >
                  <option value="">-- Select Object --</option>
                  {elements.map(el => (
                    <option key={el.id} value={el.id}>{el.name} ({el.type})</option>
                  ))}
                </select>
              </div>
            )}

            {(data.actionType === 'open_url' || data.actionType === 'change_scene' || data.actionType === 'play_animation' || data.actionType === 'api_call') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  {data.actionType === 'api_call' ? 'API Endpoint URL' : 'Value / Params'}
                </label>
                <input 
                  type="text" 
                  value={data.actionValue || ''} 
                  onChange={(e) => updateNodeData(node.id, { actionValue: e.target.value })}
                  placeholder={data.actionType === 'open_url' ? "https://..." : data.actionType === 'play_animation' ? "Animation Name or *" : data.actionType === 'api_call' ? "https://api.example.com/data" : "Scene ID"}
                  className="bg-[#0a0a0b] border border-[#333] text-gray-200 text-xs rounded p-2 focus:border-pln-blue outline-none placeholder:text-gray-600 w-full"
                />
              </div>
            )}
            
            {data.actionType === 'api_call' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">HTTP Method</label>
                <select 
                  value={data.apiMethod || 'GET'} 
                  onChange={(e) => updateNodeData(node.id, { apiMethod: e.target.value })}
                  className="bg-[#0a0a0b] border border-[#333] text-gray-200 text-xs rounded p-2 focus:border-pln-blue outline-none w-full"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
            )}
          </>
        )}

        {/* Control Properties */}
        {type === 'control' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Delay Time (Seconds)</label>
            <input 
              type="number" 
              step="0.1"
              min="0"
              value={data.delayTime || 1} 
              onChange={(e) => updateNodeData(node.id, { delayTime: parseFloat(e.target.value) || 0 })}
              className="bg-[#0a0a0b] border border-[#333] text-gray-200 text-xs rounded p-2 focus:border-yellow-500 outline-none w-full"
            />
          </div>
        )}

      </div>
    </div>
  );
}

// --- CONTEXT MENU --- //
function FlowContextMenu({ x, y, onAdd, onClose }: { x: number, y: number, onAdd: (type: string, position: any) => void, onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className="absolute z-[99999] bg-[#1a1b1e] border border-[#36393f] rounded-lg shadow-2xl w-48 overflow-hidden"
      style={{ left: x, top: y }}
    >
      <div className="p-2 border-b border-[#36393f] flex items-center gap-2">
        <Search size={14} className="text-gray-400" />
        <input autoFocus placeholder="Add Node..." className="bg-transparent text-xs text-white outline-none w-full" />
      </div>
      <div className="max-h-60 overflow-y-auto py-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Events</div>
        <button onClick={() => onAdd('trigger', { triggerType: 'on_scene_start' })} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div> On Scene Start
        </button>
        <button onClick={() => onAdd('trigger', { triggerType: 'on_click' })} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div> On Click Object
        </button>
        <button onClick={() => onAdd('trigger', { triggerType: 'on_proximity', distance: 2 })} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-orange-500/20 hover:text-orange-400 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div> On Proximity
        </button>
        
        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1 border-t border-[#36393f] pt-2">Control Flow</div>
        <button onClick={() => onAdd('control', { delayTime: 1 })} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-yellow-500/20 hover:text-yellow-400 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Delay
        </button>
        
        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1 border-t border-[#36393f] pt-2">Actions</div>
        <button onClick={() => onAdd('action', { actionType: 'play_animation' })} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-pln-blue/20 hover:text-pln-blue flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pln-blue"></div> Play Animation
        </button>
        <button onClick={() => onAdd('action', { actionType: 'toggle_visibility' })} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-pln-blue/20 hover:text-pln-blue flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pln-blue"></div> Toggle Visibility
        </button>
        <button onClick={() => onAdd('action', { actionType: 'api_call', apiMethod: 'GET' })} className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-pln-blue/20 hover:text-pln-blue flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pln-blue"></div> Fetch API
        </button>
      </div>
    </div>
  );
}

// --- MAIN WRAPPER --- //
function EditorCanvas({ onClose }: { onClose: () => void }) {
  const storeNodes = useEditorStore(state => state.nodes);
  const storeEdges = useEditorStore(state => state.edges);
  const setStoreNodes = useEditorStore(state => state.setNodes);
  const setStoreEdges = useEditorStore(state => state.setEdges);
  
  const reactFlow = useReactFlow();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{x: number, y: number} | null>(null);

  const onNodesChange = useCallback((changes: any) => {
    setStoreNodes((nds: any[]) => applyNodeChanges(changes, nds));
  }, [setStoreNodes]);

  const onEdgesChange = useCallback((changes: any) => {
    setStoreEdges((eds: any[]) => applyEdgeChanges(changes, eds));
  }, [setStoreEdges]);

  const onConnect = useCallback((params: Connection | Edge) => {
    const edge = { ...params, animated: true, style: { stroke: '#ffffff', strokeWidth: 2 } };
    setStoreEdges((eds: any[]) => addEdge(edge, eds));
  }, [setStoreEdges]);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setMenuPos({ x: event.clientX, y: event.clientY });
  }, []);

  const addNode = (type: string, data: any) => {
    if (!menuPos) return;
    const position = reactFlow.screenToFlowPosition({ x: menuPos.x, y: menuPos.y });
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data,
    };
    setStoreNodes((nds: any[]) => nds.concat(newNode));
    setMenuPos(null);
  };

  const handleSelectionChange = useCallback(({ nodes }: any) => {
    if (nodes.length === 1) {
      setSelectedNodeId(nodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0b]/90 flex flex-col backdrop-blur-md">
      <div className="h-14 bg-[#111113] border-b border-[#2b2d31] flex items-center justify-between px-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-pln-blue to-pln-blue/60 rounded-md shadow-lg shadow-pln-blue/20">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xs tracking-wide">ENTERPRISE LOGIC ENGINE</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500 mr-4 hidden sm:block">Right-Click canvas to add nodes</span>
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-bold text-white bg-pln-blue hover:bg-blue-600 rounded-md shadow-[0_0_15px_rgba(30,136,229,0.4)] transition-all hover:scale-105">
            Apply & Close
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full bg-[#0a0a0b] relative flex" data-color-mode="dark">
        {/* Editor Area */}
        <div className="flex-1 relative" onContextMenu={onPaneContextMenu}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-screen" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <ReactFlow 
            nodes={storeNodes} 
            edges={storeEdges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
            onConnect={onConnect}
            onSelectionChange={handleSelectionChange}
            nodeTypes={nodeTypes}
            fitView
            colorMode="dark"
            defaultEdgeOptions={{ animated: true, style: { stroke: '#888', strokeWidth: 2 } }}
          >
            <Controls className="bg-[#1e1e1e] border-[#2b2d31] fill-gray-300" showInteractive={false} />
            <MiniMap nodeColor="#1e1e1e" maskColor="rgba(0,0,0,0.7)" className="bg-[#111113] border border-[#2b2d31] rounded-lg overflow-hidden" />
            <Background color="#333" gap={30} size={1.5} />
          </ReactFlow>
          
          {menuPos && (
            <FlowContextMenu x={menuPos.x} y={menuPos.y} onAdd={addNode} onClose={() => setMenuPos(null)} />
          )}
        </div>
        
        {/* Properties Panel */}
        <PropertiesPanel selectedNodeId={selectedNodeId} />
      </div>
    </div>
  );
}

export default function LogicEditor({ onClose }: { onClose: () => void }) {
  return (
    <ReactFlowProvider>
      <EditorCanvas onClose={onClose} />
    </ReactFlowProvider>
  );
}
