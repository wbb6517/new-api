/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from 'react';
import { Progress, Divider, Empty } from '@douyinfe/semi-ui';
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from '@douyinfe/semi-illustrations';
import {
  timestamp2string,
  timestamp2string1,
  isDataCrossYear,
  copy,
  showSuccess,
} from './utils';
import {
  STORAGE_KEYS,
  DEFAULT_TIME_INTERVALS,
  DEFAULTS,
  ILLUSTRATION_SIZE,
  DEFAULT_DASHBOARD_QUICK_RANGE_OPTIONS,
} from '../constants/dashboard.constants';

const normalizeDashboardQuickRangeOption = (option, index) => {
  if (!option || typeof option !== 'object') {
    return null;
  }

  const value = String(option.value || '').trim();
  const label = String(option.label || '').trim();

  if (!value || !label) {
    return null;
  }

  return {
    value,
    label,
    rangeType: option.rangeType === 'today' ? 'today' : 'relative',
    amount: Math.max(Number(option.amount) || 1, 1),
    unit: ['hour', 'day', 'week'].includes(option.unit) ? option.unit : 'day',
    granularity: ['hour', 'day', 'week'].includes(option.granularity)
      ? option.granularity
      : getDefaultTime(),
    enabled: option.enabled !== false,
    sort: Number(option.sort) || index,
  };
};

export const getDefaultTime = () => {
  return localStorage.getItem(STORAGE_KEYS.DATA_EXPORT_DEFAULT_TIME) || 'hour';
};

export const getDashboardQuickRangeEnabled = (overrideValue) => {
  if (overrideValue !== undefined && overrideValue !== null) {
    return overrideValue === true || overrideValue === 'true';
  }

  const storedValue = localStorage.getItem(
    STORAGE_KEYS.DATA_EXPORT_QUICK_RANGE_ENABLED,
  );
  return storedValue === null ? true : storedValue === 'true';
};

export const getDefaultQuickRange = (overrideValue) => {
  if (overrideValue !== undefined && overrideValue !== null) {
    const normalizedValue = String(overrideValue).trim();
    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return (
    localStorage.getItem(STORAGE_KEYS.DATA_EXPORT_DEFAULT_QUICK_RANGE) || '7d'
  );
};

export const getDashboardQuickRangeOptions = (overrideValue) => {
  const rawValue =
    overrideValue !== undefined && overrideValue !== null
      ? overrideValue
      : localStorage.getItem(STORAGE_KEYS.DATA_EXPORT_QUICK_RANGE_OPTIONS);

  const fallbackOptions = DEFAULT_DASHBOARD_QUICK_RANGE_OPTIONS.map((option, index) => ({
    ...option,
    sort: index,
  }));

  if (!rawValue) {
    return fallbackOptions;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return fallbackOptions;
    }

    const normalizedOptions = parsedValue
      .map((option, index) => normalizeDashboardQuickRangeOption(option, index))
      .filter(Boolean)
      .sort((a, b) => a.sort - b.sort);

    return normalizedOptions.length > 0 ? normalizedOptions : fallbackOptions;
  } catch {
    return fallbackOptions;
  }
};

export const getEnabledDashboardQuickRangeOptions = (
  enabledOverride,
  optionsOverride,
) => {
  if (!getDashboardQuickRangeEnabled(enabledOverride)) {
    return [];
  }

  return getDashboardQuickRangeOptions(optionsOverride).filter(
    (option) => option.enabled,
  );
};

export const getTimeInterval = (timeType, isSeconds = false) => {
  const intervals =
    DEFAULT_TIME_INTERVALS[timeType] || DEFAULT_TIME_INTERVALS.hour;
  return isSeconds ? intervals.seconds : intervals.minutes;
};

export const getInitialTimestamp = () => {
  const defaultTime = getDefaultTime();
  const now = new Date().getTime() / 1000;

  switch (defaultTime) {
    case 'hour':
      return timestamp2string(now - 86400);
    case 'week':
      return timestamp2string(now - 86400 * 30);
    default:
      return timestamp2string(now - 86400 * 7);
  }
};

