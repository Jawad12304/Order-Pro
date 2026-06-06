"use client";

import React, { useState } from "react";
import { Plus, GripVertical, Image as ImageIcon, X, Loader2, Sparkles, Trash2, FolderOutput, Eye } from "lucide-react";
import imageCompression from "browser-image-compression";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ModifierGroupEditor, ModifierGroup } from "@/components/admin/ModifierGroupEditor";

// --- MOCK DATA ---
const initialCategories = [
  { id: "cat-1", name: "Starters" },
  { id: "cat-2", name: "Mains" },
  { id: "cat-3", name: "Desserts" },
  { id: "cat-4", name: "Beverages" },
];

const initialItems = [
  { id: "item-1", categoryId: "cat-1", name: "Garlic Bread", price: 6.99, isAvailable: true },
  { id: "item-2", categoryId: "cat-1", name: "Bruschetta", price: 8.50, isAvailable: true },
  { id: "item-3", categoryId: "cat-2", name: "Margherita Pizza", price: 14.99, isAvailable: false },
  { id: "item-4", categoryId: "cat-2", name: "Spicy Pasta", price: 16.50, isAvailable: true },
];

const DIETARY_TAGS = ["Vegan", "Vegetarian", "Gluten-Free", "Spicy"];
const ALLERGENS = ["Dairy", "Nuts", "Eggs", "Soy", "Shellfish", "Wheat"];

