import api from './api';

export interface ContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  subject: string;
  message: string;
}

export interface Contact extends ContactData {
  _id: string;
  status: 'new' | 'read' | 'responded';
  createdAt: string;
  updatedAt: string;
}

export interface ContactResponse {
  success: boolean;
  data: Contact;
}

export interface ContactsResponse {
  success: boolean;
  count: number;
  data: Contact[];
}

class ContactService {
  async submitContact(data: ContactData): Promise<ContactResponse> {
    const response = await api.post<ContactResponse>('/contacts', data);
    return response.data;
  }

  async getAllContacts(params?: { status?: string }): Promise<ContactsResponse> {
    const response = await api.get<ContactsResponse>('/contacts', { params });
    return response.data;
  }

  async getContact(id: string): Promise<ContactResponse> {
    const response = await api.get<ContactResponse>(`/contacts/${id}`);
    return response.data;
  }

  async updateContactStatus(id: string, status: 'new' | 'read' | 'responded'): Promise<ContactResponse> {
    const response = await api.put<ContactResponse>(`/contacts/${id}`, { status });
    return response.data;
  }

  async deleteContact(id: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/contacts/${id}`);
    return response.data;
  }
}

export const contactService = new ContactService();
export default contactService;
