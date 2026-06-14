"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { User, Image as ImageIcon, Check, Loader2, Save, Upload, X, Download, CloudOff } from "lucide-react";
import { getAdminProfile, updateAdminProfile, changeAdminPassword, generateLocalBackup } from "@/app/actions/restaurant-settings";
import { apiGetMe } from "@/lib/api";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { getCroppedImg } from "@/utils/cropImage";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [restaurantId, setRestaurantId] = useState("");
  const [username, setUsername] = useState("");
  const [formData, setFormData] = useState({
    newUsername: "",
    avatarUrl: ""
  });

  // Cropper states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  // Backup states
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const me = await apiGetMe();
        if (!me) return;
        
        setUsername(me.username);
        
        const res = await getAdminProfile(me.username);
        if (res) {
          setRestaurantId(res.restaurantId || "");
          setFormData({
            newUsername: res.username || "",
            avatarUrl: res.avatarUrl || ""
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      setFormData(prev => ({ ...prev, avatarUrl: croppedImageBase64 }));
      setIsCropping(false);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    setSaving(true);
    setSuccessMsg("");
    
    try {
      const res = await updateAdminProfile(username, formData);
      if (res.success) {
        setSuccessMsg("Profile updated successfully!");
        setUsername(formData.newUsername);
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPwdError("Password must be at least 8 characters long.");
      return;
    }

    setPwdLoading(true);
    try {
      const res = await changeAdminPassword(username, newPassword);
      if (res.success) {
        setPwdSuccess("Password changed successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPwdSuccess(""), 3000);
      } else {
        setPwdError(res.error || "Failed to change password.");
      }
    } catch (err: any) {
      setPwdError("An unexpected error occurred.");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLocalBackup = async () => {
    if (!restaurantId) return;
    setBackupLoading(true);
    try {
      const res = await generateLocalBackup(restaurantId);
      if (res.success && res.data) {
        const blob = new Blob([res.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_restaurant_${restaurantId}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Failed to generate backup: " + res.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error generating backup");
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">Settings</h1>
        <p className="text-body-lg text-on-surface-variant mt-1">Manage your restaurant profile, security, and data backups.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Form */}
          <div className="bg-surface rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
            <h2 className="text-title-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <User className="text-primary" /> Profile Information
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="flex-shrink-0 flex flex-col items-center gap-4">
                  <div className="relative group w-32 h-32 rounded-full overflow-hidden bg-surface-container border-2 border-outline-variant/50">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                        <User size={48} />
                      </div>
                    )}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all"
                    >
                      <ImageIcon className="text-white w-8 h-8" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-label-md font-medium text-primary hover:text-primary/80"
                  >
                    Change Picture
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 w-full space-y-4">
                  <div>
                    <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Admin Username</label>
                    <input
                      required
                      type="text"
                      value={formData.newUsername}
                      onChange={e => setFormData({...formData, newUsername: e.target.value})}
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <div>
                  {successMsg && <p className="text-label-md text-green-600 flex items-center gap-1"><Check size={16}/> {successMsg}</p>}
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-medium text-label-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Backup Section */}
          <div className="bg-surface rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30">
            <h2 className="text-title-lg font-bold text-on-surface mb-2 flex items-center gap-2">
              <Download className="text-primary" /> Data Backup
            </h2>
            <p className="text-body-md text-on-surface-variant mb-6">Securely download your restaurant data or configure cloud backups.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/50 flex flex-col items-start gap-4">
                <div>
                  <h3 className="font-bold text-on-surface text-label-lg">Local Backup</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">Download a JSON file containing all menus, tables, and recent orders.</p>
                </div>
                <button 
                  onClick={handleLocalBackup}
                  disabled={backupLoading}
                  className="mt-auto px-4 py-2 bg-surface-variant text-on-surface rounded-lg font-medium text-label-md hover:bg-surface-dim transition-colors flex items-center gap-2 w-full justify-center"
                >
                  {backupLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Download JSON
                </button>
              </div>

              <div className="bg-surface-container-lowest opacity-60 rounded-2xl p-5 border border-outline-variant/30 flex flex-col items-start gap-4 relative overflow-hidden">
                <div className="absolute top-3 right-3 bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Coming Soon</div>
                <div>
                  <h3 className="font-bold text-on-surface text-label-lg flex items-center gap-2"><CloudOff size={16}/> Cloud Backup</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">Automatically sync your data to secure cloud storage daily.</p>
                </div>
                <button disabled className="mt-auto px-4 py-2 bg-surface-variant/50 text-on-surface-variant rounded-lg font-medium text-label-md w-full justify-center flex items-center gap-2 cursor-not-allowed">
                  Configure Cloud
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* Security / Password Form */}
        <div className="space-y-8">
          <div className="bg-surface rounded-3xl p-6 shadow-sm border border-outline-variant/30">
            <h2 className="text-title-lg font-bold text-on-surface mb-2">Security</h2>
            <p className="text-body-sm text-on-surface-variant mb-6">Update your password to keep your account secure.</p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">New Password</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1.5">Confirm Password</label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-2.5 px-4 text-body-md focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {pwdError && <p className="text-label-sm text-error">{pwdError}</p>}
              {pwdSuccess && <p className="text-label-sm text-green-600">{pwdSuccess}</p>}

              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full mt-4 px-4 py-2.5 bg-surface-variant text-on-surface rounded-xl font-medium text-label-lg hover:bg-surface-dim transition-colors flex justify-center items-center gap-2"
              >
                {pwdLoading ? <Loader2 size={18} className="animate-spin" /> : "Update Password"}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Cropper Modal */}
      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col h-[600px] border border-outline-variant/20">
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-title-md font-bold text-on-surface">Crop Profile Picture</h3>
              <button onClick={() => { setIsCropping(false); setImageSrc(null); }} className="text-on-surface-variant hover:text-on-surface">
                <X size={20} />
              </button>
            </div>
            
            <div className="relative flex-1 bg-black/10">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/20">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-primary h-1 bg-surface-variant rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setIsCropping(false); setImageSrc(null); }}
                  className="flex-1 py-3 text-label-lg font-bold text-on-surface-variant bg-surface-variant rounded-xl hover:bg-surface-dim transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={showCroppedImage}
                  className="flex-1 py-3 text-label-lg font-bold text-on-primary bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
