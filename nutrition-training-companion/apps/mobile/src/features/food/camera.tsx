/* The camera half of the scanner (iPhone): the photographic void on
   surfaceBlack (docs/08 §8.6, Barcode scanner) with the live camera, the
   corner-bracket viewfinder, and the camera permission answers. Barcodes and
   pack QR codes (GS1 Digital Link) are read by expo-camera; what they contain
   is parsed by the caller. The web build uses camera.web.tsx instead. */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, curve, GUTTER, radius, spacing } from '@/theme';
import { Button, Icon, LinkButton, T } from '@/ui';

export const CAMERA_AVAILABLE = true;

export type CameraScannerProps = {
  /* A lookup is running: scans are ignored and the frame says so. */
  busy: boolean;
  /* Why the last code couldn't be used ("This QR code is a web link…"). */
  notice: string | null;
  onScan: (data: string) => void;
  onType: () => void;
  onClose: () => void;
};

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'datamatrix'] as const;

/* The close control: a circle in chipTranslucent at about 64% (docs/08 §8.6). */
function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onPress} hitSlop={4}
      style={({ pressed }) => ({ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, backgroundColor: colors.chipTranslucent, opacity: 0.64 }]} />
      <Icon name="xmark" size={18} color="onDark" />
    </Pressable>
  );
}

/* Corner brackets, 2px onDark: the thickest line the system allows. */
function Viewfinder() {
  const corner = (pos: object) => (
    <View style={[{ position: 'absolute', width: 32, height: 32, borderColor: colors.onDark }, pos]} />
  );
  return (
    <View pointerEvents="none" style={{ width: 280, maxWidth: '100%', height: 168 }}>
      {corner({ top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: radius.md })}
      {corner({ top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: radius.md })}
      {corner({ bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: radius.md })}
      {corner({ bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: radius.md })}
    </View>
  );
}

/* A camera answer (permission, no camera): glyph, title, sentence, actions. */
function Answer({ icon, title, body, children }: { icon: string; title: string; body: string; children: ReactNode }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: GUTTER, gap: spacing.base }}>
      <View style={{ alignItems: 'center', gap: spacing.base }}>
        <Icon name={icon} size={44} color="onDark" />
        <T size="title3" weight="semiBold" color="onDark" align="center" accessibilityRole="header">{title}</T>
        <T size="body" color="bodyMuted" align="center">{body}</T>
      </View>
      <View style={{ gap: spacing.sm, paddingTop: spacing.sm }}>{children}</View>
    </View>
  );
}

export function CameraScanner({ busy, notice, onScan, onType, onClose }: CameraScannerProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [mountError, setMountError] = useState(false);
  const typeLink = (label: string) => <LinkButton label={label} color="primaryOnDark" align="center" onPress={onType} />;

  let body: ReactNode = <View style={{ flex: 1 }} />;
  let showFooter = false;
  if (permission && !permission.granted && permission.canAskAgain) {
    body = (
      <Answer icon="camera" title="Scan with your camera"
        body="Companion uses the camera only to read the barcode or QR code on a food pack. Nothing is recorded or uploaded.">
        <Button label="Allow camera" onPress={() => { requestPermission().catch(() => {}); }} />
        {typeLink('Type the barcode instead')}
      </Answer>
    );
  } else if (permission && !permission.granted) {
    body = (
      <Answer icon="camera" title="Camera access is off"
        body="To scan barcodes, allow Companion to use the camera: open Settings, then turn on Camera. Or type the barcode instead.">
        <Button label="Open Settings" onPress={() => { Linking.openSettings().catch(() => {}); }} />
        {typeLink('Type the barcode instead')}
      </Answer>
    );
  } else if (permission && mountError) {
    body = (
      <Answer icon="camera" title="We couldn't start the camera" body="Close the scanner and try again, or type the barcode instead.">
        {typeLink('Type the barcode instead')}
      </Answer>
    );
  } else if (permission) {
    showFooter = true;
    body = (
      <>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <CameraView style={StyleSheet.absoluteFill} facing="back"
            barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
            onBarcodeScanned={busy ? undefined : (r) => onScan(r.data)}
            onMountError={() => setMountError(true)} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: GUTTER }]}>
            {busy ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} /> : null}
            <Viewfinder />
            {busy ? (
              <View style={{ position: 'absolute', alignItems: 'center', gap: spacing.sm }}>
                <ActivityIndicator color={colors.onDark} />
                <T size="callout" weight="semiBold" color="onDark">Looking it up…</T>
              </View>
            ) : null}
          </View>
        </View>
        <View style={{ paddingHorizontal: GUTTER, paddingTop: spacing.lg, gap: spacing.md }}>
          <T size="callout" color="bodyMuted" align="center">Hold the barcode or the pack's QR code inside the frame. We'll find it automatically.</T>
          {notice ? (
            <View accessibilityLiveRegion="polite" style={{ backgroundColor: colors.surfaceTile1, borderRadius: radius.lg, ...curve, padding: spacing.base, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <Icon name="info.circle" size={18} color="onDark" />
              <T size="callout" color="onDark" style={{ flex: 1 }}>{notice}</T>
            </View>
          ) : null}
        </View>
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBlack, paddingTop: insets.top }}>
      <StatusBar style="light" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, paddingHorizontal: GUTTER }}>
        <CloseButton onPress={onClose} />
        <T size="body" weight="semiBold" color="onDark" accessibilityRole="header">Scan a barcode</T>
        <View style={{ width: 36 }} />
      </View>
      <View style={{ flex: 1, paddingTop: spacing.base }}>{body}</View>
      <View style={{ alignItems: 'center', paddingHorizontal: GUTTER, paddingTop: spacing.sm, paddingBottom: Math.max(insets.bottom, spacing.base) + spacing.sm }}>
        {showFooter ? typeLink('Type the number instead') : null}
      </View>
    </View>
  );
}
