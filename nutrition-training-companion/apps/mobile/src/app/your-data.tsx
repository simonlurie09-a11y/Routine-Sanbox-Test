/* Your data (prototype YourData): everything is on this iPhone, so export
   is a JSON file through the share sheet, and deleting is immediate. */
import { router } from 'expo-router';
import { useState } from 'react';

import { shareExport } from '@/services/exportData';
import { A } from '@/store';
import { Button, Callout, Caption, overlay, Screen, Section } from '@/ui';

export default function YourData() {
  const [exporting, setExporting] = useState(false);
  const doExport = async () => {
    setExporting(true);
    try {
      const res = await shareExport();
      if (res === 'unavailable') overlay.toast("Sharing isn't available here, so we couldn't export your data.", 'error');
    } catch {
      overlay.toast("We couldn't make the export. Try again in a moment.", 'error');
    } finally {
      setExporting(false);
    }
  };
  const erase = () => {
    A.eraseAll();
    if (router.canDismiss()) router.dismissAll();
    router.replace('/sign-up');
    overlay.toast('All your data was deleted');
  };
  const askDelete = () => overlay.alert({
    title: 'Delete all your data?',
    message: "Everything you've logged and set up in Companion is deleted from this iPhone, and you'll start again from sign-up. This can't be undone. Your data in Apple Health isn't touched.",
    buttons: [
      { label: 'Cancel', style: 'cancel' },
      { label: 'Delete everything', style: 'destructive', onPress: erase }
    ]
  });
  return (
    <Screen title="Your data" subtitle="Take a copy, or delete everything.">
      <Section title="Export your data">
        <Callout>We put everything Companion holds in one JSON file: your profile, food log, your own foods, training, targets and every suggestion with its studies. It includes the disclaimer you agreed to.</Callout>
        <Button label="Export your data" icon="square.and.arrow.up" loading={exporting} onPress={doExport} />
        <Caption>You choose where it goes: Files, AirDrop or Mail. Data read from Apple Health isn't in it, because Companion doesn't keep it; it stays in the Health app.</Caption>
      </Section>
      <Section title="Delete everything">
        <Callout>Companion has no account and no server, so your data is only on this iPhone. Deleting it removes everything at once and takes you back to sign-up. Deleting the app does the same.</Callout>
        <Button variant="danger" icon="trash" label="Delete everything" onPress={askDelete} />
      </Section>
    </Screen>
  );
}
