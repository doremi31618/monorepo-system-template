const BASE_URL = 'http://localhost:3333/';


// how to use the httpClient
// Example: 
//--------------------------------
// src/lib/api/todos.ts
// import { httpClient } from './httpClient';
// export async function getTodos() {
//   return httpClient.get('/todos');
// }
// export async function addTodo(text: string) {
//   return httpClient.post('/todos', { text });
// }
//--------------------------------
// implement with store 
// Example: 
// import { getTodos, addTodo } from '$lib/api/todos';
// onMount(async () => {
//     const todos = await getTodos();
//     console.log(todos);
//   });
//   await addTodo('Buy coffee');
//--------------------------------
async function request(path:string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('token')
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        throw new Error(await safeErrorMessage(res));
    }

    return res.json();
}

async function safeErrorMessage(response: Response): Promise<string> {
    try {
        const data = await response.json();
        return data.message ?? `HTTP ${response.status} error`;
    } catch (error) {
        console.error(error);
        return `HTTP ${response.status}`;
    }
}

export const httpClient = {
    get:<T>(path:string): Promise<T> => request(path, { method: 'GET' }) as Promise<T>,
    post:<T>(path:string, data: unknown): Promise<T> => request(path, { method: 'POST', body: JSON.stringify(data) }) as Promise<T>,
    put:<T>(path:string, data: unknown): Promise<T> => request(path, { method: 'PUT', body: JSON.stringify(data) }) as Promise<T>,
    delete:<T>(path:string): Promise<T> => request(path, { method: 'DELETE' }) as Promise<T>,
}
