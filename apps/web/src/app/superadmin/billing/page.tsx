"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, ExternalLink, ArrowRight, Zap, CheckCircle2, Plus, Edit, Trash2, Loader2, Star, Check } from "lucide-react";
import { getSubscriptionPlans, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan, upgradeTenantPlan } from "@/app/actions/billing";
import { getRestaurantsAdmin } from "@/app/actions/superadmin";

export default function SuperAdminBilling() {
  const [plans, setPlans] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upgrade tool state
  const [upgradeState, setUpgradeState] = useState({
    restaurantId: "",
    planId: "",
    isUpgrading: false,
    success: false
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    tablesLimit: 0,
    ordersLimit: -1, // Default unlimited
    targetAudience: "",
    isPopular: false,
    badgeText: "Most Popular",
    badgeColor: "#8B5CF6",
    features: "" // Comma separated
  });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    const [planData, restaurantData] = await Promise.all([
      getSubscriptionPlans(),
      getRestaurantsAdmin()
    ]);
    setPlans(planData);
    setRestaurants(restaurantData);
    if (restaurantData.length > 0 && planData.length > 0 && !upgradeState.restaurantId) {
      setUpgradeState(prev => ({ ...prev, restaurantId: restaurantData[0].id, planId: planData[0].id }));
    }
    setLoading(false);
  }

  const openCreate = () => {
    setFormData({
      name: "", price: "", tablesLimit: 0, ordersLimit: -1, targetAudience: "", isPopular: false, badgeText: "Most Popular", badgeColor: "#8B5CF6", features: ""
    });
    setShowModal("create");
  };

  const openEdit = (plan: any) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      tablesLimit: plan.tablesLimit,
      ordersLimit: plan.ordersLimit,
      targetAudience: plan.targetAudience,
      isPopular: plan.isPopular,
      badgeText: plan.badgeText || "Most Popular",
      badgeColor: plan.badgeColor || "#8B5CF6",
      features: plan.features.join(", ")
    });
    setShowModal("edit");
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    await deleteSubscriptionPlan(selectedPlan.id);
    setIsSubmitting(false);
    setShowModal(null);
    loadPlans();
  };

  const handleUpgrade = async () => {
    if (!upgradeState.restaurantId || !upgradeState.planId) return;
    setUpgradeState(prev => ({ ...prev, isUpgrading: true, success: false }));
    try {
      await upgradeTenantPlan(upgradeState.restaurantId, upgradeState.planId);
      setUpgradeState(prev => ({ ...prev, success: true }));
      setTimeout(() => setUpgradeState(prev => ({ ...prev, success: false })), 3000);
      loadPlans();
    } catch (e) {
      console.error(e);
    } finally {
      setUpgradeState(prev => ({ ...prev, isUpgrading: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      features: formData.features.split(",").map(f => f.trim()).filter(f => f.length > 0)
    };

    if (showModal === "create") {
      await createSubscriptionPlan(payload);
    } else if (showModal === "edit" && selectedPlan) {
      await updateSubscriptionPlan(selectedPlan.id, payload);
    }

    setIsSubmitting(false);
    setShowModal(null);
    loadPlans();
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-headline-sm font-bold text-on-surface">Billing & Subscriptions</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Manage global Stripe configurations and SaaS pricing plans.</p>
      </div>

      {/* Stripe Gateway Status */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#635BFF]/10 text-[#635BFF] rounded-xl flex items-center justify-center shrink-0">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="text-title-md font-bold text-on-surface">Stripe Billing Portal</h3>
            <p className="text-body-sm text-on-surface-variant mt-0.5">Connected in Live Mode. Webhooks functioning normally.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-[#635BFF] text-white px-5 py-2.5 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity">
          Open Stripe Dashboard <ExternalLink size={16} />
        </button>
      </div>

      {/* Pricing Matrix */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-title-lg font-bold text-on-surface">Configured SaaS Plans</h2>
          <button 
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-label-md hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={18} /> Add Plan
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 bg-surface border border-outline-variant/30 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className={`bg-surface border p-6 rounded-2xl shadow-sm flex flex-col relative overflow-hidden group
                ${!plan.isPopular && 'border-outline-variant/30'}`}
                style={plan.isPopular ? { borderColor: plan.badgeColor || '#8B5CF6', boxShadow: `0 0 0 1px ${(plan.badgeColor || '#8B5CF6')}33` } : {}}
              >
                {plan.isPopular && (
                  <div 
                    className="absolute top-0 right-0 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg flex items-center gap-1"
                    style={{ backgroundColor: plan.badgeColor || '#8B5CF6' }}
                  >
                    <Star size={10} className="fill-current" /> {plan.badgeText || "Most Popular"}
                  </div>
                )}
                
                {/* Admin Action Buttons (Hover) */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(plan)} className="p-1.5 bg-surface-variant text-on-surface-variant hover:text-primary rounded-md">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => { setSelectedPlan(plan); setShowModal("delete"); }} className="p-1.5 bg-surface-variant text-on-surface-variant hover:text-error rounded-md">
                    <Trash2 size={16} />
                  </button>
                </div>

                <h4 className="text-title-md font-bold text-on-surface">{plan.name}</h4>
                <p className="text-body-sm text-on-surface-variant mt-1">{plan.targetAudience}</p>
                
                <div className="my-6">
                  <span className="text-display-sm font-black text-on-surface">{plan.price}</span>
                  {plan.price.toLowerCase() !== "custom" && <span className="text-body-sm text-on-surface-variant">/mo</span>}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-body-sm text-on-surface">
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                    <strong>{plan.tablesLimit === -1 ? 'Unlimited' : plan.tablesLimit}</strong> Tables max
                  </li>
                  <li className="flex items-center gap-2 text-body-sm text-on-surface">
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                    <strong>{plan.ordersLimit === -1 ? 'Unlimited' : plan.ordersLimit}</strong> Orders
                  </li>
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-body-sm text-on-surface">
                      <CheckCircle2 size={16} className="text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Downgrade/Upgrade Tool */}
      <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm p-6 relative">
        {upgradeState.success && (
          <div className="absolute top-6 right-6 flex items-center gap-2 text-label-sm font-bold text-green-600 bg-green-500/10 px-3 py-1.5 rounded-full animate-in fade-in zoom-in">
            <Check size={16} /> Plan Upgraded
          </div>
        )}
        <h2 className="text-title-md font-bold text-on-surface mb-1">Subscription Upgrade</h2>
        <p className="text-body-sm text-on-surface-variant mb-6">Force upgrade or downgrade a specific tenant outside of Stripe.</p>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Select Restaurant</label>
            <select 
              value={upgradeState.restaurantId}
              onChange={e => setUpgradeState({...upgradeState, restaurantId: e.target.value})}
              className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 text-body-md focus:border-primary focus:outline-none appearance-none"
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name} (Current: {r.plan})</option>
              ))}
            </select>
          </div>
          
          <div className="shrink-0 text-outline-variant hidden md:block mb-3">
            <ArrowRight size={24} />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-label-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">New Plan</label>
            <select 
              value={upgradeState.planId}
              onChange={e => setUpgradeState({...upgradeState, planId: e.target.value})}
              className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 text-body-md focus:border-primary focus:outline-none appearance-none"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.price})</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleUpgrade}
            disabled={upgradeState.isUpgrading}
            className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity w-full md:w-auto disabled:opacity-50"
          >
            {upgradeState.isUpgrading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />} 
            Execute Override
          </button>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            {showModal === "delete" ? (
              <div className="p-6">
                <h3 className="text-title-lg font-bold text-error mb-2">Delete Plan</h3>
                <p className="text-body-md text-on-surface-variant mb-6">
                  Are you sure you want to delete the <strong>{selectedPlan?.name}</strong> plan? 
                </p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowModal(null)} className="px-4 py-2 text-label-md font-medium text-on-surface-variant hover:bg-surface-variant rounded-xl">Cancel</button>
                  <button onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 text-label-md font-medium bg-error text-on-error hover:bg-error/90 rounded-xl flex items-center gap-2">
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />} Delete
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                <div className="p-6 border-b border-outline-variant/30 shrink-0">
                  <h3 className="text-title-lg font-bold text-on-surface">
                    {showModal === "create" ? "Create New SaaS Plan" : "Edit SaaS Plan"}
                  </h3>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Plan Name</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary" placeholder="e.g. Starter" />
                    </div>
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Price</label>
                      <input required type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary" placeholder="e.g. $29 or Custom" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Tables Limit (-1 for unlimited)</label>
                      <input required type="number" value={formData.tablesLimit} onChange={e => setFormData({...formData, tablesLimit: parseInt(e.target.value)})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Orders Limit (-1 for unlimited)</label>
                      <input required type="number" value={formData.ordersLimit} onChange={e => setFormData({...formData, ordersLimit: parseInt(e.target.value)})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Target Audience</label>
                    <input required type="text" value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary" placeholder="e.g. Small Cafes" />
                  </div>

                  <div>
                    <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Features (Comma separated)</label>
                    <textarea required value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary min-h-[100px]" placeholder="Priority Support, Custom Domain, API Access" />
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-label-md font-bold text-on-surface block">Highlight Badge</label>
                        <p className="text-body-sm text-on-surface-variant">Display a colored tag on this plan.</p>
                      </div>
                      <button type="button" onClick={() => setFormData({...formData, isPopular: !formData.isPopular})} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${formData.isPopular ? 'bg-primary' : 'bg-surface-variant'}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.isPopular ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {formData.isPopular && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-outline-variant/30">
                        <div>
                          <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Badge Text</label>
                          <input type="text" value={formData.badgeText} onChange={e => setFormData({...formData, badgeText: e.target.value})} className="w-full bg-surface-container border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary" placeholder="e.g. Most Popular" />
                        </div>
                        <div>
                          <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Badge Color</label>
                          <div className="flex items-center gap-3">
                            <input type="color" value={formData.badgeColor} onChange={e => setFormData({...formData, badgeColor: e.target.value})} className="w-10 h-12 rounded cursor-pointer border-0 p-0 bg-transparent" />
                            <input type="text" value={formData.badgeColor} onChange={e => setFormData({...formData, badgeColor: e.target.value})} className="flex-1 bg-surface-container border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary uppercase" placeholder="#8B5CF6" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-outline-variant/30 flex gap-3 justify-end bg-surface-container-low shrink-0">
                  <button type="button" onClick={() => setShowModal(null)} className="px-5 py-2.5 text-label-md font-bold text-on-surface-variant hover:bg-surface-variant rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-label-md font-bold bg-primary text-on-primary hover:bg-primary/90 rounded-xl flex items-center gap-2 transition-colors">
                    {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                    {showModal === "create" ? "Create Plan" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
