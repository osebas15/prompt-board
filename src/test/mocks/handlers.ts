import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth handlers
  http.post('/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
      },
    });
  }),

  // Prompts handlers
  http.get('/rest/v1/prompts', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Prompt',
        content: 'Test content',
        user_id: '123',
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Error handler for testing
  http.get('/rest/v1/error', () => {
    return new HttpResponse(null, { status: 500 });
  }),
];
