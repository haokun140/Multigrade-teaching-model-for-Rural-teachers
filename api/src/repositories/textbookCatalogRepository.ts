import { supabase } from '../db/supabase.js';

export const textbookCatalogRepository = {
  findVersions: async (subject?: string, stage?: string): Promise<string[]> => {
    let query = supabase.from('textbook_catalog').select('version');
    if (stage) query = query.eq('stage', stage);
    if (subject) query = query.eq('subject', subject);
    const { data, error } = await query;
    if (error) throw error;
    const versions = [...new Set((data || []).map((r: any) => r.version))];
    return versions.sort();
  },

  findGrades: async (subject?: string, version?: string, stage?: string): Promise<string[]> => {
    let query = supabase.from('textbook_catalog').select('grade');
    if (stage) query = query.eq('stage', stage);
    if (subject) query = query.eq('subject', subject);
    if (version) query = query.eq('version', version);
    const { data, error } = await query;
    if (error) throw error;
    const grades = [...new Set((data || []).map((r: any) => r.grade))];
    return grades.sort();
  },

  findVolumes: async (
    subject?: string,
    version?: string,
    grade?: string,
    stage?: string
  ): Promise<string[]> => {
    let query = supabase.from('textbook_catalog').select('volume');
    if (stage) query = query.eq('stage', stage);
    if (subject) query = query.eq('subject', subject);
    if (version) query = query.eq('version', version);
    if (grade) query = query.eq('grade', grade);
    const { data, error } = await query;
    if (error) throw error;
    const volumes = [...new Set((data || []).map((r: any) => r.volume))];
    return volumes.sort();
  },
};
