import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../modules/business-management/business-components/Navbar";
import Footer from "../modules/business-management/business-components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "../modules/business-management/business-pages/Home";
import LearnEarnLayout from "../modules/learn-earn/layout/LearnEarnLayout";
import DashboardOverview from "../modules/learn-earn/pages/DashboardOverview";
import ProfilePage from "../modules/learn-earn/pages/ProfilePage";
import ChatCentre from "../modules/learn-earn/pages/ChatCentre";
import FindLearners from "../modules/learn-earn/pages/FindLearners";
import UserProfileView from "../modules/learn-earn/pages/UserProfileView";
import LiveDebates from "../modules/learn-earn/pages/LiveDebates";
import ActivitiesHub from "../modules/learn-earn/pages/ActivitiesHub";
import QuizPlay from "../modules/learn-earn/pages/QuizPlay";
import WalletDashboard from "../modules/learn-earn/pages/WalletDashboard";
import RatingsReviews from "../modules/learn-earn/pages/RatingsReviews";
import AdminControl from "../modules/learn-earn/pages/AdminControl";
import CorporateTrainingCourses from "../modules/business-management/cources-pages/Corporate-training-cources";
import DigitalMarketingCourses from "../modules/business-management/cources-pages/Digital-marketing-cources";
import EnglishLanguageCourses from "../modules/business-management/cources-pages/English-language-cources";
import Books from "../modules/business-management/business-pages/Books";
import BookDetail from "../modules/business-management/business-pages/BookDetail";
import BookPayment from "../modules/business-management/business-pages/BookPayment";
import GiftPayment from "../modules/business-management/gift-pages/GiftPayment";
import OurStory from "../modules/business-management/business-pages/OurStory";
import MissionVision from "../modules/business-management/business-pages/MissionVision";
import MeetTheFounder from "../modules/business-management/business-pages/MeetTheFounder";
import StudentSuccessStories from "../modules/business-management/business-pages/StudentSuccessStories";
import Disclaimer from "../modules/business-management/business-pages/Disclaimer";
import PrivacyPolicy from "../modules/business-management/business-pages/PrivacyPolicy";
import RefundCancellationPolicy from "../modules/business-management/business-pages/RefundCancellationPolicy";
import TermsConditions from "../modules/business-management/business-pages/TermsConditions";
import CoursePayment from "../modules/business-management/business-pages/CoursePayment";
import CourseDetail from "../modules/business-management/business-pages/CourseDetail";
import BookDemo from "../modules/business-management/contact-pages/BookDemo";
import BusinessCollaboration from "../modules/business-management/contact-pages/BusinessCollaboration";
import FranchiseInquiry from "../modules/business-management/contact-pages/FranchiseInquiry";
import TeacherLogin from "../modules/business-management/login-pages/TeacherLogin";
import StudentLogin from "../modules/business-management/login-pages/StudentLogin";
import RecruiterLogin from "../modules/business-management/login-pages/RecruiterLogin";
import BranchOwnerLogin from "../modules/business-management/login-pages/BranchOwnerLogin";
import ForgotPassword from "../modules/business-management/login-pages/ForgotPassword";
import ResetPassword from "../modules/business-management/login-pages/ResetPassword";
import TeacherRegister from "../modules/business-management/login-pages/TeacherRegister";
import StudentRegister from "../modules/business-management/login-pages/StudentRegister";
import RecruiterRegister from "../modules/business-management/login-pages/RecruiterRegister";
import BranchOwnerRegister from "../modules/business-management/login-pages/BranchOwnerRegister";
import BlogsHome from "../modules/blogs/pages/BlogsHome";
import BlogDetails from "../modules/blogs/pages/BlogDetails";
import CreateBlog from "../modules/blogs/pages/CreateBlog";
import MyBlogs from "../modules/blogs/pages/MyBlogs";
import ExploreJobsLayout from "../modules/explore-jobs/layout/ExploreJobsLayout";
import ExploreFeed from "../modules/explore-jobs/pages/ExploreFeed";
import SeekerDashboard from "../modules/explore-jobs/pages/SeekerDashboard";
import ExplorePostDetailPage from "../modules/explore-jobs/pages/PostDetailPage";
import { ExploreJobsProvider } from "../modules/explore-jobs/context/ExploreJobsContext";
import RecruiterDashboard from "../modules/recruiter/RecruiterDashboard";
import RecruiterAnalyticsHub from "../modules/recruiter/RecruiterAnalyticsHub";
import JobApplicationAnalytics from "../modules/recruiter/JobApplicationAnalytics";
import ApplicantProfilePage from "../modules/recruiter/ApplicantProfilePage";
import JoinAsTeacher from "../modules/business-management/join-us-pages/JoinAsTeacher";
import JoinInfluencer from "../modules/business-management/join-us-pages/JoinInfluencer";
import JoinFreelancer from "../modules/business-management/join-us-pages/JoinFreelancer";
import JoinBuildAfterLife from "../modules/business-management/join-us-pages/JoinBuildAfterLife";
import FreeLibrary from "../modules/business-management/free-library/FreeLibrary";
import FreeLibraryReader from "../modules/business-management/free-library/FreeLibraryReader";
import Gallery from "../modules/business-management/business-pages/Gallery";
import SuperAdminDashboard from "../modules/admin/SuperAdminDashboard";
import AdminLogin from "../modules/admin/AdminLogin";
import AdminLayout from "../modules/admin/layout/AdminLayout";
import UserManagement from "../modules/admin/pages/UserManagement";
import ApprovalPage from "../modules/admin/pages/ApprovalPage";
import ReviewModeration from "../modules/admin/ReviewModeration";
import LiveRoomModeration from "../modules/admin/pages/LiveRoomModeration";
import AdvancedAnalytics from "../modules/admin/pages/AdvancedAnalytics";
import SystemSettings from "../modules/admin/pages/SystemSettings";
import AdminCourseCreate from "../modules/admin/pages/AdminCourseCreate";
import AdminBookCreate from "../modules/admin/pages/AdminBookCreate";
import AdminBlogCreate from "../modules/admin/pages/AdminBlogCreate";
import UserDetail from "../modules/admin/pages/UserDetail";
import SystemHealth from "../modules/admin/pages/SystemHealth";
import TeacherDashboard from "../modules/teacher/TeacherDashboard";
import TeacherMarketplace from "../modules/teacher/TeacherMarketplace";
import StudentDashboard from "../modules/student/StudentDashboard";
import EnrolledCourses from "../modules/student/EnrolledCourses";
import PointsHistory from "../modules/student/PointsHistory";
import ApplicationHistory from "../modules/student/ApplicationHistory";
import StudentLayout from "../modules/student/layout/StudentLayout";
import StudentProfile from "../modules/student/StudentProfile";
import CourseCreate from "../modules/teacher/CourseCreate";
import TeacherCourseDetail from "../modules/teacher/CourseDetail";
import EbookUpload from "../modules/teacher/EbookUpload";
import EbookDetail from "../modules/teacher/EbookDetail";
import QuizCreate from "../modules/teacher/QuizCreate";
import QuizAnalytics from "../modules/teacher/QuizAnalytics";
import QuizLeaderboard from "../modules/student/QuizLeaderboard";
import QuizDetail from "../modules/teacher/QuizDetail";
import TeacherAnalytics from "../modules/teacher/TeacherAnalytics";
import StudentManagement from "../modules/teacher/StudentManagement";
import AssignmentCreate from "../modules/teacher/AssignmentCreate";
import AssignmentList from "../modules/teacher/AssignmentList";
import AssignmentDetail from "../modules/teacher/AssignmentDetail";
import StudentAssignmentList from "../modules/student/AssignmentList";
import StudentAssignmentDetail from "../modules/student/AssignmentDetail";
import PaymentHistory from "../modules/student/PaymentHistory";
import CertificateList from "../modules/student/CertificateList";
import TeacherEarnings from "../modules/teacher/TeacherEarnings";
import PayoutRequests from "../modules/teacher/PayoutRequests";
import PaymentSlips from "../modules/teacher/PaymentSlips";
import PaymentManagement from "../modules/admin/PaymentManagement";
import CertificateManagement from "../modules/admin/CertificateManagement";
import LeadManagement from "../modules/admin/LeadManagement";
import LeadDetail from "../modules/admin/LeadDetail";
import ExpenseManagement from "../modules/admin/ExpenseManagement";
import FinancialDashboard from "../modules/admin/FinancialDashboard";
import StudentProfileDetail from "../modules/community/pages/StudentProfileDetail";
import TeacherProfileDetail from "../modules/community/pages/TeacherProfileDetail";
import RecruiterProfileDetail from "../modules/community/pages/RecruiterProfileDetail";
import CourseVideoPlayer from "../modules/student/CourseVideoPlayer";

