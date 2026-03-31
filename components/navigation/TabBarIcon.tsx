import { Ionicons } from '@expo/vector-icons';
import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { type ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface TabBarIconProps extends Omit<IconProps<IoniconsName>, 'name'> {
  name: IoniconsName;
}

export function TabBarIcon({ style, ...rest }: TabBarIconProps) {
  return <Ionicons size={24} style={[{ marginBottom: -3 }, style]} {...rest} />;
}
