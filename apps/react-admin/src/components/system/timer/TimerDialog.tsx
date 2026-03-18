import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Form, Input, Modal } from 'antd'
import { createTimer, getTimer, TaskType, updateTimer, type TimerParams } from '@/api/timer'
import { CronGenerator, CronGeneratorTriggerButton } from '@/components/CronGenerator'
import { DictSelect } from '@/components/dict/DictSelect'
import { queryClient } from '@/lib/query-client'

type Props = {
  open: boolean
  timerId?: number | null
  onClose: () => void
}

type TimerFormValues = {
  name: string
  description?: string
  cron: string
  taskType: TaskType
  target: string
  paramsJson?: string
  status?: number | string
}

export function TimerDialog({ open, timerId, onClose }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<TimerFormValues>()
  const isEdit = Boolean(timerId)
  const currentTaskType = Form.useWatch('taskType', form)
  const [cronGeneratorOpen, setCronGeneratorOpen] = useState(false)

  const { data, isFetching } = useQuery({
    queryKey: ['timer-detail', timerId],
    queryFn: () => getTimer(timerId!),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    if (isEdit && data) {
      form.setFieldsValue({
        name: data.name,
        description: data.description || '',
        cron: data.cron,
        taskType: data.taskType,
        target: data.target,
        paramsJson: data.params ? JSON.stringify(data.params, null, 2) : '',
        status: data.status,
      })
      return
    }

    form.setFieldsValue({
      name: '',
      description: '',
      cron: '',
      taskType: TaskType.HTTP,
      target: '',
      paramsJson: '',
      status: 1,
    })
  }, [data, form, isEdit, open])

  const saveMutation = useMutation({
    mutationFn: async (values: TimerFormValues) => {
      let params: Record<string, unknown> | undefined
      if (values.paramsJson?.trim()) {
        params = JSON.parse(values.paramsJson)
      }

      const payload: TimerParams = {
        name: values.name,
        description: values.description?.trim() || '',
        cron: values.cron,
        taskType: values.taskType,
        target: values.target,
        params,
        status: values.status,
      }

      if (isEdit) {
        return updateTimer(timerId!, payload)
      }

      return createTimer(payload)
    },
    onSuccess: async () => {
      message.success(isEdit ? '定时任务更新成功' : '定时任务创建成功')
      await queryClient.invalidateQueries({ queryKey: ['timers'] })
      onClose()
    },
    onError: (error: unknown) => {
      if (error instanceof SyntaxError) {
        message.error('额外参数格式错误，请输入有效的 JSON')
        return
      }
      message.error(isEdit ? '更新失败' : '创建失败')
    },
  })

  return (
    <Modal
      open={open}
      forceRender
      title={isEdit ? '修改定时任务' : '新增定时任务'}
      width={760}
      okText="确认"
      cancelText="取消"
      confirmLoading={saveMutation.isPending}
      onCancel={onClose}
      onOk={() => {
        void form.validateFields().then((values) => saveMutation.mutate(values))
      }}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        disabled={saveMutation.isPending || isFetching}
        initialValues={{
          name: '',
          description: '',
          cron: '',
          taskType: TaskType.HTTP,
          target: '',
          paramsJson: '',
          status: 1,
        }}
      >
        <Form.Item label="定时任务名称" name="name" rules={[{ required: true, message: '请输入定时任务名称' }]}>
          <Input placeholder="请输入定时任务名称" />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Input.TextArea rows={2} placeholder="请输入描述" />
        </Form.Item>
        <Form.Item label="Cron 表达式" name="cron" rules={[{ required: true, message: '请输入 Cron 表达式' }]}>
          <Input
            placeholder="如：0 0 * * * * 表示每小时整点"
            suffix={<CronGeneratorTriggerButton onClick={() => setCronGeneratorOpen(true)} />}
          />
        </Form.Item>
        <Form.Item label="任务类型" name="taskType" rules={[{ required: true, message: '请选择任务类型' }]}>
          <DictSelect dictCode="TASK_TYPE" />
        </Form.Item>
        <Form.Item label="目标地址" name="target" rules={[{ required: true, message: '请输入目标地址' }]}>
          <Input placeholder={currentTaskType === TaskType.HTTP ? '请输入 URL' : '请输入脚本路径'} />
        </Form.Item>
        <Form.Item label="额外参数" name="paramsJson">
          <Input.TextArea rows={4} placeholder='{"method": "POST", "headers": {}}' />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <DictSelect dictCode="BASE_STATUS" />
        </Form.Item>
      </Form>

      <CronGenerator
        open={cronGeneratorOpen}
        value={form.getFieldValue('cron')}
        onClose={() => setCronGeneratorOpen(false)}
        onConfirm={(cron) => {
          form.setFieldValue('cron', cron)
          setCronGeneratorOpen(false)
        }}
      />
    </Modal>
  )
}
