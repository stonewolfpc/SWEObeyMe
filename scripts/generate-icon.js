/**
 * Generate icon.png for SWEObeyMe
 * Creates a proper icon with shield and checkmark
 */

import Jimp from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateIcon() {
  try {
    // Create a 128x128 image with blue background
    const image = new Jimp(128, 128, 0x2563ebff);

    // Draw white shield shape using simple rectangles
    // Shield top (triangle)
    for (let y = 20; y < 40; y++) {
      const width = Math.floor((y - 20) * 2.8);
      const startX = 64 - Math.floor(width / 2);
      for (let x = startX; x < startX + width; x++) {
        image.setPixelColor(0xffffffff, x, y);
      }
    }

    // Shield body (rounded rectangle)
    for (let y = 40; y < 80; y++) {
      for (let x = 36; x < 92; x++) {
        image.setPixelColor(0xffffffff, x, y);
      }
    }

    // Shield bottom (pointed)
    for (let y = 80; y < 100; y++) {
      const width = Math.floor((100 - y) * 2.8);
      const startX = 64 - Math.floor(width / 2);
      for (let x = startX; x < startX + width; x++) {
        image.setPixelColor(0xffffffff, x, y);
      }
    }

    // Draw green checkmark
    // First line (diagonal up)
    for (let i = 0; i < 20; i++) {
      const x = 48 + Math.floor(i * 0.6);
      const y = 72 - Math.floor(i * 0.6);
      for (let t = -2; t <= 2; t++) {
        image.setPixelColor(0x22c55eff, x + t, y);
        image.setPixelColor(0x22c55eff, x, y + t);
      }
    }

    // Second line (diagonal down)
    for (let i = 0; i < 25; i++) {
      const x = 60 + Math.floor(i * 0.8);
      const y = 72 + Math.floor(i * 0.96);
      for (let t = -2; t <= 2; t++) {
        image.setPixelColor(0x22c55eff, x + t, y);
        image.setPixelColor(0x22c55eff, x, y + t);
      }
    }

    // Save the image
    const iconPath = path.join(__dirname, '..', 'icon.png');
    await image.writeAsync(iconPath);

    console.log('Icon generated successfully: ' + iconPath);
  } catch (error) {
    console.error('Failed to generate icon: ' + error.message);
    throw error;
  }
}

function drawLine(image, x0, y0, x1, y1, color, thickness) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  const r = (color >> 24) & 0xff;
  const g = (color >> 16) & 0xff;
  const b = (color >> 8) & 0xff;
  const a = color & 0xff;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Draw a circle of thickness at current point
    for (let i = -thickness; i <= thickness; i++) {
      for (let j = -thickness; j <= thickness; j++) {
        if (i * i + j * j <= thickness * thickness) {
          const px = Math.round(x + i);
          const py = Math.round(y + j);
          if (px >= 0 && px < 128 && py >= 0 && py < 128) {
            const idx = (py * 128 + px) * 4;
            image.bitmap.data[idx] = r;
            image.bitmap.data[idx + 1] = g;
            image.bitmap.data[idx + 2] = b;
            image.bitmap.data[idx + 3] = a;
          }
        }
      }
    }

    if (x === x1 && y === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

generateIcon().catch(console.error);
