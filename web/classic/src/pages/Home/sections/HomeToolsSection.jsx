import React from 'react';
import { Button } from '@douyinfe/semi-ui';
import { IconArrowRight } from '@douyinfe/semi-icons';

const HomeToolsSection = ({ items }) => {
  return (
    <section className='home-landing-section home-tools-section'>
      <div className='home-section-shell'>
        <div className='home-section-heading center'>
          <h2>原生支持，多工具链接入</h2>
          <p>
            原生适配 Claude Code、Codex、Gemini CLI 与 OpenAI 兼容客户端体验
          </p>
        </div>
        <div className='home-tools-grid'>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.key} className='home-soft-card home-tool-card'>
                <div className='home-tool-icon'>
                  <Icon size='large' />
                </div>
                <div className='home-tool-copy'>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <Button
                    theme='borderless'
                    icon={<IconArrowRight />}
                    iconPosition='right'
                    className='home-link-button'
                  >
                    {item.cta}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeToolsSection;
