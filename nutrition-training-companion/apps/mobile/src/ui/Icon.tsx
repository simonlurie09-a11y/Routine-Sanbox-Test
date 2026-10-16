import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, type ColorToken } from '@/theme';
import { ICON_PATHS } from './icons';

/* One icon component: SF Symbols on iOS; the system's line stand-ins elsewhere. */
export function Icon({ name, size = 20, color = 'ink' }: { name: string; size?: number; color?: ColorToken }) {
  const tint = colors[color];
  if (Platform.OS === 'ios') {
    return <SymbolView name={name as SFSymbol} size={size} tintColor={tint} weight="regular" resizeMode="scaleAspectFit" />;
  }
  const paths = ICON_PATHS[name] || ICON_PATHS['info.circle'];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={tint} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <Path key={i} d={d} />)}
    </Svg>
  );
}
