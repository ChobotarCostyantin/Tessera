import ky from 'ky';

const OWNER_TOKEN_KEY = 'tessera:owner-token';

export function getOwnerToken(): string {
    if (typeof window === 'undefined') return '';

    let token = localStorage.getItem(OWNER_TOKEN_KEY);
    if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem(OWNER_TOKEN_KEY, token);
    }
    return token;
}

export const api = ky.create({
    prefix: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010/api/v1',
    timeout: 15_000,
    retry: { limit: 1 },
    hooks: {
        beforeRequest: [
            ({ request }) => {
                const token = getOwnerToken();
                if (token) request.headers.set('x-owner-token', token);
            },
        ],
    },
});
