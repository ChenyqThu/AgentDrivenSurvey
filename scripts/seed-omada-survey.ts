import { db } from '../src/lib/db';
import { surveys } from '../src/lib/db/schema';
import type { SurveyAgent, SurveySchema, InterviewPromptTemplate, InteractiveSkillConfig, AgentBehaviorConfig } from '../src/lib/survey/types';

async function seed() {
  const surveySchema: SurveySchema = {
    version: '1.0',
    metadata: {
      estimatedDuration: 15,
      totalQuestions: 55,
      language: 'zh',
    },
    sections: [
      // ─── Section 1: General Basics ─────────────────────────────────────────────
      {
        id: 'general_basics',
        title: '基本信息',
        description: '了解您使用 Omada App 的基本情况',
        order: 1,
        questions: [
          {
            id: 'q_usage_duration',
            text: '您使用 Omada App 大概多久了？',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'usage_duration', type: 'string', description: '用户使用 Omada App 的时长' },
            ],
            followUpRules: [],
          },
          {
            id: 'q_usage_scenario',
            text: '您主要在哪种场景下使用 Omada App？',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'usage_scenario', type: 'string', description: '用户的主要使用场景：家庭/商用/专职' },
            ],
            followUpRules: [
              {
                condition: '用户选择"专职网络部署"',
                question: '您主要服务哪类客户？（如：中小企业、酒店、学校等）',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_management_mode',
            text: '您平时使用 Controller 模式还是 Standalone（单机）模式管理网络？',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'management_mode', type: 'string', description: '用户的管理模式：Controller/Standalone/两种都用' },
            ],
            followUpRules: [
              {
                condition: '用户选择"Controller"模式',
                question: '好的，接下来我会重点了解您在 Controller 模式下的使用体验。',
                maxDepth: 1,
              },
              {
                condition: '用户选择"Standalone"模式',
                question: '好的，接下来我会重点了解您在 Standalone 模式下的使用体验。',
                maxDepth: 1,
              },
              {
                condition: '用户选择"两种都使用"',
                question: '好的，我们先从 Controller 模式开始了解。',
                maxDepth: 1,
              },
            ],
          },
        ],
      },

      // ─── Section 2: Controller Usage ───────────────────────────────────────────
      {
        id: 'controller_usage',
        title: 'Controller 模式使用情况',
        description: '了解您在 Controller 模式下的具体使用情况（仅 Controller 用户作答）',
        order: 2,
        questions: [
          {
            id: 'q_controller_count',
            text: '您目前管理几个 Controller？',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'controller_count', type: 'string', description: 'Controller 数量范围' },
            ],
            followUpRules: [
              {
                condition: '用户选择"11-20个"或"更多"',
                question: '哇，规模挺大的！您主要通过什么方式统一管理这么多 Controller？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_site_count',
            text: '您管理的 Site（站点）大约有多少个？',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'site_count', type: 'string', description: '管理的站点数量范围' },
            ],
            followUpRules: [],
          },
          {
            id: 'q_device_count',
            text: '您管理的网络设备（AP、交换机、路由器等）总共大约有多少台？',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'device_count', type: 'string', description: '管理设备总数范围' },
            ],
            followUpRules: [
              {
                condition: '用户选择">100台"',
                question: '设备量很大！在 App 上管理这么多设备时，有没有遇到什么特别的挑战？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_app_vs_pc',
            text: '在 Controller 管理中，您更多地使用 App 还是 PC 端（Web 界面）？',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'app_vs_pc_preference', type: 'string', description: '用户倾向于使用 App 还是 PC 端' },
            ],
            followUpRules: [
              {
                condition: '用户选择"只用App"',
                question: '您在什么情况下会倾向于只用 App 而不用 PC 端呢？',
                maxDepth: 1,
              },
              {
                condition: '用户选择"主要PC"',
                question: '在哪些场景下您会觉得 App 无法满足需求、必须用 PC 端？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_feature_frequency',
            text: '请描述一下您在 Omada App（Controller 模式）中使用各功能的频率，比如设备监控、设备操作、网络配置、开局部署等，哪些是您最常用的？',
            type: 'open_ended',
            required: true,
            extractionFields: [
              { key: 'feature_frequency_description', type: 'string', description: '用户描述的功能使用频率' },
              { key: 'most_used_features', type: 'string[]', description: '用户最常使用的功能列表' },
            ],
            followUpRules: [
              {
                condition: '用户提到某个功能使用非常频繁',
                question: '您提到"{feature}"用得很频繁，在这个功能上有没有让您感觉特别顺手或者特别不方便的地方？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_common_operations',
            text: '在 Omada App（Controller 模式）中，您最常进行哪些操作？（可多选）',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'common_operations', type: 'string[]', description: '用户最常进行的操作列表（多选）' },
            ],
            followUpRules: [],
          },
        ],
      },

      // ─── Section 3: Controller Experience ──────────────────────────────────────
      {
        id: 'controller_experience',
        title: 'Controller 模式体验评价',
        description: '从多个维度评价您在 Controller 模式下的使用体验',
        order: 3,
        questions: [
          {
            id: 'q_controller_performance_rating',
            text: '请问您对 Omada App（Controller 模式）在**性能表现**方面的满意度如何？（包括设备响应速度、App 流畅性等）',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'controller_performance_rating', type: 'number', description: '性能表现满意度评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '您对性能表现不太满意，能具体说说是哪些方面让您觉得不好？是加载速度、刷新延迟，还是其他？',
                maxDepth: 2,
              },
              {
                condition: '用户评分 = 3',
                question: '您觉得性能表现一般，有哪些地方让您觉得还不够好？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_controller_performance_issues',
            text: '在性能方面，您遇到过哪些问题？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'controller_performance_issues', type: 'string[]', description: '用户遇到的性能问题列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择了具体的性能问题',
                question: '您提到的这些性能问题，在什么场景下最容易出现？（比如设备多时、网络差时等）',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_controller_stability_rating',
            text: '请问您对 Omada App（Controller 模式）在**稳定性**方面的满意度如何？（包括是否有崩溃、连接中断等）',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'controller_stability_rating', type: 'number', description: '稳定性满意度评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '您在稳定性方面遇到了不少问题，能描述一下最让您头疼的是哪种情况吗？',
                maxDepth: 2,
              },
              {
                condition: '用户评分 = 3',
                question: '您感觉稳定性还有提升空间，具体是哪些不稳定的情况影响了您的体验？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_controller_stability_issues',
            text: '在稳定性方面，您遇到过哪些问题？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'controller_stability_issues', type: 'string[]', description: '用户遇到的稳定性问题列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择了"闪退"或"无法连接"',
                question: '您提到了闪退或无法连接的问题，这种情况大约多久发生一次？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_controller_data_accuracy_rating',
            text: '请问您对 Omada App（Controller 模式）**数据准确及时性**的满意度如何？（包括流量、状态等数据是否准确和实时）',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'controller_data_accuracy_rating', type: 'number', description: '数据准确及时性满意度评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '您对数据准确性不太满意，具体是哪些数据经常不准确或不及时？',
                maxDepth: 2,
              },
            ],
          },
          {
            id: 'q_controller_data_accuracy_issues',
            text: '在数据准确及时性方面，您遇到过哪些问题？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'controller_data_accuracy_issues', type: 'string[]', description: '用户遇到的数据准确性问题列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择了数据问题',
                question: '这些数据不准确的问题，是否影响到您做网络运维决策？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_controller_feature_completeness_rating',
            text: '请问您对 Omada App（Controller 模式）**功能完整性**的满意度如何？（您需要的功能是否都有）',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'controller_feature_completeness_rating', type: 'number', description: '功能完整性满意度评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '您觉得功能不够完整，最希望 App 能补充哪些功能？',
                maxDepth: 2,
              },
              {
                condition: '用户评分 = 3',
                question: '有哪些功能您经常需要但在 App 上找不到或者用起来不方便？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_controller_feature_gaps',
            text: '您觉得 Omada App（Controller 模式）在哪些功能方面还有欠缺？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'controller_feature_gaps', type: 'string[]', description: '用户认为功能欠缺的领域列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择了功能缺口',
                question: '您提到的"{feature}"功能，您理想中应该是怎样的？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_controller_convenience_rating',
            text: '请问您对 Omada App（Controller 模式）**操作便捷性**的满意度如何？（包括操作流程是否简单，功能是否容易找到）',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'controller_convenience_rating', type: 'number', description: '操作便捷性满意度评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '您觉得操作不够便捷，哪个操作让您最头疼？能描述一下那个流程吗？',
                maxDepth: 2,
              },
            ],
          },
          {
            id: 'q_controller_convenience_issues',
            text: '在操作便捷性方面，您遇到过哪些困扰？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'controller_convenience_issues', type: 'string[]', description: '用户遇到的操作便捷性问题列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择了便捷性问题',
                question: '您提到的这些操作问题，您希望是什么样的交互方式会更好？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_controller_learning_rating',
            text: '请问您对 Omada App（Controller 模式）**学习与引导**的满意度如何？（包括新功能引导、帮助文档等）',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'controller_learning_rating', type: 'number', description: '学习与引导满意度评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '您觉得学习引导不够好，刚开始使用时有没有遇到特别搞不懂的地方？',
                maxDepth: 2,
              },
            ],
          },
          {
            id: 'q_controller_ui_rating',
            text: '请问您对 Omada App（Controller 模式）**界面体验**的满意度如何？（包括界面设计、信息展示等）',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'controller_ui_rating', type: 'number', description: '界面体验满意度评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '您对界面不太满意，是哪些界面设计让您觉得不好用或不舒服？',
                maxDepth: 2,
              },
            ],
          },
          {
            id: 'q_controller_ui_issues',
            text: '在界面体验方面，您有哪些不满意的地方？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'controller_ui_issues', type: 'string[]', description: '用户对界面体验不满意的方面列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择了界面问题',
                question: '您希望界面改进后是什么样的？有没有哪款 App 的界面是您觉得做得比较好的？',
                maxDepth: 1,
              },
            ],
          },
        ],
      },

      // ─── Section 4: Controller NPS ──────────────────────────────────────────────
      {
        id: 'controller_nps',
        title: 'Controller 模式综合评价',
        description: '整体评价与推荐度（仅 Controller 用户作答）',
        order: 4,
        questions: [
          {
            id: 'q_controller_competitor_apps',
            text: '您是否使用过其他品牌的网络管理 App？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'controller_competitor_apps', type: 'string[]', description: '用户使用过的竞品 App 列表' },
            ],
            followUpRules: [
              {
                condition: '用户使用过竞品',
                question: '和您用过的其他品牌相比，Omada App 在哪些方面做得更好，哪些方面还有差距？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_controller_nps_score',
            text: '如果让您给朋友或同行推荐 Omada App（Controller 模式），您打几分？（0 = 完全不会推荐，10 = 非常愿意推荐）',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'controller_nps_score', type: 'number', description: 'Controller 模式 NPS 推荐分数（0-10）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 0-6（贬损者）',
                question: '您给出了较低的分数，最主要的原因是什么？哪些问题让您不太愿意推荐？',
                maxDepth: 2,
              },
              {
                condition: '用户评分 7-8（被动者）',
                question: '您给出了中等分数，还有哪些方面如果改进了，您会更愿意推荐？',
                maxDepth: 1,
              },
              {
                condition: '用户评分 9-10（推荐者）',
                question: '感谢您的高度认可！您最喜欢 Omada App 的哪些方面，以至于愿意推荐给他人？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_controller_open_feedback',
            text: '关于 Omada App（Controller 模式），您还有什么想说的？有什么特别希望改进的地方，或者特别满意的地方？（选填）',
            type: 'open_ended',
            required: false,
            extractionFields: [
              { key: 'controller_open_feedback', type: 'string', description: '用户对 Controller 模式的开放式反馈' },
              { key: 'controller_improvement_suggestions', type: 'string[]', description: '用户提出的具体改进建议' },
            ],
            followUpRules: [
              {
                condition: '用户提到了具体的改进建议',
                question: '您提到了"{suggestion}"，能再详细说说您期望的理想状态是什么吗？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_security_camera_usage_controller',
            text: '您有使用 Omada 安防摄像头吗？',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'security_camera_usage', type: 'string', description: '用户使用安防摄像头的情况' },
            ],
            followUpRules: [],
          },
        ],
      },

      // ─── Section 5: Standalone Usage ───────────────────────────────────────────
      {
        id: 'standalone_usage',
        title: 'Standalone 模式使用情况',
        description: '了解您在 Standalone（单机）模式下的具体使用情况（仅 Standalone 用户作答）',
        order: 5,
        questions: [
          {
            id: 'q_device_count_standalone',
            text: '您通过 Standalone 模式管理的设备大约有多少台？',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'device_count_standalone', type: 'string', description: 'Standalone 模式管理设备数量范围' },
            ],
            followUpRules: [
              {
                condition: '用户选择"更多"',
                question: '设备量较多时，您在 Standalone 模式下管理有没有遇到什么挑战？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_app_vs_pc_standalone',
            text: '在 Standalone 管理中，您更多地使用 App 还是 PC 端（Web 界面）？',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'app_vs_pc_standalone', type: 'string', description: 'Standalone 模式下 App vs PC 使用偏好' },
            ],
            followUpRules: [
              {
                condition: '用户选择"主要PC"',
                question: '在 Standalone 模式下，有哪些操作您必须用 PC 端而不能用 App 完成？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_main_tasks_standalone',
            text: '在 Standalone 模式下，您主要用 Omada App 完成哪些任务？（可多选）',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'main_tasks_standalone', type: 'string[]', description: 'Standalone 模式主要使用任务列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择"天线校准"',
                question: '您使用过天线校准功能，使用体验怎么样？有没有遇到什么问题？',
                maxDepth: 1,
              },
            ],
          },
        ],
      },

      // ─── Section 6: Standalone Experience ──────────────────────────────────────
      {
        id: 'standalone_experience',
        title: 'Standalone 模式体验评价',
        description: '从多个维度评价您在 Standalone 模式下的使用体验',
        order: 6,
        questions: [
          {
            id: 'q_standalone_performance_rating',
            text: '请问您对 Omada App（Standalone 模式）在**性能表现**方面的满意度如何？（包括设备响应速度、App 流畅性等）',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'standalone_performance_rating', type: 'number', description: 'Standalone 性能表现满意度评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '您对性能表现不太满意，能具体说说是哪方面让您觉得慢或卡？',
                maxDepth: 2,
              },
              {
                condition: '用户评分 = 3',
                question: '性能方面有哪些地方让您感觉还不够好？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_standalone_performance_issues',
            text: '在性能方面，您遇到过哪些问题？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'standalone_performance_issues', type: 'string[]', description: 'Standalone 模式性能问题列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择了性能问题',
                question: '这些性能问题通常在什么情况下出现？（比如操作某类功能时、设备距离远时等）',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_standalone_stability_rating',
            text: '请问您对 Omada App（Standalone 模式）在**稳定性**方面的满意度如何？',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'standalone_stability_rating', type: 'number', description: 'Standalone 稳定性满意度评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '您在 Standalone 模式稳定性方面遇到了问题，最常见的不稳定情况是什么？',
                maxDepth: 2,
              },
            ],
          },
          {
            id: 'q_standalone_stability_issues',
            text: '在稳定性方面，您遇到过哪些问题？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'standalone_stability_issues', type: 'string[]', description: 'Standalone 模式稳定性问题列表' },
            ],
            followUpRules: [],
          },
          {
            id: 'q_standalone_data_accuracy_rating',
            text: '请问您对 Omada App（Standalone 模式）**数据准确及时性**的满意度如何？',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'standalone_data_accuracy_rating', type: 'number', description: 'Standalone 数据准确及时性评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '数据哪方面不准确或延迟？给您的使用造成了什么影响？',
                maxDepth: 2,
              },
            ],
          },
          {
            id: 'q_standalone_data_accuracy_issues',
            text: '在数据准确及时性方面，您遇到过哪些问题？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'standalone_data_accuracy_issues', type: 'string[]', description: 'Standalone 数据准确性问题列表' },
            ],
            followUpRules: [],
          },
          {
            id: 'q_standalone_feature_completeness_rating',
            text: '请问您对 Omada App（Standalone 模式）**功能完整性**的满意度如何？',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'standalone_feature_completeness_rating', type: 'number', description: 'Standalone 功能完整性评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '在 Standalone 模式下，您最希望补充哪些目前缺失的功能？',
                maxDepth: 2,
              },
            ],
          },
          {
            id: 'q_standalone_feature_gaps',
            text: '您觉得 Omada App（Standalone 模式）在哪些功能方面还有欠缺？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'standalone_feature_gaps', type: 'string[]', description: 'Standalone 模式功能缺口列表' },
            ],
            followUpRules: [],
          },
          {
            id: 'q_standalone_convenience_rating',
            text: '请问您对 Omada App（Standalone 模式）**操作便捷性**的满意度如何？',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'standalone_convenience_rating', type: 'number', description: 'Standalone 操作便捷性评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '哪些操作在 Standalone 模式下让您觉得特别麻烦？能举个例子吗？',
                maxDepth: 2,
              },
            ],
          },
          {
            id: 'q_standalone_convenience_issues',
            text: '在操作便捷性方面，您遇到过哪些困扰？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'standalone_convenience_issues', type: 'string[]', description: 'Standalone 操作便捷性问题列表' },
            ],
            followUpRules: [],
          },
          {
            id: 'q_standalone_learning_rating',
            text: '请问您对 Omada App（Standalone 模式）**学习与引导**的满意度如何？',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'standalone_learning_rating', type: 'number', description: 'Standalone 学习与引导评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '在 Standalone 模式下，上手过程中遇到过哪些困难？有什么引导方面的建议？',
                maxDepth: 2,
              },
            ],
          },
          {
            id: 'q_standalone_ui_rating',
            text: '请问您对 Omada App（Standalone 模式）**界面体验**的满意度如何？',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'standalone_ui_rating', type: 'number', description: 'Standalone 界面体验评分（1-5）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 ≤ 2',
                question: '界面哪些方面让您感觉不好用或不舒服？',
                maxDepth: 2,
              },
            ],
          },
          {
            id: 'q_standalone_ui_issues',
            text: '在界面体验方面，您有哪些不满意的地方？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'standalone_ui_issues', type: 'string[]', description: 'Standalone 界面体验问题列表' },
            ],
            followUpRules: [],
          },
        ],
      },

      // ─── Section 7: Standalone NPS ─────────────────────────────────────────────
      {
        id: 'standalone_nps',
        title: 'Standalone 模式综合评价',
        description: '整体评价与推荐度（仅 Standalone 用户作答）',
        order: 7,
        questions: [
          {
            id: 'q_standalone_competitor_apps',
            text: '您是否使用过其他品牌的网络管理 App（Standalone 场景）？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'standalone_competitor_apps', type: 'string[]', description: 'Standalone 场景使用过的竞品 App 列表' },
            ],
            followUpRules: [
              {
                condition: '用户使用过竞品',
                question: '和其他品牌相比，Omada App 在 Standalone 管理上有什么优势和不足？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_standalone_nps_score',
            text: '如果让您给朋友或同行推荐 Omada App（Standalone 模式），您打几分？（0 = 完全不会推荐，10 = 非常愿意推荐）',
            type: 'rating',
            required: true,
            extractionFields: [
              { key: 'standalone_nps_score', type: 'number', description: 'Standalone 模式 NPS 推荐分数（0-10）' },
            ],
            followUpRules: [
              {
                condition: '用户评分 0-6（贬损者）',
                question: '您给出了较低的分数，最主要影响您推荐意愿的是哪些问题？',
                maxDepth: 2,
              },
              {
                condition: '用户评分 7-8（被动者）',
                question: '还差一点到高分，哪方面改进后您会更愿意推荐？',
                maxDepth: 1,
              },
              {
                condition: '用户评分 9-10（推荐者）',
                question: '谢谢您的认可！您最推荐 Omada App Standalone 模式的哪个方面？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_standalone_open_feedback',
            text: '关于 Omada App（Standalone 模式），您还有什么想说的？有什么特别希望改进的地方？（选填）',
            type: 'open_ended',
            required: false,
            extractionFields: [
              { key: 'standalone_open_feedback', type: 'string', description: '用户对 Standalone 模式的开放式反馈' },
              { key: 'standalone_improvement_suggestions', type: 'string[]', description: '用户提出的 Standalone 改进建议' },
            ],
            followUpRules: [
              {
                condition: '用户提到了具体改进点',
                question: '关于您提到的改进点，您心目中理想的解决方案是什么？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_security_camera_usage_standalone',
            text: '您有使用 Omada 安防摄像头吗？',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'security_camera_usage_standalone', type: 'string', description: 'Standalone 用户安防摄像头使用情况' },
            ],
            followUpRules: [],
          },
        ],
      },

      // ─── Section 8: Security Survey ─────────────────────────────────────────────
      {
        id: 'security_survey',
        title: '安防摄像头附加调研',
        description: '专门针对使用安防摄像头的用户（仅使用或曾经使用安防摄像头的用户作答）',
        order: 8,
        questions: [
          {
            id: 'q_security_brands',
            text: '除了 Omada，您还使用过哪些品牌的安防摄像头系统？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'security_brands_used', type: 'string[]', description: '用户使用过的安防摄像头品牌列表' },
            ],
            followUpRules: [
              {
                condition: '用户使用过竞品安防系统',
                question: '和您用过的其他安防系统相比，Omada 安防在哪些方面做得好，哪些还有差距？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_security_scenarios',
            text: '您在哪些场景下使用安防摄像头？（可多选）',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'security_usage_scenarios', type: 'string[]', description: '安防摄像头使用场景列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择"为他人安装"',
                question: '您作为安装/维护方，在 Omada App 上管理客户的安防设备，有什么特别的需求或痛点？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_security_purpose',
            text: '您使用安防摄像头主要用于什么目的？（可多选）',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'security_usage_purpose', type: 'string[]', description: '安防摄像头使用目的列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择"人车识别"',
                question: 'Omada 目前的人车识别功能满足您的需求吗？有什么期望改进的地方？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_security_operations',
            text: '在 Omada App 中，您最常进行哪些安防相关操作？（可多选）',
            type: 'multiple_choice',
            required: true,
            extractionFields: [
              { key: 'security_common_operations', type: 'string[]', description: 'Omada App 安防操作列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择了多个安防操作',
                question: '在这些操作中，哪个操作的体验让您最满意？哪个最让您头疼？',
                maxDepth: 1,
              },
            ],
          },
          {
            id: 'q_security_wishlist',
            text: '您最希望 Omada App 在安防功能方面增加或改进哪些内容？（可多选）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'security_wishlist_features', type: 'string[]', description: '用户希望新增或改进的安防功能列表' },
            ],
            followUpRules: [
              {
                condition: '用户选择了希望的功能',
                question: '您提到最希望有"{feature}"功能，能说说这个功能在您的使用场景中具体会如何帮到您？',
                maxDepth: 1,
              },
            ],
          },
        ],
      },

      // ─── Section 9: Demographics ────────────────────────────────────────────────
      {
        id: 'demographics',
        title: '个人信息（选填）',
        description: '帮助我们更好地了解用户群体，所有问题均为选填',
        order: 9,
        questions: [
          {
            id: 'q_age_range',
            text: '您的年龄段是？（选填）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'age_range', type: 'string', description: '用户年龄段' },
            ],
            followUpRules: [],
          },
          {
            id: 'q_gender',
            text: '您的性别是？（选填）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'gender', type: 'string', description: '用户性别' },
            ],
            followUpRules: [],
          },
          {
            id: 'q_occupation',
            text: '您的职业是？（选填）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'occupation', type: 'string', description: '用户职业' },
            ],
            followUpRules: [],
          },
          {
            id: 'q_education',
            text: '您的最高学历是？（选填）',
            type: 'multiple_choice',
            required: false,
            extractionFields: [
              { key: 'education', type: 'string', description: '用户学历' },
            ],
            followUpRules: [],
          },
        ],
      },
    ],
  };

  const promptTemplate: InterviewPromptTemplate = {
    roleDescription:
      '你是一位经验丰富的 Omada App 用户体验研究员，来自 TP-Link Omada 产品团队。你的名字叫小安（Ann）。你擅长通过自然亲切的对话方式了解用户的真实使用感受，善于从用户的描述中捕捉关键信息。你了解网络管理领域的专业知识，能根据用户的技术水平调整沟通方式——对小白用户使用通俗语言，对专业工程师则可以深入技术细节。',
    openingMessage:
      '你好！我是小安，Omada App 产品团队的用户研究员 👋\n\n感谢您抽出时间参与我们的用户体验调研！这次对话大约需要 10-15 分钟，我会通过轻松的对话方式了解您使用 Omada App 的体验。\n\n所有信息仅用于产品改进研究，严格保密。任何问题都可以跳过。\n\n我们开始吧——您使用 Omada App 大概多久了呢？',
    closingMessage:
      '非常感谢您的宝贵反馈！您分享的这些信息对我们改进 Omada App 非常有价值。如果您有任何其他想法，随时可以联系我们。祝您使用愉快！',
    customRules: [
      '当用户选择 Controller 模式时，跳过 Standalone 相关问题（Part 2B），直接进入 Controller 问卷',
      '当用户选择 Standalone 模式时，跳过 Controller 相关问题（Part 2A），直接进入 Standalone 问卷',
      '当用户选择两种都使用时，按 Controller 问卷流程进行',
      '对于评分题（1-5分），如果用户给出低分（≤2分），主动追问具体原因和改进建议',
      '对于评分题，如果用户给出高分（≥4分），简单确认后继续下一题，不过度追问',
      'NPS 评分后，无论分数如何，都追问一下原因',
      '安防附加题（安防部分）仅在用户表示正在使用或曾经使用安防摄像头时才提问',
      '人口统计题（demographics 部分）作为结尾快速收集，强调均为可选',
      '根据用户的技术水平（从使用场景判断）调整语言：家庭用户用通俗语言，工程师可使用专业术语',
      '每次只问一个问题，等用户回答后再继续',
      '对于多选题，使用交互卡片让用户方便选择',
      '如果用户表现出不耐烦（简短回答、催促），减少追问，加快节奏',
      '评分题使用交互卡片（rating card），NPS 使用专用 NPS 卡片',
      '在板块切换时使用自然过渡语，如：接下来我想了解一下您在操作便捷性方面的感受...',
      '对话全程使用中文，但 NPS 题目保留英文原文标注',
    ],
  };

  const interactiveSkills: InteractiveSkillConfig[] = [
    // ── Section 1: General Basics ─────────────────────────────────────────────
    {
      questionId: 'q_usage_duration',
      sectionId: 'general_basics',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['1个月及以内', '1-6个月', '6个月-1年', '1-2年', '2年以上'],
        allowOther: false,
      },
    },
    {
      questionId: 'q_usage_scenario',
      sectionId: 'general_basics',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['家庭网络', '商用网络', '专职网络部署'],
        allowOther: false,
      },
    },
    {
      questionId: 'q_management_mode',
      sectionId: 'general_basics',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['Controller', 'Standalone', '两种都使用'],
        allowOther: false,
      },
    },

    // ── Section 2: Controller Usage ───────────────────────────────────────────
    {
      questionId: 'q_controller_count',
      sectionId: 'controller_usage',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['1个', '2-5个', '6-10个', '11-20个', '更多'],
        allowOther: false,
      },
    },
    {
      questionId: 'q_site_count',
      sectionId: 'controller_usage',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['1个', '2-5个', '6-10个', '11-20个', '更多'],
        allowOther: false,
      },
    },
    {
      questionId: 'q_device_count',
      sectionId: 'controller_usage',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['1-5台', '6-20台', '21-50台', '51-100台', '>100台'],
        allowOther: false,
      },
    },
    {
      questionId: 'q_app_vs_pc',
      sectionId: 'controller_usage',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['只用App', '主要App，偶尔PC', '主要PC，偶尔App', '都常用'],
        allowOther: false,
      },
    },
    {
      questionId: 'q_common_operations',
      sectionId: 'controller_usage',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '查看流量/带宽统计',
          '查看设备状态',
          '查看客户端信息',
          '查看告警日志',
          '开局部署',
          '设备管理（重启/升级等）',
          'WiFi 配置',
          'Portal 配置',
          'VLAN / VPN 配置',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 10,
      },
    },

    // ── Section 3: Controller Experience ─────────────────────────────────────
    {
      questionId: 'q_controller_performance_rating',
      sectionId: 'controller_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_controller_performance_issues',
      sectionId: 'controller_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '没有问题',
          '页面加载慢',
          '数据刷新慢',
          '操作响应延迟',
          '页面卡顿',
          '设备量大时明显变慢',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 7,
      },
    },
    {
      questionId: 'q_controller_stability_rating',
      sectionId: 'controller_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_controller_stability_issues',
      sectionId: 'controller_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '没有问题',
          'App 闪退',
          '无法连接 Controller',
          '频繁断开连接',
          '设备状态显示不准',
          '操作执行出错',
          '配置下发失败',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 8,
      },
    },
    {
      questionId: 'q_controller_data_accuracy_rating',
      sectionId: 'controller_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_controller_data_accuracy_issues',
      sectionId: 'controller_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '没有问题',
          '流量数据不准确',
          '设备状态更新延迟',
          '客户端信息不准',
          '历史数据缺失或错误',
          '告警信息不及时',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 7,
      },
    },
    {
      questionId: 'q_controller_feature_completeness_rating',
      sectionId: 'controller_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_controller_feature_gaps',
      sectionId: 'controller_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '批量操作功能',
          '设备管理功能',
          '故障排查工具',
          '日志与报表功能',
          '高级网络配置',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 6,
      },
    },
    {
      questionId: 'q_controller_convenience_rating',
      sectionId: 'controller_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_controller_convenience_issues',
      sectionId: 'controller_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '没有问题',
          '操作步骤太多',
          '功能入口难找',
          '配置流程复杂',
          '缺少快捷操作',
          '搜索功能不好用',
          '批量操作不方便',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 8,
      },
    },
    {
      questionId: 'q_controller_learning_rating',
      sectionId: 'controller_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_controller_ui_rating',
      sectionId: 'controller_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_controller_ui_issues',
      sectionId: 'controller_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '没有问题',
          '界面信息密度太高',
          '字体/图标太小',
          '颜色/对比度不好',
          '深色模式支持不好',
          '图表/数据可视化不直观',
          '布局不合理',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 8,
      },
    },

    // ── Section 4: Controller NPS ─────────────────────────────────────────────
    {
      questionId: 'q_controller_competitor_apps',
      sectionId: 'controller_nps',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '从未使用过竞品',
          'UniFi Network',
          'Aruba Central',
          'Meraki Dashboard',
          'Huawei iMaster NCE',
          '锐捷网络 App',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 7,
      },
    },
    {
      questionId: 'q_controller_nps_score',
      sectionId: 'controller_nps',
      cardType: 'nps',
      cardConfig: {
        min: 0,
        max: 10,
        labels: { 0: '完全不会推荐', 10: '非常愿意推荐' },
        question: 'How likely are you to recommend Omada App (Controller) to a friend or colleague?',
      },
    },
    {
      questionId: 'q_security_camera_usage_controller',
      sectionId: 'controller_nps',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['正在使用', '曾经使用过', '计划使用', '不打算使用'],
        allowOther: false,
      },
    },

    // ── Section 5: Standalone Usage ───────────────────────────────────────────
    {
      questionId: 'q_device_count_standalone',
      sectionId: 'standalone_usage',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['1台', '2-5台', '6-10台', '更多'],
        allowOther: false,
      },
    },
    {
      questionId: 'q_app_vs_pc_standalone',
      sectionId: 'standalone_usage',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['只用App', '主要App，偶尔PC', '主要PC，偶尔App', '都常用'],
        allowOther: false,
      },
    },
    {
      questionId: 'q_main_tasks_standalone',
      sectionId: 'standalone_usage',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '基本网络操作（重启/查看状态）',
          '配置管理',
          '查看设备状态和数据',
          '网络开局部署',
          '天线校准',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 6,
      },
    },

    // ── Section 6: Standalone Experience ─────────────────────────────────────
    {
      questionId: 'q_standalone_performance_rating',
      sectionId: 'standalone_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_standalone_performance_issues',
      sectionId: 'standalone_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '没有问题',
          '页面加载慢',
          '数据刷新慢',
          '操作响应延迟',
          '页面卡顿',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 6,
      },
    },
    {
      questionId: 'q_standalone_stability_rating',
      sectionId: 'standalone_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_standalone_stability_issues',
      sectionId: 'standalone_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '没有问题',
          'App 闪退',
          '无法连接设备',
          '频繁断开连接',
          '设备状态显示不准',
          '操作执行出错',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 7,
      },
    },
    {
      questionId: 'q_standalone_data_accuracy_rating',
      sectionId: 'standalone_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_standalone_data_accuracy_issues',
      sectionId: 'standalone_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '没有问题',
          '流量数据不准确',
          '设备状态更新延迟',
          '客户端信息不准',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 5,
      },
    },
    {
      questionId: 'q_standalone_feature_completeness_rating',
      sectionId: 'standalone_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_standalone_feature_gaps',
      sectionId: 'standalone_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '批量操作功能',
          '设备管理功能',
          '故障排查工具',
          '日志与报表功能',
          '高级网络配置',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 6,
      },
    },
    {
      questionId: 'q_standalone_convenience_rating',
      sectionId: 'standalone_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_standalone_convenience_issues',
      sectionId: 'standalone_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '没有问题',
          '操作步骤太多',
          '功能入口难找',
          '配置流程复杂',
          '缺少快捷操作',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 6,
      },
    },
    {
      questionId: 'q_standalone_learning_rating',
      sectionId: 'standalone_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_standalone_ui_rating',
      sectionId: 'standalone_experience',
      cardType: 'rating',
      cardConfig: {
        min: 1,
        max: 5,
        labels: { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' },
      },
    },
    {
      questionId: 'q_standalone_ui_issues',
      sectionId: 'standalone_experience',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '没有问题',
          '界面信息密度太高',
          '字体/图标太小',
          '颜色/对比度不好',
          '深色模式支持不好',
          '图表/数据可视化不直观',
          '布局不合理',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 8,
      },
    },

    // ── Section 7: Standalone NPS ─────────────────────────────────────────────
    {
      questionId: 'q_standalone_competitor_apps',
      sectionId: 'standalone_nps',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '从未使用过竞品',
          'UniFi Network',
          'Aruba Central',
          'Meraki Dashboard',
          'Huawei iMaster NCE',
          '锐捷网络 App',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 7,
      },
    },
    {
      questionId: 'q_standalone_nps_score',
      sectionId: 'standalone_nps',
      cardType: 'nps',
      cardConfig: {
        min: 0,
        max: 10,
        labels: { 0: '完全不会推荐', 10: '非常愿意推荐' },
        question: 'How likely are you to recommend Omada App (Standalone) to a friend or colleague?',
      },
    },
    {
      questionId: 'q_security_camera_usage_standalone',
      sectionId: 'standalone_nps',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['正在使用', '曾经使用过', '计划使用', '不打算使用'],
        allowOther: false,
      },
    },

    // ── Section 8: Security Survey ────────────────────────────────────────────
    {
      questionId: 'q_security_brands',
      sectionId: 'security_survey',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '只用 Omada',
          'UniFi Protect',
          'Verkada',
          'Reolink',
          'Hikvision（海康威视）',
          'Dahua（大华）',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 7,
      },
    },
    {
      questionId: 'q_security_scenarios',
      sectionId: 'security_survey',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '零售商店',
          '餐厅/咖啡厅',
          '家庭/住宅',
          '酒店/民宿',
          '办公室/写字楼',
          '仓库/工厂',
          '学校/教育机构',
          '为他人安装/维护',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 9,
      },
    },
    {
      questionId: 'q_security_purpose',
      sectionId: 'security_survey',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '实时监控',
          '事件告警通知',
          '事后录像回溯',
          '人车识别',
          '日常巡检',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 6,
      },
    },
    {
      questionId: 'q_security_operations',
      sectionId: 'security_survey',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          '实时监控查看',
          '录像回放',
          '下载录像片段',
          '搜索特定录像',
          '告警处理',
          '语音对讲',
          '摄像头配置管理',
          '录像计划设置',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 9,
      },
    },
    {
      questionId: 'q_security_wishlist',
      sectionId: 'security_survey',
      cardType: 'multi_select',
      cardConfig: {
        options: [
          'AI 智能搜索录像',
          '即时异常报警',
          '视频分享给他人',
          'AI 日报/事件总结',
          '智能侦测（人/车/宠物）',
          '自定义告警规则',
          '多设备统一管理',
          '可视化数据报表',
          '其他',
        ],
        minSelect: 1,
        maxSelect: 9,
      },
    },

    // ── Section 9: Demographics ───────────────────────────────────────────────
    {
      questionId: 'q_age_range',
      sectionId: 'demographics',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['小于18岁', '18-24岁', '25-34岁', '35-44岁', '45-54岁', '55岁及以上', '不愿透露'],
        allowOther: false,
      },
    },
    {
      questionId: 'q_gender',
      sectionId: 'demographics',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['男', '女', '其他', '不愿透露'],
        allowOther: false,
      },
    },
    {
      questionId: 'q_occupation',
      sectionId: 'demographics',
      cardType: 'multiple_choice',
      cardConfig: {
        options: [
          'IT 管理/运维',
          '网络工程师',
          '技术支持',
          '企业管理者',
          '个体经营者',
          '学生',
          '不愿透露',
          '其他',
        ],
        allowOther: false,
      },
    },
    {
      questionId: 'q_education',
      sectionId: 'demographics',
      cardType: 'multiple_choice',
      cardConfig: {
        options: ['高中及以下', '大专', '本科', '硕士及以上', '不愿透露'],
        allowOther: false,
      },
    },
  ];

  const behavior: AgentBehaviorConfig = {
    maxFollowUpRounds: 2,
    detectImpatience: true,
    allowSkipping: true,
    adaptiveDepth: true,
    transitionStyle: 'smooth',
  };

  const surveyAgent: SurveyAgent = {
    schema: surveySchema,
    promptTemplate,
    interactiveSkills,
    behavior,
  };

  const [inserted] = await db
    .insert(surveys)
    .values({
      title: 'Omada App 用户体验研究',
      description:
        '针对 TP-Link Omada App 用户的全面体验调研，覆盖 Controller 模式与 Standalone 模式，包含性能、稳定性、功能完整性、操作便捷性、学习引导、界面体验六大维度评价，以及 NPS 推荐度、安防功能附加调研和人口统计信息。',
      rawInput:
        'Omada App 用户体验调研：55题，9大板块。涵盖Controller/Standalone两种模式，6维度体验评分（性能/稳定性/数据准确性/功能完整性/操作便捷性/学习引导/界面体验），NPS推荐度，安防摄像头附加调研，人口统计。目标用户：Omada App实际使用者。',
      context: {
        product: 'TP-Link Omada App',
        targetUsers: 'Omada App 实际用户，包括家庭用户、商用网络管理员和专职网络工程师',
        focusAreas: [
          '性能表现',
          '稳定性',
          '数据准确及时性',
          '功能完整性',
          '操作便捷性',
          '学习与引导',
          '界面体验',
          'NPS 推荐度',
          '安防功能体验',
        ],
        additionalContext:
          '调研区分 Controller 模式和 Standalone 模式，根据用户的使用模式进行路由，避免无关问题。安防摄像头部分仅针对使用或曾经使用安防摄像头的用户。',
      } as unknown as Record<string, unknown>,
      schema: surveyAgent as unknown as Record<string, unknown>,
      settings: {
        maxDurationMinutes: 15,
        language: 'zh',
        tone: 'neutral',
      } as unknown as Record<string, unknown>,
      status: 'active',
      createdBy: null,
    })
    .returning({ id: surveys.id });

  console.log('');
  console.log('Survey created successfully!');
  console.log(`Survey ID: ${inserted.id}`);
  console.log(`Survey URL: http://localhost:3000/s/${inserted.id}`);
  console.log('');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
