/* Apple Health (the prototype's device page, for the one source v1 reads):
   status, what it reads, last sync, connect or stop reading. It's also the
   "Apple Health" setup item, so connecting or Done marks it done. */
import { useState } from 'react';

import { longDate, whenText } from '@/features/shared';
import { HEALTH_READS } from '@/features/signup/fields';
import { connectAppleHealth, disconnectAppleHealth, healthIsSimulated, healthSettingsHint } from '@/services/healthSync';
import { A, useApp } from '@/store';
import { Badge, Button, Callout, Caption, Card, FormPage, goBack, overlay, Rows, Section, Stack } from '@/ui';

export default function AppleHealth() {
  const dev = useApp((s) => s.devices.apple_health);
  const setupDone = useApp((s) => s.setup.devices !== false);
  const [busy, setBusy] = useState(false);
  const active = dev.status === 'active';
  const pending = dev.status === 'pending' || busy;
  const subtitle = active && dev.lastSync ? `Last synced ${whenText(dev.lastSync)}` : active ? 'Connected' : pending ? 'Connecting…' : 'Not connected';

  const connect = async () => {
    setBusy(true);
    const res = await connectAppleHealth();
    setBusy(false);
    if (!res.ok) {
      overlay.toast("Apple Health didn't connect. Try again in a moment.", 'error');
      return;
    }
    A.completeSetup('devices');
    overlay.toast('Apple Health connected', 'success');
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
            <Button label="Connect Apple Health" onPress={connect} loading={pending} />
            <Button variant="ghost" label={setupDone ? 'Done' : 'Not now'} onPress={done} />
          </>
        )}>
      <Card>
        <Badge palette="connection" status={busy ? 'pending' : dev.status} />
        <Callout>{active
          ? `Connected since ${longDate(dev.connectedAt || dev.lastSync || Date.now())}. Sleep, HRV and resting heart rate are compared with your own baseline to estimate readiness.`
          : 'Connect Apple Health to compare your sleep, HRV and resting heart rate with your own baseline, and to fill in your age, height and weight.'}</Callout>
      </Card>
      <Section title={active ? 'What Companion reads' : 'What Companion will read'}>
        <Rows rows={HEALTH_READS.map((r) => ({ key: r.key, icon: r.icon, iconColor: 'ink' as const, label: r.label, detail: r.detail }))} />
      </Section>
      <Stack gap="sm">
        <Caption>Companion only reads from Health and never writes to it. It doesn't keep your sleep, HRV or resting heart rate: it reads them again each time it opens, and nothing is uploaded. iPhone doesn't tell apps what you've chosen not to share, so anything turned off shows as no data.</Caption>
        <Caption>{healthSettingsHint}</Caption>
        {healthIsSimulated ? <Caption>In this web preview, Apple Health is simulated with sample data.</Caption> : null}
      </Stack>
      {active ? <Button variant="danger" label="Stop reading Apple Health" onPress={stop} /> : null}
    </FormPage>
  );
}