export const App = () => {
  const location = useLocation();
  const isAdminLogin = location.pathname === "/admin/login";

  return (
    <>
      <ScrollToTop />
      <ToastContainer position="top-right" autoClose={3200} theme="dark" />
      {!isAdminLogin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/super-admin/*"
          element={
            <ProtectedRoute roles={["super-admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="users/:role" element={<UserManagement />} />
          <Route path="users/id/:userId" element={<UserDetail />} />
          <Route path="approvals/:type" element={<ApprovalPage />} />
          <Route path="reviews/moderate" element={<ReviewModeration />} />
          <Route path="live-rooms/moderate" element={<LiveRoomModeration />} />
          <Route path="analytics" element={<AdvancedAnalytics />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="system-health" element={<SystemHealth />} />
          <Route path="create/course" element={<AdminCourseCreate />} />
          <Route path="create/book" element={<AdminBookCreate />} />
          <Route path="create/blog" element={<AdminBlogCreate />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="certificates" element={<CertificateManagement />} />
          <Route path="crm/leads" element={<LeadManagement />} />
          <Route path="crm/leads/:leadId" element={<LeadDetail />} />
          <Route path="expenses" element={<ExpenseManagement />} />
          <Route path="financial-dashboard" element={<FinancialDashboard />} />
        </Route>
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/marketplace"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <TeacherMarketplace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/new"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <CourseCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <TeacherCourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/ebooks/upload"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <EbookUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/ebooks/:ebookId"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <EbookDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quizzes/new"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <QuizCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quizzes/:quizId"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <QuizDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quizzes/:quizId/analytics"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <QuizAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/analytics"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <TeacherAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <StudentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId/students"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <StudentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <AssignmentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments/create"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <AssignmentCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments/:assignmentId"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <AssignmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/earnings"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <TeacherEarnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/payout-requests"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <PayoutRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/payment-slips"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <PaymentSlips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/*"
          element={
            <ProtectedRoute roles={["student", "super-admin"]}>
              <StudentLayout />
            </ProtectedRoute>
          }>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<EnrolledCourses />} />
          <Route path="courses/:courseId" element={<EnrolledCourses />} />
          <Route path="points/history" element={<PointsHistory />} />
          <Route path="applications" element={<ApplicationHistory />} />
          <Route path="assignments" element={<StudentAssignmentList />} />
          <Route
            path="assignments/:assignmentId"
            element={<StudentAssignmentDetail />}
          />
          <Route path="payments" element={<PaymentHistory />} />
          <Route path="certificates" element={<CertificateList />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>
        <Route
          path="/courses/videos/:videoId"
          element={
            <ProtectedRoute roles={["student", "teacher", "super-admin"]}>
              <CourseVideoPlayer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learn-earn"
          element={
            <ProtectedRoute
              roles={[
                "student",
                "teacher",
                "influencer",
                "freelancer",
                "super-admin",
              ]}>
              <LearnEarnLayout />
            </ProtectedRoute>
          }
          key="learn-earn">
          <Route index element={<DashboardOverview />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="chat" element={<ChatCentre />} />
          <Route path="find-learners" element={<FindLearners />} />
          <Route path="user/:userId" element={<UserProfileView />} />
          <Route path="live-debates" element={<LiveDebates />} />
          <Route path="activities" element={<ActivitiesHub />} />
          <Route path="quiz/:quizId" element={<QuizPlay />} />
          <Route
            path="quiz/:quizId/leaderboard"
            element={<QuizLeaderboard />}
          />
          <Route path="wallet" element={<WalletDashboard />} />
          <Route path="ratings" element={<RatingsReviews />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={["super-admin"]}>
                <AdminControl />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/courses/corporate-training"
          element={<CorporateTrainingCourses />}
        />
        <Route
          path="/courses/digital-marketing"
          element={<DigitalMarketingCourses />}
        />
        <Route
          path="/courses/english-language"
          element={<EnglishLanguageCourses />}
        />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route
          path="/books/:id/payment"
          element={
            <ProtectedRoute
              roles={[
                "student",
                "teacher",
                "recruiter",
                "influencer",
                "freelancer",
                "super-admin",
              ]}>
              <BookPayment />
            </ProtectedRoute>
          }
        />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/courses/id/:courseId" element={<CourseDetail />} />
        <Route path="/courses/payment" element={<CoursePayment />} />
        <Route
          path="/gift/payment"
          element={
            <ProtectedRoute
              roles={[
                "student",
                "teacher",
                "recruiter",
                "influencer",
                "freelancer",
                "super-admin",
              ]}>
              <GiftPayment />
            </ProtectedRoute>
          }
        />
        <Route path="/free-library" element={<FreeLibrary />} />
        <Route path="/free-library/:bookId" element={<FreeLibraryReader />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/about/our-story" element={<OurStory />} />
        <Route path="/about/mission-vision" element={<MissionVision />} />
        <Route path="/about/founder" element={<MeetTheFounder />} />
        <Route
          path="/about/success-stories"
          element={<StudentSuccessStories />}
        />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route
          path="/refund-cancellation-policy"
          element={<RefundCancellationPolicy />}
        />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/contact/book-demo" element={<BookDemo />} />
        <Route
          path="/contact/business-collaboration"
          element={<BusinessCollaboration />}
        />
        <Route
          path="/contact/franchise-partnership"
          element={<FranchiseInquiry />}
        />
        <Route path="/blogs" element={<BlogsHome />} />
        <Route
          path="/blogs/create"
          element={
            <ProtectedRoute
              roles={[
                "student",
                "teacher",
                "recruiter",
                "influencer",
                "freelancer",
                "super-admin",
              ]}>
              <CreateBlog />
            </ProtectedRoute>
          }
        />
        <Route path="/blogs/:id" element={<BlogDetails />} />
        <Route
          path="/my-blogs"
          element={
            <ProtectedRoute
              roles={[
                "student",
                "teacher",
                "recruiter",
                "influencer",
                "freelancer",
                "super-admin",
              ]}>
              <MyBlogs />
            </ProtectedRoute>
          }
        />
        <Route path="/join-us/teacher" element={<JoinAsTeacher />} />
        <Route path="/join-us/influencer" element={<JoinInfluencer />} />
        <Route path="/join-us/freelancer" element={<JoinFreelancer />} />
        <Route path="/join-us/afterlife" element={<JoinBuildAfterLife />} />
        <Route
          path="/community/students/:userId"
          element={<StudentProfileDetail />}
        />
        <Route
          path="/community/teachers/:userId"
          element={<TeacherProfileDetail />}
        />
        <Route
          path="/community/recruiters/:userId"
          element={<RecruiterProfileDetail />}
        />
        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute roles={["recruiter", "super-admin"]}>
              <ExploreJobsProvider>
                <RecruiterDashboard />
              </ExploreJobsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/analytics"
          element={
            <ProtectedRoute roles={["recruiter", "super-admin"]}>
              <ExploreJobsProvider>
                <RecruiterAnalyticsHub />
              </ExploreJobsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/analytics/jobs/:jobId"
          element={
            <ProtectedRoute roles={["recruiter", "super-admin"]}>
              <ExploreJobsProvider>
                <JobApplicationAnalytics />
              </ExploreJobsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/jobs/:jobId/applicants/:applicationId"
          element={
            <ProtectedRoute roles={["recruiter", "super-admin"]}>
              <ExploreJobsProvider>
                <ApplicantProfilePage />
              </ExploreJobsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore-jobs/*"
          element={
            <ProtectedRoute
              roles={[
                "student",
                "teacher",
                "recruiter",
                "influencer",
                "freelancer",
                "super-admin",
              ]}>
              <ExploreJobsProvider>
                <ExploreJobsLayout />
              </ExploreJobsProvider>
            </ProtectedRoute>
          }>
          <Route index element={<ExploreFeed />} />
          <Route
            path="seeker-dashboard"
            element={
              <ProtectedRoute
                roles={[
                  "student",
                  "influencer",
                  "freelancer",
                  "teacher",
                  "super-admin",
                ]}>
                <SeekerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="post/:id"
            element={
              <ProtectedRoute
                roles={[
                  "student",
                  "teacher",
                  "recruiter",
                  "influencer",
                  "freelancer",
                  "super-admin",
                ]}>
                <ExplorePostDetailPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login/teacher" element={<TeacherLogin />} />
        <Route path="/register/teacher" element={<TeacherRegister />} />
        <Route path="/login/student" element={<StudentLogin />} />
        <Route path="/register/student" element={<StudentRegister />} />
        <Route path="/login/recruiter" element={<RecruiterLogin />} />
        <Route path="/register/recruiter" element={<RecruiterRegister />} />
        <Route path="/login/branch-owner" element={<BranchOwnerLogin />} />
        <Route
          path="/register/branch-owner"
          element={<BranchOwnerRegister />}
        />
      </Routes>
      {!isAdminLogin && <Footer />}
    </>
  );
};
export default App;
