import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface Props {
  emoji: string;
  onPress: () => void;
}

export function HeaderButton({ emoji, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.emoji}>{emoji}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emoji: {
    fontSize: 20,
  },
});
