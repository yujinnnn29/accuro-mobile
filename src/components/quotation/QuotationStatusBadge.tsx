import React from 'react';
import { Badge } from '../common';

type QuotationStatus = 'pending' | 'quoted' | 'approved' | 'accepted' | 'declined' | 'rejected' | 'expired';

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
      case 'quoted':
        return { label: 'Quote Sent', variant: 'info' as const };
      case 'approved':
      case 'accepted':
        return { label: status === 'accepted' ? 'Accepted' : 'Approved', variant: 'success' as const };
      case 'declined':
        return { label: 'Declined', variant: 'error' as const };
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
