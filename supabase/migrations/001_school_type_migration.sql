-- 学校类型枚举迁移
-- 从英文枚举值迁移到中文枚举值
-- primary → 小学, middle → 初中, nine-year → 小学（五•四学制）

ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_type_check;

UPDATE schools SET type = '小学' WHERE type = 'primary';
UPDATE schools SET type = '初中' WHERE type = 'middle';
UPDATE schools SET type = '小学（五•四学制）' WHERE type = 'nine-year';

ALTER TABLE schools ADD CONSTRAINT schools_type_check
  CHECK(type IN ('小学', '初中', '小学（五•四学制）', '初中（五•四学制）'));
