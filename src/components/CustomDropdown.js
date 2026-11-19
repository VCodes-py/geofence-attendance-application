import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Menu, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CustomDropdown = ({ label, options, selectedValue, onSelect, placeholder, labelField = 'name', valueField = '_id' }) => {
    const [visible, setVisible] = useState(false);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    const handleSelect = (item) => {
        onSelect(item);
        closeMenu();
    };

    // Support for string options or object options
    const getDisplayValue = (item) => {
        if (!item) return placeholder;
        if (typeof item === 'string') return item;
        return item[labelField] || placeholder;
    };

    const getKeyValue = (item, index) => {
        if (typeof item === 'string') return item;
        return item[valueField] || index.toString();
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Menu
                visible={visible}
                onDismiss={closeMenu}
                style={styles.menuContainer}
                contentStyle={styles.menuContent}
                anchor={
                    <TouchableOpacity style={styles.dropdownAnchor} onPress={openMenu} activeOpacity={0.7}>
                        <Text style={[styles.anchorText, !selectedValue && styles.placeholderText]} numberOfLines={1}>
                            {getDisplayValue(selectedValue)}
                        </Text>
                        <MaterialCommunityIcons name={visible ? "chevron-up" : "chevron-down"} size={22} color="#64748B" />
                    </TouchableOpacity>
                }
            >
                {options.map((option, index) => (
                    <Menu.Item
                        key={getKeyValue(option, index)}
                        onPress={() => handleSelect(option)}
                        title={getDisplayValue(option)}
                        titleStyle={styles.menuItemText}
                        style={selectedValue && getKeyValue(selectedValue) === getKeyValue(option, index) ? styles.selectedMenuItem : null}
                    />
                ))}
                {(!options || options.length === 0) && (
                    <Menu.Item title="No options available" disabled titleStyle={styles.placeholderText} />
                )}
            </Menu>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%'
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 6,
    },
    dropdownAnchor: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FCFCFD',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    anchorText: {
        fontSize: 16,
        color: '#334155',
        flex: 1,
        marginRight: 8,
    },
    placeholderText: {
        color: '#94A3B8',
    },
    menuContainer: {
        marginTop: 56, // Push menu down completely below the anchor
        borderRadius: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    menuContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 4,
    },
    menuItemText: {
        fontSize: 15,
        color: '#1E293B',
    },
    selectedMenuItem: {
        backgroundColor: '#F0F9FF',
    }
});

export default CustomDropdown;
