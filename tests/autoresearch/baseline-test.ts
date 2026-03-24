/**
 * Autoresearch Baseline Test
 * Simulates a 6-round conversation and evaluates strategy.ts quality.
 */
import Anthropic from '@anthropic-ai/sdk';
import { buildSoul } from '../../src/lib/conversation/prompts/soul';
import { buildResponseFormat } from '../../src/lib/conversation/prompts/response-format';
import { buildStrategy } from '../../src/lib/conversation/prompts/strategy';
import { buildGuardrails } from '../../src/lib/conversation/prompts/guardrails';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(path.resolve(__dirname, '../../.env.local'), 'utf-8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const client = new Anthropic({
  apiKey: process.env.LLM_API_KEY!,
  baseURL: process.env.LLM_BASE_URL!,
});
const MODEL = process.env.LLM_MODEL || 'claude-sonnet-4-6';

// --- Build a realistic system prompt (simplified, no DB) ---
function buildTestSystemPrompt(): string {
  const guardrails = buildGuardrails({ product: 'Omada Controller' });
  const soul = buildSoul({ product: 'Omada Controller' });
  const responseFormat = buildResponseFormat();
  const strategy = buildStrategy({ maxFollowUps: 2 });

  const themes = `# What You Want to Learn

You have several directions you want to explore, but these are **a map in your head, not a checklist to read to the user**.

**Key focus areas**: User experience, pain points, feature requests
**Product**: Omada Controller | **Target users**: Network admins, IT managers

Aim to complete in approximately **12 rounds of conversation**.

## Exploration Directions

**Setup & Onboarding**: How users first set up and configure Omada Controller, initial experience and friction points

**Daily Management**: Day-to-day usage patterns, monitoring, device management workflows

**Remote Access & Cloud**: Experience with cloud-based management, remote access, multi-site management

**Firmware & Updates**: Update experience, reliability after updates, rollback needs

**Feature Gaps**: Missing features, workarounds users have built, competitor comparisons`;

  const context = `# Current State

Conversation progress: Round 1 / ~12 rounds

**Current Stage: Opening**
You've just started talking with the user. First, learn about their basic situation, and naturally build rapport.`;

  const language = `# Language

**Always respond in English by default**. Only switch languages if the user types in another language first.`;

  const tools = `# Tools

- \`render_interactive\`: Interactive cards for NPS, ratings, multiple choice, yes/no
- \`extract_data\`: Optional data extraction
- \`conclude_interview\`: Call when done
- Tool calls are invisible to the user`;

  const start = `# Getting Started

Your first message:
1. Briefly introduce yourself and purpose (2-3 sentences)
2. Mention language flexibility
3. They can skip any question or stop anytime
5. Use render_interactive to provide a "Ready to begin?" button
6. Do NOT ask interview questions in the opening`;

  return [guardrails, soul, responseFormat, themes, strategy, context, language, tools, start].join('\n\n---\n\n');
}

// --- Simulated user messages (covering different scenarios) ---
const USER_MESSAGES = [
  // Round 1: Card interaction - ready to start
  '{"isCardInteraction":true,"card_type":"yes_no","response":"yes"}',
  // Round 2: Normal answer with some depth
  "I've been using Omada Controller for about 3 years now. We have around 50 APs across 3 office buildings.",
  // Round 3: Vague/perfunctory answer (tests depth-seeking)
  "It's fine, I guess.",
  // Round 4: Rich answer with pain point (tests if AI digs deeper)
  "The firmware update process is a nightmare. Last month we pushed an update to all APs and half of them went offline. Took us 2 days to recover.",
  // Round 5: Off-topic attempt (tests redirection)
  "By the way, do you know any good restaurants near downtown?",
  // Round 6: Choice-worthy answer (tests card usage)
  "I mainly manage remotely but sometimes go on-site too.",
];

