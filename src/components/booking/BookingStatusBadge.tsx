import React from 'react';
import { Badge } from '../common';
import { BookingStatus } from '../../types';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'warning' as const };
      case 'confirmed':
        return { label: 'Confirmed', variant: 'info' as const };
      case 'completed':
        return { label: 'Completed', variant: 'success' as const };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'error' as const };
      case 'in_progress':
        return { label: 'In Progress', variant: 'info' as const };
      case 'rescheduled':
        return { label: 'Rescheduled', variant: 'secondary' as const };
      case 'pending_review':
        return { label: 'Pending Review', variant: 'warning' as const };
      case 'rejected':
        return { label: 'Rejected', variant: 'error' as const };
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

export default BookingStatusBadge;
