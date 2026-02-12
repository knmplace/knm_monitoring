'use client';

/**
 * User Management Component
 * Displays and manages wordsearch game users
 * Only shown on the wordsearch project detail page
 */

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  nickname: string | null;
  player_code: string | null;
  has_seen_prompt: number;
  created_at: string;
  last_active: string;
  total_score: number;
  puzzles_completed: number;
  current_streak: number;
  best_streak: number;
  completed_count: number;
  leaderboard_entries: number;
}

interface UserManagementProps {
  projectId: string;
  idToken: string;
}

export function UserManagement({ projectId, idToken }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!idToken) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/users`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) return;

    setActionLoading('add');
    setAddError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ nickname: newNickname.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setNewNickname('');
        setShowAddForm(false);
        fetchUsers();
      } else {
        setAddError(result.error || 'Failed to create user');
      }
    } catch (error: any) {
      setAddError(error.message || 'Failed to create user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (sessionId: string) => {
    setActionLoading(`delete-${sessionId}`);

    try {
      const response = await fetch(`/api/projects/${projectId}/users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();

      if (result.success) {
        setDeleteConfirm(null);
        fetchUsers();
      } else {
        alert(`Failed to delete user: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const copyPlayerCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    if (idToken) {
      fetchUsers();
    }
  }, [idToken, projectId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            User Management
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({users.length} user{users.length !== 1 ? 's' : ''})
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50"
            title="Refresh users"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setAddError(null);
              setNewNickname('');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium transition"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
          <form onSubmit={handleAddUser} className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Enter player nickname..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!newNickname.trim() || actionLoading === 'add'}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
            >
              {actionLoading === 'add' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddError(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </form>
          {addError && (
            <p className="mt-2 text-sm text-red-600">{addError}</p>
          )}
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          No users found for this project
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nickname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puzzles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Streak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.nickname || '(unnamed)'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.player_code ? (
                        <button
                          onClick={() => copyPlayerCode(user.player_code!)}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded font-mono text-xs hover:bg-gray-200 transition"
                          title="Click to copy"
                        >
                          {user.player_code}
                          {copiedCode === user.player_code ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-400" />
                          )}
                        </button>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.total_score.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.completed_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.current_streak > 0 ? (
                        <span className="text-orange-600 font-medium">{user.current_streak}</span>
                      ) : (
                        '0'
                      )}
                      {user.best_streak > 0 && (
                        <span className="text-gray-400 ml-1">(best: {user.best_streak})</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.last_active
                        ? formatDistanceToNow(new Date(user.last_active + 'Z'), { addSuffix: true })
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.created_at
                        ? formatDistanceToNow(new Date(user.created_at + 'Z'), { addSuffix: true })
                        : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {deleteConfirm === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={actionLoading !== null}
                            className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                          >
                            {actionLoading === `delete-${user.id}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Confirm'
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          disabled={actionLoading !== null}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
