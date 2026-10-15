export type PhotoRelief = { modelUrl: string; maxAngle: number; example: boolean; surface: 'tag' | 'lamp' | 'usb' | 'stand' | 'custom' | 'none' };

// Four character cutouts were rejected by the image editor. Never claim their assets exist.
export const productVisuals: Record<string, PhotoRelief> = {
  nfc: { modelUrl: '/assets/products/nfc.glb', maxAngle: 20, example: true, surface: 'tag' },
  lamp: { modelUrl: '/assets/products/lamp.glb', maxAngle: 20, example: true, surface: 'lamp' },
  custom: { modelUrl: '/assets/products/custom.glb', maxAngle: 20, example: true, surface: 'custom' },
  usb: { modelUrl: '/assets/products/usb.glb', maxAngle: 20, example: true, surface: 'usb' },
  stand: { modelUrl: '/assets/products/stand.glb', maxAngle: 20, example: true, surface: 'stand' },
  rocket: { modelUrl: '/assets/products/rocket.glb', maxAngle: 20, example: false, surface: 'none' },
};
