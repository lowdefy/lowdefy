'use client';

import { useState } from 'react';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';

const examples = [
  {
    id: 'user-table',
    label: 'User Table',
    generatedLines: '~150',
    lowdefyLines: '~25',
    generated: `import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Table, Card, Button, Modal, Form, Input, Select,
  message, Popconfirm, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'editor';
  status: 'active' | 'inactive';
  createdAt: Date;
}

const fetchUsers = async (): Promise<User[]> => {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

const updateUser = async (user: Partial<User> & { id: string }) => {
  const res = await fetch(\`/api/users/\${user.id}\`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
};

const deleteUser = async (id: string) => {
  const res = await fetch(\`/api/users/\${id}\`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete user');
};

const createUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
};

export function UserDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      message.success('User updated successfully');
      refetch();
      handleCloseModal();
    },
    onError: () => message.error('Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('User deleted successfully');
      refetch();
    },
    onError: () => message.error('Failed to delete user'),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      message.success('User created successfully');
      refetch();
      handleCloseModal();
    },
    onError: () => message.error('Failed to create user'),
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleSubmit = async (values: Partial<User>) => {
    if (editingUser) {
      await updateMutation.mutateAsync({ ...values, id: editingUser.id });
    } else {
      await createMutation.mutateAsync(values as Omit<User, 'id' | 'createdAt'>);
    }
  };

  if (error) return <div>Error loading users</div>;

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: true },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : role === 'editor' ? 'blue' : 'default'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete user?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="User Management"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Add User
        </Button>
      }
    >
      <Table columns={columns} dataSource={users} loading={isLoading} rowKey="id" />
      <Modal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={updateMutation.isPending || createMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={[
              { value: 'admin', label: 'Admin' },
              { value: 'editor', label: 'Editor' },
              { value: 'user', label: 'User' },
            ]} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}`,
    lowdefy: {
      content: `id: user_dashboard
type: PageHeaderMenu

requests:
  - id: get_users
    type: MongoDBFind
    connectionId: users

blocks:
  - id: users_card
    type: Card
    properties:
      title: User Management
    blocks:
      - id: users_table
        type: AgGridAlpine
        properties:
          rowData:
            _request: get_users
          columnDefs:
            - field: name
            - field: email
            - field: role`,
    },
  },
  {
    id: 'rbac',
    label: 'Role-Based Access',
    generatedLines: '~280',
    lowdefyLines: '~35',
    generated: `import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'admin')[];
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  inherits?: string[];
}

interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
}

interface RBACContextValue {
  user: User | null;
  role: Role | null;
  can: (action: string, resource: string) => boolean;
  canAny: (actions: string[], resource: string) => boolean;
  canAll: (actions: string[], resource: string) => boolean;
  isLoading: boolean;
}

const RBACContext = createContext<RBACContextValue | null>(null);

const fetchUserRole = async (userId: string): Promise<Role> => {
  const res = await fetch(\`/api/users/\${userId}/role\`);
  if (!res.ok) throw new Error('Failed to fetch role');
  return res.json();
};

const fetchRoleHierarchy = async (roleId: string): Promise<Role[]> => {
  const res = await fetch(\`/api/roles/\${roleId}/hierarchy\`);
  if (!res.ok) throw new Error('Failed to fetch role hierarchy');
  return res.json();
};

export function RBACProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<Map<string, Set<string>>>(new Map());

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', session?.user?.id],
    queryFn: () => fetchUserRole(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  const { data: roleHierarchy } = useQuery({
    queryKey: ['role-hierarchy', role?.id],
    queryFn: () => fetchRoleHierarchy(role!.id),
    enabled: !!role?.id && !!role?.inherits?.length,
  });

  useEffect(() => {
    const allRoles = roleHierarchy ? [role!, ...roleHierarchy] : role ? [role] : [];
    const permMap = new Map<string, Set<string>>();

    allRoles.forEach((r) => {
      r.permissions.forEach((p) => {
        const existing = permMap.get(p.resource) || new Set();
        p.actions.forEach((a) => existing.add(a));
        permMap.set(p.resource, existing);
      });
    });

    setPermissions(permMap);
  }, [role, roleHierarchy]);

  const can = useCallback(
    (action: string, resource: string) => {
      const resourcePerms = permissions.get(resource);
      if (!resourcePerms) return false;
      return resourcePerms.has(action) || resourcePerms.has('admin');
    },
    [permissions]
  );

  const canAny = useCallback(
    (actions: string[], resource: string) => actions.some((a) => can(a, resource)),
    [can]
  );

  const canAll = useCallback(
    (actions: string[], resource: string) => actions.every((a) => can(a, resource)),
    [can]
  );

  const isLoading = status === 'loading' || roleLoading;

  return (
    <RBACContext.Provider
      value={{
        user: session?.user as User | null,
        role: role || null,
        can,
        canAny,
        canAll,
        isLoading,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) throw new Error('useRBAC must be used within RBACProvider');
  return context;
}

interface RequirePermissionProps {
  action: string;
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({ action, resource, children, fallback }: RequirePermissionProps) {
  const { can, isLoading } = useRBAC();

  if (isLoading) return <div className="animate-pulse h-8 bg-gray-200 rounded" />;
  if (!can(action, resource)) return fallback ? <>{fallback}</> : null;

  return <>{children}</>;
}

interface ProtectedRouteProps {
  action: string;
  resource: string;
  children: ReactNode;
}

export function ProtectedRoute({ action, resource, children }: ProtectedRouteProps) {
  const { can, isLoading } = useRBAC();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !can(action, resource)) {
      router.push('/unauthorized');
    }
  }, [can, isLoading, action, resource, router]);

  if (isLoading) return <LoadingSpinner />;
  if (!can(action, resource)) return null;

  return <>{children}</>;
}`,
    lowdefy: {
      content: `# lowdefy.yaml - Auth & roles
auth:
  providers:
    - id: google
      type: GoogleProvider
  pages:
    protected: true
    public:
      - login
    roles:
      admin:
        - admin-settings
        - users
      editor:
        - content

# pages/admin-settings.yaml
id: admin_settings
type: PageHeaderMenu

blocks:
  - id: settings_form
    type: Card
    properties:
      title: Site Settings
    blocks:
      - id: site_name
        type: TextInput
        properties:
          title: Site Name
      - id: save
        type: Button
        properties:
          title: Save`,
    },
  },
  {
    id: 'dashboard',
    label: 'Analytics Dashboard',
    generatedLines: '~350',
    lowdefyLines: '~50',
    generated: `import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Select, DatePicker, Spin, Statistic, Table } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Line, Bar, Pie } from '@ant-design/charts';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface DashboardFilters {
  dateRange: [Dayjs, Dayjs];
  region: string;
  product: string;
}

interface Metrics {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  customers: number;
  customersChange: number;
  avgOrderValue: number;
}

interface SalesTrend {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface RegionData {
  region: string;
  revenue: number;
}

const fetchMetrics = async (filters: DashboardFilters): Promise<Metrics> => {
  const params = new URLSearchParams({
    startDate: filters.dateRange[0].toISOString(),
    endDate: filters.dateRange[1].toISOString(),
    region: filters.region,
    product: filters.product,
  });
  const res = await fetch(\`/api/metrics?\${params}\`);
  return res.json();
};

const fetchSalesTrend = async (filters: DashboardFilters): Promise<SalesTrend[]> => {
  const params = new URLSearchParams({
    startDate: filters.dateRange[0].toISOString(),
    endDate: filters.dateRange[1].toISOString(),
  });
  const res = await fetch(\`/api/sales-trend?\${params}\`);
  return res.json();
};

const fetchTopProducts = async (filters: DashboardFilters): Promise<TopProduct[]> => {
  const params = new URLSearchParams({
    startDate: filters.dateRange[0].toISOString(),
    endDate: filters.dateRange[1].toISOString(),
    region: filters.region,
  });
  const res = await fetch(\`/api/top-products?\${params}\`);
  return res.json();
};

const fetchRegionBreakdown = async (filters: DashboardFilters): Promise<RegionData[]> => {
  const params = new URLSearchParams({
    startDate: filters.dateRange[0].toISOString(),
    endDate: filters.dateRange[1].toISOString(),
  });
  const res = await fetch(\`/api/region-breakdown?\${params}\`);
  return res.json();
};

export function AnalyticsDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: [dayjs().subtract(30, 'day'), dayjs()],
    region: 'all',
    product: 'all',
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics', filters],
    queryFn: () => fetchMetrics(filters),
  });

  const { data: salesTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['sales-trend', filters.dateRange],
    queryFn: () => fetchSalesTrend(filters),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products', filters],
    queryFn: () => fetchTopProducts(filters),
  });

  const { data: regionBreakdown } = useQuery({
    queryKey: ['region-breakdown', filters.dateRange],
    queryFn: () => fetchRegionBreakdown(filters),
  });

  const handleFilterChange = useCallback((key: keyof DashboardFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const lineConfig = useMemo(
    () => ({
      data: salesTrend || [],
      xField: 'date',
      yField: 'revenue',
      smooth: true,
      color: '#1890ff',
    }),
    [salesTrend]
  );

  const pieConfig = useMemo(
    () => ({
      data: regionBreakdown || [],
      angleField: 'revenue',
      colorField: 'region',
      radius: 0.8,
      label: { type: 'outer' },
    }),
    [regionBreakdown]
  );

  const productColumns = [
    { title: 'Product', dataIndex: 'name', key: 'name' },
    { title: 'Sales', dataIndex: 'sales', key: 'sales' },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: formatCurrency },
  ];

  if (metricsLoading) return <Spin size="large" className="flex justify-center p-12" />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-4 mb-6">
        <RangePicker
          value={filters.dateRange}
          onChange={(dates) => dates && handleFilterChange('dateRange', dates)}
        />
        <Select
          value={filters.region}
          onChange={(v) => handleFilterChange('region', v)}
          options={[
            { value: 'all', label: 'All Regions' },
            { value: 'north', label: 'North' },
            { value: 'south', label: 'South' },
            { value: 'east', label: 'East' },
            { value: 'west', label: 'West' },
          ]}
          style={{ width: 150 }}
        />
      </div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Revenue"
              value={metrics?.revenue}
              precision={2}
              prefix="$"
              valueStyle={{ color: metrics?.revenueChange >= 0 ? '#3f8600' : '#cf1322' }}
              suffix={
                <span className="text-sm">
                  {metrics?.revenueChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(metrics?.revenueChange || 0)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Orders" value={metrics?.orders} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Customers" value={metrics?.customers} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Avg Order" value={metrics?.avgOrderValue} prefix="$" precision={2} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Sales Trend">{trendLoading ? <Spin /> : <Line {...lineConfig} />}</Card>
        </Col>
        <Col span={8}>
          <Card title="Revenue by Region">
            <Pie {...pieConfig} />
          </Card>
        </Col>
      </Row>
      <Card title="Top Products">
        <Table columns={productColumns} dataSource={topProducts} rowKey="name" pagination={false} />
      </Card>
    </div>
  );
}`,
    lowdefy: {
      content: `id: analytics
type: PageHeaderMenu

requests:
  - id: get_metrics
    type: MongoDBAggregation
    connectionId: orders
    properties:
      pipeline:
        - $group:
            _id: null
            revenue:
              $sum: $amount
            orders:
              $sum: 1
  - id: get_sales_trend
    type: MongoDBAggregation
    connectionId: orders
    properties:
      pipeline:
        - $group:
            _id:
              $dateToString:
                format: "%Y-%m-%d"
                date: $createdAt
            total:
              $sum: $amount
        - $sort:
            _id: 1

blocks:
  - id: metrics_row
    type: Box
    blocks:
      - id: revenue_stat
        type: Statistic
        layout:
          span: 6
        properties:
          title: Revenue
          value:
            _request: get_metrics.0.revenue
          prefix: $
      - id: orders_stat
        type: Statistic
        layout:
          span: 6
        properties:
          title: Orders
          value:
            _request: get_metrics.0.orders

  - id: sales_chart
    type: EChart
    properties:
      height: 300
      option:
        xAxis:
          type: category
        yAxis:
          type: value
        series:
          - type: line
            data:
              _request: get_sales_trend`,
    },
  },
  {
    id: 'crud-form',
    label: 'CRUD Form',
    generatedLines: '~320',
    lowdefyLines: '~70',
    generated: `import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Form, Input, Select, Button, message, Spin, Space } from 'antd';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\\+?[1-9]\\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  company: z.string().optional(),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'Use 2-letter state code'),
  zip: z.string().regex(/^\\d{5}(-\\d{4})?$/, 'Invalid ZIP code'),
  status: z.enum(['active', 'inactive', 'pending']),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer extends CustomerFormData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

const fetchCustomer = async (id: string): Promise<Customer> => {
  const res = await fetch(\`/api/customers/\${id}\`);
  if (!res.ok) throw new Error('Failed to fetch customer');
  return res.json();
};

const createCustomer = async (data: CustomerFormData): Promise<Customer> => {
  const res = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create customer');
  return res.json();
};

const updateCustomer = async ({ id, data }: { id: string; data: CustomerFormData }): Promise<Customer> => {
  const res = await fetch(\`/api/customers/\${id}\`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update customer');
  return res.json();
};

export function CustomerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');
  const isEditing = !!customerId;
  const queryClient = useQueryClient();

  const { data: customer, isLoading: loadingCustomer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => fetchCustomer(customerId!),
    enabled: isEditing,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      status: 'pending',
      notes: '',
    },
  });

  useEffect(() => {
    if (customer) {
      reset(customer);
    }
  }, [customer, reset]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      message.success('Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      router.push('/customers');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      message.success('Customer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      router.push('/customers');
    },
    onError: (err: Error) => message.error(err.message),
  });

  const onSubmit = async (data: CustomerFormData) => {
    if (isEditing) {
      await updateMutation.mutateAsync({ id: customerId!, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (loadingCustomer) return <Spin size="large" className="flex justify-center p-12" />;

  return (
    <Card title={isEditing ? 'Edit Customer' : 'New Customer'}>
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item label="Name" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item label="Email" validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
          <Controller name="email" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item label="Phone" validateStatus={errors.phone ? 'error' : ''} help={errors.phone?.message}>
          <Controller name="phone" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item label="Company">
          <Controller name="company" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item label="Street" validateStatus={errors.street ? 'error' : ''} help={errors.street?.message}>
          <Controller name="street" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item label="City" validateStatus={errors.city ? 'error' : ''} help={errors.city?.message}>
          <Controller name="city" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item label="State" validateStatus={errors.state ? 'error' : ''} help={errors.state?.message}>
          <Controller name="state" control={control} render={({ field }) => <Input {...field} maxLength={2} />} />
        </Form.Item>
        <Form.Item label="ZIP" validateStatus={errors.zip ? 'error' : ''} help={errors.zip?.message}>
          <Controller name="zip" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item label="Status">
          <Controller name="status" control={control} render={({ field }) => (
            <Select {...field} options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending' },
            ]} />
          )} />
        </Form.Item>
        <Form.Item label="Notes" validateStatus={errors.notes ? 'error' : ''} help={errors.notes?.message}>
          <Controller name="notes" control={control} render={({ field }) => <Input.TextArea {...field} rows={4} />} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              {isEditing ? 'Update' : 'Create'} Customer
            </Button>
            <Button onClick={() => router.push('/customers')}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}`,
    lowdefy: {
      content: `id: customer_form
type: PageHeaderMenu
properties:
  title:
    _if:
      test:
        _url_query: id
      then: Edit Customer
      else: New Customer

requests:
  - id: get_customer
    type: MongoDBFindOne
    connectionId: customers
    skip:
      _not:
        _url_query: id
    properties:
      query:
        _id:
          _url_query: id
  - id: save_customer
    type: MongoDBUpdateOne
    connectionId: customers
    payload:
      _state: true
    properties:
      upsert: true
      filter:
        _id:
          _payload: _id
      update:
        $set:
          name:
            _payload: name
          email:
            _payload: email
          phone:
            _payload: phone
          status:
            _payload: status

blocks:
  - id: form_card
    type: Card
    blocks:
      - id: name
        type: TextInput
        required: true
        properties:
          title: Name
      - id: email
        type: TextInput
        required: true
        properties:
          title: Email
      - id: phone
        type: TextInput
        properties:
          title: Phone
      - id: status
        type: Selector
        properties:
          title: Status
          options:
            - value: active
              label: Active
            - value: inactive
              label: Inactive
            - value: pending
              label: Pending
      - id: submit
        type: Button
        properties:
          title: Save Customer
        events:
          onClick:
            - id: validate
              type: Validate
            - id: save
              type: Request
              params: save_customer
            - id: notify
              type: DisplayMessage
              params:
                content: Customer saved!
                status: success`,
    },
  },
  {
    id: 'workflow',
    label: 'Approval Workflow',
    generatedLines: '~450',
    lowdefyLines: '~80',
    generated: `import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Card, Steps, Button, Form, Input, Space, Tag, Timeline, Avatar, message, Modal, Descriptions } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined, CommentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

type WorkflowStatus = 'draft' | 'pending' | 'manager_review' | 'director_review' | 'approved' | 'rejected';

interface Approval {
  user: { id: string; name: string; email: string };
  action: 'approved' | 'rejected' | 'requested_changes';
  comment?: string;
  date: string;
}

interface PurchaseRequest {
  _id: string;
  title: string;
  description: string;
  amount: number;
  status: WorkflowStatus;
  submittedBy: { id: string; name: string; email: string };
  approvals: Approval[];
  createdAt: string;
  updatedAt: string;
}

const statusToStep: Record<WorkflowStatus, number> = {
  draft: 0,
  pending: 1,
  manager_review: 2,
  director_review: 3,
  approved: 4,
  rejected: 4,
};

const fetchRequest = async (id: string): Promise<PurchaseRequest> => {
  const res = await fetch(\`/api/purchase-requests/\${id}\`);
  if (!res.ok) throw new Error('Failed to fetch request');
  return res.json();
};

const updateRequestStatus = async ({
  id,
  status,
  comment,
}: {
  id: string;
  status: WorkflowStatus;
  comment?: string;
}) => {
  const res = await fetch(\`/api/purchase-requests/\${id}/status\`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, comment }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
};

export function ApprovalWorkflow() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const { data: request, isLoading } = useQuery({
    queryKey: ['purchase-request', requestId],
    queryFn: () => fetchRequest(requestId!),
    enabled: !!requestId,
  });

  const statusMutation = useMutation({
    mutationFn: updateRequestStatus,
    onSuccess: () => {
      message.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['purchase-request', requestId] });
    },
    onError: () => message.error('Failed to update status'),
  });

  const handleApprove = () => {
    if (!request) return;
    let nextStatus: WorkflowStatus;
    if (request.status === 'pending') {
      nextStatus = request.amount > 10000 ? 'manager_review' : 'approved';
    } else if (request.status === 'manager_review') {
      nextStatus = request.amount > 50000 ? 'director_review' : 'approved';
    } else {
      nextStatus = 'approved';
    }
    statusMutation.mutate({ id: request._id, status: nextStatus });
  };

  const handleReject = () => {
    if (!request) return;
    statusMutation.mutate({ id: request._id, status: 'rejected', comment: rejectComment });
    setRejectModalOpen(false);
    setRejectComment('');
  };

  const canApprove =
    request &&
    ['pending', 'manager_review', 'director_review'].includes(request.status);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!request) return <div className="p-6">Request not found</div>;

  return (
    <div className="p-6 space-y-6">
      <Card title={request.title}>
        <Descriptions column={2}>
          <Descriptions.Item label="Amount">\${request.amount.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'red' : 'blue'}>
              {request.status.replace('_', ' ').toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Submitted By">{request.submittedBy.name}</Descriptions.Item>
          <Descriptions.Item label="Date">{dayjs(request.createdAt).format('MMM D, YYYY')}</Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>{request.description}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="Approval Progress">
        <Steps
          current={statusToStep[request.status]}
          status={request.status === 'rejected' ? 'error' : undefined}
          items={[
            { title: 'Draft' },
            { title: 'Submitted' },
            { title: 'Manager Review' },
            { title: 'Director Review' },
            { title: request.status === 'rejected' ? 'Rejected' : 'Approved' },
          ]}
        />
      </Card>
      {canApprove && (
        <Card title="Actions">
          <Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleApprove}
              loading={statusMutation.isPending}
            >
              Approve
            </Button>
            <Button danger icon={<CloseOutlined />} onClick={() => setRejectModalOpen(true)}>
              Reject
            </Button>
          </Space>
        </Card>
      )}
      <Card title="Approval History">
        <Timeline
          items={request.approvals.map((approval) => ({
            color: approval.action === 'approved' ? 'green' : 'red',
            children: (
              <div>
                <div className="flex items-center gap-2">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span className="font-medium">{approval.user.name}</span>
                  <Tag color={approval.action === 'approved' ? 'green' : 'red'}>
                    {approval.action.toUpperCase()}
                  </Tag>
                </div>
                {approval.comment && (
                  <div className="mt-1 text-gray-600 flex items-center gap-1">
                    <CommentOutlined /> {approval.comment}
                  </div>
                )}
                <div className="text-xs text-gray-400">{dayjs(approval.date).format('MMM D, YYYY h:mm A')}</div>
              </div>
            ),
          }))}
        />
      </Card>
      <Modal
        title="Reject Request"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => setRejectModalOpen(false)}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <Form.Item label="Reason for rejection">
          <Input.TextArea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={4}
            placeholder="Please provide a reason..."
          />
        </Form.Item>
      </Modal>
    </div>
  );
}`,
    lowdefy: {
      content: `id: purchase_approval
type: PageHeaderMenu

requests:
  - id: get_request
    type: MongoDBFindOne
    connectionId: purchase_requests
    properties:
      query:
        _id:
          _url_query: id
  - id: update_status
    type: MongoDBUpdateOne
    connectionId: purchase_requests
    payload:
      _id:
        _state: _id
      new_status:
        _state: new_status
      comment:
        _state: comment
    properties:
      filter:
        _id:
          _payload: _id
      update:
        $set:
          status:
            _payload: new_status
        $push:
          approvals:
            user:
              _user: email
            action:
              _payload: new_status
            date:
              _date: now
            comment:
              _payload: comment

blocks:
  - id: status_steps
    type: Steps
    properties:
      current:
        _switch:
          branches:
            - if:
                _eq:
                  - _request: get_request.status
                  - draft
              then: 0
            - if:
                _eq:
                  - _request: get_request.status
                  - pending
              then: 1
            - if:
                _eq:
                  - _request: get_request.status
                  - manager
              then: 2
          default: 3
      items:
        - title: Draft
        - title: Review
        - title: Manager
        - title: Complete

  - id: approval_actions
    type: Box
    visible:
      _eq:
        - _request: get_request.status
        - pending
    blocks:
      - id: approve_btn
        type: Button
        properties:
          title: Approve
          type: primary
        events:
          onClick:
            - id: set_status
              type: SetState
              params:
                new_status: approved
            - id: save
              type: Request
              params: update_status
      - id: reject_btn
        type: Button
        properties:
          title: Reject
          danger: true`,
    },
  },
];

