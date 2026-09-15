import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Image as ImageIcon,
  Sparkles,
  Mail,
  Heart,
  Plus,
  Trash2,
  Edit3,
  LogOut,
  Users,
  ShieldCheck,
  RefreshCw,
  X,
  ExternalLink,
  Upload,
  Sun,
  Moon,
  Settings,
  Star,
  Bell,
  CheckCheck,
  Filter,
  Layers,
  Eye,
  GraduationCap,
  QrCode,
  Copy,
  Download,
  Link2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FocalPointPicker } from '../components/FocalPointPicker';
import { eventService } from '../services/eventService';
import { galleryService } from '../services/galleryService';
import { facilityService } from '../services/facilityService';
import { contactService } from '../services/contactService';
import { contributionService } from '../services/contributionService';
import { EventItem, GalleryItem, FacilityItem, ContactMessage, ContributionRecord, UserAdmin, SiteSettingsData, ReviewItem, ActivityItem, MemoryVaultCard, StudentImage, CarouselImage } from '../types';
import { authService } from '../services/authService';
import { siteSettingsService } from '../services/siteSettingsService';
import { reviewService } from '../services/reviewService';
import { activityService } from '../services/activityService';
import { memoryVaultService } from '../services/memoryVaultService';
import { studentImageService } from '../services/studentImageService';
import { carouselService } from '../services/carouselService';
import { donationSettingsService, DonationSettings } from '../services/donationSettingsService';
import api from '../services/api';
import toast from 'react-hot-toast';
import { uploadMediaWithProgress, isFirebaseConfigured } from '../lib/firebase';

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  education: 'Formal schooling support, interactive digital science labs, language literacy, homework assistance, and conceptual clarity.',
  activities: 'Daily outdoor sports tournaments, athletics, yoga sessions, classical music, drama, and artistic creative workshops.',
  personal_growth: 'Value-based life lessons, emotional care, leadership qualities, environmental responsibility, and spiritual mindfulness.'
};

interface SortableCarouselCardProps {
  img: CarouselImage;
  onToggleActive: (img: CarouselImage) => void;
  onEdit: (img: CarouselImage) => void;
  onDelete: (img: CarouselImage) => void;
}