const getQuickRangeDurationInSeconds = (amount, unit) => {
  switch (unit) {
    case 'hour':
      return amount * 3600;
    case 'week':
      return amount * 7 * 24 * 3600;
    case 'day':
    default:
      return amount * 24 * 3600;
  }
};

const parseDashboardTimestamp = (value) => {
  if (!value) return null;
  const parsedValue = Date.parse(String(value).replace(/-/g, '/'));
  return Number.isNaN(parsedValue) ? null : Math.floor(parsedValue / 1000);
};

const getDayBucketStart = (timestamp) => {
  const date = new Date(timestamp * 1000);
  date.setHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
};

const getHourBucketStart = (timestamp) => Math.floor(timestamp / 3600) * 3600;

const normalizeRangeStartForGranularity = (rangeStartTimestamp, granularity) => {
  if (!rangeStartTimestamp) return null;
  if (granularity === 'hour') {
    return getHourBucketStart(rangeStartTimestamp);
  }
  return getDayBucketStart(rangeStartTimestamp);
};

const getBucketStartTimestamp = (
  timestamp,
  granularity,
  rangeStartTimestamp = null,
) => {
  switch (granularity) {
    case 'hour':
      return getHourBucketStart(timestamp);
    case 'week': {
      const anchorTimestamp =
        normalizeRangeStartForGranularity(rangeStartTimestamp, granularity) ||
        getDayBucketStart(timestamp);
      const interval = DEFAULT_TIME_INTERVALS.week.seconds;
      return (
        anchorTimestamp +
        Math.floor((timestamp - anchorTimestamp) / interval) * interval
      );
    }
    case 'day':
    default:
      return getDayBucketStart(timestamp);
  }
};

const formatBucketLabel = (bucketStartTimestamp, granularity, showYear = false) =>
  timestamp2string1(bucketStartTimestamp, granularity, showYear);


