import type {
  SurveySchema,
  SurveyContext,
  SurveySettings,
  InterviewPromptTemplate,
  AgentBehaviorConfig,
  InteractiveSkillConfig,
} from '@/lib/survey/types';
import type { ConversationState, ExtractedField } from '@/lib/conversation/types';
import { getProgress } from '@/lib/conversation/state';

interface BuildSystemPromptParams {
  survey: {
    title: string;
    description: string | null;
    context: SurveyContext;
    settings: SurveySettings;
    schema: SurveySchema;
  };
  state: ConversationState;
  extractedData: ExtractedField[];
  // Agent-generated configurations (optional, enhances prompt quality)
  agentConfig?: {
    promptTemplate?: InterviewPromptTemplate;
    behavior?: AgentBehaviorConfig;
    interactiveSkills?: InteractiveSkillConfig[];
  };
}

function getConversationStage(
  state: ConversationState
): 'opening' | 'middle' | 'closing' {
  const total = state.questionStates.length;
  if (total === 0) return 'opening';
  const answered = state.questionStates.filter(
    (qs) => qs.status === 'answered' || qs.status === 'skipped'
  ).length;
  const ratio = answered / total;
  if (ratio === 0) return 'opening';
  if (ratio >= 0.85) return 'closing';
  return 'middle';
}

function formatExtractedData(extractedData: ExtractedField[]): string {
  if (extractedData.length === 0) return '  (none yet)';
  const lines: string[] = [];
  for (const field of extractedData) {
    lines.push(
      `  [${field.sectionId}] ${field.fieldKey}: ${JSON.stringify(field.value)} (confidence: ${field.confidence.toFixed(2)})`
    );
  }
  return lines.join('\n');
}

function formatSurveyStructure(
  schema: SurveySchema,
  state: ConversationState
): string {
  const lines: string[] = [];
  for (const section of schema.sections) {
    lines.push(`Section: ${section.title}`);
    if (section.description) {
      lines.push(`  Description: ${section.description}`);
    }
    for (const question of section.questions) {
      const qs = state.questionStates.find(
        (q) => q.sectionId === section.id && q.questionId === question.id
      );
      const status = qs?.status ?? 'pending';
      const marker =
        status === 'answered'
          ? '[✓]'
          : status === 'skipped'
          ? '[~]'
          : status === 'in_progress'
          ? '[→]'
          : '[ ]';
      lines.push(`  ${marker} [${question.id}] ${question.text} (${question.type})`);
      if (question.required) {
        lines.push(`       Required: yes`);
      }
    }
  }
  return lines.join('\n');
}

function getActiveQuestionDetails(
  schema: SurveySchema,
  state: ConversationState
): string {
  // Find active (in_progress) question first, then first pending
  let activeSectionId: string | null = null;
  let activeQuestionId: string | null = null;

  for (const qs of state.questionStates) {
    if (qs.status === 'in_progress') {
      activeSectionId = qs.sectionId;
      activeQuestionId = qs.questionId;
      break;
    }
  }

  if (!activeSectionId) {
    for (const qs of state.questionStates) {
      if (qs.status === 'pending') {
        activeSectionId = qs.sectionId;
        activeQuestionId = qs.questionId;
        break;
      }
    }
  }

  if (!activeSectionId || !activeQuestionId) {
    return '  All questions have been addressed.';
  }

  const section = schema.sections.find((s) => s.id === activeSectionId);
  if (!section) return '  (section not found)';
  const question = section.questions.find((q) => q.id === activeQuestionId);
  if (!question) return '  (question not found)';

  const lines: string[] = [
    `Section: ${section.title}`,
    `Question ID: ${question.id}`,
    `Question: ${question.text}`,
    `Type: ${question.type}`,
    `Required: ${question.required ? 'yes' : 'no'}`,
  ];

  if (question.extractionFields.length > 0) {
    lines.push('Fields to extract:');
    for (const field of question.extractionFields) {
      lines.push(`  - ${field.key} (${field.type}): ${field.description}`);
    }
  }

  if (question.followUpRules.length > 0) {
    lines.push('Follow-up rules:');
    for (const rule of question.followUpRules) {
      lines.push(
        `  - If "${rule.condition}" → ask: "${rule.question}" (max ${rule.maxDepth} rounds)`
      );
    }
  }

  const qs = state.questionStates.find(
    (q) => q.sectionId === activeSectionId && q.questionId === activeQuestionId
  );
  if (qs && qs.followUpCount > 0) {
    lines.push(`Follow-up rounds used: ${qs.followUpCount}`);
  }

  return lines.join('\n');
}

