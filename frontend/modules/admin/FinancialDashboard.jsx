import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  HiOutlineCurrencyDollar,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineClock,
} from "react-icons/hi2";
import SEO from "../../src/components/SEO";
import { useAuth } from "../../src/contexts/AuthContext";
import { getFinancialDashboard, getExpensesByCategory, getMonthlyExpenses } from "../../src/services/api/expenses";

const FinancialDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: "",
    year: new Date().getFullYear().toString(),
    startDate: "",
    endDate: "",
  });
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboardData();
    if (activeTab === "categories") {
      loadExpensesByCategory();
    } else if (activeTab === "monthly") {
      loadMonthlyExpenses();
    }
  }, [activeTab, filters.month, filters.year, filters.startDate, filters.endDate]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await getFinancialDashboard({
        month: filters.month || undefined,
        year: filters.year || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setDashboardData(response);
    } catch (error) {
      toast.error(error.message || "Failed to load financial dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpensesByCategory = async () => {
    try {
      const response = await getExpensesByCategory({
        month: filters.month || undefined,
        year: filters.year || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setExpensesByCategory(response.categories || []);
    } catch (error) {
      toast.error(error.message || "Failed to load expenses by category");
    }
  };

  const loadMonthlyExpenses = async () => {
    try {
      const response = await getMonthlyExpenses({
        year: filters.year || undefined,
      });
      setMonthlyData(response.monthly || []);
    } catch (error) {
      toast.error(error.message || "Failed to load monthly expenses");
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

  const formatMonth = (month, year) => {
    return new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen text-white">
      <SEO title="Financial Dashboard | Digital AELA" description="View financial overview and analytics" />

      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Financial Dashboard</h1>
          <p className="text-slate-400">Track income, expenses, and financial health</p>
        </div>

        <div className="mb-6 flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === "overview"
                ? "text-[#F5D26A] border-b-2 border-[#F5D26A]"
                : "text-slate-400 hover:text-white"
            }`}>
            Overview
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === "categories"
                ? "text-[#F5D26A] border-b-2 border-[#F5D26A]"
                : "text-slate-400 hover:text-white"
            }`}>
            By Category
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-4 py-2 text-sm font-semibold transition ${
              activeTab === "monthly"
                ? "text-[#F5D26A] border-b-2 border-[#F5D26A]"
                : "text-slate-400 hover:text-white"
            }`}>
            Monthly Trends
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Month</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
                  style={{ backgroundColor: "#000000" }}>
                  <option value="" style={{ backgroundColor: "#000000" }}>All Months</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month} style={{ backgroundColor: "#000000" }}>
                      {new Date(2000, month - 1).toLocaleString("default", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                <input
                  type="number"
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-slate-400">Loading financial data...</p>
              </div>
            ) : dashboardData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <HiOutlineCurrencyDollar className="h-6 w-6 text-emerald-400" />
                      <p className="text-sm text-slate-400">Total Income</p>
                    </div>
                    <p className="text-3xl font-semibold text-white">
                      {dashboardData.summary?.currency || "AED"}{" "}
                      {dashboardData.summary?.totalIncome?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <HiOutlineCurrencyDollar className="h-6 w-6 text-red-400" />
                      <p className="text-sm text-slate-400">Total Expenses</p>
                    </div>
                    <p className="text-3xl font-semibold text-white">
                      {dashboardData.summary?.currency || "AED"}{" "}
                      {dashboardData.summary?.totalExpenses?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      {dashboardData.summary?.netProfit >= 0 ? (
                        <HiOutlineArrowTrendingUp className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <HiOutlineArrowTrendingDown className="h-6 w-6 text-red-400" />
                      )}
                      <p className="text-sm text-slate-400">Net Profit</p>
                    </div>
                    <p
                      className={`text-3xl font-semibold ${
                        dashboardData.summary?.netProfit >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}>
                      {dashboardData.summary?.currency || "AED"}{" "}
                      {dashboardData.summary?.netProfit?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <HiOutlineClock className="h-6 w-6 text-yellow-400" />
                      <p className="text-sm text-slate-400">Pending Expenses</p>
                    </div>
                    <p className="text-3xl font-semibold text-white">
                      {dashboardData.summary?.currency || "AED"}{" "}
                      {dashboardData.summary?.totalPendingExpenses?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                    <p className="text-sm text-slate-400 mb-1">Refunds</p>
                    <p className="text-2xl font-semibold text-red-400">
                      {dashboardData.summary?.currency || "AED"}{" "}
                      {dashboardData.summary?.totalRefunds?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                    <p className="text-sm text-slate-400 mb-1">Teacher Payouts</p>
                    <p className="text-2xl font-semibold text-blue-400">
                      {dashboardData.summary?.currency || "AED"}{" "}
                      {dashboardData.summary?.totalPayouts?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                    <p className="text-sm text-slate-400 mb-1">Available Fund</p>
                    <p className="text-2xl font-semibold text-emerald-400">
                      {dashboardData.summary?.currency || "AED"}{" "}
                      {(
                        (dashboardData.summary?.totalIncome || 0) -
                        (dashboardData.summary?.totalExpenses || 0) -
                        (dashboardData.summary?.totalPayouts || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                {dashboardData.expensesByCategory && dashboardData.expensesByCategory.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Expenses by Category</h2>
                    <div className="space-y-3">
                      {dashboardData.expensesByCategory
                        .sort((a, b) => b.total - a.total)
                        .map((category) => (
                          <div key={category.category} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <HiOutlineTag className="h-5 w-5 text-slate-400" />
                              <span className="text-white">{getCategoryLabel(category.category)}</span>
                              <span className="text-xs text-slate-400">({category.count} items)</span>
                            </div>
                            <span className="text-lg font-semibold text-white">
                              {dashboardData.summary?.currency || "AED"} {category.total.toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {dashboardData.pendingExpenses && dashboardData.pendingExpenses.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Pending Expenses</h2>
                    <div className="space-y-2">
                      {dashboardData.pendingExpenses.map((expense) => (
                        <div
                          key={expense._id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111] px-4 py-3">
                          <div>
                            <p className="font-semibold text-white">{expense.title}</p>
                            <p className="text-xs text-slate-400">{getCategoryLabel(expense.category)}</p>
                          </div>
                          <span className="text-lg font-semibold text-yellow-400">
                            {expense.currency} {expense.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
                <p className="text-slate-400">No financial data available</p>
              </div>
            )}
          </>
        )}

        {activeTab === "categories" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Month</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
                  style={{ backgroundColor: "#000000" }}>
                  <option value="" style={{ backgroundColor: "#000000" }}>All Months</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month} style={{ backgroundColor: "#000000" }}>
                      {new Date(2000, month - 1).toLocaleString("default", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                <input
                  type="number"
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
                />
              </div>
            </div>

            {expensesByCategory.length === 0 ? (
              <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
                <p className="text-slate-400">No category data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expensesByCategory
                  .sort((a, b) => b.total - a.total)
                  .map((category) => (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {getCategoryLabel(category.category)}
                          </h3>
                          <p className="text-sm text-slate-400">{category.count} expenses</p>
                        </div>
                        <p className="text-3xl font-semibold text-red-400">
                          AED {category.total.toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </>
        )}

        {activeTab === "monthly" && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full max-w-xs rounded-xl border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-sky-400/50 focus:outline-none"
              />
            </div>

            {monthlyData.length === 0 ? (
              <div className="text-center py-12 rounded-3xl border border-white/10 bg-[#060A17]/90">
                <p className="text-slate-400">No monthly data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyData.map((month) => (
                  <motion.div
                    key={`${month.year}-${month.month}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/10 bg-[#060A17]/90 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {formatMonth(month.month, month.year)}
                        </h3>
                        <p className="text-sm text-slate-400">{month.count} expenses</p>
                      </div>
                      <p className="text-3xl font-semibold text-red-400">
                        AED {month.total.toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FinancialDashboard;

