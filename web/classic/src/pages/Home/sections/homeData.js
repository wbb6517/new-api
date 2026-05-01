import {
  IconGlobe,
  IconArrowRight,
  IconCode,
  IconCommand,
  IconComment,
  IconHistogram,
  IconLink,
  IconMoneyExchangeStroked,
  IconPulse,
  IconServer,
  IconKey,
} from '@douyinfe/semi-icons';

export const HOME_TOOL_ITEMS = [
  {
    key: 'claude-code',
    title: 'Claude Code',
    description: '针对 Anthropic 生态深度优化，稳定路由、低延迟、高可用。',
    cta: '查看配置',
    icon: IconCommand,
  },
  {
    key: 'codex',
    title: 'Codex',
    description: '适配 OpenAI Codex 使用场景，智能路由、高并发更流畅。',
    cta: '查看配置',
    icon: IconCode,
  },
  {
    key: 'gemini-cli',
    title: 'Gemini CLI',
    description: '原生支持 Gemini CLI，自动切换最优节点，提升稳定性与速度。',
    cta: '查看配置',
    icon: IconComment,
  },
  {
    key: 'openai',
    title: 'OpenAI 兼容',
    description: '兼容 OpenAI 协议格式，支持主流客户端无缝接入。',
    cta: '查看配置',
    icon: IconGlobe,
  },
];

export const HOME_ADVANTAGES = [
  {
    key: 'routing',
    title: '智能路由',
    description: '基于可用性、延迟、价格等多维度自动选择最优模型，保障稳定响应。',
    icon: IconServer,
  },
  {
    key: 'pricing',
    title: '价格透明',
    description: '统一计费与倍率映射，实时展示模型价格与用量，费用一目了然。',
    icon: IconMoneyExchangeStroked,
  },
  {
    key: 'quota',
    title: '额度看板',
    description: '多维度额度监控与预警，用量趋势可视化，资源规划更从容。',
    icon: IconHistogram,
  },
  {
    key: 'logs',
    title: '日志追踪',
    description: '全链路请求日志与调用明细，快速定位问题，审计与合规更可靠。',
    icon: IconPulse,
  },
];

export const HOME_METRICS = [
  { label: '可用性', value: '99.95%' },
  { label: '平均延迟', value: '320 ms' },
  { label: '今日调用', value: '2.58 M' },
  { label: '错误率', value: '0.03%' },
];

export const HOME_GROUP_CARDS = [
  {
    key: 'api',
    title: '通用 API',
    badge: '推荐',
    description: '适用于各类模型与工具调用，灵活稳定，覆盖大多数集成场景。',
  },
  {
    key: 'claude',
    title: 'Claude Code 专用',
    description: '针对 Claude Code 深度优化，兼容最佳实践，稳定高效。',
  },
  {
    key: 'codex',
    title: 'Codex 专用',
    description: '为 Codex 场景优化令牌策略，提升上下文与代码生成效率。',
  },
  {
    key: 'gemini',
    title: 'Gemini CLI',
    description: '适配 Gemini CLI 使用习惯，兼顾速度与稳定性，开箱即用。',
  },
  {
    key: 'private',
    title: '经济分组',
    description: '更低成本优先，适合批量任务、测试环境与预算敏感场景。',
  },
];

export const HOME_GROUP_ROWS = [
  ['通用 API', '标准倍率', '通用调用、多模型兼容、第三方应用集成'],
  ['Claude Code 专用', '优化倍率', 'Claude Code 日常开发、智能路由、长会话场景'],
  ['Codex 专用', '优化倍率', '代码生成、仓库级任务、长上下文处理'],
  ['Gemini CLI', '优化倍率', 'Gemini CLI 交互、命令行工作流、自动化脚本'],
  ['经济分组', '经济倍率', '批量任务、测试验证、低优先级或非实时任务'],
];

export const HOME_QUICKSTART_STEPS = [
  {
    key: 'key',
    title: '创建密钥',
    description: '在控制台创建 API Key，用于身份认证。',
    icon: IconKey,
  },
  {
    key: 'base-url',
    title: '替换 Base URL',
    description: '将请求的 Base URL 替换为 Ours AI 提供的地址。',
    icon: IconLink,
  },
  {
    key: 'start',
    title: '开始请求',
    description: '使用 OpenAI 兼容的接口格式发起请求。',
    icon: IconArrowRight,
  },
];

export const HOME_FAQ_ITEMS = [
  {
    key: 'key',
    title: '如何获取 API Key？',
    content: '登录后进入【控制台 - API 密钥】页面，点击“创建密钥”即可生成新的 API Key。',
  },
  {
    key: 'stream',
    title: '是否支持流式输出？',
    content: '支持。Ours AI 完全兼容 OpenAI 的流式（stream: true）输出，提供流畅的打字机体验。',
  },
  {
    key: 'billing',
    title: '如何查看用量？',
    content: '在【控制台 - 个人设置】或【日志】页面可以实时查看消费明细与剩余额度。',
  },
];
