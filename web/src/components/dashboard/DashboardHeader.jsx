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
          <div className='inline-flex h-8 items-center rounded-full bg-semi-color-fill-0 p-0.5'>
            {quickRangeOptions.map((option) => {
              const active = activeQuickRange === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onQuickRangeChange(option.value)}
                  className={`
                    h-7 min-w-[56px] px-2 rounded-full whitespace-nowrap
                    text-xs font-medium transition-colors duration-200
                    ${
                      active
                        ? 'bg-semi-color-fill-0 text-semi-color-text-0'
                        : 'text-semi-color-text-1 hover:bg-semi-color-fill-0 hover:text-semi-color-text-0'
                    }
                  `}
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
