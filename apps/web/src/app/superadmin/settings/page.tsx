"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { User, Image as ImageIcon, Check, Loader2, Save, Upload, X } from "lucide-react";
import { getSuperAdminProfile, updateSuperAdminProfile, changeSuperAdminPassword } from "@/app/actions/settings";
import { apiGetMe } from "@/lib/api";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { getCroppedImg } from "@/utils/cropImage";

export default function SimpleSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [formData, setFormData] = useState({
    displayName: "",
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const me = await apiGetMe();
        if (!me) return;
        
        setUsername(me.username);
        
        const res = await getSuperAdminProfile(me.username);
        if (res.success && res.user) {
          setUserId(res.user.id);
          setFormData({
            displayName: res.user.displayName || "",
            avatarUrl: res.user.avatarUrl || ""
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

  const showCroppedImage = useCallback(async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      setFormData(prev => ({ ...prev, avatarUrl: croppedImageBase64 }));
      setIsCropping(false);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, croppedAreaPixels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setSaving(true);
    setSuccessMsg("");
    
    try {
      const res = await updateSuperAdminProfile(userId, formData);
      if (res.success) {
        setSuccessMsg("Profile updated successfully! Refreshing UI...");
        
        // Update local storage so the layout picks it up immediately on next reload or state change
        const stored = localStorage.getItem("order-pro-auth");
        if (stored) {
          const auth = JSON.parse(stored);
          auth.displayName = formData.displayName || auth.username;
          auth.avatarUrl = formData.avatarUrl;
          localStorage.setItem("order-pro-auth", JSON.stringify(auth));
        }
        
        // Reload to apply layout changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setPwdError("");
    setPwdSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    
    setPwdLoading(true);
    try {
      const res = await changeSuperAdminPassword(userId, currentPassword, newPassword);
      if (res.success) {
        setPwdSuccess("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwdError(res.error || "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      setPwdError("An unexpected error occurred.");
    } finally {
      setPwdLoading(false);
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
    <div className="animate-in fade-in duration-300 max-w-5xl w-full mx-auto mt-4 sm:mt-8 pb-12">
      <div className="mb-8 px-2 sm:px-0">
        <h1 className="text-headline-md font-bold text-on-surface">Account Settings</h1>
        <p className="text-body-lg text-on-surface-variant mt-2">Manage your personal profile and preferences.</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-5 py-4 rounded-2xl text-body-sm font-bold mb-8 mx-2 sm:mx-0 border border-green-500/20">
          <Check size={20} />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 px-2 sm:px-0">
        
        {/* Left Column: Avatar Settings */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-surface border border-outline-variant/30 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            
            <div className="relative mb-6">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Avatar Preview" className="w-32 h-32 rounded-full object-cover border-4 border-surface shadow-md relative z-10" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant border-4 border-surface shadow-md relative z-10">
                  <User size={48} />
                </div>
              )}
              <div className="absolute inset-0 rounded-full border border-outline-variant/20 scale-[1.05] z-0" />
            </div>
            
            <h3 className="text-title-md font-bold text-on-surface mb-1">Profile Picture</h3>
            <p className="text-label-sm text-on-surface-variant mb-6 px-4">A picture helps people recognize you across the platform.</p>
            
            <div className="flex flex-col gap-3 w-full relative z-10">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-primary text-on-primary w-full py-3 rounded-xl font-label-md hover:opacity-90 transition-opacity shadow-sm"
              >
                <Upload size={18} /> Upload New Photo
              </button>
              {formData.avatarUrl && (
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, avatarUrl: ""})}
                  className="flex items-center justify-center gap-2 text-error w-full py-2.5 rounded-xl font-label-md hover:bg-error/10 transition-colors"
                >
                  Remove Photo
                </button>
              )}
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                className="hidden" 
              />
            </div>
          </div>
        </div>

        {/* Right Column: Personal Information */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface border border-outline-variant/30 rounded-3xl shadow-sm p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-title-md font-bold text-on-surface">Personal Information</h3>
              <p className="text-body-sm text-on-surface-variant mt-1">Update your personal details here.</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-2">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    disabled
                    className="w-full bg-surface-variant/40 border border-outline-variant/20 rounded-xl py-3 px-4 text-body-md text-on-surface-variant cursor-not-allowed"
                  />
                  <p className="text-label-xs text-on-surface-variant mt-1.5">Your unique login identifier.</p>
                </div>

                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={formData.displayName}
                    onChange={e => setFormData({...formData, displayName: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-3 px-4 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-outline-variant/30 flex justify-end">
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[160px]"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Security Card */}
          <form onSubmit={handlePasswordSubmit} className="bg-surface border border-outline-variant/30 rounded-3xl shadow-sm p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-title-md font-bold text-on-surface">Security</h3>
              <p className="text-body-sm text-on-surface-variant mt-1">Change your password to keep your account secure.</p>
            </div>

            {pwdSuccess && (
              <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-3 rounded-xl text-body-sm font-bold mb-6">
                <Check size={18} />
                {pwdSuccess}
              </div>
            )}
            
            {pwdError && (
              <div className="flex items-center gap-2 bg-error/10 text-error px-4 py-3 rounded-xl text-body-sm font-bold mb-6">
                <X size={18} />
                {pwdError}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-2">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-3 px-4 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-2">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-3 px-4 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-2">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl py-3 px-4 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-outline-variant/30 flex justify-end">
              <button 
                type="submit" 
                disabled={pwdLoading}
                className="flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[160px]"
              >
                {pwdLoading ? <Loader2 size={18} className="animate-spin" /> : "Update Password"}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Crop Modal */}
      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface shrink-0">
              <h3 className="text-title-md font-bold text-on-surface">Adjust Picture</h3>
              <button onClick={() => { setIsCropping(false); setImageSrc(null); }} className="p-2 -mr-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {/* Cropper Container */}
            <div className="relative bg-black w-full h-[400px] sm:h-[500px]">
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
            
            <div className="p-6 bg-surface shrink-0">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-label-sm font-bold text-on-surface-variant">Zoom</label>
                  <span className="text-label-xs text-on-surface-variant font-mono">{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setIsCropping(false); setImageSrc(null); }} 
                  className="flex-1 py-3 text-label-md font-bold text-on-surface hover:bg-surface-variant rounded-xl border border-outline-variant/30 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={showCroppedImage} 
                  className="flex-1 py-3 text-label-md font-bold bg-primary text-on-primary hover:bg-primary/90 rounded-xl shadow-sm transition-colors"
                >
                  Confirm Crop
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
