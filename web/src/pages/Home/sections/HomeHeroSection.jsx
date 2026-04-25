import React from 'react';
import {
  Button,
  Input,
  ScrollItem,
  ScrollList,
  Typography,
} from '@douyinfe/semi-ui';
import { IconCopy, IconFile, IconPlay } from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import {
  Moonshot,
  OpenAI,
  XAI,
  Zhipu,
  Volcengine,
  Cohere,
  Claude,
  Gemini,
  Suno,
  Minimax,
  Wenxin,
  Spark,
  Qingyan,
  DeepSeek,
  Qwen,
  Midjourney,
  Grok,
  AzureAI,
  Hunyuan,
  Xinference,
} from '@lobehub/icons';

const { Text } = Typography;

const providerIcons = [
  Moonshot,
  OpenAI,
  XAI,
  Zhipu.Color,
  Volcengine.Color,
  Cohere.Color,
  Claude.Color,
  Gemini.Color,
  Suno,
  Minimax.Color,
  Wenxin.Color,
  Spark.Color,
  Qingyan.Color,
  DeepSeek.Color,
  Qwen.Color,
  Midjourney,
  Grok,
  AzureAI.Color,
  Hunyuan.Color,
  Xinference.Color,
];

const HomeHeroSection = ({
  t,
  serverAddress,
  endpointItems,
  endpointIndex,
  setEndpointIndex,
  handleCopyBaseURL,
  isDemoSiteMode,
  docsLink,
  version,
  isMobile,
}) => {
  const endpointValue = endpointItems[endpointIndex]?.value || '';

  return (
    <section className='home-landing-section home-hero-section'>
      <div className='home-hero-decor home-hero-decor-left' />
      <div className='home-hero-decor home-hero-decor-right' />
      <div className='home-section-shell home-hero-shell'>
        <div className='home-hero-main'>
          <div className='home-hero-copy'>
            <div className='home-brand-chip'>Ours AI</div>
            <h1 className='home-hero-title'>
              {t('统一的')}
              <br />
              {t('大模型接口网关')}
            </h1>
            <p className='home-hero-subtitle'>
              {t('更好的价格，更好的稳定性，一次接入多家模型供应商')}
            </p>
            <div className='home-base-url-bar'>
              <Input
                readonly
                value={serverAddress}
                size={isMobile ? 'default' : 'large'}
                className='home-base-url-input'
                suffix={
                  <div className='home-base-url-suffix'>
                    <ScrollList
                      bodyHeight={28}
                      style={{ border: 'unset', boxShadow: 'unset' }}
                    >
                      <ScrollItem
                        mode='wheel'
                        cycled
                        list={endpointItems}
                        selectedIndex={endpointIndex}
                        onSelect={({ index }) => setEndpointIndex(index)}
                      />
                    </ScrollList>
                    <Button
                      theme='borderless'
                      icon={<IconCopy />}
                      onClick={handleCopyBaseURL}
                      aria-label={t('复制')}
                    />
                  </div>
                }
              />
            </div>
            <div className='home-hero-actions'>
              <Link to='/console'>
                <Button
                  theme='solid'
                  type='primary'
                  size={isMobile ? 'default' : 'large'}
                  className='home-primary-button'
                  icon={<IconPlay />}
                >
                  {t('获取密钥')}
                </Button>
              </Link>
              {isDemoSiteMode && version ? (
                <Button
                  size={isMobile ? 'default' : 'large'}
                  className='home-secondary-button'
                >
                  {version}
                </Button>
              ) : (
                docsLink && (
                  <Button
                    size={isMobile ? 'default' : 'large'}
                    className='home-secondary-button'
                    icon={<IconFile />}
                    onClick={() => window.open(docsLink, '_blank')}
                  >
                    {t('查看文档')}
                  </Button>
                )
              )}
            </div>
          </div>
          <div className='home-terminal-card'>
            <div className='home-terminal-toolbar'>
              <span />
              <span />
              <span />
            </div>
            <pre className='home-terminal-code'>{`# 推荐基址
BASE_URL="${serverAddress}"
API_KEY="sk-********************************"
ENDPOINT="${endpointValue}"

curl ${serverAddress}/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "你好"}]
  }'`}</pre>
          </div>
        </div>
        <div className='home-provider-strip'>
          <Text type='tertiary' className='home-provider-title'>
            {t('支持众多的大模型供应商')}
          </Text>
          <div className='home-provider-grid'>
            {providerIcons.map((ProviderIcon, index) => (
              <div key={index} className='home-provider-icon'>
                <ProviderIcon size={24} />
              </div>
            ))}
            <div className='home-provider-count'>30+</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSection;
