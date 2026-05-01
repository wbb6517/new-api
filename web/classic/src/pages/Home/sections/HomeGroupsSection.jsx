import React from 'react';
import { Table, Tag } from '@douyinfe/semi-ui';

const HomeGroupsSection = ({ cards, rows }) => {
  const dataSource = rows.map(([group, ratio, scene], index) => ({
    key: index,
    group,
    ratio,
    scene,
  }));

  const columns = [
    {
      title: '分组',
      dataIndex: 'group',
      render: (text) => <span className='home-group-name'>{text}</span>,
    },
    {
      title: '倍率',
      dataIndex: 'ratio',
      render: (text) => <Tag color='orange'>{text}</Tag>,
    },
    {
      title: '适用场景',
      dataIndex: 'scene',
    },
  ];

  return (
    <section className='home-landing-section home-groups-section'>
      <div className='home-section-shell'>
        <div className='home-section-heading center'>
          <h2>按场景选择分组令牌</h2>
          <p>一个控制台管理不同工具、模型与预算策略</p>
        </div>
        <div className='home-group-card-row'>
          {cards.map((card) => (
            <article key={card.key} className='home-soft-card home-group-card'>
              <div className='home-group-card-top'>
                <h3>{card.title}</h3>
                {card.badge ? <Tag color='orange'>{card.badge}</Tag> : null}
              </div>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
        <div className='home-group-table-wrap'>
          <Table columns={columns} dataSource={dataSource} pagination={false} />
        </div>
      </div>
    </section>
  );
};

export default HomeGroupsSection;
