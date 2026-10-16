/* Web previews have no barcode camera: the scanner shows the typed entry only.
   Same exports as camera.tsx (the iPhone version). */
import type { CameraScannerProps } from './camera';

export const CAMERA_AVAILABLE = false;
export type { CameraScannerProps };

export function CameraScanner(_props: CameraScannerProps) {
  return null;
}
