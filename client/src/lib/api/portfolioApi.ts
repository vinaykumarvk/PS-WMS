import type {
  PortfolioAdviceItem,
  PortfolioScenarioRequest,
  PortfolioScenarioResponse,
} from '@shared/types/portfolio.types';
import type { APIResponse } from '@shared/types/api.types';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export const portfolioApi = {
  async getAdvice(clientId: number): Promise<APIResponse<PortfolioAdviceItem[]>> {
    const response = await fetch(`/api/portfolio/advice?clientId=${clientId}`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },

  async runScenario(payload: PortfolioScenarioRequest): Promise<APIResponse<PortfolioScenarioResponse>> {
    const response = await fetch('/api/portfolio/scenario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    return handleResponse(response);
  },
};
