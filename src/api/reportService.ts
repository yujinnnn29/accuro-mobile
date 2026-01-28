import api from './api';
import {
  ReportType,
  DateRange,
  ReportFilters,
  ReportResponse,
  ReportListResponse,
  GenerateReportRequest,
} from '../types';

class ReportService {
  // Generate a new report
  async generateReport(
    type: ReportType,
    dateRange: DateRange,
    filters?: Partial<ReportFilters>
  ): Promise<ReportResponse> {
    const requestData: GenerateReportRequest = {
      type,
      dateRange,
      filters,
    };
    const response = await api.post<ReportResponse>('/reports/generate', requestData);
    return response.data;
  }

  // Get a specific report by ID
  async getReport(reportId: string): Promise<ReportResponse> {
    const response = await api.get<ReportResponse>(`/reports/${reportId}`);
    return response.data;
  }

  // List all generated reports
  async listReports(params?: { type?: ReportType; limit?: number }): Promise<ReportListResponse> {
    const response = await api.get<ReportListResponse>('/reports', { params });
    return response.data;
  }

  // Export report as PDF (returns blob URL or base64)
  async exportReportPDF(reportId: string): Promise<{ success: boolean; data: { url: string } }> {
    const response = await api.get<{ success: boolean; data: { url: string } }>(
      `/reports/${reportId}/export-pdf`
    );
    return response.data;
  }

  // Delete a report
  async deleteReport(reportId: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/reports/${reportId}`);
    return response.data;
  }

  // Quick report generation methods for common report types
  async generateBookingsReport(dateRange: DateRange, status?: string): Promise<ReportResponse> {
    return this.generateReport('bookings', dateRange, { status } as any);
  }

  async generateUsersReport(dateRange: DateRange, role?: string): Promise<ReportResponse> {
    return this.generateReport('users', dateRange, { role } as any);
  }

  async generateQuotesReport(dateRange: DateRange, status?: string): Promise<ReportResponse> {
    return this.generateReport('quotes', dateRange, { status } as any);
  }

  async generateContactsReport(dateRange: DateRange): Promise<ReportResponse> {
    return this.generateReport('contacts', dateRange);
  }

  async generateActivityReport(dateRange: DateRange): Promise<ReportResponse> {
    return this.generateReport('activity', dateRange);
  }

  async generateProductsReport(dateRange: DateRange, category?: string): Promise<ReportResponse> {
    return this.generateReport('products', dateRange, { category } as any);
  }

  async generateReviewsReport(dateRange: DateRange): Promise<ReportResponse> {
    return this.generateReport('reviews', dateRange);
  }
}

export const reportService = new ReportService();
export default reportService;
