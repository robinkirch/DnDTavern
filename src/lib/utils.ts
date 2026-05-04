import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resizeImage (file: File, maxWidth: number, maxHeight: number): Promise<string>
{
  return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

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
              return reject(new Error('Could not get canvas context'));
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(file.type));
      };
      img.onerror = (error) => reject(error);
  });
};