export const getDashboardQuickRangeState = (range) => {
  const options = getDashboardQuickRangeOptions();
  const matchedOption =
    options.find((option) => option.value === range) ||
    DEFAULT_DASHBOARD_QUICK_RANGE_OPTIONS.find((option) => option.value === range) ||
    DEFAULT_DASHBOARD_QUICK_RANGE_OPTIONS[0];

  const now = new Date();
  const end = new Date(now.getTime());
  let start = new Date(now);

  if (matchedOption.rangeType === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else {
    const durationSeconds = getQuickRangeDurationInSeconds(
      matchedOption.amount,
      matchedOption.unit,
    );
    start = new Date(now.getTime() - durationSeconds * 1000);
  }

  return {
    start_timestamp: timestamp2string(start.getTime() / 1000),
    end_timestamp: timestamp2string(end.getTime() / 1000),
    data_export_default_time: matchedOption.granularity || getDefaultTime(),
  };
};

// ========== 数据处理工具函数 ==========
export const updateMapValue = (map, key, value) => {
  if (!map.has(key)) {
    map.set(key, 0);
  }
  map.set(key, map.get(key) + value);
};

export const initializeMaps = (key, ...maps) => {
  maps.forEach((map) => {
    if (!map.has(key)) {
      map.set(key, 0);
    }
  });
};

// ========== 图表相关工具函数 ==========
export const updateChartSpec = (
  setterFunc,
  newData,
  subtitle,
  newColors,
  dataId,
) => {
  setterFunc((prev) => ({
    ...prev,
    data: [{ id: dataId, values: newData }],
    title: {
      ...prev.title,
      subtext: subtitle,
    },
    color: {
      specified: newColors,
    },
  }));
};

export const getTrendSpec = (data, color) => ({
  type: 'line',
  data: [{ id: 'trend', values: data.map((val, idx) => ({ x: idx, y: val })) }],
  xField: 'x',
  yField: 'y',
  height: 40,
  width: 100,
  axes: [
    {
      orient: 'bottom',
      visible: false,
    },
    {
      orient: 'left',
      visible: false,
    },
  ],
  padding: 0,
  autoFit: false,
  legends: { visible: false },
  tooltip: { visible: false },
  crosshair: { visible: false },
  line: {
    style: {
      stroke: color,
      lineWidth: 2,
    },
  },
  point: {
    visible: false,
  },
  background: {
    fill: 'transparent',
  },
});

// ========== UI 工具函数 ==========
export const createSectionTitle = (Icon, text) => (
  <div className='flex items-center gap-2'>
    <Icon size={16} />
    {text}
  </div>
);

export const createFormField = (Component, props, FORM_FIELD_PROPS) => (
  <Component {...FORM_FIELD_PROPS} {...props} />
);

// ========== 操作处理函数 ==========
export const handleCopyUrl = async (url, t) => {
  if (await copy(url)) {
    showSuccess(t('复制成功'));
  }
};

export const handleSpeedTest = (apiUrl) => {
  const encodedUrl = encodeURIComponent(apiUrl);
  const speedTestUrl = `https://www.tcptest.cn/http/${encodedUrl}`;
  window.open(speedTestUrl, '_blank', 'noopener,noreferrer');
};

// ========== 状态映射函数 ==========
export const getUptimeStatusColor = (status, uptimeStatusMap) =>
  uptimeStatusMap[status]?.color || '#8b9aa7';

export const getUptimeStatusText = (status, uptimeStatusMap, t) =>
  uptimeStatusMap[status]?.text || t('未知');

// ========== 监控列表渲染函数 ==========
export const renderMonitorList = (
  monitors,
  getUptimeStatusColor,
  getUptimeStatusText,
  t,
) => {
  if (!monitors || monitors.length === 0) {
    return (
      <div className='flex justify-center items-center py-4'>
        <Empty
          image={<IllustrationConstruction style={ILLUSTRATION_SIZE} />}
          darkModeImage={
            <IllustrationConstructionDark style={ILLUSTRATION_SIZE} />
          }
          title={t('暂无监控数据')}
        />
      </div>
    );
  }

  const grouped = {};
  monitors.forEach((m) => {
    const g = m.group || '';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(m);
  });

  const renderItem = (monitor, idx) => (
    <div key={idx} className='p-2 hover:bg-white rounded-lg transition-colors'>
      <div className='flex items-center justify-between mb-1'>
        <div className='flex items-center gap-2'>
          <div
            className='w-2 h-2 rounded-full flex-shrink-0'
            style={{ backgroundColor: getUptimeStatusColor(monitor.status) }}
          />
          <span className='text-sm font-medium text-gray-900'>
            {monitor.name}
          </span>
        </div>
        <span className='text-xs text-gray-500'>
          {((monitor.uptime || 0) * 100).toFixed(2)}%
        </span>
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-xs text-gray-500'>
          {getUptimeStatusText(monitor.status)}
        </span>
        <div className='flex-1'>
          <Progress
            percent={(monitor.uptime || 0) * 100}
            showInfo={false}
            aria-label={`${monitor.name} uptime`}
            stroke={getUptimeStatusColor(monitor.status)}
          />
        </div>
      </div>
    </div>
  );

  return Object.entries(grouped).map(([gname, list]) => (
    <div key={gname || 'default'} className='mb-2'>
      {gname && (
        <>
          <div className='text-md font-semibold text-gray-500 px-2 py-1'>
            {gname}
          </div>
          <Divider />
        </>
      )}
      {list.map(renderItem)}
    </div>
  ));
};

// ========== 数据处理函数 ==========
export const processRawData = (
  data,
  dataExportDefaultTime,
  initializeMaps,
  updateMapValue,
  rangeStartTimestamp = null,
) => {
  const result = {
    totalQuota: 0,
    totalTimes: 0,
    totalTokens: 0,
    uniqueModels: new Set(),
    timePoints: [],
    timeQuotaMap: new Map(),
    timeTokensMap: new Map(),
    timeCountMap: new Map(),
  };

  // 检查数据是否跨年
  const showYear = isDataCrossYear(data.map((item) => item.created_at));

  data.forEach((item) => {
    result.uniqueModels.add(item.model_name);
    result.totalTokens += item.token_used;
    result.totalQuota += item.quota;
    result.totalTimes += item.count;

    const bucketStartTimestamp = getBucketStartTimestamp(
      item.created_at,
      dataExportDefaultTime,
      rangeStartTimestamp,
    );
    const timeKey = formatBucketLabel(
      bucketStartTimestamp,
      dataExportDefaultTime,
      showYear,
    );
    if (!result.timePoints.includes(timeKey)) {
      result.timePoints.push(timeKey);
    }

    initializeMaps(
      timeKey,
      result.timeQuotaMap,
      result.timeTokensMap,
      result.timeCountMap,
    );
    updateMapValue(result.timeQuotaMap, timeKey, item.quota);
    updateMapValue(result.timeTokensMap, timeKey, item.token_used);
    updateMapValue(result.timeCountMap, timeKey, item.count);
  });

  result.timePoints.sort();
  return result;
};

export const calculateTrendData = (
  timePoints,
  timeQuotaMap,
  timeTokensMap,
  timeCountMap,
  dataExportDefaultTime,
) => {
  const quotaTrend = timePoints.map((time) => timeQuotaMap.get(time) || 0);
  const tokensTrend = timePoints.map((time) => timeTokensMap.get(time) || 0);
  const countTrend = timePoints.map((time) => timeCountMap.get(time) || 0);

  const rpmTrend = [];
  const tpmTrend = [];

  if (timePoints.length >= 2) {
    const interval = getTimeInterval(dataExportDefaultTime);

    for (let i = 0; i < timePoints.length; i++) {
      rpmTrend.push(timeCountMap.get(timePoints[i]) / interval);
      tpmTrend.push(timeTokensMap.get(timePoints[i]) / interval);
    }
  }

  return {
    balance: [],
    usedQuota: [],
    requestCount: [],
    times: countTrend,
    consumeQuota: quotaTrend,
    tokens: tokensTrend,
    rpm: rpmTrend,
    tpm: tpmTrend,
  };
};

export const aggregateDataByTimeAndModel = (
  data,
  dataExportDefaultTime,
  rangeStartTimestamp = null,
) => {
  const aggregatedData = new Map();

  // 检查数据是否跨年
  const showYear = isDataCrossYear(data.map((item) => item.created_at));

  data.forEach((item) => {
    const bucketStartTimestamp = getBucketStartTimestamp(
      item.created_at,
      dataExportDefaultTime,
      rangeStartTimestamp,
    );
    const timeKey = formatBucketLabel(
      bucketStartTimestamp,
      dataExportDefaultTime,
      showYear,
    );
    const modelKey = item.model_name;
    const key = `${timeKey}-${modelKey}`;

    if (!aggregatedData.has(key)) {
      aggregatedData.set(key, {
        time: timeKey,
        model: modelKey,
        quota: 0,
        count: 0,
      });
    }

    const existing = aggregatedData.get(key);
    existing.quota += item.quota;
    existing.count += item.count;
  });

  return aggregatedData;
};

export const generateChartTimePoints = (
  aggregatedData,
  data,
  dataExportDefaultTime,
  startTsStr = null,
  endTsStr = null,
) => {
  const parsedStartTimestamp = parseDashboardTimestamp(startTsStr);
  const parsedEndTimestamp = parseDashboardTimestamp(endTsStr);
  const interval = getTimeInterval(dataExportDefaultTime, true);

  let lastTime =
    parsedEndTimestamp !== null
      ? parsedEndTimestamp
      : Math.max(
          ...(data || []).map((item) => item.created_at),
          Date.now() / 1000,
        );
  let firstTime =
    parsedStartTimestamp !== null
      ? parsedStartTimestamp
      : Math.min(
          ...(data || []).map((item) => item.created_at),
          lastTime - 7 * interval,
        );

  const normalizedRangeStart = normalizeRangeStartForGranularity(
    firstTime,
    dataExportDefaultTime,
  );
  const normalizedRangeEnd = getBucketStartTimestamp(
    lastTime,
    dataExportDefaultTime,
    normalizedRangeStart,
  );

  let count = 1;
  if (startTsStr && endTsStr) {
    const rawSpan = Math.max(lastTime - firstTime, 0);
    if (dataExportDefaultTime === 'week') {
      count = Math.max(Math.ceil(rawSpan / interval), 1);
    } else {
      count = Math.max(Math.floor(rawSpan / interval), 1);
    }
  } else {
    const diff = normalizedRangeEnd - normalizedRangeStart;
    count = Math.max(Math.floor(diff / interval), 0) + 1;
  }

  const alignedStart = normalizedRangeEnd - (count - 1) * interval;

  const generatedTimestamps = [];
  for (let i = 0; i < count; i++) {
    generatedTimestamps.push(alignedStart + i * interval);
  }

  // 仅在非快捷范围且点太少时做美观补齐
  if (
    !(startTsStr && endTsStr) &&
    generatedTimestamps.length < DEFAULTS.MAX_TREND_POINTS
  ) {
    const missingCount = DEFAULTS.MAX_TREND_POINTS - generatedTimestamps.length;
    for (let i = 1; i <= missingCount; i++) {
      generatedTimestamps.unshift(normalizedRangeStart - i * interval);
    }
  }

  const showYear = isDataCrossYear(generatedTimestamps);
  return generatedTimestamps.map((timestamp) =>
    formatBucketLabel(timestamp, dataExportDefaultTime, showYear),
  );
};

// ========== 用户维度数据处理 ==========
export const processUserData = (
  data,
  dataExportDefaultTime,
  limit = 10,
  rangeStartTimestamp = null,
) => {
  const userQuotaTotal = new Map();
  data.forEach((item) => {
    const prev = userQuotaTotal.get(item.username) || 0;
    userQuotaTotal.set(item.username, prev + item.quota);
  });

  const sorted = Array.from(userQuotaTotal.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const topUsers = sorted.slice(0, limit).map(([u]) => u);
  const topUserSet = new Set(topUsers);

  const rankingData = sorted.slice(0, limit).map(([username, quota]) => ({
    User: username,
    Quota: quota,
  }));

  const showYear = isDataCrossYear(data.map((item) => item.created_at));

  const timeUserMap = new Map();
  const allTimePoints = new Set();

  data.forEach((item) => {
    const bucketStartTimestamp = getBucketStartTimestamp(
      item.created_at,
      dataExportDefaultTime,
      rangeStartTimestamp,
    );
    const timeKey = formatBucketLabel(
      bucketStartTimestamp,
      dataExportDefaultTime,
      showYear,
    );
    allTimePoints.add(timeKey);
    const user = topUserSet.has(item.username) ? item.username : null;
    if (!user) return;
    const key = `${timeKey}-${user}`;
    const prev = timeUserMap.get(key) || { quota: 0 };
    timeUserMap.set(key, { quota: prev.quota + item.quota });
  });

  const sortedTimePoints = Array.from(allTimePoints).sort();
  const trendData = [];
  sortedTimePoints.forEach((time) => {
    topUsers.forEach((user) => {
      const key = `${time}-${user}`;
      const val = timeUserMap.get(key);
      trendData.push({
        Time: time,
        User: user,
        Quota: val?.quota || 0,
      });
    });
  });

  return { rankingData, trendData, topUsers };
};
