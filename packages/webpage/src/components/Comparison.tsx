'use client';

import { useState } from 'react';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';

const examples = [
  {
    id: 'user-table',
    label: 'User Table',
    generatedLines: '~150',
    lowdefyLines: '~25',
    generated: `// AI-generated React component
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Table, Card, Button } from '@/components/ui';
import { fetchUsers, updateUser } from '@/api/users';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export function UserDashboard() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      refetch();
      setIsEditing(false);
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditing(true);
  };

  const handleSave = async (data: Partial<User>) => {
    if (!selectedUser) return;
    await updateMutation.mutateAsync({
      id: selectedUser.id,
      ...data,
    });
  };

  // ... 100+ more lines of component logic,
  // state management, error handling, etc.

  return (
    <div className="space-y-6">
      {/* Complex JSX with conditional rendering */}
    </div>
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
    generatedLines: '~300',
    lowdefyLines: '~40',
    generated: `// AI-generated RBAC implementation
import { createContext, useContext, useState, useEffect } from 'react';
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
}

interface RBACContext {
  user: User | null;
  role: Role | null;
  can: (action: string, resource: string) => boolean;
  isLoading: boolean;
}

const RBACContext = createContext<RBACContext | null>(null);

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<Map<string, Set<string>>>(new Map());

  const { data: role, isLoading } = useQuery({
    queryKey: ['user-role', session?.user?.id],
    queryFn: () => fetchUserRole(session?.user?.id),
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (role?.permissions) {
      const permMap = new Map<string, Set<string>>();
      role.permissions.forEach(p => {
        permMap.set(p.resource, new Set(p.actions));
      });
      setPermissions(permMap);
    }
  }, [role]);

  const can = useCallback((action: string, resource: string) => {
    return permissions.get(resource)?.has(action) ?? false;
  }, [permissions]);

  // ... 200+ more lines: role inheritance, permission caching,
  // protected route components, HOCs, hooks, etc.

  return (
    <RBACContext.Provider value={{ user, role, can, isLoading }}>
      {children}
    </RBACContext.Provider>
  );
}

// Protected component wrapper
export function RequirePermission({
  action,
  resource,
  children,
  fallback
}: ProtectedProps) {
  const { can, isLoading } = useRBAC();

  if (isLoading) return <Skeleton />;
  if (!can(action, resource)) return fallback ?? <AccessDenied />;

  return <>{children}</>;
}

// Usage in components...`,
    lowdefy: {
      content: `# lowdefy.yaml - Auth config
auth:
  authPages:
    signIn: /login
  providers:
    - id: google
      type: GoogleProvider
  userFields:
    roles: roles

# pages/admin-settings.yaml
id: admin_settings
type: PageHeaderMenu
auth:
  public: false
  roles:
    - admin

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

  - id: danger_zone
    type: Card
    visible:
      _array.includes:
        on:
          _user: roles
        value: super_admin
    properties:
      title: Danger Zone
    blocks:
      - id: delete_all
        type: Button
        properties:
          title: Reset Database
          danger: true`,
    },
  },
  {
    id: 'dashboard',
    label: 'Analytics Dashboard',
    generatedLines: '~500',
    lowdefyLines: '~50',
    generated: `// AI-generated analytics dashboard
import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, Select, DateRangePicker } from '@/components/ui';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface DashboardFilters {
  dateRange: { start: Date; end: Date };
  region: string;
  product: string;
}

interface MetricData {
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  trends: TrendPoint[];
}

export function AnalyticsDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: { start: subDays(new Date(), 30), end: new Date() },
    region: 'all',
    product: 'all',
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics', filters],
    queryFn: () => fetchMetrics(filters),
  });

  const { data: salesTrend } = useQuery({
    queryKey: ['sales-trend', filters.dateRange],
    queryFn: () => fetchSalesTrend(filters.dateRange),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products', filters],
    queryFn: () => fetchTopProducts(filters),
  });

  const { data: regionBreakdown } = useQuery({
    queryKey: ['region-breakdown', filters.dateRange],
    queryFn: () => fetchRegionBreakdown(filters.dateRange),
  });

  const chartConfig = useMemo(() => ({
    colors: ['#8884d8', '#82ca9d', '#ffc658'],
    margins: { top: 20, right: 30, left: 20, bottom: 5 },
  }), []);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);

  // ... 350+ more lines: chart components, data transformations,
  // responsive layouts, loading states, error handling,
  // export functionality, drill-down modals, etc.

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Complex grid layout with charts */}
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
    layout:
      span: 16
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
    generatedLines: '~400',
    lowdefyLines: '~70',
    generated: `// AI-generated CRUD form with validation
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\\+?[1-9]\\d{1,14}$/, 'Invalid phone'),
  company: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().length(2, 'Use 2-letter state code'),
    zip: z.string().regex(/^\\d{5}(-\\d{4})?$/, 'Invalid ZIP'),
  }),
  status: z.enum(['active', 'inactive', 'pending']),
  notes: z.string().max(500).optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customerId?: string;
  onSuccess?: () => void;
}

