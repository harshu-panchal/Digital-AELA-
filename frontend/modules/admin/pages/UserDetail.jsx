import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaSpinner, FaArrowLeft, FaUser } from "react-icons/fa";
import { fetchUserById } from "../../../src/services/api/adminUsers";

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const response = await fetchUserById(userId);
        if (response?.user) {
          setUser(response.user);
        }
      } catch (error) {
        toast.error(`Failed to load user: ${error.message}`);
        navigate("/super-admin");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUser();
    }
  }, [userId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-white">User not found</div>;
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">
        <FaArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="rounded-2xl border border-white/10 bg-[#0B0F1E]/80 p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/20">
            <FaUser className="h-10 w-10 text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-white">{user.fullName}</h1>
            <p className="mt-1 text-sm text-gray-400">{user.email}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  user.isActive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-gray-500/20 text-gray-400"
                }`}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
              <span className="inline-flex rounded-full bg-[#D4AF37]/20 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">User ID</h3>
            <p className="text-sm text-white">{user._id || user.id}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Role</h3>
            <p className="text-sm text-white capitalize">{user.role}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Email</h3>
            <p className="text-sm text-white">{user.email}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Status</h3>
            <p className="text-sm text-white">{user.isActive ? "Active" : "Inactive"}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Joined</h3>
            <p className="text-sm text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Last Updated</h3>
            <p className="text-sm text-white">{new Date(user.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;