function YamlHighlight({ content }) {
  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, i) => {
        if (line.trim().startsWith('#')) {
          return (
            <span key={i}>
              <span className="yaml-comment">{line}</span>
              {'\n'}
            </span>
          );
        }

        const match = line.match(/^(\s*)(- )?([a-zA-Z_]+:)?(.*)$/);
        if (match) {
          const [, indent, dash, key, rest] = match;
          return (
            <span key={i}>
              {indent}
              {dash && <span className="yaml-dash">- </span>}
              {key && <span className="yaml-key">{key}</span>}
              {rest && (
                <span
                  className={
                    rest.trim().startsWith('"') || rest.trim().startsWith("'")
                      ? 'yaml-string'
                      : 'yaml-value'
                  }
                >
                  {rest}
                </span>
              )}
              {'\n'}
            </span>
          );
        }

        return (
          <span key={i}>
            {line}
            {'\n'}
          </span>
        );
      })}
    </>
  );
}

export default function Comparison() {
  const [activeTab, setActiveTab] = useState(examples[0].id);
  const activeExample = examples.find((e) => e.id === activeTab);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 bg-grid">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 font-mono">
            Code generators vs <span className="text-gradient">Lowdefy</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Lovable, v0, and other code generators produce raw React. Lowdefy produces reviewable,
            schema-validated config.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => setActiveTab(example.id)}
              className={`px-4 py-2 text-sm font-medium font-mono transition-all ${
                activeTab === example.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {example.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="border border-red-200 dark:border-red-500/20 bg-slate-50 dark:bg-slate-900 overflow-hidden bracket-corners bracket-corners-red">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/10 flex items-center justify-center">
                  <CloseOutlined style={{ fontSize: 20, color: '#f87171' }} />
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Code Generators
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-600 font-mono">
                {activeExample.generatedLines}
              </span>
            </div>
            <pre className="p-6 text-xs text-slate-700 dark:text-slate-300 h-[500px] overflow-auto scrollbar-dark">
              <code>{activeExample.generated}</code>
            </pre>
            <div className="px-6 py-4 bg-red-50 dark:bg-red-500/10 border-t border-red-200 dark:border-red-500/20">
              <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                <li>• Hard to review - need to understand React patterns</li>
                <li>• Security depends on implementation quality</li>
                <li>• Every change can introduce bugs</li>
                <li>• Dependency on specific package versions</li>
              </ul>
            </div>
          </div>

          <div className="border border-green-200 dark:border-green-500/20 bg-slate-50 dark:bg-slate-900 overflow-hidden bracket-corners bracket-corners-green">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/10 flex items-center justify-center">
                  <CheckOutlined style={{ fontSize: 20, color: '#4ade80' }} />
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">Lowdefy Config</span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-600 font-mono">
                {activeExample.lowdefyLines}
              </span>
            </div>
            <pre className="p-6 text-xs h-[500px] overflow-auto scrollbar-dark">
              <code>
                <YamlHighlight content={activeExample.lowdefy.content} />
              </code>
            </pre>
            <div className="px-6 py-4 bg-green-50 dark:bg-green-500/10 border-t border-green-200 dark:border-green-500/20">
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Scan and review in seconds</li>
                <li>• Schema-validated, secure by default</li>
                <li>• Framework handles all the complexity</li>
                <li>• Upgrade framework without changing config</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
