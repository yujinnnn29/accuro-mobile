import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { X, Minus, Plus, Package } from 'lucide-react-native';
import { colors } from '../../theme';
import { Product } from '../../types';
import { productService } from '../../api';
import { Button, Badge } from '../common';

interface StockUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
}

type UpdateMode = 'set' | 'add' | 'subtract';

export const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
  visible,
  onClose,
  onSuccess,
  product,
}) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<UpdateMode>('set');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (product && visible) {
      setMode('set');
      setQuantity(String(product.stockQuantity));
    }
  }, [product, visible]);

  const handleSubmit = async () => {
    if (!product) return;

    const numQuantity = parseInt(quantity) || 0;
    if (numQuantity < 0) {
      Alert.alert('Error', 'Quantity cannot be negative');
      return;
    }

    let newQuantity = numQuantity;
    if (mode === 'add') {
      newQuantity = product.stockQuantity + numQuantity;
    } else if (mode === 'subtract') {
      newQuantity = Math.max(0, product.stockQuantity - numQuantity);
    }

    setLoading(true);
    try {
      await productService.updateStock(product._id, newQuantity);
      Alert.alert('Success', `Stock updated to ${newQuantity}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  const getPreviewQuantity = () => {
    if (!product) return 0;
    const numQuantity = parseInt(quantity) || 0;

    switch (mode) {
      case 'add':
        return product.stockQuantity + numQuantity;
      case 'subtract':
        return Math.max(0, product.stockQuantity - numQuantity);
      default:
        return numQuantity;
    }
  };

  const isLowStock = () => {
    if (!product) return false;
    const preview = getPreviewQuantity();
    return preview <= product.lowStockThreshold;
  };

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.title}>Update Stock</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Product Info */}
          <View style={styles.productInfo}>
            <View style={styles.productIcon}>
              <Package size={24} color={colors.primary[600]} />
            </View>
            <View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.currentStock}>
                Current stock: {product.stockQuantity} units
              </Text>
            </View>
          </View>

          {/* Mode Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Update Mode</Text>
            <View style={styles.modeOptions}>
              <TouchableOpacity
                style={[styles.modeChip, mode === 'set' && styles.modeChipSelected]}
                onPress={() => setMode('set')}
              >
                <Text
                  style={[styles.modeChipText, mode === 'set' && styles.modeChipTextSelected]}
                >
                  Set to
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeChip, mode === 'add' && styles.modeChipSelected]}
                onPress={() => setMode('add')}
              >
                <Plus size={16} color={mode === 'add' ? colors.white : colors.gray[600]} />
                <Text
                  style={[styles.modeChipText, mode === 'add' && styles.modeChipTextSelected]}
                >
                  Add
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeChip, mode === 'subtract' && styles.modeChipSelected]}
                onPress={() => setMode('subtract')}
              >
                <Minus size={16} color={mode === 'subtract' ? colors.white : colors.gray[600]} />
                <Text
                  style={[styles.modeChipText, mode === 'subtract' && styles.modeChipTextSelected]}
                >
                  Subtract
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quantity Input */}
          <View style={styles.section}>
            <Text style={styles.label}>
              {mode === 'set' ? 'New Quantity' : mode === 'add' ? 'Add Amount' : 'Subtract Amount'}
            </Text>
            <View style={styles.quantityInput}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const num = parseInt(quantity) || 0;
                  if (num > 0) setQuantity(String(num - 1));
                }}
              >
                <Minus size={20} color={colors.gray[600]} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                textAlign="center"
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const num = parseInt(quantity) || 0;
                  setQuantity(String(num + 1));
                }}
              >
                <Plus size={20} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>After update:</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewValue}>{getPreviewQuantity()} units</Text>
              {isLowStock() && (
                <Badge label="Low Stock" variant="error" size="sm" />
              )}
            </View>
            <Text style={styles.thresholdText}>
              Low stock threshold: {product.lowStockThreshold}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={onClose}
            style={styles.footerButton}
          />
          <Button
            title="Update Stock"
            onPress={handleSubmit}
            loading={loading}
            style={styles.footerButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    marginBottom: 24,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  currentStock: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 12,
  },
  modeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 4,
  },
  modeChipSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  modeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  modeChipTextSelected: {
    color: colors.white,
  },
  quantityInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '600',
    color: colors.gray[900],
  },
  previewSection: {
    padding: 16,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  previewLabel: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  thresholdText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});

export default StockUpdateModal;
