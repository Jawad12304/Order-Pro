"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { Plus, GripVertical, Image as ImageIcon, X, Loader2, Sparkles, Trash2, FolderOutput, Eye, Search } from "lucide-react";
import { useRestaurantId } from "@/hooks/useRestaurantId";
import imageCompression from "browser-image-compression";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { getCroppedImg } from "@/utils/cropImage";
import { ModifierGroupEditor, ModifierGroup } from "@/components/admin/ModifierGroupEditor";
import { 
  getCategories, 
  getMenuItems, 
  updateCategorySortOrders, 
  updateMenuItemSortOrders, 
  updateMenuItemAvailability, 
  deleteMenuItems,
  createMenuItem,
  updateMenuItem,
  createCategory,
  updateCategory,
  deleteCategory
} from "@/app/actions/menu";
import { arrayMove } from "@dnd-kit/sortable";

// Dynamic imports for dnd-kit to reduce initial bundle size
const DndContext = dynamic(() => import("@dnd-kit/core").then((mod) => mod.DndContext), { ssr: false });
const SortableContext = dynamic(() => import("@dnd-kit/sortable").then((mod) => mod.SortableContext), { ssr: false });
const verticalListSortingStrategy = dynamic(() => import("@dnd-kit/sortable").then((mod) => mod.verticalListSortingStrategy), { ssr: false }) as any;
const rectSortingStrategy = dynamic(() => import("@dnd-kit/sortable").then((mod) => mod.rectSortingStrategy), { ssr: false }) as any;

// To use hooks like useSortable inside dynamically imported components, we must import them normally
// but we only render them when DndContext is ready.
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

const DIETARY_TAGS = ["Vegan", "Vegetarian", "Gluten-Free", "Spicy"];
const ALLERGENS = ["Dairy", "Nuts", "Eggs", "Soy", "Shellfish", "Wheat"];

