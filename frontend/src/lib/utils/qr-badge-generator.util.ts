/**
 * Modern & Stylish QR Code Presentation Badge Generator
 * Renders a high-resolution, presentation-ready hardware pairing pass
 * suitable for IoT course presentations, PowerPoint slides, and physical chassis stickers.
 */

export interface GenerateQrBadgeOptions {
  qrImageUrl: string;
  deviceId: string;
  deviceName?: string;
  petName: string;
  petIcon?: string;
  claimToken: string;
  botUsername?: string;
  isWebLink?: boolean;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

/**
 * Loads an image from URL into an HTMLImageElement safely
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Generates an ultra-modern, stylish 800x1080 PNG pairing badge
 */
export async function generateModernQrBadgeBlob(
  options: GenerateQrBadgeOptions
): Promise<Blob> {
  const { qrImageUrl, deviceId, petName, claimToken } = options;

  // 1. Fetch QR Image first (via Blob to avoid any CORS issues)
  let qrImg: HTMLImageElement;
  try {
    const res = await fetch(qrImageUrl);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    qrImg = await loadImage(objectUrl);
  } catch {
    qrImg = await loadImage(qrImageUrl);
  }

  // 2. Setup High-DPI Canvas (800 x 1060 px)
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1060;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // --- Background Canvas: Serenade warm biscuit with subtle aesthetic glows ---
  ctx.fillStyle = '#FFF2E6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative ambient soft radial gradients in corners
  const radGlow1 = ctx.createRadialGradient(80, 80, 10, 80, 80, 300);
  radGlow1.addColorStop(0, 'rgba(188, 219, 240, 0.45)');
  radGlow1.addColorStop(1, 'rgba(255, 242, 230, 0)');
  ctx.fillStyle = radGlow1;
  ctx.fillRect(0, 0, 400, 400);

  const radGlow2 = ctx.createRadialGradient(720, 980, 10, 720, 980, 320);
  radGlow2.addColorStop(0, 'rgba(167, 209, 174, 0.4)');
  radGlow2.addColorStop(1, 'rgba(255, 242, 230, 0)');
  ctx.fillStyle = radGlow2;
  ctx.fillRect(400, 600, 400, 460);

  // --- Main Badge Card Container ---
  const cardX = 40;
  const cardY = 40;
  const cardW = 720;
  const cardH = 980;
  const cardR = 36;

  // Soft ambient drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(20, 53, 3, 0.08)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.restore();

  // Subtle Card Border
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.strokeStyle = 'rgba(20, 53, 3, 0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // --- Top Header: Brand Emblem, Title & Hardware Badges ---
  // Brand Emblem Box
  const logoX = 75;
  const logoY = 75;
  const logoSize = 56;
  drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 16);
  ctx.fillStyle = '#143503';
  ctx.fill();

  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFF2E6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CC', logoX + logoSize / 2, logoY + logoSize / 2);

  // Brand Name & Model Info
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#143503';
  ctx.fillText('CHINCHEM SMART FEEDER', 145, 78);

  ctx.font = '600 12px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#4B633E';
  ctx.fillText('MODEL: ESP32-WROOM-32 • DISPENSER V1.0', 145, 108);

