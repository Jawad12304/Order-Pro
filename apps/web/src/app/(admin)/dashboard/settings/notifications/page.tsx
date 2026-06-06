"use client";

import React, { useState } from "react";
import { Bell, Smartphone, Mail, MessageSquare, Save, Loader2 } from "lucide-react";

type ChannelSettings = {
  push: boolean;
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
};

type EventSettings = {
  [eventId: string]: ChannelSettings;
};

export default function NotificationSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<EventSettings>({
    new_order: { push: true, sms: false, email: false, whatsapp: false },
    order_ready: { push: true, sms: true, email: true, whatsapp: true },
    waiter_called: { push: true, sms: false, email: false, whatsapp: false },
    daily_summary: { push: false, sms: false, email: true, whatsapp: false }
  });

  const events = [
    { id: "new_order", title: "New Order Received", desc: "When a customer places a new order" },
    { id: "order_ready", title: "Order Ready", desc: "When food is ready for pickup/serving" },
    { id: "waiter_called", title: "Waiter Assistance", desc: "When a table requests help" },
    { id: "daily_summary", title: "Daily Summary", desc: "Midnight report on sales and orders" }
  ];

  const toggleSetting = (eventId: string, channel: keyof ChannelSettings) => {
    setSettings(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [channel]: !prev[eventId][channel]
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call to save settings
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-headline-md font-bold text-on-surface">Notification Engine</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Configure Omnichannel routing for staff and customers.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Preferences
        </button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-surface-container-low border-b border-outline-variant/30 text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">
          <div className="col-span-4">Event Trigger</div>
          <div className="col-span-2 flex items-center justify-center gap-2"><Bell size={16}/> Push App</div>
          <div className="col-span-2 flex items-center justify-center gap-2"><MessageSquare size={16}/> WhatsApp</div>
          <div className="col-span-2 flex items-center justify-center gap-2"><Smartphone size={16}/> SMS</div>
          <div className="col-span-2 flex items-center justify-center gap-2"><Mail size={16}/> Email</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-outline-variant/20">
          {events.map(event => (
            <div key={event.id} className="grid grid-cols-12 gap-4 p-5 hover:bg-surface-container-lowest transition-colors items-center">
              
              <div className="col-span-4 pr-4 border-r border-outline-variant/20">
                <h4 className="text-title-md font-bold text-on-surface">{event.title}</h4>
                <p className="text-body-sm text-on-surface-variant mt-1">{event.desc}</p>
              </div>

              {/* Push Toggle */}
              <div className="col-span-2 flex justify-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings[event.id].push} onChange={() => toggleSetting(event.id, "push")} />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* WhatsApp Toggle */}
              <div className="col-span-2 flex justify-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings[event.id].whatsapp} onChange={() => toggleSetting(event.id, "whatsapp")} />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              {/* SMS Toggle */}
              <div className="col-span-2 flex justify-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings[event.id].sms} onChange={() => toggleSetting(event.id, "sms")} />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              {/* Email Toggle */}
              <div className="col-span-2 flex justify-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings[event.id].email} onChange={() => toggleSetting(event.id, "email")} />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* API Integrations Status */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-on-surface">Firebase FCM</span>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          </div>
          <span className="text-body-sm text-on-surface-variant">Push notifications active</span>
        </div>
        
        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-on-surface">WhatsApp Cloud</span>
            <span className="w-2 h-2 rounded-full bg-error"></span>
          </div>
          <span className="text-body-sm text-on-surface-variant">API Key missing</span>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-on-surface">Twilio SMS</span>
            <span className="w-2 h-2 rounded-full bg-error"></span>
          </div>
          <span className="text-body-sm text-on-surface-variant">Account SID missing</span>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-on-surface">Resend Email</span>
            <span className="w-2 h-2 rounded-full bg-error"></span>
          </div>
          <span className="text-body-sm text-on-surface-variant">API Key missing</span>
        </div>
      </div>
    </div>
  );
}
