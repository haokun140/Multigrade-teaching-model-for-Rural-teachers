import { supabase, handleSingle } from '../db/supabase.js';
import type { School } from '../../../shared/types.js';
import { createDefaultSubjects } from '../services/subjectService.js';

function rowToSchool(row: any): School {
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    type: row.type,
    inviteCode: row.invite_code,
    rules: row.rules || undefined,
    createdAt: row.created_at,
  };
}

export const schoolRepository = {
  create: async (
    id: string,
    name: string,
    region: string,
    type: string,
    inviteCode: string,
    createdBy: string
  ): Promise<School> => {
    const { data, error } = await supabase.from('schools').insert({
      id, name, region, type, invite_code: inviteCode, created_by: createdBy,
    }).select('*').single();
    if (error) throw error;

    await createDefaultSubjects(id);

    return rowToSchool(data!);
  },

  findById: async (id: string): Promise<School | null> => {
    const row = handleSingle(await supabase.from('schools').select('*').eq('id', id).single());
    return row ? rowToSchool(row) : null;
  },

  findByInviteCode: async (inviteCode: string): Promise<School | null> => {
    const row = handleSingle(await supabase.from('schools').select('*').eq('invite_code', inviteCode).single());
    return row ? rowToSchool(row) : null;
  },

  update: async (id: string, data: { name?: string; region?: string; type?: string; rules?: string }): Promise<School | null> => {
    const fields: Record<string, unknown> = {};
    if (data.name !== undefined) fields.name = data.name;
    if (data.region !== undefined) fields.region = data.region;
    if (data.type !== undefined) fields.type = data.type;
    if (data.rules !== undefined) fields.rules = data.rules;

    if (Object.keys(fields).length === 0) return schoolRepository.findById(id);

    const { error } = await supabase.from('schools').update(fields).eq('id', id);
    if (error) throw error;
    return schoolRepository.findById(id);
  },
};
