"use client";

import React, { useCallback, useMemo } from 'react';
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
import { X, Play, MousePointerClick, Zap } from 'lucide-react';

const TriggerNode = ({ data }: any) => {
  return (
    <div className="bg-[#2b2d31] border-2 border-orange-500 rounded-md shadow-xl min-w-[150px] overflow-hidden">
      <div className="bg-orange-500/20 text-orange-400 font-bold text-xs p-2 flex items-center gap-1 border-b border-orange-500/30">
        <MousePointerClick size={14} /> TRIGGER
      </div>
      <div className="p-3">
        <div className="text-white text-xs">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-500 border-2 border-[#2b2d31]" />
    </div>
  );
};

const ActionNode = ({ data }: any) => {
  return (
    <div className="bg-[#2b2d31] border-2 border-pln-blue rounded-md shadow-xl min-w-[150px] overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pln-blue border-2 border-[#2b2d31]" />
      <div className="bg-pln-blue/20 text-pln-blue font-bold text-xs p-2 flex items-center gap-1 border-b border-pln-blue/30">
        <Zap size={14} /> ACTION
      </div>
      <div className="p-3">
        <div className="text-white text-xs">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-pln-blue border-2 border-[#2b2d31]" />
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
  const elements = useEditorStore(state => state.elements);

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes.length > 0 ? storeNodes : [
    { id: '1', type: 'trigger', position: { x: 50, y: 100 }, data: { label: 'On Scene Start' } }
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

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
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { label: 'On Click (Select Element)' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addActionNode = () => {
    const newNode = {
      id: `action-${Date.now()}`,
      type: 'action',
      position: { x: Math.random() * 200 + 300, y: Math.random() * 200 },
      data: { label: 'Play Animation (Select Element)' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col backdrop-blur-sm">
      <div className="h-14 bg-[#1a1b1e] border-b border-[#2b2d31] flex items-center justify-between px-6">
        <h2 className="text-white font-bold flex items-center gap-2">
          <Zap size={18} className="text-pln-blue" /> Visual Logic Scripting
        </h2>
        <div className="flex gap-2">
          <button onClick={addTriggerNode} className="px-3 py-1.5 text-xs font-bold text-orange-400 bg-orange-400/10 hover:bg-orange-400/20 rounded border border-orange-400/30 transition-colors">
            + Add Trigger
          </button>
          <button onClick={addActionNode} className="px-3 py-1.5 text-xs font-bold text-pln-blue bg-pln-blue/10 hover:bg-pln-blue/20 rounded border border-pln-blue/30 transition-colors">
            + Add Action
          </button>
          <div className="w-px h-6 bg-[#36393f] mx-2 self-center"></div>
          <button onClick={handleSave} className="px-4 py-1.5 text-xs font-bold text-white bg-pln-blue hover:bg-blue-600 rounded shadow-md transition-colors">
            Apply & Close
          </button>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white bg-[#2b2d31] hover:bg-red-500 rounded transition-colors ml-2">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 w-full bg-[#1e1e1e]" data-color-mode="dark">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Controls className="bg-[#2b2d31] border-[#36393f] fill-white" />
          <MiniMap nodeColor="#2b2d31" maskColor="rgba(0,0,0,0.5)" />
          <Background color="#333" gap={20} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