export function CustomerForm({ customerId, onSuccess }: CustomerFormProps) {
  const router = useRouter();
  const isEditing = !!customerId;

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
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ?? {
      name: '',
      email: '',
      status: 'pending',
    },
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      toast.success('Customer created!');
      onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CustomerForm) =>
      updateCustomer(customerId!, data),
    onSuccess: () => {
      toast.success('Customer updated!');
      onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });

  // ... 250+ more lines: form fields, validation display,
  // unsaved changes warning, optimistic updates,
  // field arrays for multiple addresses, etc.

  const onSubmit = async (data: CustomerForm) => {
    if (isEditing) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Many controlled inputs with error states */}
    </form>
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
    properties:
      upsert: true
      filter:
        _id:
          _state: _id
      update:
        $set:
          name:
            _state: name
          email:
            _state: email
          phone:
            _state: phone
          status:
            _state: status

blocks:
  - id: form_card
    type: Card
    blocks:
      - id: name
        type: TextInput
        required: Name is required
        validate:
          - status: error
            message: Name must be at least 2 characters
            pass:
              _gte:
                - _string.length:
                    _state: name
                - 2
        properties:
          title: Name
      - id: email
        type: TextInput
        required: Email is required
        validate:
          - status: error
            message: Invalid email format
            pass:
              _regex:
                pattern: ^[\\w-.]+@[\\w-]+\\.[a-z]{2,}$
                on:
                  _state: email
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
    generatedLines: '~600',
    lowdefyLines: '~85',
    generated: `// AI-generated multi-step approval workflow
import { createMachine, assign } from 'xstate';
import { useMachine } from '@xstate/react';
import { useQuery, useMutation } from '@tanstack/react-query';

interface WorkflowContext {
  requestId: string;
  currentStep: number;
  approvals: Approval[];
  comments: Comment[];
  attachments: Attachment[];
  submittedBy: User;
  status: WorkflowStatus;
}

type WorkflowEvent =
  | { type: 'SUBMIT' }
  | { type: 'APPROVE'; approver: User; comment?: string }
  | { type: 'REJECT'; approver: User; reason: string }
  | { type: 'REQUEST_CHANGES'; changes: string }
  | { type: 'ESCALATE'; to: User };

const workflowMachine = createMachine<WorkflowContext, WorkflowEvent>({
  id: 'approval',
  initial: 'draft',
  states: {
    draft: {
      on: { SUBMIT: 'pending_review' },
    },
    pending_review: {
      on: {
        APPROVE: [
          { target: 'pending_manager', cond: 'needsManagerApproval' },
          { target: 'approved' },
        ],
        REJECT: 'rejected',
        REQUEST_CHANGES: 'changes_requested',
      },
    },
    pending_manager: {
      on: {
        APPROVE: [
          { target: 'pending_director', cond: 'needsDirectorApproval' },
          { target: 'approved' },
        ],
        REJECT: 'rejected',
        ESCALATE: 'escalated',
      },
    },
    pending_director: {
      on: {
        APPROVE: 'approved',
        REJECT: 'rejected',
      },
    },
    changes_requested: {
      on: { SUBMIT: 'pending_review' },
    },
    escalated: {
      on: {
        APPROVE: 'approved',
        REJECT: 'rejected',
      },
    },
    approved: { type: 'final' },
    rejected: { type: 'final' },
  },
}, {
  guards: {
    needsManagerApproval: (ctx) => ctx.amount > 1000,
    needsDirectorApproval: (ctx) => ctx.amount > 10000,
  },
});

export function ApprovalWorkflow({ requestId }: { requestId: string }) {
  const [state, send] = useMachine(workflowMachine);

  const { data: request } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => fetchRequest(requestId),
  });

  const approveMutation = useMutation({...});
  const rejectMutation = useMutation({...});

  // ... 400+ more lines: step indicators, approval history,
  // comment threads, file attachments, email notifications,
  // deadline tracking, delegation, audit log, etc.

  return (
    <div className="workflow-container">
      {/* Complex multi-step UI */}
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
    properties:
      filter:
        _id:
          _state: _id
      update:
        $set:
          status:
            _state: new_status
        $push:
          approvals:
            user:
              _user: email
            action:
              _state: new_status
            date:
              _date: now
            comment:
              _state: comment

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
      _and:
        - _eq:
            - _request: get_request.status
            - pending
        - _array.includes:
            on:
              - manager
              - admin
            value:
              _user: role
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
          danger: true
        events:
          onClick:
            - id: open_modal
              type: CallMethod
              params:
                blockId: reject_modal
                method: open`,
    },
  },
];

