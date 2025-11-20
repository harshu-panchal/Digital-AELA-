import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlinePlus,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../../src/services/api/expenses";

const ExpenseManagement = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [newExpense, setNewExpense] = useState({
    title: "",
    description: "",
    category: "other",
    amount: "",
    currency: "AED",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "bank_transfer",
    vendor: "",
    status: "pending",
  });
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    month: "",
    year: new Date().getFullYear().toString(),
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadExpenses();
  }, [filters.category, filters.status, filters.month, filters.year, filters.search, pagination.page]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await getAllExpenses({
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setExpenses(response.expenses || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error(error.message || "Failed to load expenses");
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExpense = async () => {
    if (!newExpense.title || !newExpense.amount || Number(newExpense.amount) <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createExpense(newExpense);
      toast.success("Expense created successfully");
      setShowCreateModal(false);
      setNewExpense({
        title: "",
        description: "",
        category: "other",
        amount: "",
        currency: "AED",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "bank_transfer",
        vendor: "",
        status: "pending",
      });
      loadExpenses();
    } catch (error) {
      toast.error(error.message || "Failed to create expense");
    }
  };

  const handleUpdateExpense = async (expenseId, updateData) => {
    try {
      await updateExpense(expenseId, updateData);
      toast.success("Expense updated successfully");
      setEditingExpense(null);
      loadExpenses();
    } catch (error) {
      toast.error(error.message || "Failed to update expense");
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      await deleteExpense(expenseId);
      toast.success("Expense deleted successfully");
      loadExpenses();
    } catch (error) {
      toast.error(error.message || "Failed to delete expense");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "approved":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      case "rejected":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      teacher_salary: "Teacher Salary",
      book_printing: "Book Printing",
      advertising: "Advertising",
      office_expenses: "Office Expenses",
      refunds: "Refunds",
      software_subscriptions: "Software Subscriptions",
      hosting: "Hosting",
      utilities: "Utilities",
      marketing: "Marketing",
      maintenance: "Maintenance",
      other: "Other",
    };
    return labels[category] || category;
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Expense Management | Digital AELA" description="Manage platform expenses" />

      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Expense Management</h1>
            <p className="text-slate-400">Track and manage all platform expenses</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold hover:brightness-110 transition flex items-center gap-2">
            <HiOutlinePlus className="h-5 w-5" />
            Add Expense
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none"
            />
          </div>
          <div>
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Categories</option>
              <option value="teacher_salary">Teacher Salary</option>
              <option value="book_printing">Book Printing</option>
              <option value="advertising">Advertising</option>
              <option value="office_expenses">Office Expenses</option>
              <option value="refunds">Refunds</option>
              <option value="software_subscriptions">Software Subscriptions</option>
              <option value="hosting">Hosting</option>
              <option value="utilities">Utilities</option>
              <option value="marketing">Marketing</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <select
              value={filters.month}
              onChange={(e) => {
                setFilters({ ...filters, month: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none">
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
            <p className="text-slate-400">No expenses found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <motion.div
                key={expense._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{expense.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          expense.status
                        )}`}>
                        {expense.status}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold border border-purple-500/40 bg-purple-500/20 text-purple-300">
                        {getCategoryLabel(expense.category)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <HiOutlineCurrencyDollar className="h-4 w-4" />
                        <span className="text-lg font-semibold text-white">
                          {expense.currency} {expense.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendar className="h-4 w-4" />
                        <span>{formatDate(expense.date)}</span>
                      </div>
                      {expense.vendor && (
                        <div className="flex items-center gap-2">
                          <HiOutlineTag className="h-4 w-4" />
                          <span>{expense.vendor}</span>
                        </div>
                      )}
                    </div>
                    {expense.description && (
                      <p className="text-sm text-slate-400 mb-2">{expense.description}</p>
                    )}
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="px-4 py-2 rounded-lg border border-white/10 bg-[#111] text-white text-sm font-semibold hover:bg-white/5 transition">
                      Edit
                    </button>
                    {expense.status === "pending" && (
                      <button
                        onClick={() => handleUpdateExpense(expense._id, { status: "approved" })}
                        className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-semibold hover:bg-blue-500/30 transition">
                        Approve
                      </button>
                    )}
                    {expense.status === "approved" && (
                      <button
                        onClick={() => handleUpdateExpense(expense._id, { status: "paid" })}
                        className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 transition">
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(expense._id)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition">
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#111] text-white hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        )}

        {/* Create/Edit Expense Modal */}
        {(showCreateModal || editingExpense) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0B0F1E] p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-white mb-4">
                {editingExpense ? "Edit Expense" : "Create New Expense"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={editingExpense?.title || newExpense.title}
                    onChange={(e) =>
                      editingExpense
                        ? setEditingExpense({ ...editingExpense, title: e.target.value })
                        : setNewExpense({ ...newExpense, title: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter expense title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingExpense?.amount || newExpense.amount}
                    onChange={(e) =>
                      editingExpense
                        ? setEditingExpense({ ...editingExpense, amount: e.target.value })
                        : setNewExpense({ ...newExpense, amount: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select
                    value={editingExpense?.category || newExpense.category}
                    onChange={(e) =>
                      editingExpense
                        ? setEditingExpense({ ...editingExpense, category: e.target.value })
                        : setNewExpense({ ...newExpense, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                    <option value="teacher_salary">Teacher Salary</option>
                    <option value="book_printing">Book Printing</option>
                    <option value="advertising">Advertising</option>
                    <option value="office_expenses">Office Expenses</option>
                    <option value="refunds">Refunds</option>
                    <option value="software_subscriptions">Software Subscriptions</option>
                    <option value="hosting">Hosting</option>
                    <option value="utilities">Utilities</option>
                    <option value="marketing">Marketing</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date *</label>
                  <input
                    type="date"
                    value={
                      editingExpense?.date
                        ? new Date(editingExpense.date).toISOString().split("T")[0]
                        : newExpense.date
                    }
                    onChange={(e) =>
                      editingExpense
                        ? setEditingExpense({ ...editingExpense, date: e.target.value })
                        : setNewExpense({ ...newExpense, date: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={editingExpense?.paymentMethod || newExpense.paymentMethod}
                    onChange={(e) =>
                      editingExpense
                        ? setEditingExpense({ ...editingExpense, paymentMethod: e.target.value })
                        : setNewExpense({ ...newExpense, paymentMethod: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="check">Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Vendor</label>
                  <input
                    type="text"
                    value={editingExpense?.vendor || newExpense.vendor}
                    onChange={(e) =>
                      editingExpense
                        ? setEditingExpense({ ...editingExpense, vendor: e.target.value })
                        : setNewExpense({ ...newExpense, vendor: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                    placeholder="Enter vendor name"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingExpense?.description || newExpense.description}
                    onChange={(e) =>
                      editingExpense
                        ? setEditingExpense({ ...editingExpense, description: e.target.value })
                        : setNewExpense({ ...newExpense, description: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-[#D4AF37]/50 focus:outline-none resize-none"
                    placeholder="Enter description"
                  />
                </div>
                {editingExpense && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                    <select
                      value={editingExpense.status}
                      onChange={(e) =>
                        setEditingExpense({ ...editingExpense, status: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2.5 text-white focus:border-[#D4AF37]/50 focus:outline-none">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingExpense(null);
                    setNewExpense({
                      title: "",
                      description: "",
                      category: "other",
                      amount: "",
                      currency: "AED",
                      date: new Date().toISOString().split("T")[0],
                      paymentMethod: "bank_transfer",
                      vendor: "",
                      status: "pending",
                    });
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-[#111] text-white font-semibold hover:bg-white/5 transition">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingExpense) {
                      handleUpdateExpense(editingExpense._id, editingExpense);
                    } else {
                      handleCreateExpense();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-semibold transition hover:brightness-110">
                  {editingExpense ? "Update" : "Create"} Expense
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManagement;

