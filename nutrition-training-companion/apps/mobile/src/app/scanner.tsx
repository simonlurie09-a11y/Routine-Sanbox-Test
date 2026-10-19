/* Scan a barcode (prototype/src/60-food.js Scanner, BarcodeEntry and
   BarcodeNotFound), presented full screen. The camera reads the barcode, or
   the QR code on newer packs (GS1 Digital Link); M.parseScan says what it
   holds. Your own foods are checked first, then Open Food Facts. A product
   found there is saved to your foods (so it works offline) and opened.
   Typed entry checks the check digit. Web previews have no camera, so they
   show the typed entry only. */
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { CAMERA_AVAILABLE, CameraScanner } from '@/features/food/camera';
import { foodHref, href, isMeal, isQrKind, showGtin, str } from '@/features/food/helpers';
import { lookupBarcode } from '@/services/openFoodFacts';
import { domain as M, type Food } from '@/shared';
import { A, getState } from '@/store';
import { Button, Caption, EmptyAnswer, FormPage, goBack, Input, LinkButton, Screen, T } from '@/ui';

type Scan = { ok: true; gtin14: string; kind: string } | { ok: false; error: string };
type View = 'camera' | 'typed';
type Result =
  | { status: 'not_found'; gtin14: string; qr: boolean; from: View }
  | { status: 'offline'; gtin14: string; qr: boolean; from: View; message: string };

const OFFLINE = "We couldn't reach Open Food Facts. Check your connection and try again.";

export default function ScannerRoute() {
  const p = useLocalSearchParams<{ meal?: string }>();
  const meal = isMeal(str(p.meal)) ? str(p.meal) : undefined;
  const [view, setView] = useState<View>(CAMERA_AVAILABLE ? 'camera' : 'typed');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [typed, setTyped] = useState('');
  const [tried, setTried] = useState(false);
  const busyRef = useRef(false);
  const lastBad = useRef<{ data: string; at: number } | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  function open(id: string, qr: boolean, yours: boolean) {
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.replace(foodHref(id, { via: qr ? 'qr' : 'barcode', from: yours ? 'yours' : undefined, meal }));
  }

  async function lookUp(gtin14: string, qr: boolean, from: View) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    const local = M.lookupBarcode(gtin14, getState().customFoods) as { status: string; food?: Food };
    if (local.status === 'found' && local.food) {
      open(local.food.id, qr, true);
      return;
    }
    const res = await lookupBarcode(gtin14);
    if (!alive.current) return;
    if (res.status === 'found') {
      /* Keep the scanned number, so the next scan finds it in your foods. */
      const id = A.saveCustomFood({ ...res.food, gtin: gtin14 });
      open(id, qr, false);
      return;
    }
    busyRef.current = false;
    setBusy(false);
    setResult(res.status === 'not_found' ? { status: 'not_found', gtin14, qr, from } : { status: 'offline', gtin14, qr, from, message: res.message });
  }

  /* The camera reports the same code many times a second: ignore it while a
     lookup runs, and say why a code can't be used only once. */
  function onScan(data: string) {
    if (busyRef.current || result) return;
    const scan = M.parseScan(data) as Scan;
    if (!scan.ok) {
      const now = Date.now();
      if (lastBad.current && lastBad.current.data === data && now - lastBad.current.at < 4000) return;
      lastBad.current = { data, at: now };
      setNotice(scan.error);
      return;
    }
    lookUp(scan.gtin14, isQrKind(scan.kind), 'camera');
  }

  const parsed = M.parseScan(typed) as Scan;
  function submitTyped() {
    setTried(true);
    if (!parsed.ok) return;
    lookUp(parsed.gtin14, isQrKind(parsed.kind), 'typed');
  }
  function again(from: View) {
    setResult(null);
    setNotice(null);
    lastBad.current = null;
    if (from === 'typed') { setTyped(''); setTried(false); }
    setView(from);
  }
  const barcodeLine = (r: Result) => (r.qr ? `Barcode ${showGtin(r.gtin14)}, read from the QR code` : `Barcode ${showGtin(r.gtin14)}`);
  const close = <LinkButton label="Close" onPress={goBack} />;

  if (result && result.status === 'not_found') {
    return (
      <Screen left={close}>
        <EmptyAnswer icon="magnifyingglass" title="We couldn't find this product"
          body="It isn't in Open Food Facts yet. Add it from its label and we'll keep it in your foods, so the next scan finds it.">
          <Button label="Add it from its label" onPress={() => router.replace(href('/food/new', { gtin: result.gtin14, meal }))} />
          <Button variant="outline" label={result.from === 'camera' ? 'Scan again' : 'Type another barcode'} onPress={() => again(result.from)} />
          <Button variant="ghost" label="Search foods instead" onPress={() => router.replace(href('/food/search', { meal }))} />
          <T size="caption" color="inkMuted48" align="center" tabular>{barcodeLine(result)}</T>
        </EmptyAnswer>
      </Screen>
    );
  }
  if (result && result.status === 'offline') {
    return (
      <Screen left={close}>
        <EmptyAnswer icon="exclamationmark.triangle" title="We couldn't look this up" body={OFFLINE}>
          <Button label="Try again" loading={busy} onPress={() => lookUp(result.gtin14, result.qr, result.from)} />
          <Button variant="outline" label={result.from === 'camera' ? 'Scan again' : 'Type another barcode'} onPress={() => again(result.from)} />
          <T size="caption" color="inkMuted48" align="center" tabular>{barcodeLine(result)}</T>
          {result.message !== OFFLINE ? <Caption>{result.message}</Caption> : null}
        </EmptyAnswer>
      </Screen>
    );
  }

  if (view === 'camera') {
    return <CameraScanner busy={busy} notice={notice} onScan={onScan} onType={() => setView('typed')} onClose={goBack} />;
  }

  return (
    <FormPage title="Type the barcode" subtitle="Usually the 13 digits under the bars."
      topLeft={CAMERA_AVAILABLE
        ? <LinkButton label="Cancel" onPress={() => { setTried(false); setView('camera'); }} />
        : close}
      footer={<Button label="Look up barcode" loading={busy} onPress={submitTyped} />}>
      <Input label="Barcode" keyboardType="number-pad" autoComplete="off" autoCorrect={false} placeholder="13 digits" autoFocus
        value={typed} onChangeText={setTyped} returnKeyType="search" onSubmitEditing={submitTyped}
        error={tried && !parsed.ok ? parsed.error : null} />
      <Caption>
        {CAMERA_AVAILABLE
          ? "Newer packs may have a QR code instead (GS1 Digital Link). It holds the same number, and the camera reads it too."
          : 'Scanning with the camera works on iPhone. It reads the barcode, or the QR code on newer packs (GS1 Digital Link), which holds the same number.'}
      </Caption>
    </FormPage>
  );
}
