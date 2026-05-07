import type { Request, Response } from 'express';
import { textbookCatalogRepository } from '../repositories/textbookCatalogRepository.js';

export const textbookController = {
  getVersions: async (req: Request, res: Response) => {
    try {
      const { subject, stage } = req.query;
      const versions = await textbookCatalogRepository.findVersions(
        subject ? String(subject) : undefined,
        stage ? String(stage) : undefined
      );
      return res.json({ success: true, data: versions });
    } catch (error) {
      console.error('获取版本列表失败:', error);
      return res.status(500).json({ success: false, error: '获取版本列表失败' });
    }
  },

  getGrades: async (req: Request, res: Response) => {
    try {
      const { subject, version, stage } = req.query;
      const grades = await textbookCatalogRepository.findGrades(
        subject ? String(subject) : undefined,
        version ? String(version) : undefined,
        stage ? String(stage) : undefined
      );
      return res.json({ success: true, data: grades });
    } catch (error) {
      console.error('获取年级列表失败:', error);
      return res.status(500).json({ success: false, error: '获取年级列表失败' });
    }
  },

  getVolumes: async (req: Request, res: Response) => {
    try {
      const { subject, version, grade, stage } = req.query;
      const volumes = await textbookCatalogRepository.findVolumes(
        subject ? String(subject) : undefined,
        version ? String(version) : undefined,
        grade ? String(grade) : undefined,
        stage ? String(stage) : undefined
      );
      return res.json({ success: true, data: volumes });
    } catch (error) {
      console.error('获取册次列表失败:', error);
      return res.status(500).json({ success: false, error: '获取册次列表失败' });
    }
  },
};
