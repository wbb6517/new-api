import React from 'react';

const HomeAdvantagesSection = ({ items, metrics }) => {
  return (
    <section className='home-landing-section home-advantages-section'>
      <div className='home-section-shell home-advantages-layout'>
        <div>
          <div className='home-section-heading'>
            <div className='home-brand-chip'>Ours AI</div>
            <h2>稳定、透明、可观测</h2>
            <p>把多家模型供应商接入统一分发，按场景路由与运营信息统一展示。</p>
          </div>
          <div className='home-advantages-grid'>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.key} className='home-soft-card home-advantage-card'>
                  <div className='home-advantage-icon'>
                    <Icon size='default' />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
        <div className='home-observability-card'>
          <div className='home-observability-center'>Ours AI</div>
          <div className='home-observability-left'>
            <span>Web App</span>
            <span>SDK</span>
            <span>CLI</span>
          </div>
          <div className='home-observability-right'>
            <span>模型节点 A</span>
            <span>模型节点 B</span>
            <span>模型节点 C</span>
          </div>
          <div className='home-observability-lines' />
        </div>
      </div>
      <div className='home-section-shell'>
        <div className='home-metrics-row'>
          {metrics.map((metric) => (
            <div key={metric.label} className='home-metric-item'>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeAdvantagesSection;
