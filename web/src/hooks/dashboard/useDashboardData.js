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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, isAdmin, showError, timestamp2string } from '../../helpers';
import {
  getDefaultTime,
  getInitialTimestamp,
  getDashboardQuickRangeState,
  getEnabledDashboardQuickRangeOptions,
  getDashboardQuickRangeEnabled,
  getDefaultQuickRange,
} from '../../helpers/dashboard';
import {
  TIME_OPTIONS,
} from '../../constants/dashboard.constants';
import { useIsMobile } from '../common/useIsMobile';
import { useMinimumLoadingTime } from '../common/useMinimumLoadingTime';

export const useDashboardData = (userState, userDispatch, statusState) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const initialized = useRef(false);
  const statusQuickRangeEnabled = statusState?.status?.data_export_quick_range_enabled;
  const statusDefaultQuickRange = statusState?.status?.data_export_default_quick_range;
  const statusQuickRangeOptions = statusState?.status?.data_export_quick_range_options;

  // 初始值设为兜底值
  const initialQuickRange = getDefaultQuickRange();
  const initialQuickRangeState = getDashboardQuickRangeState(initialQuickRange);

  // ========== 基础状态 ==========
  const [loading, setLoading] = useState(false);
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const showLoading = useMinimumLoadingTime(loading);

  // ========== 输入状态 ==========
  const [inputs, setInputs] = useState({
    username: '',
    token_name: '',
    model_name: '',
    start_timestamp: initialQuickRangeState.start_timestamp,
    end_timestamp: initialQuickRangeState.end_timestamp,
    channel: '',
    data_export_default_time: initialQuickRangeState.data_export_default_time,
  });

  const [dataExportDefaultTime, setDataExportDefaultTime] = useState(
    initialQuickRangeState.data_export_default_time,
  );
  const [activeQuickRange, setActiveQuickRange] = useState(initialQuickRange);
  const [quickRangeEnabled, setQuickRangeEnabled] = useState(
    getDashboardQuickRangeEnabled(),
  );

  // ========== 数据状态 ==========
  const [quotaData, setQuotaData] = useState([]);
  const [consumeQuota, setConsumeQuota] = useState(0);
  const [consumeTokens, setConsumeTokens] = useState(0);
  const [times, setTimes] = useState(0);
  const [pieData, setPieData] = useState([{ type: 'null', value: '0' }]);
  const [lineData, setLineData] = useState([]);
  const [modelColors, setModelColors] = useState({});

  // ========== 图表状态 ==========
  const [activeChartTab, setActiveChartTab] = useState('1');

  // ========== 趋势数据 ==========
  const [trendData, setTrendData] = useState({
    balance: [],
    usedQuota: [],
    requestCount: [],
    times: [],
    consumeQuota: [],
    tokens: [],
    rpm: [],
    tpm: [],
  });

  // ========== Uptime 数据 ==========
  const [uptimeData, setUptimeData] = useState([]);
  const [uptimeLoading, setUptimeLoading] = useState(false);
  const [activeUptimeTab, setActiveUptimeTab] = useState('');

  // ========== 常量 ==========
  const now = new Date();
  const isAdminUser = isAdmin();

  // ========== Panel enable flags ==========
  const apiInfoEnabled = statusState?.status?.api_info_enabled ?? true;
  const announcementsEnabled =
    statusState?.status?.announcements_enabled ?? true;
  const faqEnabled = statusState?.status?.faq_enabled ?? true;
  const uptimeEnabled = statusState?.status?.uptime_kuma_enabled ?? true;

  const hasApiInfoPanel = apiInfoEnabled;
  const hasInfoPanels = announcementsEnabled || faqEnabled || uptimeEnabled;

  // ========== Memoized Values ==========
  const timeOptions = useMemo(
    () =>
      TIME_OPTIONS.map((option) => ({
        ...option,
        label: t(option.label),
      })),
    [t],
  );

  const quickRangeOptions = useMemo(
    () =>
      getEnabledDashboardQuickRangeOptions(
        statusQuickRangeEnabled,
        statusQuickRangeOptions,
      ).map((option) => ({
        ...option,
        label: t(option.label),
      })),
    [t, statusQuickRangeOptions, statusQuickRangeEnabled],
  );

  const performanceMetrics = useMemo(() => {
    const { start_timestamp, end_timestamp } = inputs;
    const timeDiff =
      (Date.parse(end_timestamp) - Date.parse(start_timestamp)) / 60000;
    const avgRPM = isNaN(times / timeDiff)
      ? '0'
      : (times / timeDiff).toFixed(3);
    const avgTPM = isNaN(consumeTokens / timeDiff)
      ? '0'
      : (consumeTokens / timeDiff).toFixed(3);

    return { avgRPM, avgTPM, timeDiff };
  }, [times, consumeTokens, inputs.start_timestamp, inputs.end_timestamp]);

  const getGreeting = useMemo(() => {
    const hours = new Date().getHours();
    let greeting = '';

    if (hours >= 5 && hours < 12) {
      greeting = t('早上好');
    } else if (hours >= 12 && hours < 14) {
      greeting = t('中午好');
    } else if (hours >= 14 && hours < 18) {
      greeting = t('下午好');
    } else {
      greeting = t('晚上好');
    }

    const username = userState?.user?.username || '';
    return `👋${greeting}，${username}`;
  }, [t, userState?.user?.username]);

  // ========== 回调函数 ==========
  const handleInputChange = useCallback((value, name) => {
    if (name === 'data_export_default_time') {
      setDataExportDefaultTime(value);
      localStorage.setItem('data_export_default_time', value);
      return;
    }
    if (name === 'start_timestamp' || name === 'end_timestamp') {
      setActiveQuickRange('custom');
    }
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }, []);

  const showSearchModal = useCallback(() => {
    setSearchModalVisible(true);
  }, []);

  const loadQuotaData = useCallback(async (override = {}) => {
    setLoading(true);
    try {
      let url = '';
      const startTimestamp = override.start_timestamp ?? inputs.start_timestamp;
      const endTimestamp = override.end_timestamp ?? inputs.end_timestamp;
      const username = override.username ?? inputs.username;
      const defaultTime =
        override.data_export_default_time ?? dataExportDefaultTime;
      let localStartTimestamp = Date.parse(startTimestamp) / 1000;
      let localEndTimestamp = Date.parse(endTimestamp) / 1000;

      if (isAdminUser) {
        url = `/api/data/?username=${username}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}&default_time=${defaultTime}`;
      } else {
        url = `/api/data/self/?start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}&default_time=${defaultTime}`;
      }

      const res = await API.get(url);
      const { success, message, data } = res.data;
      if (success) {
        setQuotaData(data);
        if (data.length === 0) {
          data.push({
            count: 0,
            model_name: '无数据',
            quota: 0,
            created_at: now.getTime() / 1000,
          });
        }
        data.sort((a, b) => a.created_at - b.created_at);
        return data;
      } else {
        showError(message);
        return [];
      }
    } finally {
      setLoading(false);
    }
  }, [inputs.start_timestamp, inputs.end_timestamp, inputs.username, dataExportDefaultTime, isAdminUser, now.getTime()]);

  const loadUptimeData = useCallback(async () => {
    setUptimeLoading(true);
    try {
      const res = await API.get('/api/uptime/status');
      const { success, message, data } = res.data;
      if (success) {
        setUptimeData(data || []);
        if (data && data.length > 0 && !activeUptimeTab) {
          setActiveUptimeTab(data[0].categoryName);
        }
      } else {
        showError(message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUptimeLoading(false);
    }
  }, [activeUptimeTab]);

  const loadUserQuotaData = useCallback(async (override = {}) => {
    if (!isAdminUser) return [];
    try {
      const startTimestamp = override.start_timestamp ?? inputs.start_timestamp;
      const endTimestamp = override.end_timestamp ?? inputs.end_timestamp;
      const localStartTimestamp = Date.parse(startTimestamp) / 1000;
      const localEndTimestamp = Date.parse(endTimestamp) / 1000;
      const url = `/api/data/users?start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
      const res = await API.get(url);
      const { success, message, data } = res.data;
      if (success) {
        return data || [];
      } else {
        showError(message);
        return [];
      }
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [inputs.start_timestamp, inputs.end_timestamp, isAdminUser]);

  const applyQuickRange = useCallback(async (range) => {
    const nextState = getDashboardQuickRangeState(range);
    setInputs((prev) => ({
      ...prev,
      start_timestamp: nextState.start_timestamp,
      end_timestamp: nextState.end_timestamp,
    }));
    setDataExportDefaultTime(nextState.data_export_default_time);
    localStorage.setItem(
      'data_export_default_time',
      nextState.data_export_default_time,
    );
    setActiveQuickRange(range);

    const quotaData = await loadQuotaData(nextState);
    const userQuotaData = await loadUserQuotaData(nextState);
    await loadUptimeData();

    return { quotaData, userQuotaData, nextState };
  }, [loadQuotaData, loadUserQuotaData, loadUptimeData]);

  const handleCloseModal = useCallback(() => {
    setSearchModalVisible(false);
  }, []);

  const getUserData = useCallback(async () => {
    let res = await API.get(`/api/user/self`);
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
    } else {
      showError(message);
    }
  }, [userDispatch]);

  const refresh = useCallback(async () => {
    const data = await loadQuotaData();
    await loadUptimeData();
    return data;
  }, [loadQuotaData, loadUptimeData]);

  const handleSearchConfirm = useCallback(
    async (updateChartDataCallback) => {
      const data = await refresh();
      if (data && data.length > 0 && updateChartDataCallback) {
        updateChartDataCallback(data);
      }
      setSearchModalVisible(false);
    },
    [refresh],
  );

  // ========== Effects ==========
  useEffect(() => {
    const timer = setTimeout(() => {
      setGreetingVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (statusDefaultQuickRange !== undefined && statusDefaultQuickRange !== null) {
      const nextDefaultQuickRange = getDefaultQuickRange(statusDefaultQuickRange);
      const nextState = getDashboardQuickRangeState(nextDefaultQuickRange);
      setActiveQuickRange(nextDefaultQuickRange);
      setInputs((prev) => ({
        ...prev,
        start_timestamp: nextState.start_timestamp,
        end_timestamp: nextState.end_timestamp,
        data_export_default_time: nextState.data_export_default_time,
      }));
      setDataExportDefaultTime(nextState.data_export_default_time);
    }
  }, [statusDefaultQuickRange]);

  useEffect(() => {
    if (quickRangeOptions.length === 0) {
      return;
    }

    const matchedQuickRange = quickRangeOptions.find(
      (option) => option.value === activeQuickRange,
    );

    if (!matchedQuickRange) {
      const fallbackRange = getDefaultQuickRange(statusDefaultQuickRange);
      const availableFallbackRange =
        quickRangeOptions.find((option) => option.value === fallbackRange)?.value ||
        quickRangeOptions[0].value;
      const fallbackState = getDashboardQuickRangeState(availableFallbackRange);
      setActiveQuickRange(availableFallbackRange);
      setInputs((prev) => ({
        ...prev,
        start_timestamp: fallbackState.start_timestamp,
        end_timestamp: fallbackState.end_timestamp,
        data_export_default_time: fallbackState.data_export_default_time,
      }));
      setDataExportDefaultTime(fallbackState.data_export_default_time);
      localStorage.setItem(
        'data_export_default_time',
        fallbackState.data_export_default_time,
      );
      return;
    }

    const nextState = getDashboardQuickRangeState(activeQuickRange);
    setInputs((prev) => ({
      ...prev,
      start_timestamp: nextState.start_timestamp,
      end_timestamp: nextState.end_timestamp,
      data_export_default_time: nextState.data_export_default_time,
    }));
    setDataExportDefaultTime(nextState.data_export_default_time);
  }, [quickRangeOptions, activeQuickRange, statusDefaultQuickRange]);

  useEffect(() => {
    if (!initialized.current) {
      getUserData();
      initialized.current = true;
    }
  }, [getUserData]);

  return {
    // 基础状态
    loading: showLoading,
    greetingVisible,
    searchModalVisible,

    // 输入状态
    inputs,
    dataExportDefaultTime,

    // 数据状态
    quotaData,
    consumeQuota,
    setConsumeQuota,
    consumeTokens,
    setConsumeTokens,
    times,
    setTimes,
    pieData,
    setPieData,
    lineData,
    setLineData,
    modelColors,
    setModelColors,

    // 图表状态
    activeChartTab,
    setActiveChartTab,

    // 趋势数据
    trendData,
    setTrendData,

    // Uptime 数据
    uptimeData,
    uptimeLoading,
    activeUptimeTab,
    setActiveUptimeTab,

    // 计算值
    timeOptions,
    quickRangeOptions,
    activeQuickRange,
    quickRangeEnabled,
    performanceMetrics,
    getGreeting,
    isAdminUser,
    hasApiInfoPanel,
    hasInfoPanels,
    apiInfoEnabled,
    announcementsEnabled,
    faqEnabled,
    uptimeEnabled,

    // 函数
    handleInputChange,
    applyQuickRange,
    showSearchModal,
    handleCloseModal,
    loadQuotaData,
    loadUserQuotaData,
    loadUptimeData,
    getUserData,
    refresh,
    handleSearchConfirm,

    // 导航和翻译
    navigate,
    t,
    isMobile,
  };
};
