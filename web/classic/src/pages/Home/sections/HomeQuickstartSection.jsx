import React from 'react';
import { Button, Collapse } from '@douyinfe/semi-ui';
import { IconChevronRight, IconPlus, IconMinus } from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';

const HomeQuickstartSection = ({ steps, faqItems, serverAddress }) => {
  return (
    <section className='home-landing-section home-quickstart-section'>
      <div className='home-section-shell'>
        <div className='home-quickstart-grid'>
          <article className='home-soft-card home-quickstart-card'>
            <h2>三步完成接入</h2>
            <p className='home-card-subtitle'>几分钟完成配置，即可通过统一接口访问多家模型供应商。</p>
            <div className='home-quickstart-steps'>
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.key} className='home-step-item'>
                    <div className='home-step-marker'>{index + 1}</div>
                    <div className='home-step-icon'>
                      <Icon size='default' />
                    </div>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <pre className='home-inline-code'>{`curl ${serverAddress}/v1/chat/completions \\
  -H "Authorization: Bearer sk-xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"你好"}]}'`}</pre>
          </article>
          <article className='home-soft-card home-faq-card'>
            <h2>常见问题</h2>
            <p className='home-card-subtitle'>快速找到相关问题说明。</p>
            <Collapse
              accordion
              expandIcon={<IconPlus />}
              collapseIcon={<IconMinus />}
              className='home-faq-collapse'
            >
              {faqItems.map((item) => (
                <Collapse.Panel header={item.title} itemKey={item.key} key={item.key}>
                  <p>{item.content}</p>
                </Collapse.Panel>
              ))}
            </Collapse>
          </article>
        </div>
        <div className='home-bottom-banner'>
          <div>
            <h3>开始构建，享受更稳定、更经济的模型调用体验</h3>
            <p>统一接口、灵活路由、能力分组与日志观测协同工作。</p>
          </div>
          <Link to='/console'>
            <Button theme='solid' type='primary' icon={<IconChevronRight />}>
              进入控制台
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeQuickstartSection;
