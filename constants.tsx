/**
 * Global constants and static resources
 * Using lucide-react icon library for consistent, modern iconography
 */

import {
  Folder,
  File,
  Image,
  Video,
  Music,
  Code2,
  FileText,
  Archive,
  Plus,
  Trash2,
  Download,
  Search,
  ChevronRight,
  X,
  Grid3x3,
  List,
  MoreVertical,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Share2,
  Upload,
  Copy,
  Edit,
  Move,
  AlertCircle,
  Check,
  Loader2,
  FileType
} from 'lucide-react';

/**
 * Global color scheme (Geek-Brutalism)
 * - primary: Pure black - Main text and borders
 * - secondary: Bright yellow - Hover/Active accent color
 * - bg: Pure white - Background color
 * - border: Light gray - Secondary borders
 */
export const COLORS = {
  primary: '#000000',
  secondary: '#FDE047',
  bg: '#FFFFFF',
  border: '#E5E7EB',
};

/**
 * Icon component library using lucide-react
 * All icons from lucide-react for consistent design
 * All icons support className prop for custom styling
 */
export const Icons = {
  Folder,
  File,
  Image,
  Video,
  Audio: Music,
  Code: Code2,
  Pdf: FileType,
  Archive,
  Plus,
  Trash: Trash2,
  Download,
  Search,
  ChevronRight,
  Close: X,
  Grid: Loader2,  // Using Loader2 for spinning animation
  List,
  More: MoreVertical,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Share: Share2,
  Upload,
  Copy,
  Edit,
  Move,
  Alert: AlertCircle,
  Check,
  Loader: Loader2,
  Grid3x3  // For actual grid icon
};
