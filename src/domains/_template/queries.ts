/**
 * Domain queries (reads)
 * 데이터를 조회하는 작업을 정의
 */

import type { Result } from '@/lib/utils';
import { safeFetch } from '@/lib/utils';

import type { TemplateEntity, TemplateFilter } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function getTemplateEntities(_filter?: TemplateFilter): Promise<Result<TemplateEntity[]>> {
  return safeFetch<TemplateEntity[]>(`${API_BASE}/api/templates`);
}

async function getTemplateEntityById(id: string): Promise<Result<TemplateEntity>> {
  return safeFetch<TemplateEntity>(`${API_BASE}/api/templates/${id}`);
}

export { getTemplateEntities, getTemplateEntityById };
