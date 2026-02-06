import { StyleSheet, Text, View } from 'react-native';

export function NoContent() {
  return (
    <View style={styles.noContentContainer}>
      <Text style={styles.noContentText}>No Content Assigned</Text>
      <Text style={styles.noContentSubtext}>Please assign a playlist in the dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  noContentText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noContentSubtext: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
  },
});