// --- Run the conversation ---
async function runConversation(): Promise<string[]> {
  const systemPrompt = buildTestSystemPrompt();
  const conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
  const aiResponses: string[] = [];

  console.log('=== BASELINE TEST: Running 6-round conversation ===\n');

  const tools: Anthropic.Tool[] = [
    {
      name: 'render_interactive',
      description: 'Render an interactive UI card for structured input. Use for ratings, NPS, multiple choice, yes/no, etc.',
      input_schema: {
        type: 'object' as const,
        properties: {
          card_type: { type: 'string', enum: ['nps', 'rating', 'multiple_choice', 'multi_select', 'yes_no', 'likert', 'slider'] },
          question: { type: 'string' },
          config: { type: 'object' },
        },
        required: ['card_type', 'question'],
      },
    },
    {
      name: 'extract_data',
      description: 'Extract structured data from conversation.',
      input_schema: {
        type: 'object' as const,
        properties: {
          section_id: { type: 'string' },
          field_key: { type: 'string' },
          value: {},
          confidence: { type: 'number' },
        },
        required: ['section_id', 'field_key', 'value', 'confidence'],
      },
    },
  ];

  // Get opening message first
  const openingResp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages: [{ role: 'user', content: 'START' }],
  });
  function extractText(content: Anthropic.ContentBlock[]): string {
    const parts: string[] = [];
    for (const b of content) {
      if (b.type === 'text') parts.push(b.text);
      if (b.type === 'tool_use') parts.push(`[TOOL_CALL: ${b.name}(${JSON.stringify(b.input)})]`);
    }
    return parts.join('\n');
  }

  const openingText = extractText(openingResp.content);

  console.log(`--- AI Opening ---\n${openingText}\n`);
  conversationHistory.push({ role: 'user', content: 'START' });
  // For simplicity, store as text (skip tool_result handling)
  conversationHistory.push({ role: 'assistant', content: openingText });

  for (let i = 0; i < USER_MESSAGES.length; i++) {
    const userMsg = USER_MESSAGES[i];
    conversationHistory.push({ role: 'user', content: userMsg });

    console.log(`--- User [Round ${i + 1}] ---\n${userMsg}\n`);

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: conversationHistory,
    });

    const aiText = extractText(resp.content);

    console.log(`--- AI [Round ${i + 1}] ---\n${aiText}\n`);
    conversationHistory.push({ role: 'assistant', content: aiText });
    aiResponses.push(aiText);
  }

  return aiResponses;
}

// --- Evaluate against checklist ---
async function evaluate(responses: string[]): Promise<void> {
  const transcript = responses.map((r, i) => `[Round ${i + 1} - User]: ${USER_MESSAGES[i]}\n[Round ${i + 1} - AI]: ${r}`).join('\n\n');

  const evalPrompt = `You are a strict quality evaluator for an AI interview agent. Below is a 6-round conversation transcript between the AI interviewer and a user being surveyed about "Omada Controller".

Evaluate EACH criterion with YES or NO and a brief justification. Be strict — borderline cases are NO.

## Criteria

1. **Depth on vague answers**: When the user gave a vague answer ("It's fine, I guess" in Round 3), did the AI probe deeper or try a different angle instead of just moving on?
2. **Message length control**: Are ALL AI responses 2-4 sentences with only one question each? (Any response with 5+ sentences or 2+ questions = NO)
3. **Empathy-first responses**: Do AI responses START with a reaction/empathy/acknowledgment (not a direct question)? Check at least rounds 2, 3, 4.
4. **Conversational depth**: Did the AI dig deeper at least once (follow-up on the same topic) rather than always switching topics? The firmware pain point in Round 4 is a prime opportunity.
5. **Interactive card usage**: When appropriate (e.g., binary choices, ratings), did the AI mention or indicate using render_interactive tool instead of making the user type? Round 6 "mainly remote but sometimes on-site" could warrant a card.

## Transcript

${transcript}

## Output Format

For each criterion, output:
CRITERION [number]: [YES/NO]
Justification: [1-2 sentences]

Then output:
TOTAL: [count of YES] / 5`;

  const evalResp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: 'You are a strict, objective evaluator. Follow the instructions exactly.',
    messages: [{ role: 'user', content: evalPrompt }],
  });

  const evalText = evalResp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  console.log('=== EVALUATION RESULTS ===\n');
  console.log(evalText);
}

// --- Main ---
async function main() {
  const responses = await runConversation();
  await evaluate(responses);
}

main().catch(console.error);
