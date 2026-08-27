export const compressImage = (
  file: File, 
  maxWidth: number = 400, 
  maxHeight: number = 400, 
  quality: number = 0.65
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Optimize to JPEG with balanced compression for high-speed mobile performance
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Formats an out-of-stock item with its price/group category
 * e.g. "لب القرع 5 جنيه", "بسكوت سادة 10 جنيه", "شيبسي شطة وليمون 5 جنيه"
 */
export const formatOutOfStockItemText = (
  productName: string, 
  variation?: { name: string; group?: '5' | '10' | 'other'; price?: number }
): string => {
  const pName = (productName || '').trim();
  if (!variation) return pName;

  let vName = (variation.name || '').trim();

  // Strip redundant bracketed price tags if already typed into the name (e.g. "(5ج)", "(10ج)", "(5 جنيه)")
  vName = vName.replace(/\s*\(\s*(5|10|١٠|٥)\s*(ج|جنيه|جنية)?\s*\)/g, '').trim();

  // Determine item full name
  let fullItemName = '';
  if (!vName || pName.toLowerCase() === vName.toLowerCase()) {
    fullItemName = pName;
  } else if (vName.toLowerCase().startsWith(pName.toLowerCase()) || vName.toLowerCase().includes(pName.toLowerCase())) {
    fullItemName = vName;
  } else if (pName.toLowerCase().includes(vName.toLowerCase())) {
    fullItemName = pName;
  } else {
    fullItemName = `${pName} ${vName}`;
  }

  // Determine price label based on group or custom price
  let priceStr = '';
  if (variation.group === '5') {
    priceStr = '5 جنيه';
  } else if (variation.group === '10') {
    priceStr = '10 جنيه';
  } else if (variation.price && variation.price > 0) {
    priceStr = `${variation.price} جنيه`;
  }

  if (priceStr) {
    // If the name already contains this exact price, don't duplicate
    if (!fullItemName.includes(priceStr) && !fullItemName.includes(`${variation.group} جنيه`)) {
      return `${fullItemName} ${priceStr}`;
    }
  }

  return fullItemName;
};

export const formatVariationPriceLabel = (
  variation?: { group?: '5' | '10' | 'other'; price?: number }
): string => {
  if (!variation) return '';
  if (variation.group === '5') return '5 جنيه';
  if (variation.group === '10') return '10 جنيه';
  if (variation.price && variation.price > 0) return `${variation.price} جنيه`;
  return '';
};
