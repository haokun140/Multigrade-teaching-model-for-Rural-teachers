import { supabase } from '../db/supabase.js';

export const textbookCatalogRepository = {
  /** 获取指定学科的所有版本 */
  findVersions: async (subject?: string): Promise<string[]> => {
    let query = supabase.from('textbook_catalog').select('version');
    if (subject) {
      query = query.eq('subject', subject);
    }
    const { data, error } = await query;
    if (error) throw error;
    const versions = [...new Set((data || []).map((r: any) => r.version))];
    return versions.sort();
  },

  /** 获取指定学科+版本的年级列表 */
  findGrades: async (subject?: string, version?: string): Promise<string[]> => {
    let query = supabase.from('textbook_catalog').select('grade');
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
    grade?: string
  ): Promise<string[]> => {
    let query = supabase.from('textbook_catalog').select('volume');
    if (subject) query = query.eq('subject', subject);
    if (version) query = query.eq('version', version);
    if (grade) query = query.eq('grade', grade);
    const { data, error } = await query;
    if (error) throw error;
    const volumes = [...new Set((data || []).map((r: any) => r.volume))];
    return volumes.sort();
  },
};
