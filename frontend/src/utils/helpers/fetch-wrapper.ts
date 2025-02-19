import { auth } from '@/firebase';

export const fetchWrapper = {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE')
};

function request(method: string) {
    return async (url: string, body?: any) => {
        const requestOptions: RequestInit = {
            method,
            headers: await authHeader(url)
        };
        if (body) {
            requestOptions.headers = {
                ...requestOptions.headers,
                'Content-Type': 'application/json'
            };
            requestOptions.body = JSON.stringify(body);
        }
        return fetch(url, requestOptions).then(handleResponse);
    };
}

async function authHeader(url: string): Promise<HeadersInit> {
    const isLoggedIn = auth.currentUser;
    const isApiUrl = url.startsWith(import.meta.env.VITE_API_URL);
    
    if (isLoggedIn && isApiUrl) {
        const token = await auth.currentUser?.getIdToken();
        return { Authorization: `Bearer ${token}` };
    }
    return {};
}

async function handleResponse(response: Response) {
    const text = await response.text();
    const data = text && JSON.parse(text);

    if (!response.ok) {
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
    }

    return data;
}