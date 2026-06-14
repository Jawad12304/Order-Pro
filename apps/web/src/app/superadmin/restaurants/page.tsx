"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, ShieldAlert, LogIn, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  getRestaurantsAdmin, 
  createRestaurant, 
  updateRestaurant, 
  toggleRestaurantStatus, 
  deleteRestaurant 
} from "@/app/actions/superadmin";
import { getSubscriptionPlans } from "@/app/actions/billing";

export default function SuperAdminRestaurants() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [plansList, setPlansList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Modals state
  const [showModal, setShowModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    adminUsername: "",
    adminPassword: "",
    planId: "",
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [restData, planData] = await Promise.all([
      getRestaurantsAdmin(),
      getSubscriptionPlans()
    ]);
    setRestaurants(restData);
    setPlansList(planData);
    if (planData.length > 0 && !formData.planId) {
      setFormData(prev => ({ ...prev, planId: planData[0].id }));
    }
    setLoading(false);
  }

  const handleImpersonate = (restaurantId: string, name: string) => {
    alert(`Impersonation for ${name} coming soon!`);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleRestaurantStatus(id, currentStatus);
    setOpenDropdown(null);
    loadData();
  };

  const openEdit = (tenant: any) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      adminUsername: tenant.adminUsername,
      adminPassword: "", // Empty for edit unless changing
      planId: tenant.planId,
      isActive: tenant.status === "Active"
    });
    setOpenDropdown(null);
    setShowModal("edit");
  };

  const handleDelete = async () => {
    if (!selectedTenant) return;
    setIsSubmitting(true);
    await deleteRestaurant(selectedTenant.id);
    setIsSubmitting(false);
    setShowModal(null);
    loadData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (showModal === "create") {
      await createRestaurant({
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        planId: formData.planId,
        adminUsername: formData.adminUsername,
        adminPassword: formData.adminPassword
      });
    } else if (showModal === "edit" && selectedTenant) {
      await updateRestaurant(selectedTenant.id, {
        name: formData.name,
        planId: formData.planId,
        adminUsername: formData.adminUsername,
        adminPassword: formData.adminPassword || undefined,
        isActive: formData.isActive
      });
    }

    setIsSubmitting(false);
    setShowModal(null);
    loadData();
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-headline-sm font-bold text-on-surface">Tenant Management</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Manage all restaurant accounts, plans, and credentials.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input 
              type="text" 
              placeholder="Search tenants..." 
              className="w-full bg-surface border border-outline-variant/50 rounded-xl py-2 pl-10 pr-4 text-body-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button 
            onClick={() => {
              setFormData({ name: "", slug: "", adminUsername: "", adminPassword: "", planId: plansList.length > 0 ? plansList[0].id : "", isActive: true });
              setShowModal("create");
            }}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-label-md hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Add Tenant
          </button>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm min-h-[500px] pb-32">
        {loading ? (
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-visible px-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="p-4">Restaurant</th>
                  <th className="p-4">Admin User</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Usage (Tables/Orders)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {restaurants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-on-surface-variant">No restaurants found.</td>
                  </tr>
                ) : (
                  restaurants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-on-surface">{tenant.name}</span>
                        <p className="text-label-sm text-on-surface-variant mt-0.5">{tenant.slug}</p>
                      </td>
                      <td className="p-4 text-body-sm text-on-surface-variant">
                        <span className="font-medium">{tenant.adminUsername}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-label-xs font-bold border bg-surface-variant text-on-surface-variant border-outline-variant/30">
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="p-4 text-body-sm text-on-surface-variant">
                        {tenant.tablesCount} / {tenant.ordersCount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`flex items-center gap-1.5 text-label-sm font-bold
                          ${tenant.status === 'Active' ? 'text-green-600' : 'text-error'}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${tenant.status === 'Active' ? 'bg-green-600' : 'bg-error'}`}></span>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="p-4 text-body-sm text-on-surface-variant">{tenant.joined}</td>
                      <td className="p-4 text-right">
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={() => setOpenDropdown(openDropdown === tenant.id ? null : tenant.id)}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              openDropdown === tenant.id 
                                ? 'bg-primary/10 text-primary' 
                                : 'text-on-surface-variant hover:bg-surface-variant'
                            }`}
                          >
                            <MoreVertical size={20} />
                          </button>
                          
                          {openDropdown === tenant.id && (
                            <div className="absolute right-0 mt-2 w-56 origin-top-right bg-surface-container-high border border-outline-variant/30 shadow-2xl rounded-2xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5">
                              <button 
                                onClick={() => handleImpersonate(tenant.id, tenant.name)}
                                className="w-full text-left px-4 py-3 text-body-sm font-medium text-on-surface hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-3"
                              >
                                <LogIn size={18} /> Impersonate Admin
                              </button>
                              <button 
                                onClick={() => openEdit(tenant)}
                                className="w-full text-left px-4 py-3 text-body-sm font-medium text-on-surface hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-3"
                              >
                                <Edit size={18} /> Edit Details & Plan
                              </button>
                              
                              <div className="h-px bg-outline-variant/30 my-1"></div>
                              
                              <button 
                                onClick={() => handleToggleStatus(tenant.id, tenant.status === 'Active')}
                                className={`w-full text-left px-4 py-3 text-body-sm font-medium flex items-center gap-3 transition-colors
                                  ${tenant.status === 'Active' ? 'text-orange-600 hover:bg-orange-500/10' : 'text-green-600 hover:bg-green-500/10'}`}
                              >
                                <ShieldAlert size={18} /> {tenant.status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setShowModal("delete");
                                  setOpenDropdown(null);
                                }}
                                className="w-full text-left px-4 py-3 text-body-sm font-medium flex items-center gap-3 text-error hover:bg-error/10 transition-colors"
                              >
                                <Trash2 size={18} /> Delete Tenant
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            {showModal === "delete" ? (
              <div className="p-6">
                <h3 className="text-title-lg font-bold text-error mb-2">Delete Restaurant</h3>
                <p className="text-body-md text-on-surface-variant mb-6">
                  Are you sure you want to delete <strong>{selectedTenant?.name}</strong>? This action is permanent and will destroy all their menus, orders, and staff data.
                </p>
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => setShowModal(null)}
                    className="px-4 py-2 text-label-md font-medium text-on-surface-variant hover:bg-surface-variant rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-label-md font-medium bg-error text-on-error hover:bg-error/90 rounded-xl flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    Yes, Delete
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                <div className="p-6 border-b border-outline-variant/30 shrink-0">
                  <h3 className="text-title-lg font-bold text-on-surface">
                    {showModal === "create" ? "Create New Tenant" : "Edit Tenant"}
                  </h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {showModal === "create" ? "Fill in the details to provision a new restaurant workspace." : "Update the restaurant details and manage access."}
                  </p>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Restaurant Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary transition-colors"
                        placeholder="e.g. Pizza Palace"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Subscription Plan</label>
                      <select 
                        value={formData.planId}
                        onChange={e => setFormData({...formData, planId: e.target.value})}
                        className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary transition-colors appearance-none"
                      >
                        {plansList.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.price})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-outline-variant/20">
                    <h4 className="text-label-md font-bold text-on-surface mb-4">Admin Credentials</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Admin Username</label>
                        <input 
                          required
                          type="text" 
                          value={formData.adminUsername}
                          onChange={e => setFormData({...formData, adminUsername: e.target.value})}
                          className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary transition-colors"
                          placeholder="e.g. admin_user"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">
                          {showModal === "create" ? "Admin Password" : "New Password (optional)"}
                        </label>
                        <input 
                          required={showModal === "create"}
                          type="password" 
                          value={formData.adminPassword}
                          onChange={e => setFormData({...formData, adminPassword: e.target.value})}
                          className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary transition-colors"
                          placeholder={showModal === "create" ? "Enter a strong password" : "Leave blank to keep current"}
                        />
                      </div>
                    </div>
                  </div>

                  {showModal === "edit" && (
                    <div className="pt-6 border-t border-outline-variant/20">
                      <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-xl">
                        <div>
                          <label className="text-label-md font-bold text-on-surface block">Account Status</label>
                          <p className="text-body-sm text-on-surface-variant">Suspend or reactivate this tenant's access.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${formData.isActive ? 'bg-primary' : 'bg-surface-variant'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-outline-variant/30 flex gap-3 justify-end bg-surface-container-low shrink-0">
                  <button 
                    type="button"
                    onClick={() => setShowModal(null)}
                    className="px-5 py-2.5 text-label-md font-bold text-on-surface-variant hover:bg-surface-variant rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-label-md font-bold bg-primary text-on-primary hover:bg-primary/90 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                    {showModal === "create" ? "Create Tenant" : "Save Changes"}
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
