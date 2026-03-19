import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { messages } from '@/lib/db/schema';
import { getNotionClient, withRetry } from './client';
import type { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

const NOTION_MAX_BLOCK_TEXT = 2000;
const NOTION_MAX_BLOCKS_PER_APPEND = 100;

/**
 * Split text into chunks that fit within Notion's 2000-char block limit.
 */
function splitText(text: string, maxLen: number = NOTION_MAX_BLOCK_TEXT): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    // Try to split at a newline boundary
    let splitAt = remaining.lastIndexOf('\n', maxLen);
    if (splitAt <= 0) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).replace(/^\n/, '');
  }
  return chunks;
}

/**
 * Format conversation messages into Notion blocks.
 */
export function formatConversationBlocks(
  msgs: { role: string; content: string; createdAt: Date }[]
): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  // Section header
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '对话记录' } }],
    },
  });

  blocks.push({
    object: 'block',
    type: 'divider',
    divider: {},
  });

  for (const msg of msgs) {
    const roleLabel = msg.role === 'user' ? '受访者' : '访谈官';
    const timestamp = msg.createdAt.toLocaleString('zh-CN');

    // Role + timestamp header as a bold paragraph
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: `${roleLabel}` },
            annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
          },
          {
            type: 'text',
            text: { content: `  ${timestamp}` },
            annotations: { bold: false, italic: true, strikethrough: false, underline: false, code: false, color: 'gray' },
          },
        ],
      },
    });

    // Message content as quote blocks, split if needed
    const chunks = splitText(msg.content);
    for (const chunk of chunks) {
      blocks.push({
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: [{ type: 'text', text: { content: chunk } }],
        },
      });
    }
  }

  return blocks;
}

/**
 * Append conversation blocks to a Notion page, respecting batch limits.
 */
export async function appendConversationToPage(
  pageId: string,
  sessionId: string
): Promise<void> {
  const sessionMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(messages.sequence);

  if (sessionMessages.length === 0) return;

  const blocks = formatConversationBlocks(
    sessionMessages.map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }))
  );

  const notion = getNotionClient();

  // Append in batches of 100
  for (let i = 0; i < blocks.length; i += NOTION_MAX_BLOCKS_PER_APPEND) {
    const batch = blocks.slice(i, i + NOTION_MAX_BLOCKS_PER_APPEND);
    await withRetry(() =>
      notion.blocks.children.append({
        block_id: pageId,
        children: batch,
      })
    );

    // Rate limit: wait 350ms between batches
    if (i + NOTION_MAX_BLOCKS_PER_APPEND < blocks.length) {
      await new Promise((r) => setTimeout(r, 350));
    }
  }
}
