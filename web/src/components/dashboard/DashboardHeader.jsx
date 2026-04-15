import React from 'react';
import { Button } from '@douyinfe/semi-ui';
import { RefreshCw, Search } from 'lucide-react';

const DashboardHeader = ({
  getGreeting,
  greetingVisible,
  quickRangeOptions,
  activeQuickRange,
  onQuickRangeChange,
  showSearchModal,
  refresh,
  loading,
  t,
}) => {
  const ICON_BUTTON_CLASS = 'text-white hover:bg-opacity-80 !rounded-full';

  return (
    <div className='flex flex-col gap-4 mb-4 lg:flex-row lg:items-center lg:justify-between'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6'>
        <h2
          className='text-2xl font-semibold text-gray-800 transition-opacity duration-1000 ease-in-out'
          style={{ opacity: greetingVisible ? 1 : 0 }}
        >
          {getGreeting}
        </h2>
        {quickRangeOptions.length > 0 && (
          <div className='inline-flex items-center gap-0.5 rounded-full bg-[#f4f4f5] p-[2px] border border-[#e4e4e7]'>
            {quickRangeOptions.map((option) => {
              const active = activeQuickRange === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onQuickRangeChange(option.value)}
                  className={`
                    relative flex items-center justify-center rounded-full
                    px-3 py-1 text-[12px] font-medium transition-all duration-200
                    ${
                      active
                        ? 'bg-white text-[#09090b] shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]'
                        : 'text-[#71717a] hover:text-[#18181b] hover:bg-[#e4e4e7]/50'
                    }
                  `}
                  style={{ minHeight: '24px' }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className='flex gap-3'>
        <Button
          type='tertiary'
          icon={<Search size={16} />}
          onClick={showSearchModal}
          className={`bg-green-500 hover:bg-green-600 ${ICON_BUTTON_CLASS}`}
        />
        <Button
          type='tertiary'
          icon={<RefreshCw size={16} />}
          onClick={refresh}
          loading={loading}
          className={`bg-blue-500 hover:bg-blue-600 ${ICON_BUTTON_CLASS}`}
        />
      </div>
    </div>
  );
};

export default DashboardHeader;
