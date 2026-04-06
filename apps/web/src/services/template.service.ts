import { get } from '@/lib/api';
import type { APIResponse } from '@/lib/api';

export interface TypeTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  isPublic: boolean;
  typeDefinition: {
    typeName: string;
    typeIcon: string;
    typeColor: string;
    columns: any[];
  };
}

export const listTemplates = async (): Promise<TypeTemplate[]> =>
  get<APIResponse<{ data: TypeTemplate[] }>>('/templates').then((res) => {
    // The backend returns it under data.data or directly depending on controller
    // Let's assume the standard { data: { data: [...] } } or { data: [...] }
    return res.data.data as unknown as TypeTemplate[] || [];
  });