function SortableCategoryItem({ id, name, activeId, onClick, onEdit, onDelete }: { id: string, name: string, activeId: string, onClick: () => void, onEdit: (id: string, name: string) => void, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${
        isDragging ? "bg-surface-variant shadow-lg opacity-80 border-primary" : 
        activeId === id ? "bg-primary/10 border-primary text-primary" : "bg-surface border-transparent hover:bg-surface-variant text-on-surface"
      }`}
    >
      <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap pr-2" onClick={onClick}>
        <span className="font-medium text-body-md">{name}</span>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onEdit(id, name); }} className="p-1.5 text-on-surface-variant hover:text-primary rounded-md transition-colors">
          <Sparkles size={14} className="hidden" /> {/* just keeping import used if not */}
          <Eye size={14} className="hidden" />
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(id); }} className="p-1.5 text-on-surface-variant hover:text-error rounded-md transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      <div {...attributes} {...listeners} className="cursor-grab p-1 ml-1 text-on-surface-variant hover:text-on-surface active:cursor-grabbing">
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
          <input type="checkbox" className="sr-only peer" checked={item.isAvailable} onChange={() => onToggleAvailability(item.id, !item.isAvailable)} />
          <div className="w-10 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
      <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-outline-variant/20">
        <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="text-label-sm font-semibold text-primary hover:underline">Edit Details</button>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function MenuManagementPage() {
  const { restaurantId, loading: resLoading } = useRestaurantId();
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id?: string, name: string } | null>(null);

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
  const [searchQuery, setSearchQuery] = useState("");

  // Cropper States
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: fetchedCategories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: () => getCategories(restaurantId!),
    enabled: !!restaurantId,
  });

  const { data: fetchedItems, isLoading: loadingItems } = useQuery({
    queryKey: ['menuItems', restaurantId],
    queryFn: () => getMenuItems(restaurantId!),
    enabled: !!restaurantId,
  });

  React.useEffect(() => {
    if (fetchedCategories && fetchedCategories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(fetchedCategories[0].id);
    }
  }, [fetchedCategories, activeCategoryId]);

  React.useEffect(() => {
    if (fetchedCategories) setCategories(fetchedCategories);
  }, [fetchedCategories]);

  React.useEffect(() => {
    if (fetchedItems) setItems(fetchedItems);
  }, [fetchedItems]);

  const loading = resLoading || loadingCategories || loadingItems;

  const handleCategoryDragEnd = async (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCategories((cats) => {
        const oldIndex = cats.findIndex((i) => i.id === active.id);
        const newIndex = cats.findIndex((i) => i.id === over.id);
        const newCats = arrayMove(cats, oldIndex, newIndex);
        
        // Optimistic UI + Save to DB
        const updates = newCats.map((c, index) => ({ id: c.id, sortOrder: index }));
        updateCategorySortOrders(updates).catch(console.error);
        
        return newCats;
      });
    }
  };

  const handleItemDragEnd = async (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((itms) => {
        const oldIndex = itms.findIndex((i) => i.id === active.id);
        const newIndex = itms.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(itms, oldIndex, newIndex);
        
        // Optimistic UI + Save to DB
        const categoryItems = newItems.filter(i => i.categoryId === activeCategoryId);
        const updates = categoryItems.map((i, index) => ({ id: i.id, sortOrder: index, categoryId: activeCategoryId }));
        updateMenuItemSortOrders(updates).catch(console.error);
        
        return newItems;
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

  const handleBulkDelete = async () => {
    if(confirm(`Are you sure you want to delete ${selectedItemIds.size} items?`)) {
      const idsToDelete = Array.from(selectedItemIds);
      
      // Optimistic update
      setItems(items.filter(i => !selectedItemIds.has(i.id)));
      setSelectedItemIds(new Set());
      
      // DB call
      await deleteMenuItems(idsToDelete);
    }
  };

  const handleBulkToggleAvailability = async () => {
    const idsToToggle = Array.from(selectedItemIds);
    // Optimistic
    setItems(items.map(i => idsToToggle.includes(i.id) ? { ...i, isAvailable: !i.isAvailable } : i));
    setSelectedItemIds(new Set());
    
    // DB
    for (const id of idsToToggle) {
      const item = items.find(i => i.id === id);
      if (item) {
        await updateMenuItemAvailability(id, !item.isAvailable);
      }
    }
  };

  const handleItemToggleAvailability = async (id: string, newAvailability: boolean) => {
    setItems(items.map(i => i.id === id ? { ...i, isAvailable: newAvailability } : i));
    await updateMenuItemAvailability(id, newAvailability);
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
        description: item.description || "",
        prepTime: item.prepTimeMins ? item.prepTimeMins.toString() : "",
        imageUrl: item.imageUrl || "",
        dietaryTags: item.dietaryTags || [],
        allergens: item.allergens || [],
        modifierGroups: item.modifierGroups ? item.modifierGroups.map((mg: any) => ({
          id: mg.modifierGroup.id,
          name: mg.modifierGroup.name,
          minSelections: mg.modifierGroup.minSelections,
          maxSelections: mg.modifierGroup.maxSelections,
          options: mg.modifierGroup.modifiers.map((m: any) => ({
            id: m.id,
            name: m.name,
            priceDelta: m.priceDelta
          }))
        })) : []
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
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image load failed", error);
      alert("Failed to process image.");
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const showCroppedImage = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      setIsUploading(true);
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      setFormData(prev => ({ ...prev, imageUrl: croppedImageBase64 }));
      setIsCropping(false);
    } catch (e) {
      console.error(e);
      alert("Failed to crop image");
    } finally {
      setIsUploading(false);
    }
  };

  const mockDeepLTranslation = async () => {
    if (!formData.name && !formData.description) return;
    setIsTranslating(true);
    await new Promise(r => setTimeout(r, 1000));
    setFormData(prev => ({
      ...prev,
      nameArabic: prev.name ? `${prev.name} (Urdu Translation)` : "",
    }));
    setIsTranslating(false);
  };

  const handleSaveItem = async () => {
    if (!restaurantId) return;
    try {
      const payload = {
        restaurantId,
        categoryId: formData.categoryId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        imageUrl: formData.imageUrl,
        isAvailable: formData.isAvailable,
        prepTimeMins: parseInt(formData.prepTime) || null,
        tags: formData.dietaryTags || [],
        allergens: formData.allergens || [],
        modifierGroups: formData.modifierGroups
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, payload);
      } else {
        await createMenuItem(payload);
      }

      // Reload
      const fetchedItems = await getMenuItems(restaurantId);
      setItems(fetchedItems);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save item:", error);
      alert("Failed to save item");
    }
  };

  const openCategoryModal = (id?: string, name?: string) => {
    setEditingCategory(id && name ? { id, name } : { name: "" });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!restaurantId || !editingCategory || !editingCategory.name.trim()) return;
    try {
      let newCatId = editingCategory.id;
      if (editingCategory.id) {
        await updateCategory(editingCategory.id, { name: editingCategory.name });
      } else {
        const res = await createCategory({ restaurantId, name: editingCategory.name });
        newCatId = res.id;
      }
      const fetchedCategories = await getCategories(restaurantId);
      setCategories(fetchedCategories);
      
      // Auto-select category if none is selected so the Add Item button works
      if (!activeCategoryId) {
        if (newCatId) setActiveCategoryId(newCatId);
        else if (fetchedCategories.length > 0) setActiveCategoryId(fetchedCategories[0].id);
      }
      
      setIsCategoryModalOpen(false);
    } catch (error) {
      alert("Failed to save category.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        const res = await deleteCategory(id);
        if (!res.success) {
          alert(res.error);
        } else {
          setCategories(categories.filter(c => c.id !== id));
          if (activeCategoryId === id) {
            setActiveCategoryId("");
          }
        }
      } catch (err) {
        alert("Failed to delete category.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredItems = items
    .filter(i => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return i.name.toLowerCase().includes(query) || (i.description && i.description.toLowerCase().includes(query));
      }
      return i.categoryId === activeCategoryId;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-300 relative">
      
      {/* Categories Sidebar (Left) */}
      <div className="w-full md:w-72 shrink-0 flex flex-col gap-4 bg-surface/50 backdrop-blur-xl rounded-[2.5rem] p-5 shadow-sm border border-white/10 h-full overflow-hidden">
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="font-title-lg font-bold text-on-surface">Categories</h3>
          <button onClick={() => openCategoryModal()} className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {categories.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
              <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {categories.map((cat) => (
                  <SortableCategoryItem 
                    key={cat.id} 
                    id={cat.id} 
                    name={cat.name} 
                    activeId={activeCategoryId} 
                    onClick={() => setActiveCategoryId(cat.id)}
                    onEdit={openCategoryModal}
                    onDelete={handleDeleteCategory}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center text-sm text-on-surface-variant py-8">No categories found.</div>
          )}
        </div>
      </div>

      {/* Items Grid View (Right) */}
      <div className="flex-1 bg-surface/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-white/10 h-full overflow-hidden flex flex-col relative">
        <div className="flex justify-between items-center mb-6 shrink-0 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h3 className="font-title-lg font-bold text-on-surface">
              {searchQuery.trim() ? "Search Results" : (categories.find(c => c.id === activeCategoryId)?.name || "Items")}
            </h3>
            <span className="text-label-sm bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full">{filteredItems.length} items</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input 
                type="text" 
                placeholder="Search menu items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-body-md focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                  <X size={14} />
                </button>
              )}
            </div>
            <button onClick={() => window.open(`/menu?table=Preview&restaurantId=${restaurantId}`, "_blank")} className="flex items-center gap-2 bg-surface border border-white/20 text-on-surface px-4 py-2 rounded-xl font-label-md shadow-sm hover:bg-surface-variant transition-colors whitespace-nowrap">
              <Eye size={18} /> Preview Menu
            </button>
            <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-label-md shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50" disabled={!activeCategoryId}>
              <Plus size={18} /> Add Item
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
          {filteredItems.length > 0 ? (
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
                      onToggleAvailability={handleItemToggleAvailability}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
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
                  <label className="block text-label-sm font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Localized Name (Urdu)</label>
                  <input type="text" dir="rtl" value={formData.nameArabic} onChange={e => setFormData({...formData, nameArabic: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 text-body-md focus:outline-none focus:border-primary transition-colors font-arabic" placeholder="کلاسک بیف برگر" />
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

                {/* Modifiers */}
                <div>
                  <h3 className="text-title-md font-bold text-on-surface mb-3 border-b border-outline-variant/20 pb-2">Modifiers & Options</h3>
                  <ModifierGroupEditor 
                    groups={formData.modifierGroups} 
                    onChange={groups => setFormData({...formData, modifierGroups: groups})} 
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-lowest mt-auto sm:rounded-b-3xl">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-label-lg text-on-surface hover:bg-surface-variant transition-colors border border-transparent hover:border-outline-variant/30">Cancel</button>
              <button onClick={handleSaveItem} className="px-8 py-2.5 rounded-xl font-label-lg bg-primary text-on-primary hover:opacity-90 shadow-sm transition-opacity">Save Item</button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full min-w-[300px] max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface">
              <h2 className="text-title-lg font-bold text-on-surface">{editingCategory.id ? "Edit Category" : "New Category"}</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-on-surface-variant hover:bg-surface-variant p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-6 bg-surface-container-lowest">
              <label className="block text-label-sm font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Category Name</label>
              <input 
                type="text" 
                value={editingCategory.name} 
                onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} 
                className="w-full bg-surface border border-outline-variant/50 rounded-xl p-4 text-body-lg sm:p-3 sm:text-body-md focus:outline-none focus:border-primary transition-colors" 
                placeholder="e.g. Burgers, Drinks..." 
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveCategory()}
              />
            </div>
            <div className="p-5 sm:p-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface">
              <button onClick={() => setIsCategoryModalOpen(false)} className="px-5 py-3 sm:py-2 rounded-xl font-label-md text-on-surface hover:bg-surface-variant transition-colors">Cancel</button>
              <button onClick={handleSaveCategory} className="px-6 py-3 sm:py-2 rounded-xl font-label-md bg-primary text-on-primary hover:opacity-90 shadow-sm transition-opacity">Save</button>
            </div>
          </div>
        </div>
      )}
      {/* CROPPER MODAL */}
      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full min-w-[320px] max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface">
              <h2 className="text-title-lg font-bold text-on-surface">Crop Item Image</h2>
              <button onClick={() => { setIsCropping(false); setImageSrc(null); }} className="text-on-surface-variant hover:bg-surface-variant p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="relative w-full h-80 bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
              />
            </div>

            <div className="p-6 bg-surface-container-lowest space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Zoom</label>
                  <span className="text-label-sm text-on-surface-variant">{Math.round(zoom * 100)}%</span>
                </div>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Rotation</label>
                  <span className="text-label-sm text-on-surface-variant">{rotation}°</span>
                </div>
                <input type="range" min={0} max={360} step={1} value={rotation} onChange={e => setRotation(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>

            <div className="p-5 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface">
              <button onClick={() => { setIsCropping(false); setImageSrc(null); }} className="px-5 py-2 rounded-xl font-label-md text-on-surface hover:bg-surface-variant transition-colors">Cancel</button>
              <button onClick={showCroppedImage} disabled={isUploading} className="px-6 py-2 rounded-xl font-label-md bg-primary text-on-primary hover:opacity-90 shadow-sm transition-opacity flex items-center gap-2">
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : null}
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
