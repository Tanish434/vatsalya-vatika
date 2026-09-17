import { EventItem, GalleryItem, FacilityItem, StudentImage, CarouselImage, MemoryVaultCard, ReviewItem, SiteSettingsData } from '../types';

export const fallbackEvents: EventItem[] = [];

export const fallbackGallery: GalleryItem[] = [];

export const fallbackFacilities: FacilityItem[] = [
  {
    _id: 'fac-1',
    title: 'Education',
    description: 'Comprehensive academic learning covering sciences, humanities, languages, and moral ethics.',
    icon: 'BookOpen',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'fac-2',
    title: 'Accommodation',
    description: 'Safe, hygienic, and comfortable residential dormitories with study tables and personal storage.',
    icon: 'Home',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'fac-3',
    title: 'Nutritious Food',
    description: 'Freshly prepared vegetarian meals daily ensuring complete health and physical vitality.',
    icon: 'Utensils',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'fac-4',
    title: 'Healthcare',
    description: '24/7 medical check-ups, emergency care, first-aid, and visiting medical specialist doctors.',
    icon: 'HeartPulse',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'fac-5',
    title: 'Computer Education',
    description: 'Well-equipped computer lab with high-speed internet and digital skill training programs.',
    icon: 'Laptop',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'fac-6',
    title: 'Sports & Athletics',
    description: 'Expansive sports arena for cricket, football, volleyball, athletics, and traditional games.',
    icon: 'Trophy',
    createdAt: new Date().toISOString()
  }
];

export const fallbackStudentImages: StudentImage[] = [];

export const fallbackCarouselImages: CarouselImage[] = [];

export const fallbackMemoryVaultCards: MemoryVaultCard[] = [];

export const fallbackReviews: ReviewItem[] = [];

export const fallbackSiteSettings: SiteSettingsData = {
  heroTitle: 'A Place to Learn, Grow and Build a Better Future.',
  heroSubtitle: 'Vatsalya Vatika provides education, care, values and essential facilities to 200+ students in a safe and nurturing environment.',
  aboutText: 'Vatsalya Vatika is an educational and charitable Ashram dedicated to providing quality education, spiritual and moral guidance, wholesome nutrition, and loving residential care to over 200 young students.',
  contactEmail: 'monuvatika@gmail.com',
  contactPhone: '+91 98765 43210',
  contactAddress: 'Vatsalya Vatika Ashram, Mathura Road, Vrindavan, Uttar Pradesh, India',
  facebookUrl: 'https://facebook.com',
  youtubeUrl: 'https://youtube.com',
  instagramUrl: 'https://instagram.com'
};
