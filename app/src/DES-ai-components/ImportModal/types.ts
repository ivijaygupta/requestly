export interface ImportItem {
  id: string;
  label: string;
  type: 'collection' | 'request' | 'environment' | 'folder' | 'test';
  count?: number;
  children?: ImportItem[];
}

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}