// --- DND COMPONENTS ---
function SortableCategoryItem({ id, name, activeId, onClick }: { id: string, name: string, activeId: string, onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${
        isDragging ? "bg-surface-variant shadow-lg opacity-80 border-primary" : 
        activeId === id ? "bg-primary/10 border-primary text-primary" : "bg-surface border-transparent hover:bg-surface-variant text-on-surface"
      }`}
    >
      <span className="font-medium text-body-md">{name}</span>
      <div {...attributes} {...listeners} className="cursor-grab p-1 text-on-surface-variant hover:text-on-surface active:cursor-grabbing">
        <GripVertical size={16} />
      </div>
    </div>
  );
}

function SortableMenuItemCard({ item, isSelected, onToggleSelect, onEdit, onToggleAvailability }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`bg-surface border ${isSelected ? "border-primary ring-1 ring-primary/50" : "border-outline-variant/30"} p-4 rounded-xl shadow-sm flex flex-col gap-3 transition-shadow ${isDragging ? "opacity-70 shadow-lg" : ""}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-3">
          <div {...attributes} {...listeners} className="cursor-grab text-on-surface-variant hover:text-on-surface active:cursor-grabbing mt-1">
            <GripVertical size={18} />
          </div>
          <input type="checkbox" className="mt-1.5 cursor-pointer accent-primary w-4 h-4" checked={isSelected} onChange={() => onToggleSelect(item.id)} />
          <div>
            <h4 className={`font-title-md font-semibold ${item.isAvailable ? "text-on-surface" : "text-on-surface-variant line-through"}`}>{item.name}</h4>
            <p className="text-primary font-bold mt-1">${item.price.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Toggle Availability */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={item.isAvailable} onChange={() => onToggleAvailability(item.id)} />
          <div className="w-10 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
      <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-outline-variant/20">
        <button onClick={() => onEdit(item)} className="text-label-sm font-semibold text-primary hover:underline">Edit Details</button>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function MenuManagementPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategories[0].id);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Bulk Selection
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Form States (when modal is open)
  const [formData, setFormData] = useState({
    name: "",
    nameArabic: "",
    description: "",
    price: "",
    categoryId: "",
    isAvailable: true,
    scheduledAvailability: false,
    startTime: "",
    endTime: "",
    prepTime: "",
    dietaryTags: [] as string[],
    allergens: [] as string[],
    imageUrl: "",
    modifierGroups: [] as ModifierGroup[]
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCategoryDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCategories((cats) => {
        const oldIndex = cats.findIndex((i) => i.id === active.id);
        const newIndex = cats.findIndex((i) => i.id === over.id);
        return arrayMove(cats, oldIndex, newIndex);
      });
    }
  };

  const handleItemDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((itms) => {
        const oldIndex = itms.findIndex((i) => i.id === active.id);
        const newIndex = itms.findIndex((i) => i.id === over.id);
        return arrayMove(itms, oldIndex, newIndex);
      });
    }
  };

  // --- ACTIONS ---
  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if(confirm(`Are you sure you want to delete ${selectedItemIds.size} items?`)) {
      setItems(items.filter(i => !selectedItemIds.has(i.id)));
      setSelectedItemIds(new Set());
    }
  };

  const handleBulkToggleAvailability = () => {
    setItems(items.map(i => selectedItemIds.has(i.id) ? { ...i, isAvailable: !i.isAvailable } : i));
    setSelectedItemIds(new Set());
  };

  // --- FORM HANDLERS ---
  const openModal = (item?: any) => {
    if (item) {
      setFormData({
        ...formData,
        name: item.name,
        price: item.price.toString(),
        categoryId: item.categoryId,
        isAvailable: item.isAvailable,
      });
      setEditingItem(item);
    } else {
      setFormData({
        name: "", nameArabic: "", description: "", price: "", categoryId: activeCategoryId,
        isAvailable: true, scheduledAvailability: false, startTime: "", endTime: "", prepTime: "",
        dietaryTags: [], allergens: [], imageUrl: "", modifierGroups: []
      });
      setEditingItem(null);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // 1. Compress Image using browser-image-compression
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      console.log(`Original: ${file.size / 1024 / 1024} MB, Compressed: ${compressedFile.size / 1024 / 1024} MB`);

      // 2. Mock Cloudinary Upload (In production, POST to cloudinary URL here)
      // We simulate a network delay and just use local object URL for preview
      await new Promise(r => setTimeout(r, 1500));
      const previewUrl = URL.createObjectURL(compressedFile);
      setFormData(prev => ({ ...prev, imageUrl: previewUrl }));

    } catch (error) {
      console.error("Image upload failed", error);
      alert("Failed to process image.");
    } finally {
      setIsUploading(false);
    }
  };

  const mockDeepLTranslation = async () => {
    if (!formData.name && !formData.description) return;
    setIsTranslating(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setFormData(prev => ({
      ...prev,
      nameArabic: prev.name ? `${prev.name} (Arabic Translation)` : "",
    }));
    setIsTranslating(false);
  };

  const filteredItems = items.filter(i => i.categoryId === activeCategoryId);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-300 relative">
      
      {/* Top action: Preview Menu */}
      <div className="absolute -top-14 right-0">
        <button onClick={() => window.open("/menu?table=Preview", "_blank")} className="flex items-center gap-2 bg-surface border border-outline-variant/50 text-on-surface px-4 py-2 rounded-xl font-label-md shadow-sm hover:bg-surface-variant transition-colors">
          <Eye size={18} /> Preview Menu
        </button>
      </div>

      {/* Categories Sidebar (Left) */}
      <div className="w-full md:w-72 shrink-0 flex flex-col gap-4 bg-surface rounded-2xl p-4 shadow-sm border border-outline-variant/30 h-full overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-title-lg font-bold text-on-surface">Categories</h3>
          <button className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {categories.map((cat) => (
                <SortableCategoryItem key={cat.id} id={cat.id} name={cat.name} activeId={activeCategoryId} onClick={() => setActiveCategoryId(cat.id)} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Items Grid View (Right) */}
      <div className="flex-1 bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant/30 h-full overflow-hidden flex flex-col relative">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-title-lg font-bold text-on-surface">
              {categories.find(c => c.id === activeCategoryId)?.name || "Items"}
            </h3>
            <span className="text-label-sm bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full">{filteredItems.length} items</span>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity">
            <Plus size={18} /> Add Item
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
            <SortableContext items={filteredItems.map(i => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <SortableMenuItemCard 
                    key={item.id} 
                    item={item} 
                    isSelected={selectedItemIds.has(item.id)}
                    onToggleSelect={toggleItemSelection}
                    onEdit={openModal}
                    onToggleAvailability={(id: string) => setItems(items.map(i => i.id === id ? { ...i, isAvailable: !i.isAvailable } : i))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-on-surface-variant">No items in this category.</div>
          )}
        </div>

        {/* Floating Bulk Action Bar */}
        {selectedItemIds.size > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-container-high border border-outline-variant/50 shadow-xl rounded-2xl p-2 px-4 flex items-center gap-4 animate-in slide-in-from-bottom-8">
            <span className="text-label-md font-bold text-on-surface border-r border-outline-variant/50 pr-4">{selectedItemIds.size} Selected</span>
            <button onClick={handleBulkToggleAvailability} className="text-label-sm font-semibold text-on-surface hover:text-primary transition-colors flex items-center gap-1.5 px-2">
              Toggle Availability
            </button>
            <button className="text-label-sm font-semibold text-on-surface hover:text-primary transition-colors flex items-center gap-1.5 px-2">
              <FolderOutput size={16} /> Move
            </button>
            <button onClick={handleBulkDelete} className="text-label-sm font-semibold text-error hover:text-error/80 transition-colors flex items-center gap-1.5 px-2 pl-4 border-l border-outline-variant/50">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* FULL PAGE ITEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface sm:bg-black/60 sm:backdrop-blur-sm sm:p-4 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-surface w-full max-w-5xl sm:rounded-3xl shadow-2xl flex flex-col min-h-screen sm:min-h-0 sm:max-h-[90vh]">
            
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/30 sticky top-0 bg-surface z-10 sm:rounded-t-3xl">
              <h2 className="text-headline-sm font-bold text-on-surface">{editingItem ? "Edit Menu Item" : "Create New Item"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:bg-surface-variant p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col md:flex-row gap-8">
              
              {/* Left Column: Basic Info & Image */}
              <div className="w-full md:w-1/2 space-y-6">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Primary Name</label>
                    <button onClick={mockDeepLTranslation} disabled={isTranslating} className="text-label-xs font-bold text-primary flex items-center gap-1 hover:underline">
                      {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Auto-Translate
                    </button>
                  </div>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 text-body-md focus:outline-none focus:border-primary transition-colors" placeholder="e.g. Classic Beef Burger" />
                </div>

                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Localized Name (Arabic)</label>
                  <input type="text" dir="rtl" value={formData.nameArabic} onChange={e => setFormData({...formData, nameArabic: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 text-body-md focus:outline-none focus:border-primary transition-colors font-arabic" placeholder="برجر لحم كلاسيك" />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-label-sm font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                      <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 pl-8 text-body-md focus:outline-none focus:border-primary transition-colors" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-label-sm font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Category</label>
                    <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 text-body-md focus:outline-none focus:border-primary transition-colors">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
                    <span className="text-label-xs text-on-surface-variant">{formData.description.length}/200</span>
                  </div>
                  <textarea rows={3} maxLength={200} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 text-body-md focus:outline-none focus:border-primary transition-colors resize-none" placeholder="Appetizing description..." />
                </div>

                <div>
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Item Image</label>
                  <label className="relative border-2 border-dashed border-outline-variant/50 rounded-2xl p-8 flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-variant/30 cursor-pointer transition-colors overflow-hidden group">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                    {isUploading ? (
                      <Loader2 size={32} className="animate-spin text-primary" />
                    ) : formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                        <span className="relative z-10 bg-black/50 text-white px-3 py-1 rounded-full text-label-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Change Image</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={40} className="mb-3 opacity-50" />
                        <span className="text-body-md font-medium text-on-surface">Drag & Drop or Click to Upload</span>
                        <span className="text-label-sm mt-1">JPEG, PNG, WebP (Max 5MB)</span>
                        <span className="text-label-xs text-primary mt-3 bg-primary/10 px-2 py-0.5 rounded">Auto-compresses before upload</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Right Column: Modifiers, Tags, Settings */}
              <div className="w-full md:w-1/2 space-y-8 border-t md:border-t-0 md:border-l border-outline-variant/30 pt-6 md:pt-0 md:pl-8">
                
                {/* Availability */}
                <div>
                  <h3 className="text-title-md font-bold text-on-surface mb-3 border-b border-outline-variant/20 pb-2">Availability & Prep</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-body-md font-medium text-on-surface">Currently Available</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.isAvailable} onChange={e => setFormData({...formData, isAvailable: e.target.checked})} />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-body-md font-medium text-on-surface">Scheduled Availability</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.scheduledAvailability} onChange={e => setFormData({...formData, scheduledAvailability: e.target.checked})} />
                        <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {formData.scheduledAvailability && (
                      <div className="flex gap-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1">
                          <label className="block text-label-xs font-bold text-on-surface-variant mb-1">Start Time</label>
                          <input type="time" className="w-full bg-surface border border-outline-variant/50 rounded-lg p-2 focus:border-primary focus:outline-none" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-label-xs font-bold text-on-surface-variant mb-1">End Time</label>
                          <input type="time" className="w-full bg-surface border border-outline-variant/50 rounded-lg p-2 focus:border-primary focus:outline-none" />
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-label-xs font-bold text-on-surface-variant mb-1">Prep Time (Minutes)</label>
                      <input type="number" min="0" placeholder="e.g. 15" className="w-32 bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-2 text-body-md focus:outline-none focus:border-primary transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Tags & Allergens */}
                <div>
                  <h3 className="text-title-md font-bold text-on-surface mb-3 border-b border-outline-variant/20 pb-2">Dietary & Allergens</h3>
                  
                  <div className="mb-4">
                    <label className="block text-label-xs font-bold text-on-surface-variant mb-2">Dietary Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_TAGS.map(tag => (
                        <button 
                          key={tag}
                          onClick={() => {
                            const newTags = formData.dietaryTags.includes(tag) 
                              ? formData.dietaryTags.filter(t => t !== tag)
                              : [...formData.dietaryTags, tag];
                            setFormData({...formData, dietaryTags: newTags});
                          }}
                          className={`px-3 py-1.5 rounded-full text-label-sm font-semibold border transition-colors ${formData.dietaryTags.includes(tag) ? "bg-primary text-on-primary border-primary" : "bg-surface text-on-surface-variant border-outline-variant/50 hover:border-outline-variant"}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-label-xs font-bold text-on-surface-variant mb-2">Allergens</label>
                    <div className="flex flex-wrap gap-2">
                      {ALLERGENS.map(alg => (
                        <button 
                          key={alg}
                          onClick={() => {
                            const newTags = formData.allergens.includes(alg) 
                              ? formData.allergens.filter(t => t !== alg)
                              : [...formData.allergens, alg];
                            setFormData({...formData, allergens: newTags});
                          }}
                          className={`px-3 py-1.5 rounded-full text-label-sm font-semibold border transition-colors ${formData.allergens.includes(alg) ? "bg-error text-on-error border-error" : "bg-surface text-on-surface-variant border-outline-variant/50 hover:border-outline-variant"}`}
                        >
                          {alg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modifiers */}
                <div>
                  <h3 className="text-title-md font-bold text-on-surface mb-3 border-b border-outline-variant/20 pb-2">Modifier Groups</h3>
                  <ModifierGroupEditor 
                    groups={formData.modifierGroups} 
                    onChange={(groups) => setFormData({...formData, modifierGroups: groups})} 
                  />
                </div>

              </div>
            </div>

            <div className="p-6 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-lowest mt-auto sm:rounded-b-3xl">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-label-lg text-on-surface hover:bg-surface-variant transition-colors border border-transparent hover:border-outline-variant/30">Cancel</button>
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-2.5 rounded-xl font-label-lg bg-primary text-on-primary hover:opacity-90 shadow-sm transition-opacity">Save Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
