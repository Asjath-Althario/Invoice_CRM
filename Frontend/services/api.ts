// Set API base to go through Apache proxy to avoid CORS issues
const API_BASE_URL = 'http://localhost:54112/api';
class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async register(name: string, email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  // Contacts
  async getContacts() {
    return this.request('/contacts');
  }

  async createContact(contact: any) {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  async updateContact(id: string, contact: any) {
    return this.request(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    });
  }

  async deleteContact(id: string) {
    return this.request(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Invoices
  async getInvoices() {
    return this.request('/invoices');
  }

  async getInvoiceById(id: string) {
    return this.request(`/invoices/${id}`);
  }

  async createInvoice(invoice: any) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  }

  async updateInvoice(id: string, invoice: any) {
    return this.request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoice),
    });
  }

  async deleteInvoice(id: string) {
    return this.request(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  // Purchases
  async getPurchases() {
    return this.request('/purchases');
  }

  async getPurchaseById(id: string) {
    return this.request(`/purchases/${id}`);
  }

  async createPurchase(purchase: any) {
    return this.request('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchase),
    });
  }

  async updatePurchase(id: string, purchase: any) {
    return this.request(`/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(purchase),
    });
  }

  async deletePurchase(id: string) {
    return this.request(`/purchases/${id}`, {
      method: 'DELETE',
    });
  }

  // Products & Services
  async getProductsServices() {
    return this.request('/products-services');
  }

  async createProduct(product: any) {
    return this.request('/products-services', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: any) {
    return this.request(`/products-services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products-services/${id}`, {
      method: 'DELETE',
    });
  }

  // Bank Accounts
  async getBankAccounts() {
    return this.request('/bank-accounts');
  }

  async createBankAccount(account: any) {
    console.log('Sending bank account data:', account); // Debug log
    return this.request('/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }

  async updateBankAccount(id: string, account: any) {
    return this.request(`/bank-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(account),
    });
  }

  async deleteBankAccount(id: string) {
    return this.request(`/bank-accounts/${id}`, {
      method: 'DELETE',
    });
  }

  async getBankTransactions(accountId: string) {
    return this.request(`/bank-accounts/${accountId}/transactions`);
  }

  async addBankTransaction(accountId: string, transaction: any) {
    return this.request(`/bank-accounts/${accountId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Petty Cash
  async getPettyCashTransactions() {
    return this.request('/petty-cash');
  }

  async createPettyCashTransaction(transaction: any) {
    return this.request('/petty-cash', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async updatePettyCashTransaction(id: string, transaction: any) {
    return this.request(`/petty-cash/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  }

  async deletePettyCashTransaction(id: string) {
    return this.request(`/petty-cash/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings
  async getCompanyProfile() {
    return this.request('/company-profile');
  }

  async updateCompanyProfile(profile: any) {
    return this.request('/company-profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async getUsers() {
    return this.request('/users');
  }

  async getPreferences() {
    return this.request('/preferences');
  }

  async updatePreferences(prefs: any) {
    return this.request('/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    });
  }

  // AI Services
  async extractPurchaseDetails(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/ai/extract-purchase-details`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to extract purchase details');
    }

    return response.json();
  }

  async chat(message: string, history: any[] = []) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  }

  // File Upload
  async uploadPurchaseReceipt(purchaseId: string, formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/purchase-uploads/${purchaseId}/upload-receipt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return response.json();
  }
}

export const apiService = new ApiService();