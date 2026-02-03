'use client';

import axios from 'axios';
import api from '@/lib/api';
import type { MediaAsset, MediaKind, MediaOwnerType } from '@/types';

export type MediaSignatureRequest = {
  ownerType: MediaOwnerType;
  ownerId: string;
  kind: MediaKind;
  fileNameHint?: string;
};

export type MediaSignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  public_id: string;
  signature: string;
};

export type MediaRegisterRequest = {
  ownerType: MediaOwnerType;
  ownerId: string;
  kind: MediaKind;
  publicId: string;
  url: string;
  secureUrl: string;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
};

export type MediaListParams = {
  ownerType: MediaOwnerType;
  ownerId: string;
  kind?: MediaKind;
};

export type CloudinaryUploadResult = {
  public_id: string;
  url: string;
  secure_url: string;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
};

export type MediaServiceError = {
  message: string;
  status?: number;
};

const mapApiError = (error: unknown, fallback: string): MediaServiceError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return { message: 'Sesión expirada', status };
    if (status === 403) return { message: 'No tenés permisos', status };
    return { message: fallback, status };
  }
  return { message: fallback };
};

const mapUploadError = (error: unknown): MediaServiceError => {
  if (axios.isAxiosError(error)) {
    return { message: 'No pudimos subir la imagen. Reintentá.', status: error.response?.status };
  }
  if (error instanceof Error) {
    return { message: 'No pudimos subir la imagen. Reintentá.' };
  }
  return { message: 'No pudimos subir la imagen. Reintentá.' };
};

export const MediaService = {
  getSignature: async (payload: MediaSignatureRequest): Promise<MediaSignatureResponse> => {
    try {
      const { data } = await api.post<MediaSignatureResponse>(
        '/media/cloudinary/signature',
        payload,
      );
      return data;
    } catch (error) {
      throw mapApiError(error, 'No pudimos iniciar la subida. Reintentá.');
    }
  },

  register: async (payload: MediaRegisterRequest): Promise<MediaAsset> => {
    try {
      const { data } = await api.post<MediaAsset>('/media/register', payload);
      return data;
    } catch (error) {
      throw mapApiError(error, 'No pudimos registrar la imagen. Reintentá.');
    }
  },

  listAuth: async (params: MediaListParams): Promise<MediaAsset[]> => {
    try {
      const { data } = await api.get<MediaAsset[]>('/media', { params });
      return data;
    } catch (error) {
      throw mapApiError(error, 'No pudimos cargar las imagenes.');
    }
  },

  remove: async (id: string): Promise<MediaAsset> => {
    try {
      const { data } = await api.delete<MediaAsset>(`/media/${id}`);
      return data;
    } catch (error) {
      throw mapApiError(error, 'No pudimos eliminar la imagen.');
    }
  },

  listPublic: async (params: MediaListParams): Promise<MediaAsset[]> => {
    try {
      const { data } = await api.get<MediaAsset[]>('/public/media', { params });
      return data;
    } catch (error) {
      throw mapApiError(error, 'No pudimos cargar las imagenes.');
    }
  },

  getClubLogo: async (clubId: string): Promise<MediaAsset | null> => {
    try {
      const { data } = await api.get<MediaAsset | null>(`/public/media/clubs/${clubId}/logo`);
      return data;
    } catch (error) {
      throw mapApiError(error, 'No pudimos cargar el logo.');
    }
  },

  getClubCover: async (clubId: string): Promise<MediaAsset | null> => {
    try {
      const { data } = await api.get<MediaAsset | null>(`/public/media/clubs/${clubId}/cover`);
      return data;
    } catch (error) {
      throw mapApiError(error, 'No pudimos cargar la portada.');
    }
  },

  getCourtPrimary: async (courtId: string): Promise<MediaAsset | null> => {
    try {
      const { data } = await api.get<MediaAsset | null>(
        `/public/media/courts/${courtId}/primary`,
      );
      return data;
    } catch (error) {
      throw mapApiError(error, 'No pudimos cargar la imagen principal.');
    }
  },

  getCourtGallery: async (courtId: string): Promise<MediaAsset[]> => {
    try {
      const { data } = await api.get<MediaAsset[]>(
        `/public/media/courts/${courtId}/gallery`,
      );
      return data;
    } catch (error) {
      throw mapApiError(error, 'No pudimos cargar la galería.');
    }
  },

  getUserAvatar: async (userId: string): Promise<MediaAsset | null> => {
    try {
      const { data } = await api.get<MediaAsset | null>(
        `/public/media/users/${userId}/avatar`,
      );
      return data;
    } catch (error) {
      throw mapApiError(error, 'No pudimos cargar el avatar.');
    }
  },
};

export const cloudinaryUploadSigned = async (
  file: File,
  signature: MediaSignatureResponse,
): Promise<CloudinaryUploadResult> => {
  const endpoint = `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('folder', signature.folder);
  formData.append('public_id', signature.public_id);
  formData.append('signature', signature.signature);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('upload_failed');
    }
    const data = (await response.json()) as CloudinaryUploadResult;
    return data;
  } catch (error) {
    throw mapUploadError(error);
  }
};
