import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import { renderHook, waitFor, act } from '../../test/utils/testUtils';
import { useUpdatePrompt } from '../../features/prompts/hooks/usePrompts';
import { promptService } from '../../features/prompts/services/PromptService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../features/prompts/services/PromptService', () => {
  const actual = vi.importActual('../../features/prompts/services/PromptService');
  return {
    ...actual,
    promptService: {
      ...(actual as any).promptService,
      updatePrompt: vi.fn(),
    },
  };
});

function createWrapper() {
  const queryClient = new QueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useUpdatePrompt Hook', () => {
  const updatedPrompt = {
    id: '1',
    title: 'Updated Prompt',
    content: 'Updated content',
    category: null,
    tags: [],
    is_public: false,
    user_id: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    usage_count: 0,
    version: 2,
  };

  beforeEach(() => {
    (promptService.updatePrompt as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(updatedPrompt);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should update prompt and refresh cache', async () => {
    const { result } = renderHook(() => useUpdatePrompt(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ id: '1', updates: { title: 'Updated Prompt' } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(promptService.updatePrompt).toHaveBeenCalledWith('1', { title: 'Updated Prompt' });
    expect(result.current.data?.title).toBe('Updated Prompt');
  });

  it('should handle partial updates', () => {
    // TODO: Implement partial update test
  });
  it('should show loading states during update', () => {
    // TODO: Implement loading state test
  });
  it('should handle validation errors', () => {
    // TODO: Implement validation error test
  });
  it('should implement optimistic UI updates', () => {
    // TODO: Implement optimistic update test
  });
});
