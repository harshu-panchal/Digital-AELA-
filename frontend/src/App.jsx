import React, { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../modules/business-management/business-components/Navbar";
import Footer from "../modules/business-management/business-components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import FloatingDebateButton from "./components/FloatingDebateButton";
import ProtectedRoute from "./components/ProtectedRoute";
import FinancialProtectedRoute from "./components/FinancialProtectedRoute";
import Home from "../modules/business-management/business-pages/Home";
import LearnEarnLayout from "../modules/learn-earn/layout/LearnEarnLayout";
import DashboardOverview from "../modules/learn-earn/pages/DashboardOverview";
import NotificationCenter from "../modules/learn-earn/pages/NotificationCenter";
import ProfilePage from "../modules/learn-earn/pages/ProfilePage";
import ChatCentre from "../modules/learn-earn/pages/ChatCentre";
import FindLearners from "../modules/learn-earn/pages/FindLearners";
import UserProfileView from "../modules/learn-earn/pages/UserProfileView";
import FullLeaderboard from "../modules/learn-earn/pages/FullLeaderboard";
import LiveDebates from "../modules/learn-earn/pages/LiveDebates";
import VoiceRoom from "../modules/learn-earn/pages/VoiceRoom";
import ActivitiesHub from "../modules/learn-earn/pages/ActivitiesHub";
import QuizPlay from "../modules/learn-earn/pages/QuizPlay";
import WalletDashboard from "../modules/learn-earn/pages/WalletDashboard";
import RedemptionHistory from "../modules/learn-earn/pages/RedemptionHistory";
import RatingsReviews from "../modules/learn-earn/pages/RatingsReviews";
import AdminControl from "../modules/learn-earn/pages/AdminControl";
import RewardManagement from "../modules/admin/pages/RewardManagement";
import RedemptionRequestsManagement from "../modules/admin/pages/RedemptionRequestsManagement";
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
import PDFEbookReader from "../modules/business-management/free-library/PDFEbookReader";
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
import AdminCourseDetail from "../modules/admin/pages/AdminCourseDetail";
import AdminBookCreate from "../modules/admin/pages/AdminBookCreate";
import AdminBlogCreate from "../modules/admin/pages/AdminBlogCreate";
import ContentManagement from "../modules/admin/pages/ContentManagement";
import GalleryManagement from "../modules/admin/pages/GalleryManagement";
import TestimonialManagement from "../modules/admin/pages/TestimonialManagement";
import UserDetail from "../modules/admin/pages/UserDetail";
import SystemHealth from "../modules/admin/pages/SystemHealth";
import AdminAssignmentList from "../modules/admin/pages/AdminAssignmentList";
import AdminAssignmentDetail from "../modules/admin/pages/AdminAssignmentDetail";
import AdminAssignmentCreate from "../modules/admin/pages/AdminAssignmentCreate";
import AdminStudentManagement from "../modules/admin/pages/AdminStudentManagement";
import AdminDoubtTicketManagement from "../modules/admin/pages/AdminDoubtTicketManagement";
import AdminDoubtTicketDetail from "../modules/admin/pages/AdminDoubtTicketDetail";
// Use lazy loading to prevent circular dependency issues
const TeacherDashboard = lazy(() =>
  import("../modules/teacher/TeacherDashboard")
);
const TeacherLayout = lazy(() =>
  import("../modules/teacher/layout/TeacherLayout")
);
import CourseList from "../modules/teacher/CourseList";
import EbookList from "../modules/teacher/EbookList";
import QuizList from "../modules/teacher/QuizList";
import TeacherProfile from "../modules/teacher/TeacherProfile";
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
import DoubtTicketList from "../modules/student/DoubtTicketList";
import DoubtTicketCreate from "../modules/student/DoubtTicketCreate";
import DoubtTicketDetail from "../modules/student/DoubtTicketDetail";
import DoubtTicketInbox from "../modules/teacher/DoubtTicketInbox";
import TeacherDoubtTicketDetail from "../modules/teacher/DoubtTicketDetail";
import AnnouncementList from "../modules/teacher/AnnouncementList";
import AnnouncementCreate from "../modules/teacher/AnnouncementCreate";
import AnnouncementDetail from "../modules/teacher/AnnouncementDetail";
import AnnouncementManagement from "../modules/admin/AnnouncementManagement";
import AdminAnnouncementCreate from "../modules/admin/AnnouncementCreate";
import AdminAnnouncementDetail from "../modules/admin/AnnouncementDetail";
import ActiveSessions from "../modules/admin/ActiveSessions";
import BackupManagement from "../modules/admin/BackupManagement";
import StudentAnnouncementList from "../modules/student/AnnouncementList";
import StudentAnnouncementDetail from "../modules/student/AnnouncementDetail";
import BatchInformation from "../modules/student/BatchInformation";
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
import CommunityHub from "../modules/community/pages/CommunityHub";
import StudentProfileDetail from "../modules/community/pages/StudentProfileDetail";
import TeacherProfileDetail from "../modules/community/pages/TeacherProfileDetail";
import RecruiterProfileDetail from "../modules/community/pages/RecruiterProfileDetail";
import CourseVideoPlayer from "../modules/student/CourseVideoPlayer";

export const App = () => {
  const location = useLocation();
  const isAdminLogin = location.pathname === "/admin/login";

  // Check if current path is a dashboard
  const isDashboard =
    location.pathname.startsWith("/super-admin") ||
    location.pathname === "/teacher/dashboard" ||
    location.pathname.startsWith("/teacher/") ||
    location.pathname.startsWith("/student/") ||
    location.pathname.startsWith("/learn-earn") ||
    location.pathname === "/recruiter/dashboard" ||
    location.pathname.startsWith("/recruiter/analytics") ||
    location.pathname.startsWith("/explore-jobs");

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
          <Route path="courses/:courseId" element={<AdminCourseDetail />} />
          <Route path="create/book" element={<AdminBookCreate />} />
          <Route path="create/blog" element={<AdminBlogCreate />} />
          <Route path="content-management" element={<ContentManagement />} />
          <Route path="gallery-management" element={<GalleryManagement />} />
          <Route path="testimonials" element={<TestimonialManagement />} />
          <Route
            path="payments"
            element={
              <FinancialProtectedRoute>
                <PaymentManagement />
              </FinancialProtectedRoute>
            }
          />
          <Route path="certificates" element={<CertificateManagement />} />
          <Route path="crm/leads" element={<LeadManagement />} />
          <Route path="crm/leads/:leadId" element={<LeadDetail />} />
          <Route
            path="expenses"
            element={
              <FinancialProtectedRoute>
                <ExpenseManagement />
              </FinancialProtectedRoute>
            }
          />
          <Route
            path="financial-dashboard"
            element={
              <FinancialProtectedRoute>
                <FinancialDashboard />
              </FinancialProtectedRoute>
            }
          />
          <Route path="announcements" element={<AnnouncementManagement />} />
          <Route
            path="announcements/create"
            element={<AdminAnnouncementCreate />}
          />
          <Route
            path="announcements/:announcementId"
            element={<AdminAnnouncementDetail />}
          />
          <Route path="active-sessions" element={<ActiveSessions />} />
          <Route path="backups" element={<BackupManagement />} />
          <Route path="rewards" element={<RewardManagement />} />
          <Route
            path="redemption-requests"
            element={<RedemptionRequestsManagement />}
          />
          <Route path="assignments" element={<AdminAssignmentList />} />
          <Route
            path="assignments/create"
            element={<AdminAssignmentCreate />}
          />
          <Route
            path="assignments/:assignmentId"
            element={<AdminAssignmentDetail />}
          />
          <Route path="students" element={<AdminStudentManagement />} />
          <Route
            path="doubt-tickets"
            element={<AdminDoubtTicketManagement />}
          />
          <Route
            path="doubt-tickets/:ticketId"
            element={<AdminDoubtTicketDetail />}
          />
        </Route>
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <Suspense
                fallback={
                  <div className="min-h-screen bg-[#020409] text-white flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5D26A] mx-auto"></div>
                      <p className="mt-4 text-gray-400">Loading...</p>
                    </div>
                  </div>
                }>
                <TeacherLayout />
              </Suspense>
            </ProtectedRoute>
          }>
          <Route
            path="dashboard"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen bg-[#020409] text-white flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5D26A] mx-auto"></div>
                      <p className="mt-4 text-gray-400">Loading dashboard...</p>
                    </div>
                  </div>
                }>
                <TeacherDashboard />
              </Suspense>
            }
          />
          <Route path="courses" element={<CourseList />} />
          <Route path="courses/new" element={<CourseCreate />} />
          <Route path="courses/:courseId" element={<TeacherCourseDetail />} />
          <Route
            path="courses/:courseId/students"
            element={<StudentManagement />}
          />
          <Route path="ebooks" element={<EbookList />} />
          <Route path="ebooks/upload" element={<EbookUpload />} />
          <Route path="ebooks/:ebookId" element={<EbookDetail />} />
          <Route path="quizzes" element={<QuizList />} />
          <Route path="quizzes/new" element={<QuizCreate />} />
          <Route path="quizzes/:quizId" element={<QuizDetail />} />
          <Route path="quizzes/:quizId/analytics" element={<QuizAnalytics />} />
          <Route path="assignments" element={<AssignmentList />} />
          <Route path="assignments/create" element={<AssignmentCreate />} />
          <Route
            path="assignments/:assignmentId"
            element={<AssignmentDetail />}
          />
          <Route path="students" element={<StudentManagement />} />
          <Route path="analytics" element={<TeacherAnalytics />} />
          <Route path="earnings" element={<TeacherEarnings />} />
          <Route path="doubt-tickets" element={<DoubtTicketInbox />} />
          <Route
            path="doubt-tickets/:ticketId"
            element={<TeacherDoubtTicketDetail />}
          />
          <Route path="announcements" element={<AnnouncementList />} />
          <Route path="announcements/create" element={<AnnouncementCreate />} />
          <Route
            path="announcements/:announcementId"
            element={<AnnouncementDetail />}
          />
          <Route path="payout-requests" element={<PayoutRequests />} />
          <Route path="payment-slips" element={<PaymentSlips />} />
          <Route path="profile" element={<TeacherProfile />} />
        </Route>
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
          <Route path="doubt-tickets" element={<DoubtTicketList />} />
          <Route path="doubt-tickets/create" element={<DoubtTicketCreate />} />
          <Route
            path="doubt-tickets/:ticketId"
            element={<DoubtTicketDetail />}
          />
          <Route path="announcements" element={<StudentAnnouncementList />} />
          <Route
            path="announcements/:announcementId"
            element={<StudentAnnouncementDetail />}
          />
          <Route path="batch" element={<BatchInformation />} />
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
          element={<LearnEarnLayout />}
          key="learn-earn">
          {/* Public routes - accessible without login */}
          <Route path="live-debate-room" element={<LiveDebates />} />
          <Route
            path="live-debate-room/voice-room/:roomId"
            element={<VoiceRoom />}
          />
          <Route path="activities" element={<ActivitiesHub />} />

          {/* Protected routes - require login (show login prompt instead of redirecting) */}
          <Route
            index
            element={
              <ProtectedRoute
                showLoginPrompt={true}
                roles={[
                  "student",
                  "teacher",
                  "influencer",
                  "freelancer",
                  "super-admin",
                ]}>
                <DashboardOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute
                showLoginPrompt={true}
                roles={[
                  "student",
                  "teacher",
                  "influencer",
                  "freelancer",
                  "super-admin",
                ]}>
                <DashboardOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute
                showLoginPrompt={true}
                roles={[
                  "student",
                  "teacher",
                  "influencer",
                  "freelancer",
                  "super-admin",
                ]}>
                <NotificationCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute
                showLoginPrompt={true}
                roles={[
                  "student",
                  "teacher",
                  "influencer",
                  "freelancer",
                  "super-admin",
                ]}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="chat"
            element={
              <ProtectedRoute
                showLoginPrompt={true}
                roles={[
                  "student",
                  "teacher",
                  "influencer",
                  "freelancer",
                  "super-admin",
                ]}>
                <ChatCentre />
              </ProtectedRoute>
            }
          />
          <Route path="find-learners" element={<FindLearners />} />
          <Route path="user/:userId" element={<UserProfileView />} />
          <Route path="quiz/:quizId" element={<QuizPlay />} />
          <Route
            path="quiz/:quizId/leaderboard"
            element={<QuizLeaderboard />}
          />
          <Route
            path="wallet"
            element={
              <ProtectedRoute
                showLoginPrompt={true}
                roles={[
                  "student",
                  "teacher",
                  "influencer",
                  "freelancer",
                  "super-admin",
                ]}>
                <WalletDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="redemption-history"
            element={
              <ProtectedRoute
                showLoginPrompt={true}
                roles={[
                  "student",
                  "teacher",
                  "influencer",
                  "freelancer",
                  "super-admin",
                ]}>
                <RedemptionHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="ratings"
            element={
              <ProtectedRoute
                showLoginPrompt={true}
                roles={[
                  "student",
                  "teacher",
                  "influencer",
                  "freelancer",
                  "super-admin",
                ]}>
                <RatingsReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="leaderboard"
            element={
              <ProtectedRoute
                showLoginPrompt={true}
                roles={[
                  "student",
                  "teacher",
                  "influencer",
                  "freelancer",
                  "super-admin",
                ]}>
                <FullLeaderboard />
              </ProtectedRoute>
            }
          />
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
        <Route
          path="/free-library/ebook/:ebookId/read"
          element={<PDFEbookReader />}
        />
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
          path="/community"
          element={
            <ProtectedRoute
              roles={["student", "teacher", "recruiter", "super-admin"]}>
              <CommunityHub />
            </ProtectedRoute>
          }
        />
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
            <ExploreJobsProvider>
              <ExploreJobsLayout />
            </ExploreJobsProvider>
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
      {!isAdminLogin && !isDashboard && <Footer />}
      {!isAdminLogin &&
        (location.pathname === "/" || location.pathname === "/home") && (
          <FloatingDebateButton />
        )}
    </>
  );
};
export default App;
