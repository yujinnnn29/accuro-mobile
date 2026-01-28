import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Camera, Package } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../../theme';
import { Product, ProductStatus } from '../../types';
import { productService, CreateProductData } from '../../api/productService';
import { Button, Badge } from '../common';

interface ProductFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
}

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const CATEGORY_OPTIONS = [
  'Calibrators',
  'Controllers',
  'Software',
  'Accessories',
  'Services',
  'Other',
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  visible,
  onClose,
  onSuccess,
  product,
}) => {
  const isEdit = !!product;

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    category: '',
    image: '',
    priceRange: '',
    status: 'inactive',
    stockQuantity: 0,
    lowStockThreshold: 5,
    trackInventory: true,
    features: [],
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        image: product.image || '',
        priceRange: product.priceRange || '',
        status: product.status,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        trackInventory: product.trackInventory,
        features: product.features || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        image: '',
        priceRange: '',
        status: 'inactive',
        stockQuantity: 0,
        lowStockThreshold: 5,
        trackInventory: true,
        features: [],
      });
    }
  }, [product, visible]);

  const handleImagePick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.uri && asset.fileName && asset.type) {
          setImageUploading(true);
          try {
            const uploadResult = await productService.uploadImage(
              asset.uri,
              asset.fileName,
              asset.type
            );
            setFormData({ ...formData, image: uploadResult.data.url });
          } catch (error) {
            Alert.alert('Error', 'Failed to upload image');
          } finally {
            setImageUploading(false);
          }
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    if (!formData.category.trim()) {
      Alert.alert('Error', 'Category is required');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && product) {
        await productService.updateProduct(product._id, formData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await productService.createProduct(formData);
        Alert.alert('Success', 'Product created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Edit Product' : 'Add Product'}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Upload */}
          <View style={styles.section}>
            <Text style={styles.label}>Product Image</Text>
            <TouchableOpacity
              style={styles.imageUpload}
              onPress={handleImagePick}
              disabled={imageUploading}
            >
              {formData.image ? (
                <Image source={{ uri: formData.image }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Camera size={32} color={colors.gray[400]} />
                  <Text style={styles.uploadText}>
                    {imageUploading ? 'Uploading...' : 'Tap to upload'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter product name"
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryOptions}>
                {CATEGORY_OPTIONS.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      formData.category === cat && styles.categoryChipSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        formData.category === cat && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter product description"
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.label}>Price Range</Text>
            <TextInput
              style={styles.input}
              value={formData.priceRange}
              onChangeText={(text) => setFormData({ ...formData, priceRange: text })}
              placeholder="e.g., $500 - $1000"
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusOptions}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusChip,
                    formData.status === option.value && styles.statusChipSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, status: option.value })}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      formData.status === option.value && styles.statusChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Inventory */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Track Inventory</Text>
              <Switch
                value={formData.trackInventory}
                onValueChange={(value) => setFormData({ ...formData, trackInventory: value })}
                trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
                thumbColor={formData.trackInventory ? colors.primary[600] : colors.gray[100]}
              />
            </View>
          </View>

          {formData.trackInventory && (
            <>
              <View style={styles.section}>
                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={String(formData.stockQuantity || 0)}
                  onChangeText={(text) =>
                    setFormData({ ...formData, stockQuantity: parseInt(text) || 0 })
                  }
                  placeholder="0"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Low Stock Threshold</Text>
                <TextInput
                  style={styles.input}
                  value={String(formData.lowStockThreshold || 5)}
                  onChangeText={(text) =>
                    setFormData({ ...formData, lowStockThreshold: parseInt(text) || 5 })
                  }
                  placeholder="5"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={onClose}
            style={styles.footerButton}
          />
          <Button
            title={isEdit ? 'Update Product' : 'Create Product'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.footerButton}
          />
        </View>
      </KeyboardAvoidingView>
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
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  imageUpload: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
  },
  uploadText: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
  },
  categoryOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  categoryChipSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  categoryChipTextSelected: {
    color: colors.white,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  statusChipSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  statusChipTextSelected: {
    color: colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomPadding: {
    height: 24,
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

export default ProductFormModal;
