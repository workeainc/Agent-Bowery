'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  organizationId: string;
  organizationName: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
  profileImage?: string;
  department?: string;
  phone?: string;
  timezone?: string;
}

interface UserManagementProps {
  onUserSelect?: (user: User) => void;
}

export default function UserManagement({ onUserSelect }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'role' | 'lastLogin'>('name');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'viewer' as User['role'],
    organizationId: 'org_chauncey',
    organizationName: 'Chauncey Organization',
    department: '',
    phone: '',
    timezone: 'UTC',
    isActive: true
  });

  // Mock data for demonstration
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@agentbowery.com',
      name: 'Admin User',
      role: 'admin',
      organizationId: 'org_chauncey',
      organizationName: 'Chauncey Organization',
      isActive: true,
      lastLoginAt: new Date('2024-01-20T10:30:00'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-20'),
      permissions: ['admin:access', 'users:manage', 'templates:manage', 'brand-rules:manage'],
      department: 'Administration',
      phone: '+1-555-0101',
      timezone: 'UTC'
    },
    {
      id: '2',
      email: 'editor@agentbowery.com',
      name: 'Editor User',
      role: 'editor',
      organizationId: 'org_chauncey',
      organizationName: 'Chauncey Organization',
      isActive: true,
      lastLoginAt: new Date('2024-01-19T14:15:00'),
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-19'),
      permissions: ['content:create', 'content:edit', 'templates:manage', 'leads:manage'],
      department: 'Content',
      phone: '+1-555-0102',
      timezone: 'UTC'
    },
    {
      id: '3',
      email: 'viewer@agentbowery.com',
      name: 'Viewer User',
      role: 'viewer',
      organizationId: 'org_chauncey',
      organizationName: 'Chauncey Organization',
      isActive: true,
      lastLoginAt: new Date('2024-01-18T09:45:00'),
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      permissions: ['analytics:view', 'leads:view'],
      department: 'Analytics',
      phone: '+1-555-0103',
      timezone: 'UTC'
    },
    {
      id: '4',
      email: 'john.doe@agentbowery.com',
      name: 'John Doe',
      role: 'editor',
      organizationId: 'org_chauncey',
      organizationName: 'Chauncey Organization',
      isActive: true,
      lastLoginAt: new Date('2024-01-17T16:20:00'),
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-17'),
      permissions: ['content:create', 'content:edit', 'templates:manage'],
      department: 'Marketing',
      phone: '+1-555-0104',
      timezone: 'UTC'
    },
    {
      id: '5',
      email: 'jane.smith@agentbowery.com',
      name: 'Jane Smith',
      role: 'viewer',
      organizationId: 'org_chauncey',
      organizationName: 'Chauncey Organization',
      isActive: false,
      lastLoginAt: new Date('2024-01-15T11:30:00'),
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-15'),
      permissions: ['analytics:view'],
      department: 'Research',
      phone: '+1-555-0105',
      timezone: 'UTC'
    },
    {
      id: '6',
      email: 'mike.wilson@agentbowery.com',
      name: 'Mike Wilson',
      role: 'admin',
      organizationId: 'org_chauncey',
      organizationName: 'Chauncey Organization',
      isActive: true,
      lastLoginAt: new Date('2024-01-20T08:15:00'),
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-20'),
      permissions: ['admin:access', 'users:manage', 'templates:manage', 'brand-rules:manage'],
      department: 'IT',
      phone: '+1-555-0106',
      timezone: 'UTC'
    }
  ];

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  const handleCreateUser = () => {
    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      organizationId: formData.organizationId,
      organizationName: formData.organizationName,
      department: formData.department,
      phone: formData.phone,
      timezone: formData.timezone,
      isActive: formData.isActive,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: getRolePermissions(formData.role)
    };

    setUsers(prev => [newUser, ...prev]);
    setShowCreateModal(false);
    resetForm();
    alert('User created successfully!');
  };

  const handleEditUser = () => {
    if (!editingUser) return;

    const updatedUser: User = {
      ...editingUser,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      organizationId: formData.organizationId,
      organizationName: formData.organizationName,
      department: formData.department,
      phone: formData.phone,
      timezone: formData.timezone,
      isActive: formData.isActive,
      updatedAt: new Date(),
      permissions: getRolePermissions(formData.role)
    };

    setUsers(prev => prev.map(user => 
      user.id === editingUser.id ? updatedUser : user
    ));
    setShowEditModal(false);
    setEditingUser(null);
    resetForm();
    alert('User updated successfully!');
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    setUsers(prev => prev.filter(user => user.id !== userId));
    alert('User deleted successfully!');
  };

  const handleToggleActive = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive, updatedAt: new Date() }
        : user
    ));
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      department: user.department || '',
      phone: user.phone || '',
      timezone: user.timezone || 'UTC',
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const handleChangeRole = (userId: string, newRole: User['role']) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            role: newRole, 
            permissions: getRolePermissions(newRole),
            updatedAt: new Date() 
          }
        : user
    ));
    setShowRoleModal(false);
    alert(`User role changed to ${newRole}!`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'viewer',
      organizationId: 'org_chauncey',
      organizationName: 'Chauncey Organization',
      department: '',
      phone: '',
      timezone: 'UTC',
      isActive: true
    });
  };

  const getRolePermissions = (role: User['role']) => {
    const rolePermissions = {
      admin: ['admin:access', 'users:manage', 'templates:manage', 'brand-rules:manage', 'quality-policies:manage'],
      editor: ['content:create', 'content:edit', 'templates:manage', 'leads:manage'],
      viewer: ['analytics:view', 'leads:view']
    };
    return rolePermissions[role] || [];
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'role':
        return a.role.localeCompare(b.role);
      case 'lastLogin':
        if (!a.lastLoginAt && !b.lastLoginAt) return 0;
        if (!a.lastLoginAt) return 1;
        if (!b.lastLoginAt) return -1;
        return b.lastLoginAt.getTime() - a.lastLoginAt.getTime();
      default:
        return 0;
    }
  });

  const getRoleOptions = () => [
    { value: 'admin', label: 'Admin', color: 'text-red-600', bgColor: 'bg-red-100' },
    { value: 'editor', label: 'Editor', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { value: 'viewer', label: 'Viewer', color: 'text-green-600', bgColor: 'bg-green-100' }
  ];

  const getTimezoneOptions = () => [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney', 'Pacific/Auckland'
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'editor': return '✏️';
      case 'viewer': return '👁️';
      default: return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                placeholder="Search users..."
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="input"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                {getRoleOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                className="input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="name">Sort by Name</option>
                <option value="created">Sort by Created</option>
                <option value="role">Sort by Role</option>
                <option value="lastLogin">Sort by Last Login</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {sortedUsers.length} of {users.length} users
            </div>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedUsers.map((user) => (
          <div
            key={user.id}
            className={`card cursor-pointer transition-all ${
              selectedUser?.id === user.id ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleUserSelect(user)}
          >
            <div className="card-content">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <span>{getRoleIcon(user.role)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(user.id);
                    }}
                    className={`w-3 h-3 rounded-full ${
                      user.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={user.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium text-gray-900">{user.department || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">{user.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Login:</span>
                  <span className="font-medium text-gray-900">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">{formatDate(user.createdAt)}</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.slice(0, 3).map((permission, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                    >
                      {permission.split(':')[0]}
                    </span>
                  ))}
                  {user.permissions.length > 3 && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      +{user.permissions.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(user);
                  }}
                  className="btn-outline btn-sm flex-1"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRoleModal(true);
                  }}
                  className="btn-outline btn-sm"
                  title="Change Role"
                >
                  Role
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteUser(user.id);
                  }}
                  className="btn-outline btn-sm text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create User</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="input w-full"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    className="input w-full"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                  >
                    {getRoleOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Enter department"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    className="input w-full"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    className="input w-full"
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    {getTimezoneOptions().map(timezone => (
                      <option key={timezone} value={timezone}>{timezone}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  User is active
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  className="btn-primary"
                  disabled={!formData.name || !formData.email}
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Same form fields as create modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="input w-full"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    className="input w-full"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                  >
                    {getRoleOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Enter department"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    className="input w-full"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    className="input w-full"
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    {getTimezoneOptions().map(timezone => (
                      <option key={timezone} value={timezone}>{timezone}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-700">
                  User is active
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditUser}
                  className="btn-primary"
                  disabled={!formData.name || !formData.email}
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Change User Role</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Select a new role for the user. This will update their permissions automatically.
              </p>
              <div className="space-y-3">
                {getRoleOptions().map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (selectedUser) {
                        handleChangeRole(selectedUser.id, option.value as User['role']);
                      }
                    }}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      selectedUser?.role === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getRoleIcon(option.value)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">
                          {option.value === 'admin' && 'Full system access and management'}
                          {option.value === 'editor' && 'Content creation and editing'}
                          {option.value === 'viewer' && 'Read-only access to analytics and leads'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
