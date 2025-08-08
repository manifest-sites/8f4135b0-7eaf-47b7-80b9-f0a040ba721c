import React, { useState, useEffect } from 'react'
import { Card, Button, Form, Input, InputNumber, Select, DatePicker, Space, Divider, Typography, Modal, Table, Tag, message } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Workout } from '../entities/Workout'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

function WorkoutTracker() {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState(null)
  const [form] = Form.useForm()

  const commonExercises = [
    'Push-ups', 'Pull-ups', 'Squats', 'Deadlifts', 'Bench Press', 'Overhead Press',
    'Rows', 'Lunges', 'Planks', 'Burpees', 'Bicep Curls', 'Tricep Dips',
    'Leg Press', 'Chest Fly', 'Lat Pulldowns', 'Shoulder Raises', 'Calf Raises',
    'Running', 'Cycling', 'Swimming', 'Jumping Jacks'
  ]

  useEffect(() => {
    loadWorkouts()
  }, [])

  const loadWorkouts = async () => {
    setLoading(true)
    try {
      const response = await Workout.list()
      if (response.success) {
        const sortedWorkouts = response.data.sort((a, b) => new Date(b.date) - new Date(a.date))
        setWorkouts(sortedWorkouts)
      }
    } catch (error) {
      message.error('Failed to load workouts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const workoutData = {
        ...values,
        date: values.date.toISOString(),
        exercises: values.exercises || []
      }

      let response
      if (editingWorkout) {
        response = await Workout.update(editingWorkout._id, workoutData)
      } else {
        response = await Workout.create(workoutData)
      }

      if (response.success) {
        message.success(editingWorkout ? 'Workout updated successfully' : 'Workout logged successfully')
        setIsModalVisible(false)
        setEditingWorkout(null)
        form.resetFields()
        loadWorkouts()
      }
    } catch (error) {
      message.error('Failed to save workout')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (workoutId) => {
    Modal.confirm({
      title: 'Delete Workout',
      content: 'Are you sure you want to delete this workout?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await Workout.delete(workoutId)
          message.success('Workout deleted successfully')
          loadWorkouts()
        } catch (error) {
          message.error('Failed to delete workout')
        }
      }
    })
  }

  const handleEdit = (workout) => {
    setEditingWorkout(workout)
    form.setFieldsValue({
      ...workout,
      date: dayjs(workout.date)
    })
    setIsModalVisible(true)
  }

  const addExercise = () => {
    const exercises = form.getFieldValue('exercises') || []
    form.setFieldsValue({
      exercises: [...exercises, { name: '', sets: [{ reps: 0, weight: 0 }] }]
    })
  }

  const addSet = (exerciseIndex) => {
    const exercises = form.getFieldValue('exercises') || []
    exercises[exerciseIndex].sets.push({ reps: 0, weight: 0 })
    form.setFieldsValue({ exercises })
  }

  const removeExercise = (index) => {
    const exercises = form.getFieldValue('exercises') || []
    exercises.splice(index, 1)
    form.setFieldsValue({ exercises })
  }

  const removeSet = (exerciseIndex, setIndex) => {
    const exercises = form.getFieldValue('exercises') || []
    exercises[exerciseIndex].sets.splice(setIndex, 1)
    form.setFieldsValue({ exercises })
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'Workout',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Exercises',
      dataIndex: 'exercises',
      key: 'exercises',
      render: (exercises) => (
        <div>
          {exercises?.slice(0, 3).map((exercise, index) => (
            <Tag key={index} className="mb-1">{exercise.name}</Tag>
          ))}
          {exercises?.length > 3 && <Tag>+{exercises.length - 3} more</Tag>}
        </div>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => duration ? `${duration} min` : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record._id)} />
        </Space>
      ),
    },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <Title level={1} className="text-center mb-2">Workout Tracker</Title>
        <Text className="text-gray-600 block text-center">Track your fitness journey and monitor your progress</Text>
      </div>

      <div className="mb-6 text-center">
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={() => {
            setEditingWorkout(null)
            form.resetFields()
            setIsModalVisible(true)
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Log New Workout
        </Button>
      </div>

      <Card className="shadow-lg">
        <Table
          columns={columns}
          dataSource={workouts}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} workouts`,
          }}
          className="responsive-table"
        />
      </Card>

      <Modal
        title={editingWorkout ? 'Edit Workout' : 'Log New Workout'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          setEditingWorkout(null)
          form.resetFields()
        }}
        footer={null}
        width={800}
        className="workout-modal"
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          initialValues={{
            date: dayjs(),
            exercises: [{ name: '', sets: [{ reps: 0, weight: 0 }] }]
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="date"
              label="Workout Date"
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              name="name"
              label="Workout Name"
              rules={[{ required: true, message: 'Please enter workout name' }]}
            >
              <Input placeholder="e.g., Upper Body, Leg Day, Cardio" />
            </Form.Item>
          </div>

          <Form.Item name="duration" label="Duration (minutes)">
            <InputNumber min={0} className="w-full" placeholder="How long was your workout?" />
          </Form.Item>

          <Divider>Exercises</Divider>

          <Form.List name="exercises">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, exerciseIndex) => (
                  <Card key={key} className="mb-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        label="Exercise"
                        className="flex-1 mr-4"
                        rules={[{ required: true, message: 'Please enter exercise name' }]}
                      >
                        <Select
                          showSearch
                          placeholder="Select or type exercise name"
                          optionFilterProp="children"
                          allowClear
                        >
                          {commonExercises.map(exercise => (
                            <Option key={exercise} value={exercise}>{exercise}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => remove(name)}
                      />
                    </div>

                    <Form.List name={[name, 'sets']}>
                      {(setFields, { add: addSet, remove: removeSet }) => (
                        <>
                          <div className="grid gap-2">
                            {setFields.map(({ key: setKey, name: setName, ...setRestField }, setIndex) => (
                              <div key={setKey} className="flex items-center gap-2">
                                <Text className="w-12">Set {setIndex + 1}:</Text>
                                <Form.Item
                                  {...setRestField}
                                  name={[setName, 'reps']}
                                  className="mb-0 flex-1"
                                >
                                  <InputNumber min={0} placeholder="Reps" className="w-full" />
                                </Form.Item>
                                <Text>×</Text>
                                <Form.Item
                                  {...setRestField}
                                  name={[setName, 'weight']}
                                  className="mb-0 flex-1"
                                >
                                  <InputNumber min={0} placeholder="Weight" className="w-full" />
                                </Form.Item>
                                <Form.Item
                                  {...setRestField}
                                  name={[setName, 'duration']}
                                  className="mb-0 flex-1"
                                >
                                  <InputNumber min={0} placeholder="Duration (s)" className="w-full" />
                                </Form.Item>
                                <Button 
                                  type="text" 
                                  danger 
                                  size="small"
                                  icon={<DeleteOutlined />} 
                                  onClick={() => removeSet(setName)}
                                />
                              </div>
                            ))}
                          </div>
                          <Button 
                            type="dashed" 
                            onClick={() => addSet({ reps: 0, weight: 0 })} 
                            className="w-full mt-2"
                          >
                            Add Set
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </Card>
                ))}
                <Button 
                  type="dashed" 
                  onClick={() => add({ name: '', sets: [{ reps: 0, weight: 0 }] })} 
                  icon={<PlusOutlined />}
                  className="w-full mb-4"
                >
                  Add Exercise
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Any additional notes about your workout..." />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingWorkout ? 'Update Workout' : 'Save Workout'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default WorkoutTracker