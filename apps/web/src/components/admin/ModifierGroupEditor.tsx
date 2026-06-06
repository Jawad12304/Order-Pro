"use client";

import React, { useState } from "react";
import { Plus, Trash2, Settings2, GripVertical } from "lucide-react";

export type ModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
};

interface ModifierGroupEditorProps {
  groups: ModifierGroup[];
  onChange: (groups: ModifierGroup[]) => void;
}

export function ModifierGroupEditor({ groups, onChange }: ModifierGroupEditorProps) {
  
  const addGroup = () => {
    const newGroup: ModifierGroup = {
      id: `group-${Date.now()}`,
      name: "",
      minSelections: 0,
      maxSelections: 1,
      options: [
        { id: `opt-${Date.now()}`, name: "", priceDelta: 0 }
      ]
    };
    onChange([...groups, newGroup]);
  };

  const updateGroup = (groupId: string, field: keyof ModifierGroup, value: any) => {
    onChange(groups.map(g => g.id === groupId ? { ...g, [field]: value } : g));
  };

  const removeGroup = (groupId: string) => {
    onChange(groups.filter(g => g.id !== groupId));
  };

  const addOption = (groupId: string) => {
    onChange(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: [...g.options, { id: `opt-${Date.now()}`, name: "", priceDelta: 0 }]
        };
      }
      return g;
    }));
  };

  const updateOption = (groupId: string, optionId: string, field: keyof ModifierOption, value: any) => {
    onChange(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: g.options.map(o => o.id === optionId ? { ...o, [field]: value } : o)
        };
      }
      return g;
    }));
  };

  const removeOption = (groupId: string, optionId: string) => {
    onChange(groups.map(g => {
      if (g.id === groupId) {
        return { ...g, options: g.options.filter(o => o.id !== optionId) };
      }
      return g;
    }));
  };

  return (
    <div className="space-y-6">
      {groups.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-lowest">
          <Settings2 size={32} className="mx-auto text-on-surface-variant mb-3 opacity-50" />
          <h4 className="text-label-lg font-bold text-on-surface mb-1">No Modifier Groups</h4>
          <p className="text-body-sm text-on-surface-variant mb-4">Add options like "Size", "Spice Level", or "Extra Toppings"</p>
          <button type="button" onClick={addGroup} className="bg-primary text-on-primary px-4 py-2 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity">
            + Add First Group
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-surface border border-outline-variant/40 rounded-2xl p-5 shadow-sm">
              
              {/* Group Header */}
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-label-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Group Name</label>
                    <input 
                      type="text" 
                      value={group.name} 
                      onChange={(e) => updateGroup(group.id, "name", e.target.value)}
                      placeholder="e.g. Choose Size"
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-2.5 text-body-md font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-label-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Min Selections</label>
                      <input 
                        type="number" 
                        min="0"
                        value={group.minSelections} 
                        onChange={(e) => updateGroup(group.id, "minSelections", parseInt(e.target.value) || 0)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-2 text-body-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-label-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Max Selections</label>
                      <input 
                        type="number" 
                        min="1"
                        value={group.maxSelections} 
                        onChange={(e) => updateGroup(group.id, "maxSelections", parseInt(e.target.value) || 1)}
                        className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-2 text-body-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => removeGroup(group.id)} className="p-2 text-error hover:bg-error-container hover:text-on-error-container rounded-lg transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Options List */}
              <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20">
                <div className="flex items-center mb-3 px-2 text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  <div className="w-8"></div>
                  <div className="flex-1">Option Name</div>
                  <div className="w-32">Price Delta ($)</div>
                  <div className="w-10"></div>
                </div>
                
                <div className="space-y-2">
                  {group.options.map((option) => (
                    <div key={option.id} className="flex items-center gap-3">
                      <GripVertical size={16} className="text-outline-variant cursor-grab active:cursor-grabbing" />
                      <input 
                        type="text" 
                        value={option.name} 
                        onChange={(e) => updateOption(group.id, option.id, "name", e.target.value)}
                        placeholder="e.g. Large"
                        className="flex-1 bg-surface border border-outline-variant/50 rounded-lg p-2 text-body-sm focus:outline-none focus:border-primary"
                      />
                      <input 
                        type="number" 
                        step="0.01"
                        value={option.priceDelta} 
                        onChange={(e) => updateOption(group.id, option.id, "priceDelta", parseFloat(e.target.value) || 0)}
                        className="w-32 bg-surface border border-outline-variant/50 rounded-lg p-2 text-body-sm focus:outline-none focus:border-primary text-right"
                      />
                      <button type="button" onClick={() => removeOption(group.id, option.id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  type="button" 
                  onClick={() => addOption(group.id)} 
                  className="mt-4 flex items-center gap-1.5 text-label-sm font-bold text-primary hover:underline px-2"
                >
                  <Plus size={16} /> Add Option
                </button>
              </div>

            </div>
          ))}

          <button type="button" onClick={addGroup} className="w-full py-4 border-2 border-dashed border-primary/40 rounded-xl text-primary font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
            <Plus size={20} /> Add Another Group
          </button>
        </div>
      )}
    </div>
  );
}
