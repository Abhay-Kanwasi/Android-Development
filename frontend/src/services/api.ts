const BASE_URL = 'http://10.0.2.2:8000/api';

interface ApiResponse<T> {
  data: T;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
}

export const apiCall = async <T>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> => {
  try {
    const config: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (options.data) {
      config.body = JSON.stringify(options.data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};
