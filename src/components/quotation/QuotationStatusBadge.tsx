import React from 'react';
import { Badge } from '../common';

type QuotationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface QuotationStatusBadgeProps {
  status: QuotationStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const QuotationStatusBadge: React.FC<QuotationStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'warning' as const };
      case 'approved':
        return { label: 'Approved', variant: 'success' as const };
      case 'rejected':
        return { label: 'Rejected', variant: 'error' as const };
      case 'expired':
        return { label: 'Expired', variant: 'gray' as const };
      default:
        return { label: status, variant: 'gray' as const };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      label={config.label}
      variant={config.variant}
      size={size}
      dot
    />
  );
};

export default QuotationStatusBadge;
