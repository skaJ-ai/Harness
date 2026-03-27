import { type ClassValue, clsx } from 'clsx';

/**
 * Utility: className 병합
 * Tailwind CSS 클래스 결합에 사용
 */
function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Result pattern: 모든 async 작업의 반환 타입
 * 에러 핸들링을 일관되게 강제한다.
 */
type Result<T> = { data: T; success: true } | { error: string; success: false };

/**
 * Type-safe fetch wrapper
 */
async function safeFetch<T>(url: string, options?: RequestInit): Promise<Result<T>> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();

      if (errorText.trim().length > 0) {
        try {
          const errorBody = JSON.parse(errorText) as { message?: string };

          if (typeof errorBody.message === 'string' && errorBody.message.trim().length > 0) {
            return { success: false, error: errorBody.message };
          }
        } catch {
          return { success: false, error: errorText };
        }
      }

      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = (await response.json()) as T;
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export { cn, safeFetch };
export type { Result };
