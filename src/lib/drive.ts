/**
 * Helper to convert Google Drive File IDs or share links into direct, high-res CDN URLs
 */
export function getGoogleDriveImageUrl(fileIdOrUrl: string): string {
  if (!fileIdOrUrl) return '';

  // If it's already a full direct URL (e.g., wixstatic, unsplash, lh3), return clean
  if (fileIdOrUrl.startsWith('http://') || fileIdOrUrl.startsWith('https://')) {
    // If it's a drive.google.com file link, extract file ID
    const driveMatch = fileIdOrUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || fileIdOrUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    return fileIdOrUrl;
  }

  // If passed just the raw File ID from Google Drive
  return `https://lh3.googleusercontent.com/d/${fileIdOrUrl}`;
}

/**
 * Resolves product image with Google Drive fallback if reference matches
 */
export function resolveProductImage(product: { images?: string[]; reference?: string; name?: string }): string {
  if (product.images && product.images.length > 0 && product.images[0]) {
    return getGoogleDriveImageUrl(product.images[0]);
  }
  return '';
}