  // Wi-Fi+BLE Chip (Top Right)
  const chipW = 120;
  const chipH = 34;
  const chipX = 720 - chipW - 35;
  const chipY = 86;
  drawRoundedRect(ctx, chipX, chipY, chipW, chipH, 17);
  ctx.fillStyle = '#ECFDF5';
  ctx.fill();
  drawRoundedRect(ctx, chipX, chipY, chipW, chipH, 17);
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Green active pulse dot
  ctx.beginPath();
  ctx.arc(chipX + 16, chipY + chipH / 2, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#059669';
  ctx.fill();

  ctx.font = '700 12px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#065F46';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Wi-Fi + BLE', chipX + 28, chipY + chipH / 2);

  // --- Thin Hairline Separator ---
  ctx.beginPath();
  ctx.moveTo(75, 155);
  ctx.lineTo(725, 155);
  ctx.strokeStyle = 'rgba(20, 53, 3, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // --- Pet & Device Profile Capsule ---
  const capX = 75;
  const capY = 175;
  const capW = 650;
  const capH = 68;
  drawRoundedRect(ctx, capX, capY, capW, capH, 20);
  ctx.fillStyle = '#FFF2E6';
  ctx.fill();
  drawRoundedRect(ctx, capX, capY, capW, capH, 20);
  ctx.strokeStyle = 'rgba(20, 53, 3, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left Pet Icon Badge
  ctx.beginPath();
  ctx.arc(capX + 38, capY + capH / 2, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 53, 3, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '22px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐾', capX + 38, capY + capH / 2 + 1);

  // Pet Name & Feeder label
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '800 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#143503';
  ctx.fillText(`${petName || 'Kira'}'s Automated Feeder`, capX + 72, capY + 14);

  // Claim Token monospace info
  ctx.font = '600 12px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#4B633E';
  const displayToken = claimToken.length > 28 ? `${claimToken.substring(0, 28)}...` : claimToken;
  ctx.fillText(`TOKEN: ${displayToken}`, capX + 72, capY + 38);

  // Device ID Badge (Right inside capsule)
  ctx.textAlign = 'right';
  ctx.font = '700 12px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#143503';
  ctx.fillText(deviceId, capX + capW - 20, capY + 26);
  ctx.font = '500 10px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#4B633E';
  ctx.fillText('ACTIVE UNIT', capX + capW - 20, capY + 42);

  // --- Scannable QR Code Frame & High-Tech Viewfinder ---
  const qrFrameX = 175;
  const qrFrameY = 275;
  const qrFrameSize = 450;
  const qrFrameR = 28;

  // Frame Background
  drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, qrFrameR);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, qrFrameR);
  ctx.strokeStyle = 'rgba(20, 53, 3, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tech Viewfinder Corners (⌜ ⌝ ⌞ ⌟)
  const vLen = 28;
  const vOffset = 18;
  ctx.strokeStyle = '#143503';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Top-Left ⌜
  ctx.beginPath();
  ctx.moveTo(qrFrameX + vOffset, qrFrameY + vOffset + vLen);
  ctx.lineTo(qrFrameX + vOffset, qrFrameY + vOffset);
  ctx.lineTo(qrFrameX + vOffset + vLen, qrFrameY + vOffset);
  ctx.stroke();

  // Top-Right ⌝
  ctx.beginPath();
  ctx.moveTo(qrFrameX + qrFrameSize - vOffset - vLen, qrFrameY + vOffset);
  ctx.lineTo(qrFrameX + qrFrameSize - vOffset, qrFrameY + vOffset);
  ctx.lineTo(qrFrameX + qrFrameSize - vOffset, qrFrameY + vOffset + vLen);
  ctx.stroke();

  // Bottom-Left ⌞
  ctx.beginPath();
  ctx.moveTo(qrFrameX + vOffset, qrFrameY + qrFrameSize - vOffset - vLen);
  ctx.lineTo(qrFrameX + vOffset, qrFrameY + qrFrameSize - vOffset);
  ctx.lineTo(qrFrameX + vOffset + vLen, qrFrameY + qrFrameSize - vOffset);
  ctx.stroke();

  // Bottom-Right ⌟
  ctx.beginPath();
  ctx.moveTo(qrFrameX + qrFrameSize - vOffset - vLen, qrFrameY + qrFrameSize - vOffset);
  ctx.lineTo(qrFrameX + qrFrameSize - vOffset, qrFrameY + qrFrameSize - vOffset);
  ctx.lineTo(qrFrameX + qrFrameSize - vOffset, qrFrameY + qrFrameSize - vOffset - vLen);
  ctx.stroke();

  // Draw the QR Code image centered inside the frame
  const qrDrawSize = 350;
  const qrDrawX = qrFrameX + (qrFrameSize - qrDrawSize) / 2;
  const qrDrawY = qrFrameY + (qrFrameSize - qrDrawSize) / 2 - 8;
  ctx.drawImage(qrImg, qrDrawX, qrDrawY, qrDrawSize, qrDrawSize);

  // Center Emblem Overlay on QR (Styled brand paw badge)
  const centerSize = 64;
  const centerX = qrFrameX + qrFrameSize / 2;
  const centerY = qrDrawY + qrDrawSize / 2;
  drawRoundedRect(
    ctx,
    centerX - centerSize / 2,
    centerY - centerSize / 2,
    centerSize,
    centerSize,
    18
  );
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  drawRoundedRect(
    ctx,
    centerX - centerSize / 2,
    centerY - centerSize / 2,
    centerSize,
    centerSize,
    18
  );
  ctx.strokeStyle = '#143503';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.font = '30px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐾', centerX, centerY + 2);

  // Viewfinder Subtitle: Scan prompt
  ctx.font = '800 11px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#143503';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('• SCAN WITH PHONE CAMERA OR TELEGRAM •', qrFrameX + qrFrameSize / 2, qrFrameY + qrFrameSize - 16);

  // --- Primary Call-To-Action Banner ---
  const ctaX = 75;
  const ctaY = 755;
  const ctaW = 650;
  const ctaH = 54;
  drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, 18);
  ctx.fillStyle = '#143503';
  ctx.fill();

  ctx.font = '900 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFF2E6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡ TAP OR SCAN TO PAIR • INSTANT CLOUD ACCESS', ctaX + ctaW / 2, ctaY + ctaH / 2);

  // --- Specifications / Presentation Meta Grid ---
  const specY = 835;
  const boxW = 310;
  const boxH = 68;

  // Left Spec Box: Architecture & MQTT
  drawRoundedRect(ctx, 75, specY, boxW, boxH, 16);
  ctx.fillStyle = '#F8ECE1';
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 53, 3, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#4B633E';
  ctx.fillText('TELEMETRY PROTOCOL', 95, specY + 14);
  ctx.font = '800 13px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#143503';
  ctx.fillText('MQTT / Mosquitto + RTC', 95, specY + 36);

  // Right Spec Box: Course & University
  drawRoundedRect(ctx, 415, specY, boxW, boxH, 16);
  ctx.fillStyle = '#F8ECE1';
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 53, 3, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#4B633E';
  ctx.fillText('PROJECT COURSE EDITION', 435, specY + 14);
  ctx.font = '800 13px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#143503';
  ctx.fillText('IoT Smart Feeder Capstone', 435, specY + 36);

  // --- Footer Watermark & Branding ---
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#4B633E';
  ctx.fillText(
    'ចិញ្ចឹម (ChinChem) Smart Pet Ecosystem • ACLEDA Institute of Business',
    canvas.width / 2,
    940
  );

  ctx.font = '500 9.5px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = 'rgba(75, 99, 62, 0.7)';
  const footerRef = options.isWebLink
    ? `DIRECT WEB APP • REF: claim_${claimToken.substring(0, 10)}...`
    : `TELEGRAM: @${options.botUsername || 'ChinChemBot'} • AUTH_REF: claim_${claimToken.substring(0, 10)}...`;
  ctx.fillText(footerRef, canvas.width / 2, 962);

  // 3. Export to PNG Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/png',
      1.0
    );
  });
}
