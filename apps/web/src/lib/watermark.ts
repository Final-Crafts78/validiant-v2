/**
 * Watermark Utility
 *
 * Burns coordinates and timestamps natively onto local images using Canvas API.
 */

export interface WatermarkMetadata {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  ipAddress?: string;
}

/**
 * Applies a forensic watermark to an image file
 * Returns a new File object with the watermark burned in
 */
export async function applyWatermark(
  file: File,
  metadata: WatermarkMetadata
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Watermark Styling
        const padding = canvas.width * 0.02; // 2% padding
        const fontSize = Math.max(12, Math.floor(canvas.width * 0.025));
        ctx.font = `bold ${fontSize}px sans-serif`;

        // Prepare text
        const lines = [
          `LOC: ${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)} (±${metadata.accuracy.toFixed(1)}m)`,
          `TIME: ${metadata.timestamp}`,
          `VALIDIANT FORENSIC TAG [TAMPER-PROTECTED PL]`,
        ];

        // Draw background bar for legibility
        const barHeight = lines.length * fontSize * 1.5 + padding * 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

        // Draw text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        lines.reverse().forEach((line, index) => {
          ctx.fillText(
            line,
            padding,
            canvas.height - padding - index * fontSize * 1.5
          );
        });

        // Convert back to file
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            const watermarkedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(watermarkedFile);
          },
          file.type,
          0.9
        ); // 90% quality
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}
