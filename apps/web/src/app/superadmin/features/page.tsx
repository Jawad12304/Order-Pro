"use client";

import React, { useState, useEffect } from "react";
import { Search, ShieldCheck, Check, Plus, Settings2, Trash2, Edit, Loader2, X } from "lucide-react";
import { 
  getFeatureFlags, 
  getTenantsForFeatures, 
  toggleTenantFeatureFlag,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag
} from "@/app/actions/features";

export default function SuperAdminFeatureFlags() {
  const [flags, setFlags] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Manage flags modal
  const [showManageModal, setShowManageModal] = useState(false);
  const [flagForm, setFlagForm] = useState({ id: "", key: "", name: "", description: "", defaultValue: false });
  const [showFlagForm, setShowFlagForm] = useState<"create" | "edit" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [fetchedFlags, fetchedTenants] = await Promise.all([
      getFeatureFlags(),
      getTenantsForFeatures()
    ]);
    setFlags(fetchedFlags);
    setTenants(fetchedTenants);
    setLoading(false);
  }

  const toggleFlag = async (restaurantId: string, featureKey: string, currentValue: boolean) => {
    const newValue = !currentValue;
    
    // Optimistic UI update
    setTenants(prev => prev.map(t => {
      if (t.id === restaurantId) {
        const settings = t.settingsJson || {};
        const ff = settings.featureFlags || {};
        return {
          ...t,
          settingsJson: {
            ...settings,
            featureFlags: { ...ff, [featureKey]: newValue }
          }
        };
      }
      return t;
    }));

    setSavingId(restaurantId);
    await toggleTenantFeatureFlag(restaurantId, featureKey, newValue);
    setTimeout(() => setSavingId(null), 800);
  };

  const handleSaveFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (showFlagForm === "create") {
      await createFeatureFlag({
        key: flagForm.key.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        name: flagForm.name,
        description: flagForm.description,
        defaultValue: flagForm.defaultValue
      });
    } else {
      await updateFeatureFlag(flagForm.id, {
        key: flagForm.key,
        name: flagForm.name,
        description: flagForm.description,
        defaultValue: flagForm.defaultValue
      });
    }
    setIsSubmitting(false);
    setShowFlagForm(null);
    loadData();
  };

  const handleDeleteFlag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feature flag?")) return;
    await deleteFeatureFlag(id);
    loadData();
  };

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-headline-sm font-bold text-on-surface">Global Feature Flags</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Granular access control matrix for all platform features.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input 
              type="text" 
              placeholder="Find tenant..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-outline-variant/50 rounded-xl py-2 pl-10 pr-4 text-body-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button 
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-2 bg-surface-variant text-on-surface-variant px-4 py-2 rounded-xl font-label-md hover:text-primary transition-colors whitespace-nowrap border border-outline-variant/30 shadow-sm"
          >
            <Settings2 size={18} /> Manage Definitions
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
      ) : (
        <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm overflow-x-auto">
          {/* Table Header */}
          <div className="flex p-4 bg-surface-container-low border-b border-outline-variant/30 text-label-xs font-bold text-on-surface-variant uppercase tracking-wider items-center min-w-[800px]">
            <div className="w-64 shrink-0">Tenant Identity</div>
            {flags.map(f => (
              <div key={f.id} className="flex-1 text-center truncate px-2" title={f.name}>
                {f.name}
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          <div className="divide-y divide-outline-variant/20 min-w-[800px]">
            {filteredTenants.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">No tenants found.</div>
            ) : (
              filteredTenants.map((tenant) => {
                const planName = tenant.subscriptionPlan?.name || "No Plan";
                return (
                  <div key={tenant.id} className="flex p-4 items-center hover:bg-surface-container-lowest transition-colors relative">
                    
                    {/* Saving Indicator Overlay */}
                    {savingId === tenant.id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-label-sm font-bold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full animate-in fade-in zoom-in">
                        <Check size={14} /> Saved
                      </div>
                    )}

                    <div className="w-64 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface truncate">{tenant.name}</span>
                        {planName.toLowerCase().includes('enterprise') && <ShieldCheck size={14} className="text-orange-500 shrink-0" />}
                      </div>
                      <div className="text-label-sm text-on-surface-variant mt-0.5">{planName}</div>
                    </div>

                    {/* Dynamic Flag Toggles */}
                    {flags.map(f => {
                      const settings = tenant.settingsJson || {};
                      const featureFlags = settings.featureFlags || {};
                      // If specific override doesn't exist, fall back to the flag's global default
                      const isEnabled = featureFlags[f.key] !== undefined ? featureFlags[f.key] : f.defaultValue;

                      return (
                        <div key={f.id} className="flex-1 flex justify-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={isEnabled} 
                              onChange={() => toggleFlag(tenant.id, f.key, isEnabled)} 
                            />
                            <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showManageModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
              <h3 className="text-title-lg font-bold text-on-surface">Manage Feature Flags</h3>
              <button onClick={() => setShowManageModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {!showFlagForm ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-body-sm text-on-surface-variant">Define which features can be toggled across tenants.</p>
                    <button 
                      onClick={() => {
                        setFlagForm({ id: "", key: "", name: "", description: "", defaultValue: false });
                        setShowFlagForm("create");
                      }}
                      className="flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1.5 rounded-lg text-label-sm font-bold hover:bg-primary/90"
                    >
                      <Plus size={16} /> New Flag
                    </button>
                  </div>
                  
                  <div className="border border-outline-variant/30 rounded-xl divide-y divide-outline-variant/20">
                    {flags.map(f => (
                      <div key={f.id} className="p-4 flex items-center justify-between hover:bg-surface-container-lowest">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-on-surface text-body-md">{f.name}</h4>
                            <span className="text-[10px] font-mono bg-surface-variant px-1.5 py-0.5 rounded text-on-surface-variant">{f.key}</span>
                            {f.defaultValue && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">Default ON</span>}
                          </div>
                          <p className="text-body-sm text-on-surface-variant mt-1">{f.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setFlagForm(f); setShowFlagForm("edit"); }} className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-variant/50 transition-colors">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteFlag(f.id)} className="p-2 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-variant/50 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {flags.length === 0 && (
                      <div className="p-8 text-center text-on-surface-variant text-body-sm">No feature flags defined yet.</div>
                    )}
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveFlag} className="space-y-4">
                  <div>
                    <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Display Name</label>
                    <input 
                      required 
                      type="text" 
                      value={flagForm.name} 
                      onChange={e => {
                        const name = e.target.value;
                        const key = name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
                        setFlagForm(prev => ({ ...prev, name, ...(showFlagForm === 'create' && { key }) }));
                      }} 
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2 px-3 text-body-md focus:outline-none focus:border-primary" 
                      placeholder="e.g. Loyalty Program" 
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">System Key</label>
                    <input 
                      required 
                      disabled={showFlagForm === "edit"}
                      type="text" 
                      value={flagForm.key} 
                      onChange={e => setFlagForm({...flagForm, key: e.target.value})} 
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2 px-3 text-body-md focus:outline-none focus:border-primary disabled:opacity-50" 
                    />
                    <p className="text-label-xs text-on-surface-variant mt-1">Used in code to check if feature is enabled.</p>
                  </div>
                  <div>
                    <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Description</label>
                    <textarea 
                      value={flagForm.description} 
                      onChange={e => setFlagForm({...flagForm, description: e.target.value})} 
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2 px-3 text-body-md focus:outline-none focus:border-primary h-20" 
                    />
                  </div>
                  <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-xl">
                    <div>
                      <label className="text-label-md font-bold text-on-surface block">Enabled by Default</label>
                      <p className="text-body-sm text-on-surface-variant">If true, this feature will be ON for all tenants unless overridden.</p>
                    </div>
                    <button type="button" onClick={() => setFlagForm({...flagForm, defaultValue: !flagForm.defaultValue})} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${flagForm.defaultValue ? 'bg-primary' : 'bg-surface-variant'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flagForm.defaultValue ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <button type="button" onClick={() => setShowFlagForm(null)} className="px-4 py-2 text-label-md font-medium text-on-surface-variant hover:bg-surface-variant rounded-xl">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-label-md font-medium bg-primary text-on-primary hover:bg-primary/90 rounded-xl flex items-center gap-2">
                      {isSubmitting && <Loader2 size={16} className="animate-spin" />} Save Flag
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
