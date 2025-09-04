import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InfoItem {
  text: string;
}

interface InfoSectionProps {
  title: string;
  items: InfoItem[] | string[];
}

const InfoSection: React.FC<InfoSectionProps> = ({ title, items }) => {
  return (
    <View style={styles.infoContainer}>
      <Text style={styles.infoTitle}>{title}</Text>
      {items.map((item, index) => (
        <Text key={index} style={styles.infoText}>
          • {typeof item === 'string' ? item : item.text}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    backgroundColor: '#ecf0f1',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#34495e',
    lineHeight: 20,
  },
});

export default InfoSection;