export function buildSystemPrompt(params: BuildSystemPromptParams): string {
  const { survey, state, extractedData, agentConfig } = params;
  const { context, settings, schema } = survey;
  const progress = getProgress(state);
  const stage = getConversationStage(state);
  const language = settings.language || schema.metadata.language || 'en';

  const promptTemplate = agentConfig?.promptTemplate;
  const behavior = agentConfig?.behavior;
  const interactiveSkills = agentConfig?.interactiveSkills;

  const maxFollowUps = behavior?.maxFollowUpRounds ?? 2;
  const transitionStyle = behavior?.transitionStyle === 'direct'
    ? 'Transition directly between sections without lengthy acknowledgments.'
    : 'Transition smoothly between sections — briefly acknowledge the shift before moving on.';

  const stageGuidance: Record<string, string> = {
    opening: promptTemplate?.openingMessage
      ? `OPENING STAGE: Use this greeting as inspiration (adapt naturally): "${promptTemplate.openingMessage}"`
      : 'OPENING STAGE: Introduce yourself briefly, thank the participant for their time, and ease into the first question with a warm, inviting tone.',
    middle:
      'MIDDLE STAGE: You are in the core of the interview. Maintain momentum, follow up naturally where appropriate, and transition smoothly between sections.',
    closing: promptTemplate?.closingMessage
      ? `CLOSING STAGE: Use this closing as inspiration (adapt naturally): "${promptTemplate.closingMessage}"`
      : 'CLOSING STAGE: Most questions have been addressed. Begin wrapping up the conversation. Summarize key themes if helpful, thank the participant sincerely, and end warmly.',
  };

  const toneDesc: Record<string, string> = {
    formal: 'professional and formal',
    casual: 'friendly and casual',
    neutral: 'warm but professional',
  };

  const tone = toneDesc[settings.tone] ?? 'warm but professional';

  const sections: string[] = [];

  // 1. Role definition (use agent-generated role if available)
  const roleDesc = promptTemplate?.roleDescription
    ?? `You are conducting a research interview about ${context.product}. Your goal is to naturally gather insights through conversation. Be ${tone}.`;
  sections.push(`# Role\n${roleDesc}`);

  // 2. Behavior rules
  const behaviorRules = [
    '- Ask ONE question at a time. Never ask multiple questions in a single turn.',
    `- Follow up naturally when the answer warrants it (maximum ${maxFollowUps} follow-up rounds per question).`,
    behavior?.detectImpatience !== false
      ? '- If the user seems impatient, disengaged, or short, move on to the next question gracefully.'
      : null,
    `- ${transitionStyle}`,
    '- Do not repeat questions that have already been answered (see extracted data below).',
    '- Keep responses concise and conversational.',
    behavior?.allowSkipping !== false
      ? '- If the user wants to skip a question, allow it gracefully.'
      : null,
    behavior?.adaptiveDepth
      ? '- Adjust follow-up depth based on response quality: go deeper on rich answers, move on faster with brief ones.'
      : null,
    `- Language: respond in ${language}.`,
  ].filter(Boolean);

  // Add agent-generated custom rules
  if (promptTemplate?.customRules && promptTemplate.customRules.length > 0) {
    for (const rule of promptTemplate.customRules) {
      behaviorRules.push(`- ${rule}`);
    }
  }

  sections.push(`# Behavior Rules\n${behaviorRules.join('\n')}`);

  // 3. Survey context
  sections.push(
    `# Survey Context
Product: ${context.product}
Target Users: ${context.targetUsers}
Focus Areas: ${context.focusAreas.join(', ')}${context.additionalContext ? `\nAdditional Context: ${context.additionalContext}` : ''}`
  );

  // 4. Survey structure with progress markers
  sections.push(
    `# Survey Structure (${progress.completed}/${progress.total} questions complete — ${progress.percentage}%)
Legend: [✓] answered  [~] skipped  [→] in progress  [ ] pending

${formatSurveyStructure(schema, state)}`
  );

  // 5. Active question details
  sections.push(
    `# Currently Active Question
${getActiveQuestionDetails(schema, state)}`
  );

  // 6. Already extracted data
  sections.push(
    `# Already Extracted Data (do not re-ask for these)
${formatExtractedData(extractedData)}`
  );

  // 7. Tool use instructions (enhanced with interactive card guidance)
  const toolInstructions = [
    '- Use the `extract_data` tool whenever you identify a relevant data point in the user\'s response, even mid-conversation.',
    '- Use the `update_progress` tool when you have finished with a question (answered or skipped) and are ready to move to the next one.',
    '- You may call tools silently — the user does not see tool calls, only your text responses.',
    '- Always call `update_progress` before moving on so the survey state stays accurate.',
  ];

  // Add interactive card instructions if skills are configured
  if (interactiveSkills && interactiveSkills.length > 0) {
    toolInstructions.push(
      '- Use the `render_interactive` tool to show interactive cards for structured input (ratings, NPS, choices).',
      '- When a question has an associated interactive skill, prefer using the card over asking as plain text.',
      '- After the user interacts with a card, their response will be sent as a structured message. Acknowledge it naturally and continue.'
    );

    // List which questions have interactive skills
    const skillMap = interactiveSkills.map(
      (s) => `  ${s.questionId}: ${s.cardType} card`
    );
    toolInstructions.push(
      `- Questions with interactive cards:\n${skillMap.join('\n')}`
    );
  }

  sections.push(`# Tool Use Instructions\n${toolInstructions.join('\n')}`);

  // 8. Conversation stage guidance
  sections.push(`# Conversation Stage\n${stageGuidance[stage]}`);

  return sections.join('\n\n');
}
