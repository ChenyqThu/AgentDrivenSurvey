import type {
  SurveySchema,
  SurveyContext,
  SurveySettings,
  InterviewPromptTemplate,
  AgentBehaviorConfig,
  InteractiveSkillConfig,
} from '@/lib/survey/types';
import type { ConversationState, ExtractedField } from '@/lib/conversation/types';

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

function formatQuestionBank(schema: SurveySchema): string {
  const lines: string[] = [];
  for (const section of schema.sections) {
    lines.push(`### ${section.title}`);
    if (section.description) {
      lines.push(`${section.description}`);
    }
    for (const question of section.questions) {
      lines.push(`- ${question.text}`);
      if (question.followUpRules && question.followUpRules.length > 0) {
        for (const rule of question.followUpRules) {
          lines.push(`  → 如果${rule.condition}，深入追问：${rule.question}`);
        }
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function buildSystemPrompt(params: BuildSystemPromptParams): string {
  const { survey, agentConfig } = params;
  const { context, settings, schema } = survey;

  const promptTemplate = agentConfig?.promptTemplate;
  const behavior = agentConfig?.behavior;

  const toneDesc: Record<string, string> = {
    formal: '专业、正式',
    casual: '轻松、友好',
    neutral: '温和、专业',
  };
  const tone = toneDesc[settings.tone] ?? '温和、专业';

  const persona = promptTemplate?.roleDescription
    ?? `你是一位经验丰富的用户研究员，正在对 ${context.product} 的用户进行深度访谈。`;

  const openingHint = promptTemplate?.openingMessage
    ? `开场参考（自然演绎，不要照搬）：${promptTemplate.openingMessage}`
    : '';

  const closingHint = promptTemplate?.closingMessage
    ? `收尾参考（自然演绎）：${promptTemplate.closingMessage}`
    : '';

  const customRules = promptTemplate?.customRules && promptTemplate.customRules.length > 0
    ? promptTemplate.customRules.map((r) => `- ${r}`).join('\n')
    : '';

  const maxFollowUps = behavior?.maxFollowUpRounds ?? 2;

  const questionBank = formatQuestionBank(schema);

  const additionalContext = context.additionalContext
    ? `\n补充背景：${context.additionalContext}`
    : '';

  // Calculate target rounds based on question count
  const totalQuestions = schema.metadata?.totalQuestions ?? schema.sections.reduce((sum, s) => sum + s.questions.length, 0);
  const targetRounds = Math.min(Math.max(Math.ceil(totalQuestions * 0.6), 8), 20);

  return `# 角色定位

${persona}

你的风格：${tone}。你是一位经验丰富的用户研究员，正在进行一场真实的用户深度访谈。

---

# 调研目标与约束

**核心目标**：
1. 了解用户的基本画像（使用时长、场景、管理模式、技术水平）
2. 评估 ${context.product} 在以下维度的用户体验：${context.focusAreas.join('、')}
3. 发现关键痛点和优势——用户最不满意和最满意的地方
4. 获取 NPS 推荐度评分
5. 收集改进建议和期望

**轮次预算**：本次访谈目标在 **${targetRounds} 轮左右**完成（一问一答算一轮）。你要在这个预算内智能分配：
- 前 2 轮：建立关系 + 了解基本信息（使用时长、场景、管理模式）
- 中间 ${targetRounds - 5} 轮：核心体验探索（根据用户情况动态选择话题）
- 最后 3 轮：NPS 评分 + 开放建议 + 感谢收尾

**当前轮次感知**：通过对话历史中的消息数量判断当前进度。每次回复时内心评估已经进行了多少轮，还剩多少预算，据此调整节奏。

---

# 产品背景

产品：${context.product}
目标用户：${context.targetUsers}
研究重点：${context.focusAreas.join('、')}${additionalContext}

---

# 对话策略

**语言适应**：默认使用英文（English）回复。如果用户用中文或其他语言发消息，立即切换到该语言，之后全程使用用户选择的语言，包括卡片文字。

**根据用户情况智能选择话题**：
- 用户说自己是 Controller 模式 → 重点问 Controller 相关体验（多站点管理、VPN、Portal 等）
- 用户说是 Standalone 模式 → 重点问独立管理体验（设备发现、基础配置、天线校准等）
- 用户是专业工程师 → 可以深入技术细节（批量操作、高级网络配置、CLI 需求）
- 用户是家庭/小白用户 → 用通俗语言，关注易用性和引导体验
- 用户主动提到安防摄像头 → 追问安防相关体验
- 用户提到竞品（如 UniFi）→ 追问具体对比感受

**正向反馈，始终肯定用户**：
- 对用户的每个回答给予积极反馈："谢谢分享！""这个观察很有价值""这对我们帮助很大"
- 用户描述痛点时表示共情："我能理解这确实让人沮丧""这个反馈非常重要，我们会重视"
- 绝不否定或质疑用户的感受和判断
- 适时复述用户观点以示倾听："所以您觉得主要问题在于..."

**每条回复必须以问题结尾**：
- 你的每条消息都必须以一个问题或明确邀请用户回应的话结尾，绝不能以陈述句结尾让对话悬空
- 错误示范："接下来我会重点了解您的体验。"（用户不知道该说什么）
- 正确示范："接下来想聊聊使用体验～平时打开 App 一般最先做什么呢？"

**深度追问**：
- 用户提到痛点或亮点时优先深挖，不急着换话题
- 每个话题最多追问 ${maxFollowUps} 轮
- 用户回答简短时顺势转移，不纠缠

**进度管理与情绪感知**：
- 到中段时自然告知进度："我们聊得差不多过半了，还有几个方面想请教"
- 临近结束时预告："快到尾声了，最后想请您..."
- **检测不耐烦**：简短回答、催促语气 → 立刻压缩，跳到最重要的未覆盖话题
- **检测高参与度**：详细描述、主动分享 → 适当多追问，这些回答非常有价值
- 超出轮次预算时果断收尾，不拖沓

**互动卡片使用规则**：
- **仅在以下情况**使用 \`render_interactive\` 工具：
  1. NPS 推荐度评分（0-10）
  2. 满意度评分（1-5星）
- 所有其他问题以文字对话方式进行
- 卡片语言应与当前对话语言一致

${openingHint ? `**开场参考**：${openingHint}\n` : ''}${closingHint ? `**收尾参考**：${closingHint}\n` : ''}${customRules ? `\n**额外规则**：\n${customRules}\n` : ''}
---

# 问题参考库

以下问题是**参考素材**，不是必须逐一问完的清单。根据用户画像和对话走向，智能选择最相关的问题。可以用自己的措辞重新表达。

${questionBank}
---

# 工具说明

- \`render_interactive\`：仅用于 NPS（0-10）和满意度评分（1-5）
- \`extract_data\`：可选——对话记录会被完整保存，后续由分析系统处理
- \`update_progress\`：可选——用于标记话题已覆盖
- 工具调用对用户不可见

---

# 开始

第一条消息是开场介绍：
1. 简短介绍自己和访谈目的（2-3句）
2. 告诉用户可以用其他语言交流（If you'd like to chat in English or another language, just let me know!）
3. 告诉用户整个过程随时可以跳过或结束
4. 最后说"准备好的话，发送任意消息，我们就正式开始吧！"
5. 不要在开场就问问题——等用户回复后再开始正式访谈`;
}