function YamlHighlight({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, i) => {
        // Handle comments
        if (line.trim().startsWith('#')) {
          return (
            <span key={i}>
              <span className="yaml-comment">{line}</span>
              {'\n'}
            </span>
          );
        }

        // Parse key-value patterns
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
  const activeExample = examples.find((e) => e.id === activeTab)!;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Code generators vs <span className="text-gradient">Lowdefy</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            See the difference between raw generated code and production-ready config.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => setActiveTab(example.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === example.id
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {example.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Generated Code */}
          <div className="rounded-2xl border border-red-500/30 bg-slate-800/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <CloseOutlined style={{ fontSize: 20, color: '#f87171' }} />
                </div>
                <span className="font-semibold">Code Generators</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">{activeExample.generatedLines}</span>
            </div>
            <pre className="p-6 text-sm text-slate-300 h-[500px] overflow-auto scrollbar-dark">
              <code>{activeExample.generated}</code>
            </pre>
            <div className="px-6 py-4 bg-red-500/10 border-t border-red-500/20">
              <ul className="text-sm text-red-300 space-y-1">
                <li>• Hard to review - need to understand React patterns</li>
                <li>• Security depends on implementation quality</li>
                <li>• Every change can introduce bugs</li>
                <li>• Dependency on specific package versions</li>
              </ul>
            </div>
          </div>

          {/* Lowdefy Config */}
          <div className="rounded-2xl border border-green-500/30 bg-slate-800/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckOutlined style={{ fontSize: 20, color: '#4ade80' }} />
                </div>
                <span className="font-semibold">Lowdefy Config</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">{activeExample.lowdefyLines}</span>
            </div>
            <pre className="p-6 text-sm h-[500px] overflow-auto scrollbar-dark">
              <code>
                <YamlHighlight content={activeExample.lowdefy.content} />
              </code>
            </pre>
            <div className="px-6 py-4 bg-green-500/10 border-t border-green-500/20">
              <ul className="text-sm text-green-300 space-y-1">
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
