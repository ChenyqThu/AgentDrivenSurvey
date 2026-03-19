import type { SurveySchema } from '@/lib/survey/types';

type PropertyConfig = Record<string, Record<string, unknown>>;

const NOTION_MAX_PROPERTIES = 100;
const FIXED_COLUMNS_COUNT = 5;

/**
 * Map ExtractionField.type to Notion property configuration.
 */
function mapFieldType(type: string): Record<string, unknown> {
  switch (type) {
    case 'number':
      return { number: {} };
    case 'boolean':
      return { checkbox: {} };
    case 'string[]':
      return { multi_select: {} };
    case 'string':
    case 'object':
    default:
      return { rich_text: {} };
  }
}

/**
 * Build Notion database properties from a SurveySchema.
 * Compatible with @notionhq/client v5.13 initial_data_source.properties format.
 */
export function buildDatabaseProperties(schema: SurveySchema): {
  properties: PropertyConfig;
  warnings: string[];
} {
  const warnings: string[] = [];

  const properties: PropertyConfig = {
    '会话 ID': { title: {} },
    '受访者': { rich_text: {} },
    '状态': {
      select: {
        options: [
          { name: 'active', color: 'yellow' },
          { name: 'completed', color: 'green' },
        ],
      },
    },
    '完成时间': { date: {} },
    '平均置信度': { number: {} },
  };

  let fieldCount = FIXED_COLUMNS_COUNT;

  for (const section of schema.sections) {
    for (const question of section.questions) {
      for (const field of question.extractionFields) {
        if (fieldCount >= NOTION_MAX_PROPERTIES) {
          warnings.push(
            `Reached Notion's ${NOTION_MAX_PROPERTIES} property limit. ` +
            `Skipping field: ${section.title}: ${field.key}`
          );
          continue;
        }

        const propName = `${section.title}: ${field.key}`;
        properties[propName] = mapFieldType(field.type);
        fieldCount++;
      }
    }
  }

  return { properties, warnings };
}
