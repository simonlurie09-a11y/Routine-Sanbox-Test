/* Apple Health (the prototype's device page, for the one source v1 reads):
   status, what it reads, last sync, connect or stop reading. It's also the
   "Apple Health" setup item, so connecting or Done marks it done. Connecting
   here fills in only what the profile is missing (features/settings/health). */
import { useState } from 'react';

import { applyHealthProfile } from '@/features/settings/health';
import { longDate, whenText } from '@/features/shared';
import { HEALTH_READS } from '@/features/signup/fields';
import { connectAppleHealth, disconnectAppleHealth, healthIsSimulated, healthSettingsHint } from '@/services/healthSync';
import { domain as M } from '@/shared';
import { A, useApp } from '@/store';
import { Badge, Button, Callout, Caption, Card, FormPage, goBack, overlay, Rows, Section, Stack } from '@/ui';

export default function AppleHealth() {
  const dev = useApp((s) => s.devices.apple_health);
  const setupDone = useApp((s) => s.setup.devices !== false);
  const [busy, setBusy] = useState(false);
  /* A "pending" left behind (the app closed while Apple's sheet was up) counts as not connected. */
  const status = busy ? 'pending' : dev.status === 'pending' ? 'revoked' : dev.status;
  const active = status === 'active';
  const subtitle = active && dev.lastSync ? `Last synced ${whenText(dev.lastSync)}` : active ? 'Connected' : busy ? 'Connecting…' : 'Not connected';

  const connect = async () => {
    setBusy(true);
    const res = await connectAppleHealth();
    setBusy(false);
    if (!res.ok) {
      overlay.toast("Apple Health didn't connect. Try again in a moment.", 'error');
      return;
    }
    const { minor, filled } = applyHealthProfile(res.profile);
    if (minor) {
      overlay.alert({
        title: "Apple Health says you're under 18",
        message: "Companion is for adults, 18 and over, so we've stopped reading Apple Health and haven't kept anything from it."
      });
      return;
    }
    A.completeSetup('devices');
    overlay.toast(filled.length ? `Apple Health connected. We filled in your ${M.listJoin(filled)}.` : 'Apple Health connected', 'success');
  };
  const done = () => {
    A.completeSetup('devices');
    goBack();
  };
  const stop = () => overlay.alert({
    title: 'Stop reading Apple Health?',
    message: "Readiness will have no sleep, HRV or resting heart rate to work with. Your data in the Health app isn't touched. To remove access completely, turn it off in the Health app as well.",
    buttons: [
      { label: 'Cancel', style: 'cancel' },
      { label: 'Stop reading', style: 'destructive', onPress: () => { disconnectAppleHealth(); overlay.toast('Stopped reading Apple Health'); } }
    ]
  });

  return (
    <FormPage title="Apple Health" subtitle={subtitle}
      footer={active
        ? <Button label="Done" onPress={done} />
        : (
          <>
            <Button label="Connect Apple Health" onPress={connect} loading={busy} />
            <Button variant="ghost" label={setupDone ? 'Done' : 'Not now'} onPress={done} />
          </>
        )}>
      <Card>
        <Badge palette="connection" status={status} />
        <Callout>{active
          ? `Connected since ${longDate(dev.connectedAt || dev.lastSync || Date.now())}. Sleep, HRV and resting heart rate are compared with your own baseline to estimate readiness.`
          : "Connect Apple Health to compare your sleep, HRV and resting heart rate with your own baseline. It also fills in your date of birth, height and sex where you haven't given them."}</Callout>
      </Card>
      <Section title={active ? 'What Companion reads' : 'What Companion will read'}>
        <Rows rows={HEALTH_READS.map((r) => ({ key: r.key, icon: r.icon, iconColor: 'ink' as const, label: r.label, detail: r.detail }))} />
      </Section>
      <Stack gap="sm">
        <Caption>Companion only reads from Health and never writes to it. It doesn't keep your sleep, HRV or resting heart rate: it reads them again each time it opens, and nothing is uploaded. iPhone doesn't tell apps what you've chosen not to share, so anything turned off shows as no data.</Caption>
        <Caption>{healthIsSimulated ? 'In this web preview, Apple Health is simulated with sample data.' : healthSettingsHint}</Caption>
      </Stack>
      {active ? <Button variant="danger" label="Stop reading Apple Health" onPress={stop} /> : null}
    </FormPage>
  );
}
