import { Client } from "@shared/schema";
import type {
  ClientAttentionReason,
  ClientDraftRequest,
  ClientDraftResponse,
  SemanticSearchResult,
} from "@shared/types/insights";

/**
 * Client API service
 * This service provides methods to interact with client data through APIs.
 * It can be easily replaced with another implementation for different banks
 * without changing the consuming components.
 */
export type ClientListItem = Client & {
  churnScore?: number;
  upsellScore?: number;
  attentionReasons?: ClientAttentionReason[];
};

export interface ClientApiService {
  getClients(): Promise<ClientListItem[]>;
  getClient(id: number): Promise<Client | undefined>;
  getRecentClients(limit: number): Promise<Client[]>;
  createClient(clientData: Omit<Client, "id" | "createdAt">): Promise<Client>;
  updateClient(id: number, clientData: Partial<Omit<Client, "id" | "createdAt">>): Promise<Client>;
  deleteClient(id: number): Promise<boolean>;
  semanticSearch(query: string): Promise<SemanticSearchResult[]>;
  generateDraft(clientId: number, payload: ClientDraftRequest): Promise<ClientDraftResponse>;
}

/**
 * Default implementation that uses the current API endpoints
 */
export class DefaultClientApiService implements ClientApiService {
  async getClients(): Promise<ClientListItem[]> {
    const response = await fetch('/api/clients', {
      credentials: 'include'
    });
    return response.json();
  }

  async getClient(id: number): Promise<Client | undefined> {
    const response = await fetch(`/api/clients/${id}`, {
      credentials: 'include'
    });
    return response.json();
  }

  async getRecentClients(limit: number): Promise<Client[]> {
    const response = await fetch(`/api/clients/recent?limit=${limit}`, {
      credentials: 'include'
    });
    return response.json();
  }

  async createClient(clientData: Omit<Client, "id" | "createdAt">): Promise<Client> {
    const response = await fetch('/api/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    return response.json();
  }

  async updateClient(id: number, clientData: Partial<Omit<Client, "id" | "createdAt">>): Promise<Client> {
    const response = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(clientData),
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    return response.json();
  }

  async deleteClient(id: number): Promise<boolean> {
    const response = await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return response.ok;
  }

  async semanticSearch(query: string): Promise<SemanticSearchResult[]> {
    const response = await fetch(`/api/clients/search/semantic?q=${encodeURIComponent(query)}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to perform semantic search');
    }
    return response.json();
  }

  async generateDraft(clientId: number, payload: ClientDraftRequest): Promise<ClientDraftResponse> {
    const response = await fetch(`/api/clients/${clientId}/ai-drafts`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to generate draft');
    }

    return response.json();
  }
}

// Export a singleton instance of the default implementation
// This can be replaced with a different implementation if needed
let clientApiService: ClientApiService = new DefaultClientApiService();

/**
 * Allows replacing the API service implementation
 * This is useful for switching between different bank API implementations
 * @param newImplementation The new API service implementation
 */
export function setClientApiService(newImplementation: ClientApiService) {
  clientApiService = newImplementation;
}

/**
 * Returns the current API service implementation
 */
export function getClientApiService(): ClientApiService {
  return clientApiService;
}

// Export a convenience object that forwards to the current implementation
export const clientApi = {
  getClients: () => clientApiService.getClients(),
  getClient: (id: number) => clientApiService.getClient(id),
  getRecentClients: (limit: number) => clientApiService.getRecentClients(limit),
  createClient: (clientData: Omit<Client, "id" | "createdAt">) => clientApiService.createClient(clientData),
  updateClient: (id: number, clientData: Partial<Omit<Client, "id" | "createdAt">>) => clientApiService.updateClient(id, clientData),
  deleteClient: (id: number) => clientApiService.deleteClient(id),
  semanticSearch: (query: string) => clientApiService.semanticSearch(query),
  generateDraft: (clientId: number, payload: ClientDraftRequest) => clientApiService.generateDraft(clientId, payload),
};