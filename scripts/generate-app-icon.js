#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "assets");

function rgba(hex, alpha = 255) {
  const clean = hex.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
    alpha,
  ];
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    Math.round(a[3] + (b[3] - a[3]) * t),
  ];
}

class Canvas {
  constructor(size, transparent = false) {
    this.size = size;
    this.data = new Uint8ClampedArray(size * size * 4);
    if (!transparent) this.fillRect(0, 0, size, size, rgba("#0f8f7e"));
  }

  index(x, y) {
    return (y * this.size + x) * 4;
  }

  setPixel(x, y, color) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;
    const index = this.index(x, y);
    const alpha = color[3] / 255;
    const inverse = 1 - alpha;
    this.data[index] = Math.round(color[0] * alpha + this.data[index] * inverse);
    this.data[index + 1] = Math.round(color[1] * alpha + this.data[index + 1] * inverse);
    this.data[index + 2] = Math.round(color[2] * alpha + this.data[index + 2] * inverse);
    this.data[index + 3] = Math.round(255 * alpha + this.data[index + 3] * inverse);
  }

  fillRect(x, y, width, height, color) {
    const left = Math.max(0, Math.floor(x));
    const top = Math.max(0, Math.floor(y));
    const right = Math.min(this.size, Math.ceil(x + width));
    const bottom = Math.min(this.size, Math.ceil(y + height));
    for (let yy = top; yy < bottom; yy += 1) {
      for (let xx = left; xx < right; xx += 1) {
        this.setPixel(xx, yy, color);
      }
    }
  }

  fillGradient(topColor, bottomColor) {
    for (let y = 0; y < this.size; y += 1) {
      const color = mix(topColor, bottomColor, y / Math.max(1, this.size - 1));
      this.fillRect(0, y, this.size, 1, color);
    }
  }

  fillCircle(cx, cy, radius, color) {
    const left = Math.floor(cx - radius);
    const right = Math.ceil(cx + radius);
    const top = Math.floor(cy - radius);
    const bottom = Math.ceil(cy + radius);
    const rr = radius * radius;
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= rr) this.setPixel(x, y, color);
      }
    }
  }

  fillRoundedRect(x, y, width, height, radius, color) {
    const left = Math.floor(x);
    const right = Math.ceil(x + width);
    const top = Math.floor(y);
    const bottom = Math.ceil(y + height);
    for (let yy = top; yy < bottom; yy += 1) {
      for (let xx = left; xx < right; xx += 1) {
        const nearestX = Math.max(x + radius, Math.min(xx, x + width - radius));
        const nearestY = Math.max(y + radius, Math.min(yy, y + height - radius));
        const dx = xx - nearestX;
        const dy = yy - nearestY;
        if (dx * dx + dy * dy <= radius * radius) this.setPixel(xx, yy, color);
      }
    }
  }

  fillPolygon(points, color) {
    const minY = Math.floor(Math.min(...points.map((point) => point[1])));
    const maxY = Math.ceil(Math.max(...points.map((point) => point[1])));
    for (let y = minY; y <= maxY; y += 1) {
      const intersections = [];
      for (let index = 0; index < points.length; index += 1) {
        const a = points[index];
        const b = points[(index + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          intersections.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
        }
      }
      intersections.sort((a, b) => a - b);
      for (let index = 0; index < intersections.length; index += 2) {
        const start = Math.floor(intersections[index]);
        const end = Math.ceil(intersections[index + 1]);
        for (let x = start; x <= end; x += 1) this.setPixel(x, y, color);
      }
    }
  }

  strokeLine(x1, y1, x2, y2, width, color) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / Math.max(1, steps);
      this.fillCircle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, color);
    }
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function encodePng(width, height, data) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width * 4; x += 1) {
      raw[y * (width * 4 + 1) + 1 + x] = data[y * width * 4 + x];
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function downsample(canvas, outputSize) {
  const scale = canvas.size / outputSize;
  const output = new Uint8ClampedArray(outputSize * outputSize * 4);
  for (let y = 0; y < outputSize; y += 1) {
    for (let x = 0; x < outputSize; x += 1) {
      const totals = [0, 0, 0, 0];
      for (let yy = 0; yy < scale; yy += 1) {
        for (let xx = 0; xx < scale; xx += 1) {
          const index = ((y * scale + yy) * canvas.size + (x * scale + xx)) * 4;
          totals[0] += canvas.data[index];
          totals[1] += canvas.data[index + 1];
          totals[2] += canvas.data[index + 2];
          totals[3] += canvas.data[index + 3];
        }
      }
      const count = scale * scale;
      const outputIndex = (y * outputSize + x) * 4;
      output[outputIndex] = Math.round(totals[0] / count);
      output[outputIndex + 1] = Math.round(totals[1] / count);
      output[outputIndex + 2] = Math.round(totals[2] / count);
      output[outputIndex + 3] = Math.round(totals[3] / count);
    }
  }
  return output;
}

function drawMark(canvas, unit, options = {}) {
  const teal = rgba("#0f8f7e");
  const deepTeal = rgba("#075f5b");
  const cream = rgba("#fff7ed");
  const saffron = rgba("#c65f2e");
  const shadow = rgba("#06413f", 52);
  const inkSoft = rgba("#7b645a", 70);
  const scale = (value) => value * unit;
  const point = (x, y) => [scale(x), scale(y)];

  if (options.badge) {
    canvas.fillCircle(scale(512), scale(528), scale(382), rgba("#fff7ed", 42));
  }

  canvas.fillRoundedRect(scale(226), scale(248), scale(572), scale(304), scale(92), shadow);
  canvas.fillRoundedRect(scale(204), scale(222), scale(572), scale(304), scale(92), cream);
  canvas.fillPolygon([point(430, 504), point(512, 604), point(566, 504)], cream);

  canvas.strokeLine(scale(314), scale(336), scale(620), scale(336), scale(34), teal);
  canvas.strokeLine(scale(314), scale(420), scale(548), scale(420), scale(34), teal);
  canvas.fillCircle(scale(660), scale(420), scale(28), saffron);

  canvas.fillPolygon([point(244, 620), point(492, 558), point(492, 790), point(244, 854)], inkSoft);
  canvas.fillPolygon([point(532, 558), point(780, 620), point(780, 854), point(532, 790)], inkSoft);
  canvas.fillPolygon([point(232, 584), point(492, 526), point(492, 758), point(232, 818)], cream);
  canvas.fillPolygon([point(532, 526), point(792, 584), point(792, 818), point(532, 758)], cream);

  canvas.strokeLine(scale(512), scale(538), scale(512), scale(792), scale(24), deepTeal);
  canvas.strokeLine(scale(292), scale(656), scale(444), scale(624), scale(20), teal);
  canvas.strokeLine(scale(292), scale(724), scale(444), scale(692), scale(20), teal);
  canvas.strokeLine(scale(580), scale(624), scale(732), scale(656), scale(20), teal);
  canvas.strokeLine(scale(580), scale(692), scale(732), scale(724), scale(20), teal);
}

function renderIcon(outputSize, mode) {
  const supersample = 2;
  const size = outputSize * supersample;
  const unit = size / 1024;
  const canvas = new Canvas(size, mode !== "full");

  if (mode === "full") {
    canvas.fillGradient(rgba("#179e8c"), rgba("#086863"));
    canvas.fillCircle(0.84 * size, 0.16 * size, 0.3 * size, rgba("#f7b267", 48));
    canvas.fillCircle(0.12 * size, 0.9 * size, 0.24 * size, rgba("#fff7ed", 34));
  }

  drawMark(canvas, unit);
  const pixels = downsample(canvas, outputSize);
  return encodePng(outputSize, outputSize, pixels);
}

function writeAsset(name, size, mode) {
  const outputPath = path.join(assetsDir, name);
  fs.writeFileSync(outputPath, renderIcon(size, mode));
  console.log(`Wrote ${outputPath}`);
}

fs.mkdirSync(assetsDir, { recursive: true });
writeAsset("icon.png", 1024, "full");
writeAsset("adaptive-icon.png", 1024, "foreground");
writeAsset("splash-icon.png", 1024, "foreground");
writeAsset("favicon.png", 48, "full");
