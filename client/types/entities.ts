// Entity types for characters and products

// Reference images
export interface ReferenceImage {
  id: string;
  url?: string;
  name?: string;
  preview?: string;
  file?: File;
  isLoading?: boolean;
}

// Uploaded image
export interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  createdAt: string;
  preview?: string;
  file?: File;
  isExisting?: boolean;
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  images: string[];
  referenceImages?: ReferenceImage[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  images: string[];
  referenceImages?: ReferenceImage[];
  createdAt: string;
  updatedAt: string;
}

export type EntityType = 'character' | 'product';

// Saved versions (alias for compatibility)
export type SavedCharacter = Character;
export type SavedProduct = Product;

// Entity union
export type Entity = Character | Product;
