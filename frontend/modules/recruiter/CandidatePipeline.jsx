import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineUserGroup,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import { fetchCandidatePipelineMetrics, fetchRecruiterJobs } from "../../../src/services/api/recruiter";
import { Link } from "react-router-dom";

const CandidatePipeline = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobs, setJobs] = useState([]);

  const loadJobs = useCallback(async () => {
    try {
      const result = await fetchRecruiterJobs();
      console.log("Jobs data received:", result);
      const jobsData = result?.data || result;
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setJobs([]);
    }
  }, []);

  const loadPipeline = useCallback(async () => {
    try {
      setLoading(true);
      const params = selectedJobId ? { jobId: selectedJobId } : {};
      const result = await fetchCandidatePipelineMetrics(params);
      console.log("Pipeline data received:", result);
      const pipelineData = result?.data || result;
      setData(pipelineData || { pipeline: {}, metrics: {} });
    } catch (err) {
      console.error("Error loading pipeline:", err);
      toast.error(err.message || "Failed to load pipeline metrics");
      setData({ pipeline: {}, metrics: {} });
    } finally {
      setLoading(false);
    }
  }, [selectedJobId]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  if (loading) {
    return (
      <div className="w-full text-white flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-white text-lg mb-2">Loading pipeline...</div>
          <div className="text-gray-400 text-sm">Please wait</div>
        </div>
      </div>
    );
  }

  const { pipeline = {}, metrics = {} } = data || {};
  const stages = ["screening", "assessment", "interview", "offer", "hired", "rejected"];

  return (
    <div className="w-full text-white space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Candidate Pipeline</h1>
            <p className="text-gray-400">Track candidates through hiring stages</p>
          </div>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
          >
            <option value="">All Jobs</option>
            {jobs.map((job) => (
              <option key={job._id || job.id} value={job._id || job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="text-sm text-gray-400 mb-2">Total in Pipeline</div>
            <div className="text-3xl font-bold text-white">{metrics.totalInPipeline || 0}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="text-sm text-gray-400 mb-2">Total Applications</div>
            <div className="text-3xl font-bold text-white">{metrics.totalApplications || 0}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="text-sm text-gray-400 mb-2">Bottlenecks</div>
            <div className="text-3xl font-bold text-white">{metrics.bottlenecks?.length || 0}</div>
          </div>
        </div>

        {(!metrics.totalInPipeline || metrics.totalInPipeline === 0) && (
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-12 text-center">
            <HiOutlineUserGroup className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Candidates in Pipeline</h2>
            <p className="text-gray-400 mb-6">
              Applications will appear here once candidates apply to your job postings.
            </p>
          </div>
        )}

        {metrics.bottlenecks && metrics.bottlenecks.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineExclamationTriangle className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">Bottlenecks</h3>
            </div>
            <div className="space-y-2">
              {metrics.bottlenecks.map((bottleneck, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl border border-yellow-400/20 bg-yellow-400/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="capitalize text-white font-semibold">{bottleneck.stage}</div>
                    <div className="text-sm text-gray-400">{bottleneck.count} candidates</div>
                  </div>
                  <div className="text-yellow-400 font-semibold">{bottleneck.avgDays} days avg</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((stage) => {
            const stageData = pipeline[stage];
            if (!stageData) return null;

            return (
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white capitalize">{stage}</h3>
                  <div className="px-3 py-1 rounded-lg bg-white/5 text-white text-sm font-semibold">
                    {stageData.count}
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stageData.applications && stageData.applications.length > 0 ? (
                    stageData.applications.map((app) => (
                      <Link
                        key={app.applicationId}
                        to={`/recruiter/jobs/${app.job?.id || app.job?._id}/applicants/${app.applicationId}`}
                        className="block p-3 rounded-xl border border-white/5 bg-black/40 hover:border-white/10 transition"
                      >
                        <div className="text-white font-medium text-sm">{app.candidateName}</div>
                        <div className="text-xs text-gray-400 mt-1">{app.candidateHeadline}</div>
                        <div className="text-xs text-gray-500 mt-1">{app.job?.title}</div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-4 text-sm">No candidates</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {metrics.stageFlow && (
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Stage Flow Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(metrics.stageFlow).map(([key, value]) => (
                <div key={key} className="p-4 rounded-xl border border-white/5 bg-black/40">
                  <div className="text-sm text-gray-400 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="text-2xl font-bold text-white">{value}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
  );
};

export default CandidatePipeline;

