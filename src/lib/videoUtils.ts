export interface FormattedVideo {
  type: 'iframe' | 'video';
  src: string;
  previewSrc?: string;
  isSupported: boolean;
  driveId?: string;
}

/**
 * Normaliza cualquier URL de video (Google Drive, YouTube, Vimeo, MP4 directo)
 * para reproducirlo de forma fluida sin controles invasivos que tapen las prendas.
 */
export function formatVideoUrl(rawUrl?: string): FormattedVideo {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { type: 'video', src: '', isSupported: false };
  }

  const url = rawUrl.trim();

  // 1. Google Drive: preferir streaming directo MP4 en <video> para evitar la interfaz
  // pesada de Drive que coloca botones gigantes de pausa y títulos sobre la ropa.
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+)|uc\?(?:.*&)?id=([a-zA-Z0-9_-]+))/i);
  if (driveMatch) {
    const fileId = driveMatch[1] || driveMatch[2] || driveMatch[3];
    return {
      type: 'video',
      src: `https://drive.google.com/uc?export=download&id=${fileId}`,
      previewSrc: `https://drive.google.com/file/d/${fileId}/preview`,
      driveId: fileId,
      isSupported: true,
    };
  }

  // 2. YouTube (watch, shorts, embed, youtu.be)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'iframe',
      src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`,
      isSupported: true,
    };
  }

  // 3. Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      isSupported: true,
    };
  }

  // 4. Archivo de video directo (.mp4, .webm, .mov, etc.)
  return {
    type: 'video',
    src: url,
    isSupported: true,
  };
}
