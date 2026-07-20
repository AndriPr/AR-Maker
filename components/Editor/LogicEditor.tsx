"use client";

import React, { useCallback } from 'react';
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
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEditorStore } from '@/lib/store';
import { X, MousePointerClick, Zap, Play, Eye, Link as LinkIcon, Volume2, Globe } from 'lucide-react';

const TriggerNode = ({ id, data }: any) => {
  const elements = useEditorStore(state => state.elements);
  const updateNodeData = useEditorStore(state => state.updateNodeData);

  const handleChangeType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { triggerType: e.target.value });
  };

  const handleChangeTarget = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { targetId: e.target.value });
  };

  return (
    <div className="bg-[#1e1e1e] border border-orange-500/50 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.15)] min-w-[200px] overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/5 text-orange-400 font-bold text-xs p-2.5 flex items-center gap-2 border-b border-orange-500/20">
        <MousePointerClick size={14} className="text-orange-500" /> 
        <span>TRIGGER</span>
      </div>
      <div className="p-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400 font-medium">When:</label>
          <select 
            value={data.triggerType || 'on_scene_start'} 
            onChange={handleChangeType}
            className="bg-[#121212] border border-[#333] text-gray-200 text-xs rounded p-1.5 focus:border-orange-500 outline-none"
          >
            <option value="on_scene_start">On Scene Start</option>
            <option value="on_click">On Click Object</option>
          </select>
        </div>
        
        {data.triggerType === 'on_click' && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-medium">Target Object:</label>
            <select 
              value={data.targetId || ''} 
              onChange={handleChangeTarget}
              className="bg-[#121212] border border-[#333] text-gray-200 text-xs rounded p-1.5 focus:border-orange-500 outline-none"
            >
              <option value="">-- Select Object --</option>
              {elements.map(el => (
                <option key={el.id} value={el.id}>{el.name} ({el.type})</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-500 border-2 border-[#1e1e1e]" />
    </div>
  );
};

const ActionNode = ({ id, data }: any) => {
  const elements = useEditorStore(state => state.elements);
  const updateNodeData = useEditorStore(state => state.updateNodeData);

  const handleChangeType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { actionType: e.target.value });
  };

  const handleChangeTarget = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { targetId: e.target.value });
  };
  
  const handleChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { actionValue: e.target.value });
  };

  return (
    <div className="bg-[#1e1e1e] border border-pln-blue/50 rounded-lg shadow-[0_0_15px_rgba(30,136,229,0.15)] min-w-[200px] overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pln-blue border-2 border-[#1e1e1e]" />
      <div className="bg-gradient-to-r from-pln-blue/20 to-pln-blue/5 text-pln-blue font-bold text-xs p-2.5 flex items-center gap-2 border-b border-pln-blue/20">
        <Zap size={14} className="text-pln-blue" /> 
        <span>ACTION</span>
      </div>
      <div className="p-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400 font-medium">Do:</label>
          <select 
            value={data.actionType || 'play_animation'} 
            onChange={handleChangeType}
            className="bg-[#121212] border border-[#333] text-gray-200 text-xs rounded p-1.5 focus:border-pln-blue outline-none"
          >
            <option value="play_animation">Play Animation</option>
            <option value="toggle_visibility">Toggle Visibility</option>
            <option value="open_url">Open URL</option>
            <option value="play_audio">Play Audio</option>
            <option value="change_scene">Change Scene</option>
          </select>
        </div>

        {['play_animation', 'toggle_visibility', 'play_audio'].includes(data.actionType || 'play_animation') && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-medium">On Object:</label>
            <select 
              value={data.targetId || ''} 
              onChange={handleChangeTarget}
              className="bg-[#121212] border border-[#333] text-gray-200 text-xs rounded p-1.5 focus:border-pln-blue outline-none"
            >
              <option value="">-- Select Object --</option>
              {elements.map(el => (
                <option key={el.id} value={el.id}>{el.name} ({el.type})</option>
              ))}
            </select>
          </div>
        )}

        {(data.actionType === 'open_url' || data.actionType === 'change_scene' || data.actionType === 'play_animation') && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 font-medium">Value / Params:</label>
            <input 
              type="text" 
              value={data.actionValue || ''} 
              onChange={handleChangeValue}
              placeholder={data.actionType === 'open_url' ? "https://..." : data.actionType === 'play_animation' ? "Animation Name or *" : "Scene ID"}
              className="bg-[#121212] border border-[#333] text-gray-200 text-xs rounded p-1.5 focus:border-pln-blue outline-none placeholder:text-gray-600"
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-pln-blue border-2 border-[#1e1e1e]" />
    </div>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
};

export default function LogicEditor({ onClose }: { onClose: () => void }) {
  const storeNodes = useEditorStore(state => state.nodes);
  const storeEdges = useEditorStore(state => state.edges);
  const setStoreNodes = useEditorStore(state => state.setNodes);
  const setStoreEdges = useEditorStore(state => state.setEdges);

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes.length > 0 ? storeNodes : [
    { id: '1', type: 'trigger', position: { x: 100, y: 150 }, data: { triggerType: 'on_scene_start' } }
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  const onConnect = useCallback((params: Connection | Edge) => {
    // Add animated: true to connection line
    const edge = { ...params, animated: true, style: { stroke: '#ffffff', strokeWidth: 2 } };
    setEdges((eds) => addEdge(edge, eds));
  }, [setEdges]);

  // Sync to store on unmount or save
  const handleSave = () => {
    setStoreNodes(nodes);
    setStoreEdges(edges);
    onClose();
  };

  const addTriggerNode = () => {
    const newNode = {
      id: `trigger-${Date.now()}`,
      type: 'trigger',
      position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 },
      data: { triggerType: 'on_click' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addActionNode = () => {
    const newNode = {
      id: `action-${Date.now()}`,
      type: 'action',
      position: { x: Math.random() * 200 + 400, y: Math.random() * 200 + 50 },
      data: { actionType: 'play_animation' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0b]/90 flex flex-col backdrop-blur-md">
      <div className="h-16 bg-[#111113] border-b border-[#2b2d31] flex items-center justify-between px-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-pln-blue to-pln-blue/60 rounded-lg shadow-lg shadow-pln-blue/20">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm tracking-wide">VISUAL LOGIC SCRIPTING</h2>
            <p className="text-[10px] text-gray-400">Node-based interaction builder</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={addTriggerNode} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-400 bg-orange-400/10 hover:bg-orange-400/20 rounded border border-orange-400/30 transition-all hover:scale-105">
            <MousePointerClick size={14} /> Add Trigger
          </button>
          <button onClick={addActionNode} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-pln-blue bg-pln-blue/10 hover:bg-pln-blue/20 rounded border border-pln-blue/30 transition-all hover:scale-105">
            <Play size={14} /> Add Action
          </button>
          <div className="w-px h-8 bg-[#2b2d31] mx-1"></div>
          <button onClick={handleSave} className="px-5 py-2 text-xs font-bold text-white bg-pln-blue hover:bg-blue-600 rounded-md shadow-[0_0_15px_rgba(30,136,229,0.4)] transition-all hover:scale-105">
            Apply & Close
          </button>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-[#1e1e1e] hover:bg-red-500 rounded-md transition-all">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 w-full bg-[#0a0a0b] relative" data-color-mode="dark">
        {/* Subtle grid background pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
          defaultEdgeOptions={{ animated: true, style: { stroke: '#ffffff', strokeWidth: 2 } }}
        >
          <Controls className="bg-[#1e1e1e] border-[#2b2d31] fill-gray-300" showInteractive={false} />
          <MiniMap nodeColor="#1e1e1e" maskColor="rgba(0,0,0,0.7)" className="bg-[#111113] border border-[#2b2d31] rounded-lg overflow-hidden" />
          <Background color="#222" gap={30} size={2} />
        </ReactFlow>
      </div>
    </div>
  );
}
