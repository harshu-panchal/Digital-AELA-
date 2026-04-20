import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSpinner, FaUser } from "react-icons/fa";
import { fetchUsersByRole, deleteUser, updateUser } from "../../../src/services/api/adminUsers";
import { createUser } from "../../../src/services/api/adminUsers";

const UserManagement = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const roleLabels = {
    student: "Students",
    teacher: "Teachers",
    recruiter: "Recruiters",
    "branch-owners": "Branch Owners",
    branch_owners: "Branch Owners",
    branch_owner: "Branch Owners",
    influencer: "Influencers",
    freelancer: "Freelancers",
  };

  const getInstituteLabel = (user) => {
    const isBranchUser = user?.branchJoinType === "branch";
    const instituteName = user?.branch?.instituteName;
    if (isBranchUser && instituteName) return instituteName;
    return "Individual";
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchUsersByRole(role, { page, pageSize: 20, search });
      if (response) {
        setUsers(response.users || []);
        setPagination(response.pagination || { total: 0, totalPages: 1 });
      }
    } catch (error) {
      toast.error(`Failed to load ${roleLabels[role]}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      loadUsers();
    }
  }, [role, page, search]);

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(userId);
      toast.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      toast.error(`Failed to delete user: ${error.message}`);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await createUser({
        ...formData,
        role,
      });
      toast.success("User created successfully");
      setShowCreateModal(false);
      setFormData({ email: "", password: "", fullName: "", isActive: true });
      loadUsers();
    } catch (error) {
      toast.error(`Failed to create user: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await updateUser(selectedUser._id, formData);
      toast.success("User updated successfully");
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ email: "", password: "", fullName: "", isActive: true });
      loadUsers();
    } catch (error) {
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: "",
      fullName: user.fullName,
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">{roleLabels[role] || "Users"}</h1>
          <p className="mt-2 text-sm text-gray-400">Manage {roleLabels[role]?.toLowerCase() || "users"}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110">
          <FaPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-10 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No users found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-400">
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Joined</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b border-white/5 text-sm">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/20">
                            <FaUser className="h-5 w-5 text-[#D4AF37]" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user.fullName}</p>
                            <p className="text-xs text-gray-400">{user.role}</p>
                            {(user.role === "student" || user.role === "teacher") && (
                              <p className="mt-0.5 text-xs text-gray-500">
                                Institute: {getInstituteLabel(user)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-gray-300">{user.email}</td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            user.isActive
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-gray-500/20 text-gray-400"
                          }`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10 hover:text-white">
                            <FaEdit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigate(`/super-admin/users/id/${user._id}`);
                            }}
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10 hover:text-white">
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user._id)}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20">
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-sm text-white transition hover:bg-white/5 disabled:opacity-50">
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-sm text-white transition hover:bg-white/5 disabled:opacity-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F1E] p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Create New User</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-white/10 bg-[#111] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">
                  Active
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ email: "", password: "", fullName: "", isActive: true });
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50">
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F1E] p-6">
            <h3 className="mb-4 text-xl font-semibold text-white">Edit User</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-white/10 bg-[#111] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <label htmlFor="isActiveEdit" className="text-sm text-gray-300">
                  Active
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setFormData({ email: "", password: "", fullName: "", isActive: true });
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50">
                  {submitting ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

