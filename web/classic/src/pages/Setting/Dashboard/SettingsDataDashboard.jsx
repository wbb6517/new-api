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

import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Empty,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { Plus, Edit, Trash2, Save, CalendarRange, ArrowUp, ArrowDown } from 'lucide-react';
import {
  API,
  compareObjects,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { DEFAULT_DASHBOARD_QUICK_RANGE_OPTIONS } from '../../../constants/dashboard.constants';

const { Text } = Typography;

const RANGE_TYPE_OPTIONS = [
  { value: 'relative', label: '最近时段' },
  { value: 'today', label: '当天' },
];

const UNIT_OPTIONS = [
  { value: 'hour', label: '小时' },
  { value: 'day', label: '天' },
  { value: 'week', label: '周' },
];

const GRANULARITY_OPTIONS = [
  { value: 'hour', label: '小时' },
  { value: 'day', label: '天' },
  { value: 'week', label: '周' },
];

const DEFAULT_FORM_STATE = {
  value: '',
  label: '',
  rangeType: 'relative',
  amount: 1,
  unit: 'day',
  granularity: 'day',
  enabled: true,
};

const normalizeOption = (option, index = 0) => {
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
      : 'day',
    enabled: option.enabled !== false,
    sort: Number(option.sort) || index,
  };
};

const getDefaultQuickRangeOptions = () =>
  DEFAULT_DASHBOARD_QUICK_RANGE_OPTIONS.map((option, index) => ({
    ...option,
    sort: index,
  }));

const parseQuickRangeOptions = (value) => {
  if (!value) {
    return getDefaultQuickRangeOptions();
  }

  try {
    const parsedValue = JSON.parse(value);
    if (!Array.isArray(parsedValue)) {
      return getDefaultQuickRangeOptions();
    }

    const normalizedOptions = parsedValue
      .map((option, index) => normalizeOption(option, index))
      .filter(Boolean)
      .sort((a, b) => a.sort - b.sort);

    return normalizedOptions.length > 0
      ? normalizedOptions
      : getDefaultQuickRangeOptions();
  } catch {
    return getDefaultQuickRangeOptions();
  }
};

const stringifyQuickRangeOptions = (options) =>
  JSON.stringify(
    options.map((option, index) => ({
      ...option,
      sort: index,
    })),
  );