const SortableCarouselCard: React.FC<SortableCarouselCardProps> = ({ img, onToggleActive, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' };
  
  return (
    <div ref={setNodeRef} style={style} className={`group bg-white dark:bg-darkAshram-card border rounded-2xl overflow-hidden shadow-soft transition-all duration-300 hover:shadow-xl ${img.isActive ? 'border-ashram-border dark:border-darkAshram-border' : 'border-dashed border-ashram-muted/60 opacity-70'}`}>
      <div className="relative aspect-[4/3] bg-ashram-cream dark:bg-darkAshram-bg cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <img src={img.image} alt={img.title || 'Showcase Image'} className="w-full h-full object-cover" />
        {!img.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/40 backdrop-blur-sm">Inactive</span>
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 bg-black/30 backdrop-blur rounded-lg flex flex-col items-center justify-center gap-0.5">
            <div className="w-3.5 h-0.5 bg-white rounded"></div>
            <div className="w-3.5 h-0.5 bg-white rounded"></div>
            <div className="w-3.5 h-0.5 bg-white rounded"></div>
          </div>
        </div>
        {img.category && (
          <div className="absolute bottom-2 left-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-ashram-saffron/90 text-white">{img.category}</span>
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        {img.title && <p className="text-sm font-semibold text-ashram-charcoal dark:text-darkAshram-text line-clamp-1">{img.title}</p>}
        {img.description && <p className="text-xs text-ashram-muted dark:text-darkAshram-muted line-clamp-2">{img.description}</p>}
        <div className="flex items-center justify-between pt-1 border-t border-ashram-border/50 dark:border-darkAshram-border/50">
          <button
            onClick={() => onToggleActive(img)}
            className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${img.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'}`}
          >
            {img.isActive ? '● Active' : '○ Inactive'}
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(img)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors" title="Edit">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(img)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-600 rounded-xl m-10 border border-red-200">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="text-sm overflow-auto p-4 bg-red-100 rounded">{this.state.error?.toString()}</pre>
          <pre className="text-xs overflow-auto p-4 bg-red-100 rounded mt-2">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AdminDashboardPage: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'events' | 'gallery' | 'facilities' | 'messages' | 'contributions' | 'users' | 'settings' | 'donation_settings' | 'reviews' | 'activity' | 'memoryvault' | 'our_students' | 'carousel'>('events');

  // Data states
  const [events, setEvents] = useState<EventItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [contributions, setContributions] = useState<ContributionRecord[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<UserAdmin[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsData | null>(null);
  const [donationSettings, setDonationSettings] = useState<DonationSettings | null>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const modalQrFileInputRef = useRef<HTMLInputElement>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrUrlInput, setQrUrlInput] = useState('');
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [activitySearch, setActivitySearch] = useState('');
  
  const [studentImages, setStudentImages] = useState<StudentImage[]>([]);
  const [showStudentImageModal, setShowStudentImageModal] = useState(false);
  const [editingStudentImage, setEditingStudentImage] = useState<StudentImage | null>(null);
  const [studentImageForm, setStudentImageForm] = useState<{ title: string; image: string; description: string; focalPoint?: { x: number, y: number } }>({ title: '', image: '', description: '', focalPoint: { x: 50, y: 50 } });
  // Memory Vault state
  const [memoryVaultCards, setMemoryVaultCards] = useState<MemoryVaultCard[]>([]);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [editingVaultCard, setEditingVaultCard] = useState<MemoryVaultCard | null>(null);
  const [vaultForm, setVaultForm] = useState<{ title: string; image: string; description: string; category: MemoryVaultCard['category']; focalPoint?: { x: number, y: number } }>({
    title: '',
    image: '',
    description: '',
    category: 'Memories',
    focalPoint: { x: 50, y: 50 }
  });
  const [vaultPreview, setVaultPreview] = useState(false);

  // Carousel Strip State
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [showCarouselModal, setShowCarouselModal] = useState(false);
  const [editingCarouselImage, setEditingCarouselImage] = useState<CarouselImage | null>(null);
  const [carouselForm, setCarouselForm] = useState<{ image: string; title: string; description: string; category: string; date: string; isActive: boolean; order: number }>({
    image: '', title: '', description: '', category: '', date: '', isActive: true, order: 0
  });

  const [loading, setLoading] = useState(true);

  // Modal / Form state for Add/Edit
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventForm, setEventForm] = useState<{ title: string; description: string; image: string; date: string; category: string; location: string; focalPoint?: { x: number, y: number } }>({ title: '', description: '', image: '', date: '', category: 'Educational Events', location: 'Vatsalya Vatika Campus', focalPoint: { x: 50, y: 50 } });

  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [galleryForm, setGalleryForm] = useState<{ title: string; image: string; category: 'Students' | 'Events' | 'Ashram' | 'Activities'; description: string; focalPoint?: { x: number, y: number } }>({ title: '', image: '', category: 'Ashram', description: '', focalPoint: { x: 50, y: 50 } });

  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [facilityForm, setFacilityForm] = useState<{ title: string; description: string; icon: string; focalPoint?: { x: number, y: number } }>({ title: '', description: '', icon: 'BookOpen', focalPoint: { x: 50, y: 50 } });

  const [showContributionModal, setShowContributionModal] = useState(false);
  const [contributionForm, setContributionForm] = useState({ name: '', email: '', amount: 0, purpose: 'General Support', paymentStatus: 'completed', paymentRef: '' });

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'fallback' | 'checking'>(
    isFirebaseConfigured ? 'connected' : 'fallback'
  );
  const loadedTabs = useRef<Set<string>>(new Set());

  const checkDbHealth = useCallback(() => {
    setDbStatus(isFirebaseConfigured ? 'connected' : 'fallback');
  }, []);

  const loadTabData = useCallback(async (tabName: string, force = false) => {
    if (!force && loadedTabs.current.has(tabName)) {
      return;
    }
    try {
      switch (tabName) {
        case 'events': {
          const data = await eventService.getEvents().catch(() => []);
          setEvents(data);
          break;
        }
        case 'gallery': {
          const data = await galleryService.getGallery().catch(() => []);
          setGallery(data);
          break;
        }
        case 'memoryvault': {
          const data = await memoryVaultService.getCards().catch(() => []);
          setMemoryVaultCards(data);
          break;
        }
        case 'facilities': {
          const data = await facilityService.getFacilities().catch(() => []);
          setFacilities(data);
          break;
        }
        case 'messages': {
          const data = await contactService.getContacts().catch(() => []);
          setContacts(data);
          break;
        }
        case 'contributions': {
          const data = await contributionService.getContributions().catch(() => []);
          setContributions(data);
          break;
        }
        case 'donation_settings': {
          const data = await donationSettingsService.getSettings().catch(() => null);
          setDonationSettings(data);
          break;
        }
        case 'reviews': {
          const data = await reviewService.getAllReviews().catch(() => []);
          setReviews(data);
          break;
        }
        case 'users': {
          const data = await authService.getRegisteredUsers().catch(() => []);
          setRegisteredUsers(data);
          break;
        }
        case 'settings': {
          const data = await siteSettingsService.getSettings().catch(() => null);
          if (data) setSiteSettings(data);
          break;
        }
        case 'our_students': {
          const data = await studentImageService.getAll().catch(() => []);
          setStudentImages(data);
          break;
        }
        case 'carousel': {
          const data = await carouselService.getImages().catch(() => []);
          setCarouselImages(data);
          break;
        }
        case 'activity': {
          const [acts, unread] = await Promise.all([
            activityService.getActivities().catch(() => []),
            activityService.getUnreadCount().catch(() => 0)
          ]);
          setActivities(acts);
          setUnreadCount(unread);
          break;
        }
      }
      loadedTabs.current.add(tabName);
    } catch (err) {
      console.error(`Failed loading tab ${tabName}:`, err);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsData, galleryData, contactsData, contributionsData, unread] = await Promise.all([
        eventService.getEvents().catch(() => []),
        galleryService.getGallery().catch(() => []),
        contactService.getContacts().catch(() => []),
        contributionService.getContributions().catch(() => []),
        activityService.getUnreadCount().catch(() => 0)
      ]);
      setEvents(eventsData);
      setGallery(galleryData);
      setContacts(contactsData);
      setContributions(contributionsData);
      setUnreadCount(unread);

      loadedTabs.current.add('events');
      loadedTabs.current.add('gallery');
      loadedTabs.current.add('messages');
      loadedTabs.current.add('contributions');
    } catch (err) {
      console.error('Failed loading initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllData = async () => {
    loadedTabs.current.clear();
    setLoading(true);
    try {
      await loadInitialData();
      await loadTabData(activeTab, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadInitialData();
    checkDbHealth();

    const unsubContacts = contactService.subscribeToContacts((items) => {
      setContacts(items);
    });
    const unsubContrib = contributionService.subscribeToContributions((items) => {
      setContributions(items);
    });
    const unsubAct = activityService.subscribeToActivities((items) => {
      setActivities(items);
      setUnreadCount(items.filter(a => !a.isRead).length);
    });

    return () => {
      if (typeof unsubContacts === 'function') unsubContacts();
      if (typeof unsubContrib === 'function') unsubContrib();
      if (typeof unsubAct === 'function') unsubAct();
    };
  }, [isAuthenticated, user, navigate, loadInitialData, checkDbHealth]);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  // Enable smooth horizontal scrolling on hover using mouse wheel
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.2;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = carouselImages.findIndex(i => i._id === active.id);
    const newIndex = carouselImages.findIndex(i => i._id === over.id);
    const reordered = arrayMove(carouselImages, oldIndex, newIndex);
    setCarouselImages(reordered);
    try {
      await carouselService.reorderImages(reordered.map(i => i._id));
      toast.success('Order saved!');
    } catch { toast.error('Failed to save order'); loadTabData('carousel', true); }
  };

  // --- MEMORY VAULT CRUD ---
  const handleSaveVaultCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultForm.image) {
      toast.error('Please upload an image or provide an image URL.');
      return;
    }
    try {
      const submitData = {
        ...vaultForm,
        title: vaultForm.title || `${vaultForm.category} Memory`,
        description: vaultForm.description || ''
      };
      if (editingVaultCard) {
        const updated = await memoryVaultService.updateCard(editingVaultCard._id, submitData);
        setMemoryVaultCards(prev => prev.map(c => c._id === editingVaultCard._id ? updated : c));
        toast.success('Memory card updated successfully');
      } else {
        const created = await memoryVaultService.createCard(submitData);
        setMemoryVaultCards(prev => [created, ...prev]);
        toast.success('Memory card added to vault!');
      }
      setShowVaultModal(false);
      setEditingVaultCard(null);
      setVaultForm({ title: '', image: '', description: '', category: 'Memories', focalPoint: { x: 50, y: 50 } });
      setVaultPreview(false);
    } catch (err) {
      toast.error('Failed to save memory card');
    }
  };

  const handleDeleteVaultCard = async (id: string) => {
    if (!window.confirm('Remove this card from the Memory Vault?')) return;
    try {
      await memoryVaultService.deleteCard(id);
      setMemoryVaultCards(prev => prev.filter(c => c._id !== id));
      toast.success('Memory card removed');
    } catch (err) {
      toast.error('Failed to delete memory card');
    }
  };

  const openEditVaultCard = (card: MemoryVaultCard) => {
    setEditingVaultCard(card);
    setVaultForm({
      title: card.title,
      image: card.image,
      description: card.description || '',
      category: card.category,
      focalPoint: card.focalPoint || { x: 50, y: 50 }
    });
    setVaultPreview(false);
    setShowVaultModal(true);
  };

  // Helper to handle direct cloud & local file upload (Images & Videos) with progress tracking
  const handleFileUpload = async (file: File, callback: (mediaUrl: string) => void) => {
    if (!file) return;
    try {
      setUploadProgress(15);
      const res = await uploadMediaWithProgress(file, 'media', (pct) => {
        setUploadProgress(pct);
      });
      callback(res.url);
      toast.success(`${res.mediaType === 'video' ? 'Video' : 'Image'} uploaded successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload file.');
    } finally {
      setTimeout(() => setUploadProgress(null), 800);
    }
  };

  // Helper to process and validate QR code upload for Donation Settings
  const processQrCodeFile = (file: File) => {
    if (!file) return;
    handleFileUpload(file, async (dataUrl) => {
      setDonationSettings(prev => prev ? { ...prev, qrCodeImage: dataUrl } : null);
      try {
        const updated = await donationSettingsService.updateSettings({ qrCodeImage: dataUrl });
        setDonationSettings(updated);
        toast.success('Donation QR Code updated and saved live!');
      } catch (err: any) {
        console.error('Failed to auto-save QR code:', err);
      }
    });
  };

  const handleQrCodeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processQrCodeFile(file);
    }
    e.target.value = '';
  };

  const handleSaveQrUrl = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error('Please enter a valid image URL');
      return;
    }
    try {
      const updated = await donationSettingsService.updateSettings({ qrCodeImage: trimmed });
      setDonationSettings(updated);
      setQrUrlInput('');
      toast.success('Donation QR Code updated and saved live!');
    } catch (err: any) {
      toast.error('Failed to update QR code URL');
    }
  };

  const handleRemoveQr = async () => {
    if (!window.confirm('Are you sure you want to remove the custom QR code? The website will display the default Ashram QR.')) return;
    try {
      const updated = await donationSettingsService.updateSettings({ qrCodeImage: '' });
      setDonationSettings(updated);
      toast.success('Custom QR code removed. Reverted to default.');
    } catch (err: any) {
      toast.error('Failed to remove QR code');
    }
  };

  // --- STUDENT IMAGES CRUD ---
  const handleSaveStudentImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentImageForm.title || !studentImageForm.image || !studentImageForm.description) {
      toast.error('Please fill all fields (title, image, description).');
      return;
    }
    try {
      if (editingStudentImage) {
        const updated = await studentImageService.update(editingStudentImage._id, studentImageForm);
        setStudentImages(prev => prev.map(s => s._id === editingStudentImage._id ? updated : s));
        toast.success('Student entry updated successfully');
      } else {
        const created = await studentImageService.create(studentImageForm);
        setStudentImages(prev => [created, ...prev]);
        toast.success('Student entry created successfully');
      }
      setShowStudentImageModal(false);
      setEditingStudentImage(null);
      setStudentImageForm({ title: '', image: '', description: '', focalPoint: { x: 50, y: 50 } });
    } catch (err) {
      toast.error('Failed to save student entry');
    }
  };

  const handleDeleteStudentImage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student entry?')) return;
    try {
      await studentImageService.remove(id);
      setStudentImages(prev => prev.filter(s => s._id !== id));
      toast.success('Student entry deleted');
    } catch (err) {
      toast.error('Failed to delete student entry');
    }
  };

  // --- EVENTS CRUD ---
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.image) {
      toast.error('Please upload an image file or provide an Image URL.');
      return;
    }
    try {
      if (editingEvent) {
        const updated = await eventService.updateEvent(editingEvent._id, eventForm);
        setEvents(prev => prev.map(ev => ev._id === editingEvent._id ? updated : ev));
        toast.success('Event updated successfully');
      } else {
        const created = await eventService.createEvent(eventForm);
        setEvents(prev => [created, ...prev]);
        toast.success('Event created successfully');
      }
      setShowEventModal(false);
      setEditingEvent(null);
      setEventForm({ title: '', description: '', image: '', date: '', category: 'Educational Events', location: 'Vatsalya Vatika Campus', focalPoint: { x: 50, y: 50 } });
    } catch (err) {
      toast.error('Failed to save event');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventService.deleteEvent(id);
      setEvents(prev => prev.filter(e => e._id !== id));
      toast.success('Event deleted successfully');
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  // --- GALLERY CRUD ---
  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.image) {
      toast.error('Please upload an image file or provide an Image URL.');
      return;
    }
    try {
      if (editingGalleryItem) {
        const updated = await galleryService.updateGalleryItem(editingGalleryItem._id, galleryForm);
        setGallery((prev) => prev.map((item) => (item._id === editingGalleryItem._id ? updated : item)));
        toast.success('Gallery item updated successfully');
      } else {
        const created = await galleryService.createGalleryItem(galleryForm);
        setGallery((prev) => [created, ...prev]);
        toast.success('Gallery item added successfully');
      }
      setShowGalleryModal(false);
      setEditingGalleryItem(null);
      setGalleryForm({ title: '', image: '', category: 'Ashram', description: '', focalPoint: { x: 50, y: 50 } });
    } catch (err: any) {
      console.error('Save gallery error:', err);
      toast.error(err?.message || 'Failed to add gallery item');
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await galleryService.deleteGalleryItem(id);
      setGallery((prev) => prev.filter((item) => item._id !== id));
      toast.success('Gallery image deleted');
    } catch (err) {
      toast.error('Failed to delete gallery image');
    }
  };

  // --- FACILITIES CRUD ---
  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await facilityService.createFacility(facilityForm);
      setFacilities(prev => [created, ...prev]);
      toast.success('Facility added successfully');
      setShowFacilityModal(false);
      setFacilityForm({ title: '', description: '', icon: 'BookOpen', focalPoint: { x: 50, y: 50 } });
    } catch (err) {
      toast.error('Failed to add facility');
    }
  };

  const handleDeleteFacility = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) return;
    try {
      await facilityService.deleteFacility(id);
      setFacilities(prev => prev.filter(f => f._id !== id));
      toast.success('Facility deleted');
    } catch (err) {
      toast.error('Failed to delete facility');
    }
  };

  // --- CONTACT MESSAGES ---
  const handleStatusChange = async (id: string, status: 'new' | 'read' | 'replied') => {
    try {
      await contactService.updateStatus(id, status);
      toast.success(`Message marked as ${status}`);
      loadTabData('messages', true);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await contactService.deleteContact(id);
      toast.success('Message deleted');
      loadTabData('messages', true);
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    try {
      const updated = await siteSettingsService.updateSettings(siteSettings);
      setSiteSettings(updated);
      toast.success('Site settings updated successfully');
    } catch (err) {
      toast.error('Failed to update site settings');
    }
  };

  const handleSaveContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await contributionService.submitContribution(contributionForm);
      toast.success('Contribution recorded successfully');
      setShowContributionModal(false);
      setContributionForm({ name: '', email: '', amount: 0, purpose: 'General Support', paymentStatus: 'completed', paymentRef: '' });
      loadTabData('contributions', true);
    } catch (err) {
      toast.error('Failed to record contribution');
    }
  };

  const totalContributionAmount = contributions.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="min-h-screen bg-ashram-cream dark:bg-darkAshram-bg text-ashram-charcoal dark:text-darkAshram-text transition-colors duration-300">

      {/* Top Admin Header */}
      <header className="bg-white dark:bg-darkAshram-card border-b border-ashram-border dark:border-darkAshram-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-[1.5px] border-amber-400/80 bg-slate-900 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6),inset_0_0_8px_rgba(251,191,36,0.4)] shrink-0">
              <span className="text-xl sm:text-2xl font-bold drop-shadow-[0_0_8px_rgba(251,191,36,1)] leading-none mt-0.5 select-none">ॐ</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-xs sm:text-base lg:text-xl text-ashram-green dark:text-darkAshram-gold leading-tight truncate">
                  <span className="hidden sm:inline">Vatsalya Vatika </span>Admin Dashboard
                </h1>
                <div
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border transition-all ${
                    dbStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                  }`}
                  title={
                    dbStatus === 'connected'
                      ? 'Firebase Cloud is connected with live real-time sync'
                      : 'Running with instant local live synchronization'
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dbStatus === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span>
                    {dbStatus === 'connected'
                      ? 'Firebase Live Sync'
                      : 'Local Live Sync'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-ashram-muted dark:text-darkAshram-muted truncate">
                Welcome, {user?.name || 'Administrator'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

            {/* Direct Quick Action: Change QR Code */}
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/60 transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
              title="Change Donation QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-ashram-saffron shrink-0" />
              <span>Change QR</span>
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold bg-ashram-cream dark:bg-darkAshram-surface border border-ashram-border dark:border-darkAshram-border hover:bg-ashram-border/50 dark:hover:bg-darkAshram-border/50 text-ashram-charcoal dark:text-darkAshram-text transition-colors shadow-sm shrink-0 whitespace-nowrap"
              title="Visit Live Website"
            >
              <span>Live Website</span>
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            </Link>

            {/* Dark / Light Mode Toggle Button for Admin Dashboard */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-gold hover:bg-ashram-saffron/10 dark:hover:bg-darkAshram-gold/20 flex items-center justify-center transition-all transform hover:scale-105 shadow-sm shrink-0"
              title={theme === 'light' ? 'Switch Admin to Dark Mode' : 'Switch Admin to Light Mode'}
            >
              {theme === 'light' ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ashram-saffron theme-btn-icon" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-darkAshram-gold theme-btn-icon" />
              )}
            </button>

            <button
              onClick={() => {
                logout();
                toast.success('Logged out');
                navigate('/');
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 shadow-sm shrink-0"
              title="Logout of Admin Portal"
            >
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Summary Cards */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-soft flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ashram-muted truncate">Students</p>
              <p className="font-heading font-bold text-base sm:text-xl text-ashram-green dark:text-darkAshram-gold">200+</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-soft flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-orange-50 text-ashram-saffron dark:bg-orange-950/50 dark:text-ashram-saffron flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ashram-muted truncate">Events</p>
              <p className="font-heading font-bold text-base sm:text-xl text-ashram-green dark:text-darkAshram-gold">{events.length}</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-soft flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ashram-muted truncate">Gallery</p>
              <p className="font-heading font-bold text-base sm:text-xl text-ashram-green dark:text-darkAshram-gold">{gallery.length}</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-soft flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ashram-muted truncate">Messages</p>
              <p className="font-heading font-bold text-base sm:text-xl text-ashram-green dark:text-darkAshram-gold">{contacts.length}</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-soft flex items-center gap-2.5 sm:gap-3 col-span-2 sm:col-span-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-ashram-muted truncate">Pledges</p>
              <p className="font-heading font-bold text-base sm:text-xl text-ashram-saffron">₹{totalContributionAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-ashram-border dark:border-darkAshram-border flex items-center justify-between gap-2">
          <div
            ref={tabsContainerRef}
            className="flex-1 overflow-x-auto no-scrollbar scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex gap-2 sm:gap-4 min-w-max pb-0.5">
              {[
                { id: 'events', label: 'Events', icon: Calendar },
                { id: 'gallery', label: 'Gallery', icon: ImageIcon },
                { id: 'memoryvault', label: 'Memory Vault', icon: Layers },
                { id: 'facilities', label: 'Facilities', icon: Sparkles },
                { id: 'messages', label: 'Messages', icon: Mail, badge: contacts.filter(c => c.status === 'new').length > 0 ? contacts.filter(c => c.status === 'new').length : undefined },
                { id: 'contributions', label: 'Donations', icon: Heart },
                { id: 'donation_settings', label: 'Donation & QR Code', icon: QrCode },
                { id: 'reviews', label: 'Reviews', icon: Star },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'settings', label: 'Site Settings', icon: Settings },
                { id: 'our_students', label: 'Our Students', icon: GraduationCap },
                { id: 'carousel', label: 'Gallery Showcase', icon: ImageIcon },
                { id: 'activity', label: 'Activity Log', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined }
              ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2.5 px-2.5 sm:py-3 sm:px-3 font-sans text-xs font-semibold flex items-center gap-1 sm:gap-1.5 border-b-2 transition-colors relative shrink-0 ${activeTab === tab.id
                      ? 'border-ashram-saffron text-ashram-saffron dark:border-darkAshram-gold dark:text-darkAshram-gold'
                      : 'border-transparent text-ashram-muted dark:text-darkAshram-muted hover:text-ashram-charcoal'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {(tab as any).badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                      {(tab as any).badge > 9 ? '9+' : (tab as any).badge}
                    </span>
                  )}
                </button>
              );
            })}
            </div>
          </div>

          <button
            onClick={loadAllData}
            className="p-2 rounded-lg text-ashram-muted hover:text-ashram-saffron transition-colors shrink-0 ml-2"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* TAB CONTENTS */}

        {/* DONATION SETTINGS TAB */}
        {activeTab === 'donation_settings' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-2xl text-ashram-green dark:text-darkAshram-gold">
                Secure Donation Settings
              </h3>
            </div>
            <div className="bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border rounded-2xl shadow-soft p-6">
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const updated = await donationSettingsService.updateSettings(donationSettings!);
                  setDonationSettings(updated);
                  toast.success('Donation settings updated securely!');
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to update settings');
                }
              }} className="space-y-5 max-w-2xl">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-1">Bank Name</label>
                    <input type="text" value={donationSettings?.bankName || ''} onChange={e => setDonationSettings(prev => prev ? {...prev, bankName: e.target.value} : null)} className="w-full px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-sm focus:border-ashram-saffron" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-1">Account Name</label>
                    <input type="text" value={donationSettings?.bankAccountName || ''} onChange={e => setDonationSettings(prev => prev ? {...prev, bankAccountName: e.target.value} : null)} className="w-full px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-sm focus:border-ashram-saffron" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-1">Account Number</label>
                    <input type="text" value={donationSettings?.bankAccountNumber || ''} onChange={e => setDonationSettings(prev => prev ? {...prev, bankAccountNumber: e.target.value} : null)} className="w-full px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-sm focus:border-ashram-saffron" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-1">IFSC Code</label>
                    <input type="text" value={donationSettings?.ifscCode || ''} onChange={e => setDonationSettings(prev => prev ? {...prev, ifscCode: e.target.value} : null)} className="w-full px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-sm focus:border-ashram-saffron" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-1">Branch</label>
                    <input type="text" value={donationSettings?.branch || ''} onChange={e => setDonationSettings(prev => prev ? {...prev, branch: e.target.value} : null)} className="w-full px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-sm focus:border-ashram-saffron" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-1">UPI ID</label>
                    <input type="text" value={donationSettings?.upiId || ''} onChange={e => setDonationSettings(prev => prev ? {...prev, upiId: e.target.value} : null)} className="w-full px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-sm focus:border-ashram-saffron" required />
                  </div>
                </div>

                <div id="admin-qr-section" className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text">
                      Donation QR Code
                    </label>
                    <span className="text-[10px] text-ashram-muted dark:text-darkAshram-muted">
                      Changes auto-save live to public website
                    </span>
                  </div>

                  {/* Hidden file input for native device selection */}
                  <input
                    ref={qrFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleQrCodeFileChange}
                    className="hidden"
                  />

                  {uploadProgress !== null && (
                    <div className="space-y-1 py-2 max-w-sm">
                      <div className="flex justify-between text-[10px] font-semibold text-ashram-saffron">
                        <span>Uploading QR Code...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-darkAshram-surface rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-ashram-saffron h-1.5 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {donationSettings?.qrCodeImage ? (
                    <div className="p-4 sm:p-5 rounded-2xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream/30 dark:bg-darkAshram-surface/40 flex flex-col sm:flex-row items-center sm:items-start gap-5 transition-all">
                      <div className="relative shrink-0">
                        <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-xl bg-white p-2.5 border border-ashram-border dark:border-darkAshram-border shadow-sm flex items-center justify-center overflow-hidden">
                          <img
                            src={donationSettings.qrCodeImage}
                            alt="Donation QR Code Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                          <CheckCheck className="w-3 h-3" /> Live Active
                        </span>
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-ashram-charcoal dark:text-darkAshram-text">
                            Active Donation QR Code
                          </h4>
                          <p className="text-xs text-ashram-muted dark:text-darkAshram-muted mt-0.5 leading-relaxed">
                            This QR code is displayed to donors in the public "Scan & Donate" modal on the website.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => qrFileInputRef.current?.click()}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-ashram-saffron hover:bg-ashram-saffronHover text-white shadow-soft transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Change QR (File Upload)</span>
                          </button>

                          <a
                            href={donationSettings.qrCodeImage}
                            download="donation-qr.jpg"
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-darkAshram-surface hover:bg-ashram-cream text-ashram-charcoal dark:text-darkAshram-text border border-ashram-border dark:border-darkAshram-border transition-all flex items-center gap-1.5 active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(donationSettings.qrCodeImage || '');
                              toast.success('QR Code URL copied!');
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-darkAshram-surface hover:bg-ashram-cream text-ashram-charcoal dark:text-darkAshram-text border border-ashram-border dark:border-darkAshram-border transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRemoveQr}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="text-[11px] text-ashram-muted dark:text-darkAshram-muted">
                          Supports PNG, JPG, JPEG, WebP • Max 5 MB
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => qrFileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) processQrCodeFile(file);
                      }}
                      className="border-2 border-dashed border-ashram-border dark:border-darkAshram-border hover:border-ashram-saffron dark:hover:border-ashram-saffron rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 bg-ashram-cream/30 hover:bg-ashram-cream/60 dark:bg-darkAshram-surface/20 dark:hover:bg-darkAshram-surface/40 group"
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-ashram-saffron/10 dark:bg-ashram-saffron/20 text-ashram-saffron flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ashram-charcoal dark:text-darkAshram-text group-hover:text-ashram-saffron transition-colors">
                            Upload Donation QR Code
                          </p>
                          <p className="text-xs text-ashram-muted dark:text-darkAshram-muted mt-1">
                            Click or drag & drop image here (PNG, JPG, JPEG, WebP up to 5 MB)
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-ashram-saffron hover:bg-ashram-saffronHover text-white shadow-soft transition-all flex items-center gap-2 pointer-events-none"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload QR Code</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Or Paste Direct Image URL */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-1.5">
                      Or Paste Image URL directly:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/donation-qr.jpg"
                        value={qrUrlInput}
                        onChange={(e) => setQrUrlInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-xs focus:border-ashram-saffron focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveQrUrl(qrUrlInput)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-ashram-saffron hover:bg-ashram-saffronHover text-white shadow transition-all cursor-pointer shrink-0"
                      >
                        Set QR Link
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-ashram-border dark:border-darkAshram-border flex justify-end">
                  <button type="submit" className="px-5 py-2.5 bg-ashram-saffron hover:bg-ashram-saffronHover text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-soft hover:shadow transition-all">
                    <ShieldCheck className="w-4 h-4" /> Save Securely
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* PREMIUM GALLERY SHOWCASE TAB */}
        {activeTab === 'carousel' && (
          <ErrorBoundary>
            <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-heading font-bold text-2xl text-ashram-green dark:text-darkAshram-gold">Premium Image Showcase</h3>
                  <p className="text-sm text-ashram-muted mt-1">Drag cards to reorder. Changes reflect instantly on the live website.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCarouselImage(null);
                    setCarouselForm({ image: '', title: '', description: '', category: '', date: '', isActive: true, order: carouselImages.length });
                    setShowCarouselModal(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ashram-saffron hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-soft hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Add Image
                </button>
              </div>

              {/* Empty state */}
              {carouselImages.length === 0 ? (
                <div className="bg-white dark:bg-darkAshram-card border border-dashed border-ashram-border dark:border-darkAshram-border rounded-2xl p-16 text-center shadow-soft">
                  <ImageIcon className="w-14 h-14 text-ashram-saffron mx-auto mb-4 opacity-40" />
                  <h4 className="text-xl font-bold text-ashram-green dark:text-darkAshram-gold mb-2">No showcase images yet</h4>
                  <p className="text-sm text-ashram-muted">Click "Add Image" to upload the first image to the premium showcase.</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={carouselImages.map(i => i._id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {carouselImages.map(img => (
                        <SortableCarouselCard
                          key={img._id}
                          img={img}
                          onToggleActive={async (image) => {
                            try {
                              const updated = await carouselService.updateImage(image._id, { isActive: !image.isActive });
                              setCarouselImages(prev => prev.map(c => c._id === image._id ? updated : c));
                              toast.success(image.isActive ? 'Image hidden from showcase' : 'Image visible on showcase');
                            } catch { toast.error('Failed to toggle status'); }
                          }}
                          onEdit={(image) => {
                            setEditingCarouselImage(image);
                            setCarouselForm({
                              image: image.image, title: image.title || '', description: image.description || '',
                              category: image.category || '', date: image.date ? image.date.split('T')[0] : '',
                              isActive: image.isActive, order: image.order
                            });
                            setShowCarouselModal(true);
                          }}
                          onDelete={(image) => {
                            if (window.confirm('Permanently delete this image from the showcase?')) {
                              carouselService.deleteImage(image._id).then(() => {
                                setCarouselImages(prev => prev.filter(c => c._id !== image._id));
                                toast.success('Image removed from showcase');
                              }).catch(() => toast.error('Failed to delete'));
                            }
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Add/Edit Modal */}
              {showCarouselModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowCarouselModal(false); }}>
                  <div className="bg-white dark:bg-darkAshram-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-ashram-border dark:border-darkAshram-border">
                      <h4 className="font-heading font-bold text-xl text-ashram-green dark:text-darkAshram-gold">
                        {editingCarouselImage ? 'Edit Image' : 'Add New Image'}
                      </h4>
                      <button onClick={() => setShowCarouselModal(false)} className="p-2 rounded-lg hover:bg-ashram-cream dark:hover:bg-darkAshram-surface transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!carouselForm.image) { toast.error('Please provide an image URL or upload a file.'); return; }
                        try {
                          if (editingCarouselImage) {
                            const updated = await carouselService.updateImage(editingCarouselImage._id, carouselForm);
                            setCarouselImages(prev => prev.map(c => c._id === editingCarouselImage._id ? updated : c));
                            toast.success('Image updated successfully!');
                          } else {
                            const newImg = await carouselService.addImage(carouselForm);
                            setCarouselImages(prev => [...prev, newImg]);
                            toast.success('Image added to showcase!');
                          }
                          setShowCarouselModal(false);
                        } catch { toast.error('Failed to save image'); }
                      }}
                      className="p-6 space-y-5"
                    >
                      {/* Image Preview */}
                      {carouselForm.image && (
                        <div className="rounded-xl overflow-hidden aspect-[4/3] bg-ashram-cream dark:bg-darkAshram-bg">
                          <img src={carouselForm.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {/* Image Upload */}
                      <div>
                        <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-2">Image <span className="text-rose-500">*</span></label>
                        <div className="space-y-2">
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, (dataUrl) => setCarouselForm(f => ({ ...f, image: dataUrl })));
                            }
                          }} className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-ashram-saffron/10 file:text-ashram-saffron file:font-semibold hover:file:bg-ashram-saffron/20 cursor-pointer" />

                          {uploadProgress !== null && (
                            <div className="space-y-1 py-1">
                              <div className="flex justify-between text-[10px] font-semibold text-ashram-saffron">
                                <span>Uploading to Cloud...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-darkAshram-surface rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-ashram-saffron h-1.5 transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="text-center text-xs text-ashram-muted">or</div>
                          <input type="text" value={carouselForm.image} onChange={e => setCarouselForm(f => ({ ...f, image: e.target.value }))} placeholder="Paste image URL..." className="w-full px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-sm focus:outline-none focus:border-ashram-saffron transition-colors" />
                        </div>
                      </div>
                      {/* Title */}
                      <div>
                        <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-1">Title (shown on hover)</label>
                        <input type="text" value={carouselForm.title} onChange={e => setCarouselForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Spiritual Morning" className="w-full px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-sm focus:outline-none focus:border-ashram-saffron transition-colors" />
                      </div>
                      {/* Description */}
                      <div>
                        <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-1">Description (optional)</label>
                        <textarea value={carouselForm.description} onChange={e => setCarouselForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Short description..." className="w-full px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-sm focus:outline-none focus:border-ashram-saffron transition-colors resize-none" />
                      </div>
                      {/* Category + Date */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-1">Category (optional)</label>
                          <input type="text" value={carouselForm.category} onChange={e => setCarouselForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Meditation" className="w-full px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-sm focus:outline-none focus:border-ashram-saffron transition-colors" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text mb-1">Date (optional)</label>
                          <input type="date" value={carouselForm.date} onChange={e => setCarouselForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-transparent text-sm focus:outline-none focus:border-ashram-saffron transition-colors" />
                        </div>
                      </div>
                      {/* Active toggle */}
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setCarouselForm(f => ({ ...f, isActive: !f.isActive }))}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${carouselForm.isActive ? 'bg-ashram-saffron' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${carouselForm.isActive ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </button>
                        <span className="text-sm font-medium text-ashram-charcoal dark:text-darkAshram-text">{carouselForm.isActive ? 'Visible on website' : 'Hidden from website'}</span>
                      </div>
                      {/* Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-ashram-border dark:border-darkAshram-border">
                        <button type="button" onClick={() => setShowCarouselModal(false)} className="px-4 py-2 rounded-xl border border-ashram-border text-ashram-muted text-sm hover:bg-ashram-cream transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-xl bg-ashram-saffron hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-soft">
                          {editingCarouselImage ? 'Save Changes' : 'Add to Showcase'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </ErrorBoundary>
        )}

        {/* 1. EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-ashram-green dark:text-darkAshram-gold">
                Manage Events ({events.length})
              </h3>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setEventForm({ title: '', description: '', image: '', date: '', category: 'Educational Events', location: 'Vatsalya Vatika Campus', focalPoint: { x: 50, y: 50 } });
                  setShowEventModal(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-ashram-saffron hover:bg-ashram-saffronHover text-white text-xs font-semibold shadow"
              >
                <Plus className="w-4 h-4" /> Add Event
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {events.map((evt) => (
                <div key={evt._id} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-soft space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <img src={evt.image} alt={evt.title} className="w-full h-36 sm:h-40 object-cover rounded-xl" />
                    <span className="text-[10px] uppercase font-semibold bg-ashram-saffron/10 text-ashram-saffron px-2 py-0.5 rounded">
                      {evt.category}
                    </span>
                    <h4 className="font-heading font-bold text-base sm:text-lg text-ashram-green dark:text-darkAshram-gold">{evt.title}</h4>
                    <p className="text-xs text-ashram-muted line-clamp-2">{evt.description}</p>
                    <p className="text-[11px] font-semibold text-ashram-saffron">{evt.date}</p>
                  </div>
                  <div className="pt-2 border-t border-ashram-border/60 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingEvent(evt);
                        setEventForm({
                          title: evt.title,
                          description: evt.description,
                          image: evt.image,
                          date: evt.date,
                          category: evt.category,
                          location: evt.location,
                          focalPoint: evt.focalPoint || { x: 50, y: 50 }
                        });
                        setShowEventModal(true);
                      }}
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(evt._id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MEMORY VAULT TAB ── */}
        {activeTab === 'memoryvault' && (
          <div className="space-y-6">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-xl sm:text-2xl text-ashram-green dark:text-darkAshram-gold">
                  Ashram Memory Vault
                </h3>
                <p className="text-xs text-ashram-muted dark:text-darkAshram-muted mt-0.5">
                  {memoryVaultCards.length} card{memoryVaultCards.length !== 1 ? 's' : ''} · Add, edit, or remove memory cards visible on the public Vault page
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/cards"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-ashram-cream dark:bg-darkAshram-surface border border-ashram-border dark:border-darkAshram-border hover:bg-ashram-border/50"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </Link>
                <button
                  onClick={() => {
                    setEditingVaultCard(null);
                    setVaultForm({ title: '', image: '', description: '', category: 'Memories', focalPoint: { x: 50, y: 50 } });
                    setVaultPreview(false);
                    setShowVaultModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-ashram-saffron hover:bg-ashram-saffronHover text-white text-xs font-semibold shadow"
                >
                  <Plus className="w-4 h-4" /> Add Card
                </button>
              </div>
            </div>

            {memoryVaultCards.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Layers className="w-10 h-10 mx-auto text-ashram-muted/30" />
                <p className="font-heading font-bold text-lg text-ashram-green dark:text-darkAshram-gold">No cards yet</p>
                <p className="text-xs text-ashram-muted">Click "Add Card" to create your first memory card.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
                {memoryVaultCards.map((card) => (
                  <div key={card._id} className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-ashram-border dark:border-darkAshram-border bg-white dark:bg-darkAshram-card shadow-soft">
                    <div className="aspect-[2/3] overflow-hidden">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5 sm:p-3">
                      <p className="text-white font-bold text-[10px] truncate">{card.title}</p>
                      <p className="text-white/60 text-[9px]">{card.category}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          onClick={() => openEditVaultCard(card)}
                          className="flex-1 py-1 rounded-lg bg-white/20 hover:bg-blue-500/80 text-white text-[9px] font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVaultCard(card._id)}
                          className="flex-1 py-1 rounded-lg bg-white/20 hover:bg-red-500/80 text-white text-[9px] font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-bold text-ashram-green dark:text-darkAshram-gold truncate">{card.title}</p>
                      <span className="text-[9px] uppercase font-semibold text-ashram-saffron">{card.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OUR STUDENTS TAB */}
        {activeTab === 'our_students' && (
          <div className="space-y-6">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-xl sm:text-2xl text-ashram-green dark:text-darkAshram-gold">
                  Our Students
                </h3>
                <p className="text-xs text-ashram-muted dark:text-darkAshram-muted mt-0.5">
                  Manage dynamic student activities and pillars shown on the homepage.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingStudentImage(null);
                  setStudentImageForm({ title: '', image: '', description: '', focalPoint: { x: 50, y: 50 } });
                  setShowStudentImageModal(true);
                }}
                className="flex items-center gap-2 bg-ashram-saffron text-white px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold hover:bg-ashram-saffronHover transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Student Entry
              </button>
            </div>

            {studentImages.length === 0 ? (
              <div className="bg-white dark:bg-darkAshram-card p-6 sm:p-8 rounded-2xl border border-ashram-border dark:border-darkAshram-border text-center">
                <GraduationCap className="w-12 h-12 text-ashram-muted mx-auto mb-3" />
                <h4 className="font-heading font-bold text-base sm:text-lg text-ashram-green dark:text-darkAshram-gold">No Student Entries Yet</h4>
                <p className="text-xs sm:text-sm text-ashram-muted mt-1 max-w-md mx-auto">
                  Click the button above to add a new student activity or pillar. Until you add one, the default 3 pillars will be shown on the homepage.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {studentImages.map((student) => (
                  <div key={student._id} className="p-4 rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-soft flex flex-col">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-ashram-border/50 mb-3 shrink-0">
                      <img src={student.image} alt={student.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-ashram-green dark:text-darkAshram-gold">{student.title}</h4>
                        <p className="text-xs text-ashram-charcoal/80 dark:text-darkAshram-text/80 mt-2 line-clamp-3">
                          {student.description}
                        </p>
                      </div>
                      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-ashram-border/50">
                        <button
                          onClick={() => {
                            setEditingStudentImage(student);
                            setStudentImageForm({ title: student.title, image: student.image, description: student.description, focalPoint: student.focalPoint || { x: 50, y: 50 } });
                            setShowStudentImageModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStudentImage(student._id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-ashram-green dark:text-darkAshram-gold">
                Manage Gallery Images ({gallery.length})
              </h3>
              <button
                onClick={() => {
                  setEditingGalleryItem(null);
                  setGalleryForm({ title: '', image: '', category: 'Ashram', description: '', focalPoint: { x: 50, y: 50 } });
                  setShowGalleryModal(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-ashram-saffron hover:bg-ashram-saffronHover text-white text-xs font-semibold shadow"
              >
                <Plus className="w-4 h-4" /> Add Image
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {gallery.map((img) => (
                <div key={img._id} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-soft space-y-2 sm:space-y-3">
                  <img src={img.image} alt={img.title} className="w-full h-28 sm:h-40 object-cover rounded-lg sm:rounded-xl" />
                  <div>
                    <span className="text-[9px] sm:text-[10px] uppercase font-semibold bg-ashram-green/10 text-ashram-green px-2 py-0.5 rounded">
                      {img.category}
                    </span>
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-ashram-green dark:text-darkAshram-gold mt-1 truncate">{img.title}</h4>
                  </div>
                  <div className="flex justify-end pt-1 gap-1 sm:gap-2">
                    <button
                      onClick={() => {
                        setEditingGalleryItem(img);
                        setGalleryForm({
                          title: img.title || '',
                          image: img.image || '',
                          category: img.category || 'Ashram',
                          description: img.description || '',
                          focalPoint: img.focalPoint || { x: 50, y: 50 }
                        });
                        setShowGalleryModal(true);
                      }}
                      className="p-1.5 rounded-lg text-ashram-saffron hover:bg-ashram-saffron/10"
                    >
                      <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGallery(img._id)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. FACILITIES TAB */}
        {activeTab === 'facilities' && (
          <div className="space-y-6">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-ashram-green dark:text-darkAshram-gold">
                Manage Facilities ({facilities.length})
              </h3>
              <button
                onClick={() => setShowFacilityModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-ashram-saffron hover:bg-ashram-saffronHover text-white text-xs font-semibold shadow"
              >
                <Plus className="w-4 h-4" /> Add Facility
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {facilities.map((fac) => (
                <div key={fac._id} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-soft space-y-2 flex justify-between items-start">
                  <div>
                    <h4 className="font-heading font-bold text-base sm:text-lg text-ashram-green dark:text-darkAshram-gold">{fac.title}</h4>
                    <p className="text-xs text-ashram-muted mt-1">{fac.description}</p>
                    <span className="text-[10px] font-mono text-ashram-saffron mt-2 block">Icon: {fac.icon}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteFacility(fac._id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <h3 className="font-heading font-bold text-xl sm:text-2xl text-ashram-green dark:text-darkAshram-gold">
              Contact Form Inquiries ({contacts.length})
            </h3>

            {contacts.length === 0 ? (
              <p className="text-sm text-ashram-muted py-8 text-center bg-white dark:bg-darkAshram-card rounded-2xl">No contact messages received yet.</p>
            ) : (
              <div className="space-y-4">
                {contacts.map((cnt) => (
                  <div key={cnt._id} className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border shadow-soft space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="font-heading font-bold text-base sm:text-lg text-ashram-green dark:text-darkAshram-gold">{cnt.name}</h4>
                        <p className="text-xs text-ashram-muted">{cnt.email} • {cnt.phone || 'No phone provided'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={cnt.status}
                          onChange={(e) => handleStatusChange(cnt._id, e.target.value as any)}
                          className="px-3 py-1.5 rounded-lg border border-ashram-border dark:border-darkAshram-border bg-white dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text text-xs font-semibold focus:outline-none"
                        >
                          <option value="new" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">🆕 New</option>
                          <option value="read" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">👀 Read</option>
                          <option value="replied" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">✅ Replied</option>
                        </select>
                        <button
                          onClick={() => handleDeleteContact(cnt._id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-ashram-charcoal dark:text-darkAshram-text p-3 sm:p-4 rounded-xl bg-ashram-cream dark:bg-darkAshram-surface border border-ashram-border/50">
                      "{cnt.message}"
                    </p>
                    <p className="text-[10px] text-ashram-muted text-right">{new Date(cnt.createdAt || Date.now()).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. CONTRIBUTIONS TAB */}
        {activeTab === 'contributions' && (
          <div className="space-y-6">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-ashram-green dark:text-darkAshram-gold">
                Recorded Contributions ({contributions.length})
              </h3>
              <div className="flex items-center gap-2.5 sm:gap-3 text-right">
                <div>
                  <span className="text-[10px] sm:text-xs text-ashram-muted block">Total Pledged</span>
                  <span className="font-heading font-bold text-lg sm:text-2xl text-ashram-saffron">₹{totalContributionAmount.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 text-xs font-semibold shadow-sm cursor-pointer"
                  title="Change public donation QR code"
                >
                  <QrCode className="w-4 h-4 text-ashram-saffron" />
                  <span>Change QR Code</span>
                </button>
                <button
                  onClick={() => setShowContributionModal(true)}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-ashram-saffron hover:bg-ashram-saffronHover text-white text-xs font-semibold shadow"
                >
                  <Plus className="w-4 h-4" /> Add Donation
                </button>
              </div>
            </div>

            {/* Quick QR Info Banner */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-darkAshram-card p-1 border border-amber-300 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                  {donationSettings?.qrCodeImage ? (
                    <img src={donationSettings.qrCodeImage} alt="Donation QR" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-7 h-7 text-ashram-saffron" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ashram-charcoal dark:text-darkAshram-text">Public Donation QR</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Active
                    </span>
                  </div>
                  <p className="text-[11px] text-ashram-muted dark:text-darkAshram-muted mt-0.5 truncate">
                    Donors scan this QR code on the live website to donate. UPI ID: <span className="font-semibold text-ashram-saffron">{donationSettings?.upiId || 'vatsalyavatika@upi'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-ashram-saffron hover:bg-ashram-saffronHover text-white shadow-soft transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Change QR</span>
              </button>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-darkAshram-card rounded-2xl border border-ashram-border dark:border-darkAshram-border shadow-soft">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-ashram-cream dark:bg-darkAshram-surface border-b border-ashram-border uppercase text-ashram-muted">
                  <tr>
                    <th className="p-4">Donor Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Purpose</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ashram-border dark:divide-darkAshram-border">
                  {contributions.map((con) => (
                    <tr key={con._id} className="hover:bg-ashram-cream/50 dark:hover:bg-darkAshram-surface">
                      <td className="p-4 font-bold text-ashram-green dark:text-darkAshram-gold">{con.name}</td>
                      <td className="p-4 text-ashram-muted">{con.email}</td>
                      <td className="p-4 font-bold text-ashram-saffron text-sm">₹{con.amount}</td>
                      <td className="p-4"><span className="px-2.5 py-1 rounded bg-ashram-saffron/10 text-ashram-saffron font-semibold">{con.purpose}</span></td>
                      <td className="p-4 text-ashram-muted">{new Date(con.createdAt || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. REGISTERED USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-xl sm:text-2xl text-ashram-green dark:text-darkAshram-gold">
                  Registered Users
                </h3>
                <p className="text-xs text-ashram-muted dark:text-darkAshram-muted mt-0.5">
                  All accounts registered on the Vatsalya Vatika website.
                </p>
              </div>
              <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-center">
                  <p className="text-[9px] sm:text-[10px] text-blue-500 uppercase font-semibold">Total</p>
                  <p className="font-heading font-bold text-lg sm:text-2xl text-blue-600 dark:text-blue-400">{registeredUsers.length}</p>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-ashram-saffron/10 dark:bg-ashram-saffron/5 border border-ashram-saffron/20 text-center">
                  <p className="text-[9px] sm:text-[10px] text-ashram-saffron uppercase font-semibold">Admins</p>
                  <p className="font-heading font-bold text-lg sm:text-2xl text-ashram-saffron">{registeredUsers.filter(u => u.role === 'admin').length}</p>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center">
                  <p className="text-[9px] sm:text-[10px] text-emerald-500 uppercase font-semibold">Members</p>
                  <p className="font-heading font-bold text-lg sm:text-2xl text-emerald-600 dark:text-emerald-400">{registeredUsers.filter(u => u.role === 'user').length}</p>
                </div>
              </div>
            </div>

            {registeredUsers.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border text-center">
                <Users className="w-10 h-10 text-ashram-muted mx-auto mb-3" />
                <p className="text-sm font-semibold text-ashram-muted">No registered users yet.</p>
                <p className="text-xs text-ashram-muted mt-1">Users who sign up on the website will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white dark:bg-darkAshram-card rounded-2xl border border-ashram-border dark:border-darkAshram-border shadow-soft">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-ashram-cream dark:bg-darkAshram-surface border-b border-ashram-border uppercase text-ashram-muted">
                    <tr>
                      <th className="p-4">#</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Registered On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ashram-border dark:divide-darkAshram-border">
                    {registeredUsers.map((usr, idx) => (
                      <tr key={usr._id || idx} className="hover:bg-ashram-cream/50 dark:hover:bg-darkAshram-surface transition-colors">
                        <td className="p-4 text-ashram-muted font-semibold">{idx + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ashram-saffron to-ashram-gold text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {usr.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-bold text-ashram-green dark:text-darkAshram-gold">{usr.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-ashram-muted">{usr.email}</td>
                        <td className="p-4 text-ashram-muted">{usr.phone || <span className="italic text-ashram-border">—</span>}</td>
                        <td className="p-4">
                          {usr.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-ashram-saffron/10 text-ashram-saffron border border-ashram-saffron/20">
                              <ShieldCheck className="w-3 h-3" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50">
                              <Users className="w-3 h-3" /> Member
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-ashram-muted">
                          {usr.createdAt
                            ? new Date(usr.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 7. SETTINGS TAB */}
        {activeTab === 'settings' && siteSettings && (
          <div className="space-y-6">
            <h3 className="font-heading font-bold text-2xl text-ashram-green dark:text-darkAshram-gold">
              Site Settings (CMS)
            </h3>
            <form onSubmit={handleSaveSettings} className="bg-white dark:bg-darkAshram-card p-6 rounded-2xl border border-ashram-border dark:border-darkAshram-border shadow-soft space-y-6 text-ashram-charcoal dark:text-darkAshram-text">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-4 text-ashram-saffron border-b border-ashram-border dark:border-darkAshram-border pb-2">Hero Section</h4>
                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="block font-semibold mb-1">Hero Title</label>
                      <input type="text" value={siteSettings.heroTitle} onChange={e => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Hero Subtitle</label>
                      <textarea rows={3} value={siteSettings.heroSubtitle} onChange={e => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-4 text-ashram-saffron border-b border-ashram-border dark:border-darkAshram-border pb-2">Contact Details</h4>
                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="block font-semibold mb-1">Email</label>
                      <input type="email" value={siteSettings.contactEmail} onChange={e => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Phone</label>
                      <input type="text" value={siteSettings.contactPhone} onChange={e => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Address</label>
                      <textarea rows={2} value={siteSettings.contactAddress} onChange={e => setSiteSettings({ ...siteSettings, contactAddress: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-4 text-ashram-saffron border-b border-ashram-border dark:border-darkAshram-border pb-2">About Section</h4>
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block font-semibold mb-1">About Text</label>
                    <textarea rows={4} value={siteSettings.aboutText} onChange={e => setSiteSettings({ ...siteSettings, aboutText: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-4 text-ashram-saffron border-b border-ashram-border dark:border-darkAshram-border pb-2">Social Links & Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold mb-1">Facebook URL</label>
                      <input type="url" value={siteSettings.facebookUrl} onChange={e => setSiteSettings({ ...siteSettings, facebookUrl: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">YouTube URL</label>
                      <input type="url" value={siteSettings.youtubeUrl} onChange={e => setSiteSettings({ ...siteSettings, youtubeUrl: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Instagram URL</label>
                      <input type="url" value={siteSettings.instagramUrl} onChange={e => setSiteSettings({ ...siteSettings, instagramUrl: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer p-4 border border-ashram-border dark:border-darkAshram-border rounded-xl w-full hover:bg-ashram-cream dark:hover:bg-darkAshram-surface transition-colors">
                      <input type="checkbox" checked={siteSettings.showDonors} onChange={e => setSiteSettings({ ...siteSettings, showDonors: e.target.checked })} className="w-5 h-5 accent-ashram-saffron rounded" />
                      <span className="font-semibold text-ashram-charcoal dark:text-darkAshram-text">Show Top Contributors on Homepage</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-ashram-border dark:border-darkAshram-border flex justify-end">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-ashram-saffron text-white font-bold hover:bg-ashram-saffronHover shadow-md">
                  Save All Settings
                </button>
              </div>

            </form>
          </div>
        )}

        {/* 8. REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-2xl text-ashram-green dark:text-darkAshram-gold">
                Reviews & Feedback ({reviews.length})
              </h3>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} avg
                  </span>
                </div>
              )}
            </div>
            {reviews.length === 0 ? (
              <div className="p-12 rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border text-center">
                <Star className="w-10 h-10 text-ashram-muted mx-auto mb-3" />
                <p className="text-sm text-ashram-muted">No reviews yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white dark:bg-darkAshram-card rounded-2xl border border-ashram-border dark:border-darkAshram-border shadow-soft">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-ashram-cream dark:bg-darkAshram-surface border-b border-ashram-border uppercase text-ashram-muted">
                    <tr>
                      <th className="p-4">Reviewer</th>
                      <th className="p-4">Rating</th>
                      <th className="p-4">Comment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ashram-border dark:divide-darkAshram-border">
                    {reviews.map(rev => (
                      <tr key={rev._id} className="hover:bg-ashram-cream/50 dark:hover:bg-darkAshram-surface transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-ashram-green dark:text-darkAshram-gold">{rev.name}</p>
                          {rev.email && <p className="text-ashram-muted text-[10px]">{rev.email}</p>}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-amber-500">{rev.rating}/5</span>
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="text-ashram-charcoal dark:text-darkAshram-text line-clamp-3 italic">"{rev.comment}"</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rev.approved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400'}`}>
                            {rev.approved ? '✓ Visible' : '⏸ Hidden'}
                          </span>
                        </td>
                        <td className="p-4 text-ashram-muted">
                          {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <button
                              onClick={async () => {
                                try {
                                  await reviewService.toggleApproval(rev._id);
                                  setReviews(prev => prev.map(r => r._id === rev._id ? { ...r, approved: !r.approved } : r));
                                  toast.success(`Review ${rev.approved ? 'hidden' : 'shown'}.`);
                                } catch { toast.error('Failed to update review.'); }
                              }}
                              className={`px-2 py-1 text-[10px] rounded-lg font-semibold ${rev.approved ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                            >
                              {rev.approved ? 'Hide' : 'Show'}
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm('Delete this review permanently?')) return;
                                try {
                                  await reviewService.deleteReview(rev._id);
                                  setReviews(prev => prev.filter(r => r._id !== rev._id));
                                  toast.success('Review deleted.');
                                } catch { toast.error('Failed to delete review.'); }
                              }}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 9. ACTIVITY LOG TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-ashram-green dark:text-darkAshram-gold">
                Activity Log
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs sm:text-sm px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">{unreadCount} unread</span>
                )}
              </h3>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <input
                  type="text" value={activitySearch}
                  onChange={e => setActivitySearch(e.target.value)}
                  placeholder="Search activities..."
                  className="px-3 py-2 text-xs rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron w-full sm:w-40"
                />
                <select
                  value={activityFilter}
                  onChange={e => setActivityFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-ashram-border dark:border-darkAshram-border bg-white dark:bg-darkAshram-surface text-gray-900 dark:text-white focus:outline-none flex-1 sm:flex-initial"
                >
                  <option value="all" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">All Types</option>
                  <option value="signup" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Signups</option>
                  <option value="login" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Logins</option>
                  <option value="contact" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Contact Messages</option>
                  <option value="review" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Reviews</option>
                  <option value="contribution" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Donations</option>
                </select>
                <button
                  onClick={async () => {
                    try {
                      await activityService.markAllRead();
                      setActivities(prev => prev.map(a => ({ ...a, isRead: true })));
                      setUnreadCount(0);
                      toast.success('All marked as read.');
                    } catch { toast.error('Failed.'); }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-ashram-green text-white font-semibold hover:bg-ashram-greenHover w-full sm:w-auto shrink-0"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
                </button>
              </div>
            </div>

            {(() => {
              const typeEmoji: Record<string, string> = { signup: '🆕', login: '🔐', contact: '📬', review: '⭐', contribution: '💰', contribution_guest: '💰', other: '📌' };
              const filtered = activities
                .filter(a => activityFilter === 'all' || a.type === activityFilter)
                .filter(a => {
                  if (!activitySearch) return true;
                  const s = activitySearch.toLowerCase();
                  return a.title.toLowerCase().includes(s) || a.description.toLowerCase().includes(s);
                });

              if (filtered.length === 0) return (
                <div className="p-12 rounded-2xl bg-white dark:bg-darkAshram-card border border-ashram-border dark:border-darkAshram-border text-center">
                  <Bell className="w-10 h-10 text-ashram-muted mx-auto mb-3" />
                  <p className="text-sm text-ashram-muted">No activity records found.</p>
                </div>
              );

              return (
                <div className="space-y-2">
                  {filtered.map(act => (
                    <div
                      key={act._id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${act.isRead ? 'bg-white dark:bg-darkAshram-card border-ashram-border dark:border-darkAshram-border' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'}`}
                    >
                      <div className="text-2xl shrink-0 mt-0.5">{typeEmoji[act.type] || '📌'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-bold ${act.isRead ? 'text-ashram-charcoal dark:text-darkAshram-text' : 'text-ashram-green dark:text-darkAshram-gold'}`}>{act.title}</p>
                          <span className="text-[10px] text-ashram-muted dark:text-darkAshram-muted shrink-0">
                            {act.createdAt ? new Date(act.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-ashram-muted dark:text-darkAshram-muted mt-0.5">{act.description}</p>
                        {act.metadata && Object.keys(act.metadata).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {Object.entries(act.metadata).filter(([k]) => ['name', 'amount', 'email', 'rating'].includes(k)).map(([k, v]) => (
                              <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-ashram-border/50 dark:bg-darkAshram-border/50 text-ashram-muted">
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={async () => {
                            try {
                              await activityService.markRead(act._id);
                              setActivities(prev => prev.map(a => a._id === act._id ? { ...a, isRead: !a.isRead } : a));
                              setUnreadCount(prev => act.isRead ? prev + 1 : Math.max(0, prev - 1));
                            } catch { toast.error('Failed.'); }
                          }}
                          className={`p-1.5 rounded-lg text-xs ${act.isRead ? 'text-ashram-muted hover:bg-ashram-border/30' : 'text-blue-600 hover:bg-blue-50'}`}
                          title={act.isRead ? 'Mark unread' : 'Mark read'}
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await activityService.deleteActivity(act._id);
                              setActivities(prev => prev.filter(a => a._id !== act._id));
                              if (!act.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
                            } catch { toast.error('Failed.'); }
                          }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* EVENT MODAL WITH FILE UPLOAD & PROPER SELECT STYLING */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-darkAshram-card text-ashram-charcoal dark:text-darkAshram-text rounded-2xl p-6 shadow-2xl border border-ashram-border dark:border-darkAshram-border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-bold text-xl text-ashram-green dark:text-darkAshram-gold">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              <button onClick={() => setShowEventModal(false)} className="p-1 rounded-lg hover:bg-ashram-border/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Event Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Annual Cultural Day"
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text text-xs focus:outline-none focus:border-ashram-saffron"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Event details..."
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text text-xs focus:outline-none focus:border-ashram-saffron"
                />
              </div>

              {/* File Upload OR URL Option */}
              <div>
                <label className="block font-semibold mb-1">Event Image (Upload File or Enter URL) *</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl border border-dashed border-ashram-border dark:border-darkAshram-border bg-ashram-cream/50 dark:bg-darkAshram-surface">
                    <Upload className="w-4 h-4 text-ashram-saffron shrink-0" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, (dataUrl) => setEventForm({ ...eventForm, image: dataUrl }));
                      }}
                      className="w-full text-[11px] text-ashram-muted file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-ashram-saffron file:text-white hover:file:bg-ashram-saffronHover cursor-pointer"
                    />
                  </div>

                  {uploadProgress !== null && (
                    <div className="space-y-1 py-1">
                      <div className="flex justify-between text-[10px] font-semibold text-ashram-saffron">
                        <span>Uploading to Cloud...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-darkAshram-surface rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-ashram-saffron h-1.5 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <input
                    type="url"
                    placeholder="Or paste image URL (https://...)"
                    value={eventForm.image}
                    onChange={e => setEventForm({ ...eventForm, image: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text text-xs focus:outline-none focus:border-ashram-saffron"
                  />
                </div>

                {eventForm.image && (
                  <FocalPointPicker
                    imageUrl={eventForm.image}
                    focalPoint={eventForm.focalPoint}
                    onChange={(point) => setEventForm({ ...eventForm, focalPoint: point })}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Date *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Nov 20, 2026"
                    value={eventForm.date}
                    onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text text-xs focus:outline-none focus:border-ashram-saffron"
                  />
                </div>

                {/* CATEGORY SELECTOR WITH HIGH CONTRAST DARK/LIGHT STYLING */}
                <div>
                  <label className="block font-semibold mb-1">Category *</label>
                  <select
                    value={eventForm.category}
                    onChange={e => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-ashram-saffron"
                  >
                    <option value="Educational Events" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white font-medium">Educational Events</option>
                    <option value="Cultural Programs" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white font-medium">Cultural Programs</option>
                    <option value="Sports Activities" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white font-medium">Sports Activities</option>
                    <option value="Festivals" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white font-medium">Festivals</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Venue *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ashram Sports Complex & Grounds"
                  value={eventForm.location}
                  onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text text-xs focus:outline-none focus:border-ashram-saffron"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-darkAshram-surface text-ashram-muted">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-ashram-saffron text-white font-bold">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GALLERY MODAL WITH FILE UPLOAD & FIXED SELECT OPTION VISIBILITY */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-darkAshram-card text-ashram-charcoal dark:text-darkAshram-text rounded-2xl p-6 shadow-2xl border border-ashram-border dark:border-darkAshram-border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-bold text-xl text-ashram-green dark:text-darkAshram-gold">
                {editingGalleryItem ? 'Edit Gallery Image' : 'Add Gallery Image'}
              </h3>
              <button onClick={() => setShowGalleryModal(false)} className="p-1 rounded-lg hover:bg-ashram-border/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGallery} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Image Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Classroom Study Session"
                  value={galleryForm.title}
                  onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text text-xs focus:outline-none focus:border-ashram-saffron"
                />
              </div>

              {/* File Upload OR URL Option */}
              <div>
                <label className="block font-semibold mb-1">Image File or URL *</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl border border-dashed border-ashram-border dark:border-darkAshram-border bg-ashram-cream/50 dark:bg-darkAshram-surface">
                    <Upload className="w-4 h-4 text-ashram-saffron shrink-0" />
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, (dataUrl) => setGalleryForm({ ...galleryForm, image: dataUrl }));
                      }}
                      className="w-full text-[11px] text-ashram-muted file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-ashram-saffron file:text-white hover:file:bg-ashram-saffronHover cursor-pointer"
                    />
                  </div>

                  {uploadProgress !== null && (
                    <div className="space-y-1 py-1">
                      <div className="flex justify-between text-[10px] font-semibold text-ashram-saffron">
                        <span>Uploading to Cloud...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-darkAshram-surface rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-ashram-saffron h-1.5 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <input
                    type="url"
                    placeholder="Or paste image/video URL (https://...)"
                    value={galleryForm.image}
                    onChange={e => setGalleryForm({ ...galleryForm, image: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text text-xs focus:outline-none focus:border-ashram-saffron"
                  />
                </div>

                {galleryForm.image && (galleryForm.image.includes('.mp4') || galleryForm.image.includes('video')) ? (
                  <div className="rounded-xl overflow-hidden mt-2 bg-black/90 p-1 border border-ashram-border">
                    <video src={galleryForm.image} controls className="max-h-48 w-full object-contain rounded-lg" />
                  </div>
                ) : galleryForm.image ? (
                  <FocalPointPicker
                    imageUrl={galleryForm.image}
                    focalPoint={galleryForm.focalPoint}
                    onChange={(point) => setGalleryForm({ ...galleryForm, focalPoint: point })}
                  />
                ) : null}
              </div>

              {/* CATEGORY SELECTOR WITH CRISP HIGH-CONTRAST OPTION STYLING */}
              <div>
                <label className="block font-semibold mb-1">Category *</label>
                <select
                  value={galleryForm.category}
                  onChange={e => setGalleryForm({ ...galleryForm, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-white dark:bg-darkAshram-surface text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-ashram-saffron"
                >
                  <option value="Students" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white font-medium py-1">Students</option>
                  <option value="Events" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white font-medium py-1">Events</option>
                  <option value="Ashram" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white font-medium py-1">Ashram</option>
                  <option value="Activities" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white font-medium py-1">Activities</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowGalleryModal(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-darkAshram-surface text-ashram-muted">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-ashram-saffron text-white font-bold">Save Image</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FACILITY MODAL */}
      {showFacilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-darkAshram-card text-ashram-charcoal dark:text-darkAshram-text rounded-2xl p-6 shadow-2xl border border-ashram-border dark:border-darkAshram-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-bold text-xl text-ashram-green dark:text-darkAshram-gold">Add Facility</h3>
              <button onClick={() => setShowFacilityModal(false)} className="p-1 rounded-lg hover:bg-ashram-border/50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFacility} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Facility Title *</label>
                <input required type="text" value={facilityForm.title} onChange={e => setFacilityForm({ ...facilityForm, title: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block font-semibold mb-1">One-Line Description *</label>
                <input required type="text" value={facilityForm.description} onChange={e => setFacilityForm({ ...facilityForm, description: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-ashram-charcoal dark:text-darkAshram-text text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Lucide Icon Name *</label>
                <select value={facilityForm.icon} onChange={e => setFacilityForm({ ...facilityForm, icon: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-white dark:bg-darkAshram-surface text-gray-900 dark:text-white text-xs font-semibold focus:outline-none">
                  <option value="BookOpen" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">BookOpen</option>
                  <option value="Home" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Home</option>
                  <option value="Utensils" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Utensils</option>
                  <option value="HeartPulse" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">HeartPulse</option>
                  <option value="Laptop" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Laptop</option>
                  <option value="Trophy" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Trophy</option>
                  <option value="Palette" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Palette</option>
                  <option value="Sparkles" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Sparkles</option>
                  <option value="Library" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Library</option>
                  <option value="UserCheck" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">UserCheck</option>
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowFacilityModal(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-darkAshram-surface text-ashram-muted">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-ashram-saffron text-white font-bold">Save Facility</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTRIBUTION MODAL */}
      {showContributionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-darkAshram-card text-ashram-charcoal dark:text-darkAshram-text rounded-2xl p-6 shadow-2xl border border-ashram-border dark:border-darkAshram-border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-bold text-xl text-ashram-green dark:text-darkAshram-gold">Record Offline Donation</h3>
              <button onClick={() => setShowContributionModal(false)} className="p-1 rounded-lg hover:bg-ashram-border/50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveContribution} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Donor Name *</label>
                  <input required type="text" value={contributionForm.name} onChange={e => setContributionForm({ ...contributionForm, name: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email *</label>
                  <input required type="email" value={contributionForm.email} onChange={e => setContributionForm({ ...contributionForm, email: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Amount (₹) *</label>
                  <input required type="number" min="1" value={contributionForm.amount || ''} onChange={e => setContributionForm({ ...contributionForm, amount: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Purpose *</label>
                  <select value={contributionForm.purpose} onChange={e => setContributionForm({ ...contributionForm, purpose: e.target.value as any })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-white dark:bg-darkAshram-surface text-gray-900 dark:text-white focus:outline-none">
                    <option value="General Support" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">General Support</option>
                    <option value="Education" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Education</option>
                    <option value="Food" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Food</option>
                    <option value="Healthcare" className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">Healthcare</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Payment Reference (e.g., Check No, Txn ID)</label>
                <input type="text" value={contributionForm.paymentRef} onChange={e => setContributionForm({ ...contributionForm, paymentRef: e.target.value })} className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface focus:outline-none focus:border-ashram-saffron" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowContributionModal(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-darkAshram-surface text-ashram-muted">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-ashram-saffron text-white font-bold">Save Donation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MEMORY VAULT ADD/EDIT MODAL ── */}
      {showVaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-darkAshram-card text-ashram-charcoal dark:text-darkAshram-text rounded-2xl shadow-2xl border border-ashram-border dark:border-darkAshram-border max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-ashram-border dark:border-darkAshram-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-ashram-saffron/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-ashram-saffron" />
                </div>
                <h3 className="font-heading font-bold text-lg text-ashram-green dark:text-darkAshram-gold">
                  {editingVaultCard ? 'Edit Memory Card' : 'Add Memory Card'}
                </h3>
              </div>
              <button onClick={() => setShowVaultModal(false)} className="p-1.5 rounded-lg hover:bg-ashram-border/50 dark:hover:bg-darkAshram-border">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVaultCard} className="p-5 space-y-4 text-xs">
              {/* Image Upload */}
              <div>
                <label className="block font-semibold mb-1.5 text-sm">Card Image *</label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-ashram-saffron/40 hover:border-ashram-saffron cursor-pointer transition-colors bg-ashram-saffron/5">
                    <Upload className="w-4 h-4 text-ashram-saffron" />
                    <span className="text-ashram-saffron font-semibold text-xs">Upload from device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, (url) => setVaultForm({ ...vaultForm, image: url }));
                      }}
                    />
                  </label>

                  {uploadProgress !== null && (
                    <div className="space-y-1 py-1">
                      <div className="flex justify-between text-[10px] font-semibold text-ashram-saffron">
                        <span>Uploading to Cloud...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-darkAshram-surface rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-ashram-saffron h-1.5 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-ashram-border dark:bg-darkAshram-border" />
                    <span className="text-[10px] text-ashram-muted uppercase font-bold">or URL</span>
                    <div className="flex-1 h-px bg-ashram-border dark:bg-darkAshram-border" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={vaultForm.image.startsWith('data:') ? '' : vaultForm.image}
                    onChange={(e) => setVaultForm({ ...vaultForm, image: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-xs focus:outline-none focus:border-ashram-saffron"
                  />
                </div>
                {/* Live preview */}
                {vaultForm.image && (
                  <div className="mt-3 flex items-start gap-4">
                    <div className="rounded-xl overflow-hidden border border-ashram-border dark:border-darkAshram-border" style={{ width: 72, aspectRatio: '2/3', flexShrink: 0 }}>
                      <img src={vaultForm.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[10px] text-ashram-muted dark:text-darkAshram-muted leading-relaxed">
                      <p className="font-bold text-ashram-green dark:text-darkAshram-gold mb-0.5">Preview</p>
                      <p>Portrait format works best for memory cards.</p>
                      <p className="mt-1">Max file size: 5MB</p>
                    </div>
                  </div>
                )}
                {vaultForm.image && (
                  <FocalPointPicker
                    imageUrl={vaultForm.image}
                    focalPoint={vaultForm.focalPoint}
                    onChange={(point) => setVaultForm({ ...vaultForm, focalPoint: point })}
                  />
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold mb-1.5 text-sm">Category *</label>
                <select
                  value={vaultForm.category}
                  onChange={(e) => setVaultForm({ ...vaultForm, category: e.target.value as MemoryVaultCard['category'] })}
                  className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-white dark:bg-darkAshram-surface text-gray-900 dark:text-white text-xs font-semibold focus:outline-none"
                >
                  {['Campus', 'Students', 'Nature', 'Events', 'Activities', 'Facilities', 'Memories'].map(cat => (
                    <option key={cat} value={cat} className="bg-white dark:bg-darkAshram-card text-gray-900 dark:text-white">{cat}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVaultModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-darkAshram-surface text-ashram-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-ashram-saffron hover:bg-ashram-saffronHover text-white font-bold text-xs shadow transition-colors"
                >
                  {editingVaultCard ? 'Update Card' : 'Add to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}




      {/* STUDENT IMAGE MODAL */}
      {showStudentImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-darkAshram-card text-ashram-charcoal dark:text-darkAshram-text rounded-2xl shadow-2xl border border-ashram-border dark:border-darkAshram-border max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-ashram-border dark:border-darkAshram-border">
              <h3 className="font-heading font-bold text-lg text-ashram-green dark:text-darkAshram-gold">
                {editingStudentImage ? 'Edit Student Entry' : 'Add New Student Entry'}
              </h3>
              <button onClick={() => setShowStudentImageModal(false)} className="p-1.5 rounded-lg hover:bg-ashram-border/50 dark:hover:bg-darkAshram-border">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStudentImage} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1.5 text-sm">Title *</label>
                <input
                  type="text"
                  required
                  value={studentImageForm.title}
                  onChange={(e) => setStudentImageForm({ ...studentImageForm, title: e.target.value })}
                  placeholder="e.g. Education, Sports Tournament..."
                  className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-xs focus:outline-none focus:border-ashram-saffron"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-sm">Image Source *</label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-ashram-saffron/40 hover:border-ashram-saffron cursor-pointer transition-colors bg-ashram-saffron/5">
                    <Upload className="w-4 h-4 text-ashram-saffron" />
                    <span className="text-ashram-saffron font-semibold text-xs">Upload from device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, (url) => setStudentImageForm({ ...studentImageForm, image: url }));
                      }}
                    />
                  </label>

                  {uploadProgress !== null && (
                    <div className="space-y-1 py-1">
                      <div className="flex justify-between text-[10px] font-semibold text-ashram-saffron">
                        <span>Uploading to Cloud...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-darkAshram-surface rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-ashram-saffron h-1.5 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-ashram-border dark:bg-darkAshram-border" />
                    <span className="text-[10px] text-ashram-muted uppercase font-bold">or URL</span>
                    <div className="flex-1 h-px bg-ashram-border dark:bg-darkAshram-border" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={studentImageForm.image.startsWith('data:') ? '' : studentImageForm.image}
                    onChange={(e) => setStudentImageForm({ ...studentImageForm, image: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-xs focus:outline-none focus:border-ashram-saffron"
                  />
                </div>
                {studentImageForm.image && (
                  <div className="mt-3 flex items-start gap-4">
                    <div className="rounded-xl overflow-hidden border border-ashram-border dark:border-darkAshram-border w-32 aspect-[4/3] shrink-0">
                      <img src={studentImageForm.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
                {studentImageForm.image && (
                  <FocalPointPicker
                    imageUrl={studentImageForm.image}
                    focalPoint={studentImageForm.focalPoint}
                    onChange={(point) => setStudentImageForm({ ...studentImageForm, focalPoint: point })}
                  />
                )}
              </div>
              
              <div>
                <label className="block font-semibold mb-1.5 text-sm">Description *</label>
                <textarea
                  required
                  value={studentImageForm.description}
                  onChange={(e) => setStudentImageForm({ ...studentImageForm, description: e.target.value })}
                  placeholder="Enter a description for this student activity..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream dark:bg-darkAshram-surface text-xs focus:outline-none focus:border-ashram-saffron resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowStudentImageModal(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-darkAshram-surface text-ashram-muted font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-ashram-saffron hover:bg-ashram-saffronHover text-white font-bold shadow">
                  {editingStudentImage ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DEDICATED CHANGE QR CODE MODAL ── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-darkAshram-card text-ashram-charcoal dark:text-darkAshram-text rounded-2xl shadow-2xl border border-ashram-border dark:border-darkAshram-border max-h-[92vh] overflow-y-auto p-5 sm:p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-ashram-border dark:border-darkAshram-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-ashram-saffron flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-ashram-green dark:text-darkAshram-gold">
                    Change Donation QR Code
                  </h3>
                  <p className="text-[11px] text-ashram-muted dark:text-darkAshram-muted">
                    Updates live in the "Scan & Donate" modal across the website
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1.5 rounded-lg hover:bg-ashram-border/50 dark:hover:bg-darkAshram-border text-ashram-muted hover:text-ashram-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-5">
              {/* Current Active QR Preview */}
              <div className="p-4 rounded-xl bg-ashram-cream/40 dark:bg-darkAshram-surface/40 border border-ashram-border dark:border-darkAshram-border flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-white p-1.5 border border-ashram-border shrink-0 flex items-center justify-center overflow-hidden">
                  {donationSettings?.qrCodeImage ? (
                    <img src={donationSettings.qrCodeImage} alt="Current QR" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-12 h-12 text-ashram-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Live Active
                  </span>
                  <p className="text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text truncate">
                    UPI: {donationSettings?.upiId || 'vatsalyavatika@upi'}
                  </p>
                  <p className="text-[11px] text-ashram-muted truncate">
                    Bank: {donationSettings?.bankName || 'Ashram Trust'}
                  </p>
                  {donationSettings?.qrCodeImage && (
                    <div className="flex items-center gap-3 pt-1">
                      <a
                        href={donationSettings.qrCodeImage}
                        download="donation-qr.jpg"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-ashram-saffron hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(donationSettings.qrCodeImage || '');
                          toast.success('QR Code URL copied!');
                        }}
                        className="text-[10px] font-semibold text-ashram-muted hover:text-ashram-charcoal flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Copy URL
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload New QR File */}
              <div>
                <label className="block text-xs font-bold text-ashram-charcoal dark:text-darkAshram-text mb-1.5">
                  1. Upload New QR Code Image (from Phone or Computer)
                </label>
                <input
                  ref={modalQrFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      processQrCodeFile(file);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <div
                  onClick={() => modalQrFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processQrCodeFile(file);
                  }}
                  className="border-2 border-dashed border-amber-400/60 dark:border-amber-600/60 hover:border-ashram-saffron rounded-xl p-5 text-center cursor-pointer transition-all bg-amber-50/30 hover:bg-amber-50/60 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 group"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-ashram-saffron/10 text-ashram-saffron flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ashram-charcoal dark:text-darkAshram-text">
                        Click to select QR file or drag & drop here
                      </p>
                      <p className="text-[10px] text-ashram-muted mt-0.5">
                        PNG, JPG, JPEG, WebP • Auto saved to Cloud & Live Site
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Or Paste Image URL */}
              <div>
                <label className="block text-xs font-bold text-ashram-charcoal dark:text-darkAshram-text mb-1.5">
                  2. Or Paste Image URL directly
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/qr-code.png"
                    value={qrUrlInput}
                    onChange={(e) => setQrUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-ashram-border dark:border-darkAshram-border bg-ashram-cream/50 dark:bg-darkAshram-surface text-xs focus:border-ashram-saffron focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveQrUrl(qrUrlInput)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-ashram-saffron hover:bg-ashram-saffronHover text-white shadow-soft transition-all shrink-0 cursor-pointer"
                  >
                    Save URL
                  </button>
                </div>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1 py-1">
                  <div className="flex justify-between text-[10px] font-semibold text-ashram-saffron">
                    <span>Uploading & saving QR Code...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-darkAshram-surface rounded-full h-1.5 overflow-hidden">
                    <div className="bg-ashram-saffron h-1.5 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-ashram-border dark:border-darkAshram-border flex items-center justify-between">
              <button
                type="button"
                onClick={handleRemoveQr}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 rounded-xl bg-ashram-saffron hover:bg-ashram-saffronHover text-white text-xs font-bold shadow cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
