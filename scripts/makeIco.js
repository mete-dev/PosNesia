const fs = require('fs');
const path = require('path');

// Simple PNG to ICO generator script (creates valid uncompressed 256x256 ICO wrapper)
const pngBuffer = fs.readFileSync(path.join(__dirname, '../public/pwa-icon.png'));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // Type 1 = ICO
header.writeUInt16LE(1, 4); // 1 image

const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(0, 0);   // Width 0 means 256
dirEntry.writeUInt8(0, 1);   // Height 0 means 256
dirEntry.writeUInt8(0, 2);   // Color palette
dirEntry.writeUInt8(0, 3);   // Reserved
dirEntry.writeUInt16LE(1, 4);  // Color planes
dirEntry.writeUInt16LE(32, 6); // Bits per pixel
dirEntry.writeUInt32LE(pngBuffer.length, 8); // Size of image data
dirEntry.writeUInt32LE(22, 12); // Offset of image data (6 + 16 = 22)

const icoBuffer = Buffer.concat([header, dirEntry, pngBuffer]);
fs.writeFileSync(path.join(__dirname, '../public/pwa-icon.ico'), icoBuffer);
console.log('Successfully created public/pwa-icon.ico');
