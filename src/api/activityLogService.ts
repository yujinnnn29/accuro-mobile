import api from './api';

export interface ActivityLog {
  _id: string;
  user: string;
  action: string;
  resourceType: 'user' | 'booking' | 'review' | 'auth' | 'quote' | 'purchase' | 'system';
  resourceId?: string;
  details?: string;
  createdAt: string;
}

export interface ActivityLogsResponse {
  success: boolean;
  count: number;
  data: ActivityLog[];
}

// Normalize various backend response shapes into a consistent format
function normalizeActivityLogs(raw: any): ActivityLogsResponse {
  if (!raw || typeof raw !== 'object') {
    return { success: false, count: 0, data: [] };
  }
  // Handle { success, data: [...] } or { success, activityLogs: [...] } or { success, logs: [...] }
  const logs: ActivityLog[] =
    Array.isArray(raw.data) ? raw.data :
    Array.isArray(raw.activityLogs) ? raw.activityLogs :
    Array.isArray(raw.logs) ? raw.logs :
    Array.isArray(raw) ? raw :
    [];
  return {
    success: raw.success ?? true,
    count: raw.count ?? logs.length,
    data: logs,
  };
}

const activityLogService = {
  getMyActivityLogs: async (): Promise<ActivityLogsResponse> => {
    const response = await api.get('/activity-logs/my');
    return normalizeActivityLogs(response.data);
  },

  logActivity: async (data: {
    action: string;
    resourceType: ActivityLog['resourceType'];
    resourceId?: string;
    details?: string;
  }): Promise<void> => {
    try {
      await api.post('/activity-logs', data);
    } catch {
      // Fire-and-forget — don't let logging failures block the user
    }
  },
};

export { activityLogService };
export default activityLogService;
