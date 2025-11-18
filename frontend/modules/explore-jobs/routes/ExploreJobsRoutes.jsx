import React from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ExploreJobsProvider } from "../context/ExploreJobsContext";
import ExploreJobsLayout from "../layout/ExploreJobsLayout";
import ExploreFeed from "../pages/ExploreFeed";
import RecruiterDashboard from "../pages/RecruiterDashboard";
import SeekerDashboard from "../pages/SeekerDashboard";
import PostDetailPage from "../pages/PostDetailPage";
import ApplicantProfilePage from "../pages/ApplicantProfilePage";
import RecruiterAnalyticsHub from "../pages/RecruiterAnalyticsHub";
import JobApplicationAnalytics from "../pages/JobApplicationAnalytics";
import PostModal from "../components/PostModal";
import { useExploreJobs } from "../context/ExploreJobsContext";

const ModalRenderer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: postId } = useParams();
  const { getPostById } = useExploreJobs();
  const post = getPostById(postId);
  const backgroundLocation = location.state?.backgroundLocation;

  if (!post) return null;

  const handleClose = () => {
    if (backgroundLocation) {
      navigate(-1);
    } else {
      navigate("/explore-jobs", { replace: true });
    }
  };

  return <PostModal post={post} isOpen onClose={handleClose} />;
};

const ExploreJobsRoutes = () => {
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <ExploreJobsProvider>
      <Routes location={backgroundLocation || location}>
        <Route path="/*" element={<ExploreJobsLayout />}>
          <Route index element={<ExploreFeed />} />
          <Route path="recruiter-dashboard" element={<RecruiterDashboard />} />
          <Route path="recruiter/applicants/:jobId/:applicationId" element={<ApplicantProfilePage />} />
          <Route path="recruiter/analytics" element={<RecruiterAnalyticsHub />} />
          <Route path="recruiter/analytics/jobs/:jobId" element={<JobApplicationAnalytics />} />
          <Route path="recruiter/pipeline" element={<RecruiterAnalyticsHub />} />
          <Route path="recruiter/hiring-stats" element={<RecruiterAnalyticsHub />} />
          <Route path="recruiter/performance-reports" element={<RecruiterAnalyticsHub />} />
          <Route path="recruiter/bulk-actions" element={<RecruiterAnalyticsHub />} />
          <Route path="recruiter/candidates" element={<RecruiterAnalyticsHub />} />
          <Route path="recruiter/interviews" element={<RecruiterAnalyticsHub />} />
          <Route path="seeker-dashboard" element={<SeekerDashboard />} />
          <Route path="post/:id" element={<PostDetailPage />} />
        </Route>
      </Routes>
      {backgroundLocation && (
        <Routes>
          <Route path="/explore-jobs/post/:id" element={<ModalRenderer />} />
        </Routes>
      )}
    </ExploreJobsProvider>
  );
};

export default ExploreJobsRoutes;
