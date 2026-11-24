/** Resize to fit `max` px and re-encode as JPEG so it fits in browser storage. */
export const shrink = (file: File, max = 1000, quality = 0.8) =>
  new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const scale = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.round(im.width * scale);
      c.height = Math.round(im.height * scale);
      c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad image'));
    };
    im.src = url;
  });

export const ratioOf = (dataUrl: string) =>
  new Promise<'square' | 'portrait' | 'landscape'>((resolve) => {
    const im = new Image();
    im.onload = () => {
      const r = im.width / im.height;
      resolve(r > 1.2 ? 'landscape' : r < 0.9 ? 'portrait' : 'square');
    };
    im.onerror = () => resolve('square');
    im.src = dataUrl;
  });