export default function DataDashboard(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [quickRangeEnabled, setQuickRangeEnabled] = useState(true);
  const [quickRangeOptions, setQuickRangeOptions] = useState(
    getDefaultQuickRangeOptions(),
  );
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [deletingOption, setDeletingOption] = useState(null);
  const [optionForm, setOptionForm] = useState(DEFAULT_FORM_STATE);
  const [inputs, setInputs] = useState({
    DataExportEnabled: false,
    DataExportInterval: '',
    DataExportDefaultTime: '',
    DataExportDefaultQuickRange: '7d',
    DataExportQuickRangeEnabled: true,
    DataExportQuickRangeOptions: stringifyQuickRangeOptions(
      getDefaultQuickRangeOptions(),
    ),
  });
  const [inputsRow, setInputsRow] = useState(inputs);

  const updateQuickRangeOptionValue = (options) => {
    const normalizedOptions = options.map((option, index) => ({
      ...option,
      sort: index,
    }));
    setQuickRangeOptions(normalizedOptions);
    setInputs((prev) => ({
      ...prev,
      DataExportQuickRangeOptions: stringifyQuickRangeOptions(normalizedOptions),
    }));
    setHasChanges(true);
  };

  const columns = useMemo(
    () => [
      {
        title: t('快捷范围'),
        dataIndex: 'label',
        key: 'label',
        render: (text, record) => (
          <Space>
            <Text strong>{text}</Text>
            {!record.enabled && <Tag color='grey'>{t('已禁用')}</Tag>}
          </Space>
        ),
      },
      {
        title: t('标识值'),
        dataIndex: 'value',
        key: 'value',
      },
      {
        title: t('范围规则'),
        key: 'rangeRule',
        render: (_, record) => {
          if (record.rangeType === 'today') {
            return t('当天');
          }
          const unitLabel = UNIT_OPTIONS.find((item) => item.value === record.unit)?.label || record.unit;
          return `${t('最近')} ${record.amount} ${t(unitLabel)}`;
        },
      },
      {
        title: t('统计区间单位'),
        dataIndex: 'granularity',
        key: 'granularity',
        render: (value) =>
          GRANULARITY_OPTIONS.find((item) => item.value === value)?.label || value,
      },
      {
        title: t('启用'),
        dataIndex: 'enabled',
        key: 'enabled',
        render: (enabled, record) => (
          <Switch
            checked={enabled}
            onChange={(checked) => {
              updateQuickRangeOptionValue(
                quickRangeOptions.map((item) =>
                  item.value === record.value ? { ...item, enabled: checked } : item,
                ),
              );
            }}
          />
        ),
      },
      {
        title: t('操作'),
        key: 'action',
        width: 220,
        render: (_, record, index) => (
          <Space>
            <Button
              icon={<ArrowUp size={14} />}
              theme='light'
              type='tertiary'
              size='small'
              disabled={index === 0}
              onClick={() => handleMoveUp(index)}
            />
            <Button
              icon={<ArrowDown size={14} />}
              theme='light'
              type='tertiary'
              size='small'
              disabled={index === quickRangeOptions.length - 1}
              onClick={() => handleMoveDown(index)}
            />
            <Button
              icon={<Edit size={14} />}
              theme='light'
              type='tertiary'
              size='small'
              onClick={() => handleEditOption(record)}
            >
              {t('编辑')}
            </Button>
            <Button
              icon={<Trash2 size={14} />}
              theme='light'
              type='danger'
              size='small'
              onClick={() => handleDeleteOption(record)}
            >
              {t('删除')}
            </Button>
          </Space>
        ),
      },
    ],
    [quickRangeOptions, t],
  );

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const newOptions = [...quickRangeOptions];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    updateQuickRangeOptionValue(newOptions);
  };

  const handleMoveDown = (index) => {
    if (index >= quickRangeOptions.length - 1) return;
    const newOptions = [...quickRangeOptions];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    updateQuickRangeOptionValue(newOptions);
  };

  const handleAddOption = () => {
    setEditingOption(null);
    setOptionForm(DEFAULT_FORM_STATE);
    setShowModal(true);
  };

  const handleEditOption = (option) => {
    setEditingOption(option);
    setOptionForm({ ...option });
    setShowModal(true);
  };

  const handleDeleteOption = (option) => {
    setDeletingOption(option);
    setShowDeleteModal(true);
  };

  const confirmDeleteOption = () => {
    if (!deletingOption) return;
    updateQuickRangeOptionValue(
      quickRangeOptions.filter((option) => option.value !== deletingOption.value),
    );
    setDeletingOption(null);
    setShowDeleteModal(false);
    showSuccess(t('快捷范围已删除，请及时保存设置'));
  };

  const handleSaveOption = () => {
    const normalizedOption = normalizeOption(optionForm, quickRangeOptions.length);
    if (!normalizedOption) {
      showError(t('请填写完整的快捷范围配置'));
      return;
    }

    const duplicateOption = quickRangeOptions.find(
      (item) =>
        item.value === normalizedOption.value &&
        (!editingOption || item.value !== editingOption.value),
    );

    if (duplicateOption) {
      showError(t('标识值不能重复'));
      return;
    }

    const nextOptions = editingOption
      ? quickRangeOptions.map((item) =>
          item.value === editingOption.value ? { ...normalizedOption } : item,
        )
      : [...quickRangeOptions, { ...normalizedOption, sort: quickRangeOptions.length }];

    updateQuickRangeOptionValue(nextOptions);
    setShowModal(false);
    showSuccess(
      editingOption
        ? t('快捷范围已更新，请及时保存设置')
        : t('快捷范围已添加，请及时保存设置'),
    );
  };

  const handleToggleQuickRangeEnabled = (checked) => {
    setQuickRangeEnabled(checked);
    setInputs((prev) => ({
      ...prev,
      DataExportQuickRangeEnabled: checked,
    }));
    setHasChanges(true);
  };

  const onSubmit = async () => {
    const nextInputs = {
      ...inputs,
      DataExportQuickRangeEnabled: quickRangeEnabled,
      DataExportQuickRangeOptions: stringifyQuickRangeOptions(quickRangeOptions),
    };
    const updateArray = compareObjects(nextInputs, inputsRow);
    if (!updateArray.length) {
      return showWarning(t('你似乎并没有修改什么'));
    }

    const requestQueue = updateArray.map((item) => {
      let value = nextInputs[item.key];
      if (typeof value === 'boolean') {
        value = String(value);
      }
      return API.put('/api/option/', {
        key: item.key,
        value,
      });
    });

    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (requestQueue.length === 1) {
          if (res.includes(undefined)) return;
        } else if (requestQueue.length > 1) {
          if (res.includes(undefined)) {
            return showError(t('部分保存失败，请重试'));
          }
        }
        showSuccess(t('保存成功'));
        setInputs(nextInputs);
        setInputsRow(structuredClone(nextInputs));
        localStorage.setItem(
          'data_export_default_time',
          String(nextInputs.DataExportDefaultTime || ''),
        );
        localStorage.setItem(
          'data_export_default_quick_range',
          String(nextInputs.DataExportDefaultQuickRange || '7d'),
        );
        localStorage.setItem(
          'data_export_quick_range_enabled',
          String(nextInputs.DataExportQuickRangeEnabled),
        );
        localStorage.setItem(
          'data_export_quick_range_options',
          String(nextInputs.DataExportQuickRangeOptions || ''),
        );
        setHasChanges(false);
        props.refresh();
      })
      .catch(() => {
        showError(t('保存失败，请重试'));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const currentInputs = {
      DataExportEnabled: props.options.DataExportEnabled ?? false,
      DataExportInterval: props.options.DataExportInterval ?? '',
      DataExportDefaultTime: props.options.DataExportDefaultTime ?? 'hour',
      DataExportDefaultQuickRange: props.options.DataExportDefaultQuickRange || '7d',
      DataExportQuickRangeEnabled:
        props.options.DataExportQuickRangeEnabled === undefined
          ? true
          : props.options.DataExportQuickRangeEnabled === true ||
            props.options.DataExportQuickRangeEnabled === 'true',
      DataExportQuickRangeOptions:
        props.options.DataExportQuickRangeOptions ||
        stringifyQuickRangeOptions(getDefaultQuickRangeOptions()),
    };

    const parsedQuickRangeOptions = parseQuickRangeOptions(
      currentInputs.DataExportQuickRangeOptions,
    );
    const defaultQuickRangeExists = parsedQuickRangeOptions.some(
      (option) => option.value === currentInputs.DataExportDefaultQuickRange,
    );
    if (!defaultQuickRangeExists && parsedQuickRangeOptions.length > 0) {
      currentInputs.DataExportDefaultQuickRange = parsedQuickRangeOptions[0].value;
    }

    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    setQuickRangeEnabled(currentInputs.DataExportQuickRangeEnabled);
    setQuickRangeOptions(parsedQuickRangeOptions);
    localStorage.setItem(
      'data_export_default_time',
      String(currentInputs.DataExportDefaultTime || ''),
    );
    localStorage.setItem(
      'data_export_default_quick_range',
      String(currentInputs.DataExportDefaultQuickRange || '7d'),
    );
    localStorage.setItem(
      'data_export_quick_range_enabled',
      String(currentInputs.DataExportQuickRangeEnabled),
    );
    localStorage.setItem(
      'data_export_quick_range_options',
      stringifyQuickRangeOptions(parsedQuickRangeOptions),
    );
    setHasChanges(false);
  }, [props.options]);

  return (
    <Spin spinning={loading}>
      <div className='flex flex-col w-full'>
        <div className='mb-2'>
          <div className='flex items-center text-blue-500'>
            <CalendarRange size={16} className='mr-2' />
            <Text>
              {t('数据看板设置与快捷时间范围管理')}
            </Text>
          </div>
        </div>
        <div className='flex flex-col md:flex-row justify-between items-center gap-4 w-full mb-4'>
          <div className='flex gap-2 w-full md:w-auto order-2 md:order-1'>
            <Button
              theme='light'
              type='primary'
              icon={<Plus size={14} />}
              className='w-full md:w-auto'
              onClick={handleAddOption}
            >
              {t('添加快捷范围')}
            </Button>
            <Button
              icon={<Save size={14} />}
              onClick={onSubmit}
              loading={loading}
              disabled={!hasChanges}
              type='secondary'
              className='w-full md:w-auto'
            >
              {t('保存设置')}
            </Button>
          </div>
          <div className='order-1 md:order-2 flex items-center gap-2'>
            <Switch
              checked={quickRangeEnabled}
              onChange={handleToggleQuickRangeEnabled}
            />
            <Text>{quickRangeEnabled ? t('已启用') : t('已禁用')}</Text>
          </div>
        </div>

        <div className='mb-4'>
          <div className='mb-2 text-sm font-medium'>{t('启用数据看板（实验性）')}</div>
          <Switch
            checked={inputs.DataExportEnabled}
            checkedText='｜'
            uncheckedText='〇'
            onChange={(value) => {
              setInputs((prev) => ({
                ...prev,
                DataExportEnabled: value,
              }));
              setHasChanges(true);
            }}
          />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <div>
            <div className='mb-1 text-sm font-medium'>{t('数据看板更新间隔')}</div>
            <InputNumber
              step={1}
              min={1}
              suffix={t('分钟')}
              value={Number(inputs.DataExportInterval) || 1}
              style={{ width: '100%' }}
              onChange={(value) => {
                setInputs((prev) => ({
                  ...prev,
                  DataExportInterval: String(value || 1),
                }));
                setHasChanges(true);
              }}
            />
            <div className='mt-1 text-sm text-[var(--semi-color-text-2)]'>
              {t('设置过短会影响数据库性能')}
            </div>
          </div>
          <div>
            <div className='mb-1 text-sm font-medium'>{t('默认快捷范围')}</div>
            <Select
              optionList={quickRangeOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={inputs.DataExportDefaultQuickRange}
              style={{ width: '100%' }}
              onChange={(value) => {
                setInputs((prev) => ({
                  ...prev,
                  DataExportDefaultQuickRange: String(value),
                }));
                setHasChanges(true);
              }}
            />
            <div className='mt-1 text-sm text-[var(--semi-color-text-2)]'>
              {t('进入数据看板时默认选中的时间范围')}
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={quickRangeOptions}
          rowKey='value'
          pagination={false}
          size='middle'
          empty={
            <Empty
              image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
              darkModeImage={
                <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
              }
              description={t('暂无快捷范围配置')}
              style={{ padding: 30 }}
            />
          }
        />
      </div>

      <Modal
        title={editingOption ? t('编辑快捷范围') : t('添加快捷范围')}
        visible={showModal}
        onOk={handleSaveOption}
        onCancel={() => setShowModal(false)}
        okText={t('保存')}
        cancelText={t('取消')}
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <div className='mb-1 text-sm font-medium'>{t('显示名称')}</div>
            <Input
              value={optionForm.label}
              placeholder={t('如：3小时')}
              onChange={(value) => setOptionForm((prev) => ({ ...prev, label: value }))}
            />
          </div>
          <div>
            <div className='mb-1 text-sm font-medium'>{t('标识值')}</div>
            <Input
              value={optionForm.value}
              placeholder={t('如：3h')}
              disabled={!!editingOption}
              onChange={(value) => setOptionForm((prev) => ({ ...prev, value }))}
            />
          </div>
          <div>
            <div className='mb-1 text-sm font-medium'>{t('范围类型')}</div>
            <Select
              optionList={RANGE_TYPE_OPTIONS.map((option) => ({
                ...option,
                label: t(option.label),
              }))}
              value={optionForm.rangeType}
              style={{ width: '100%' }}
              onChange={(value) =>
                setOptionForm((prev) => ({ ...prev, rangeType: String(value) }))
              }
            />
          </div>
          <div>
            <div className='mb-1 text-sm font-medium'>{t('数量')}</div>
            <InputNumber
              min={1}
              disabled={optionForm.rangeType === 'today'}
              value={optionForm.amount}
              style={{ width: '100%' }}
              onChange={(value) =>
                setOptionForm((prev) => ({ ...prev, amount: Number(value) || 1 }))
              }
            />
          </div>
          <div>
            <div className='mb-1 text-sm font-medium'>{t('统计范围时间单位')}</div>
            <Select
              optionList={UNIT_OPTIONS.map((option) => ({
                ...option,
                label: t(option.label),
              }))}
              disabled={optionForm.rangeType === 'today'}
              value={optionForm.unit}
              style={{ width: '100%' }}
              onChange={(value) =>
                setOptionForm((prev) => ({ ...prev, unit: String(value) }))
              }
            />
          </div>
          <div>
            <div className='mb-1 text-sm font-medium'>{t('统计区间单位')}</div>
            <Select
              optionList={GRANULARITY_OPTIONS.map((option) => ({
                ...option,
                label: t(option.label),
              }))}
              value={optionForm.granularity}
              style={{ width: '100%' }}
              onChange={(value) =>
                setOptionForm((prev) => ({ ...prev, granularity: String(value) }))
              }
            />
          </div>
        </div>
        <div className='mt-3 flex items-center gap-2'>
          <Switch
            checked={optionForm.enabled}
            onChange={(checked) =>
              setOptionForm((prev) => ({ ...prev, enabled: checked }))
            }
          />
          <Text>{optionForm.enabled ? t('该项启用') : t('该项禁用')}</Text>
        </div>
      </Modal>

      <Modal
        title={t('确认删除')}
        visible={showDeleteModal}
        onOk={confirmDeleteOption}
        onCancel={() => {
          setDeletingOption(null);
          setShowDeleteModal(false);
        }}
        okText={t('删除')}
        cancelText={t('取消')}
      >
        <p>
          {t('确定删除快捷范围')} {deletingOption?.label || '-'} {t('吗？')}
        </p>
      </Modal>
    </Spin>
  );
}
