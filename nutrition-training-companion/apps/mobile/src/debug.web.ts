/* Web only: lets scripts/web-smoke.mjs and the screenshot script set state
   and navigate. Never part of the iOS app (Metro picks debug.ts there). */
import { router } from 'expo-router';

import { data, domain } from '@/shared';
import { A, freshState, getState, useApp } from '@/store';

(globalThis as unknown as { __companion: unknown }).__companion = { A, getState, useApp, freshState, router, data, domain };
