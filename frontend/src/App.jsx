import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ScrollToTop from "./components/ScrollToTop";
import FloatingDebateButton from "./components/FloatingDebateButton";
import WebsitePopupForm from "./components/WebsitePopupForm";
import ProtectedRoute from "./components/ProtectedRoute";
import FinancialProtectedRoute from "./components/FinancialProtectedRoute";
import LoadingFallback from "./components/LoadingFallback";
import { ExploreJobsProvider } from "../modules/explore-jobs/context/ExploreJobsContext";

// Lazy load Home, AdminLogin, Navbar, and Footer for better performance
const Home = lazy(() =>
  import("../modules/business-management/business-pages/Home")
);
const AdminLogin = lazy(() => import("../modules/admin/AdminLogin"));
const Navbar = lazy(() =>
  import("../modules/business-management/business-components/Navbar")
);
const Footer = lazy(() =>
  import("../modules/business-management/business-components/Footer")
);
const LeadCaptureBar = lazy(() =>
  import("../modules/business-management/business-components/LeadCaptureBar")
);

// Lazy load all route components
const LearnEarnLayout = lazy(() =>
  import("../modules/learn-earn/layout/LearnEarnLayout")
);
const DashboardOverview = lazy(() =>
  import("../modules/learn-earn/pages/DashboardOverview")
);
const NotificationCenter = lazy(() =>
  import("../modules/learn-earn/pages/NotificationCenter")
);
const ProfilePage = lazy(() =>
  import("../modules/learn-earn/pages/ProfilePage")
);
const ChatCentre = lazy(() => import("../modules/learn-earn/pages/ChatCentre"));
const FindLearners = lazy(() =>
  import("../modules/learn-earn/pages/FindLearners")
);
const UserProfileView = lazy(() =>
  import("../modules/learn-earn/pages/UserProfileView")
);
const FullLeaderboard = lazy(() =>
  import("../modules/learn-earn/pages/FullLeaderboard")
);
const LiveDebates = lazy(() =>
  import("../modules/learn-earn/pages/LiveDebates")
);
const VoiceRoom = lazy(() => import("../modules/learn-earn/pages/VoiceRoom"));
const ActivitiesHub = lazy(() =>
  import("../modules/learn-earn/pages/ActivitiesHub")
);
const QuizPlay = lazy(() => import("../modules/learn-earn/pages/QuizPlay"));
const WalletDashboard = lazy(() =>
  import("../modules/learn-earn/pages/WalletDashboard")
);
const RedemptionHistory = lazy(() =>
  import("../modules/learn-earn/pages/RedemptionHistory")
);
const RatingsReviews = lazy(() =>
  import("../modules/learn-earn/pages/RatingsReviews")
);
const AdminControl = lazy(() =>
  import("../modules/learn-earn/pages/AdminControl")
);

// Admin pages - lazy loaded
const SuperAdminDashboard = lazy(() =>
  import("../modules/admin/SuperAdminDashboard")
);
const AdminLayout = lazy(() => import("../modules/admin/layout/AdminLayout"));
const UserManagement = lazy(() =>
  import("../modules/admin/pages/UserManagement")
);
const ApprovalPage = lazy(() => import("../modules/admin/pages/ApprovalPage"));
const ReviewModeration = lazy(() =>
  import("../modules/admin/ReviewModeration")
);
const LiveRoomModeration = lazy(() =>
  import("../modules/admin/pages/LiveRoomModeration")
);
const AdvancedAnalytics = lazy(() =>
  import("../modules/admin/pages/AdvancedAnalytics")
);
const SystemSettings = lazy(() =>
  import("../modules/admin/pages/SystemSettings")
);
const FinancialPasswordReset = lazy(() =>
  import("../modules/admin/pages/FinancialPasswordReset")
);
const AdminCourseCreate = lazy(() =>
  import("../modules/admin/pages/AdminCourseCreate")
);
const AdminCourseDetail = lazy(() =>
  import("../modules/admin/pages/AdminCourseDetail")
);
const AdminCategoryManagement = lazy(() =>
  import("../modules/admin/pages/AdminCategoryManagement")
);
const AdminBookCreate = lazy(() =>
  import("../modules/admin/pages/AdminBookCreate")
);
const AdminBlogCreate = lazy(() =>
  import("../modules/admin/pages/AdminBlogCreate")
);
const ContentManagement = lazy(() =>
  import("../modules/admin/pages/ContentManagement")
);
const GalleryManagement = lazy(() =>
  import("../modules/admin/pages/GalleryManagement")
);
const TestimonialManagement = lazy(() =>
  import("../modules/admin/pages/TestimonialManagement")
);
const UserDetail = lazy(() => import("../modules/admin/pages/UserDetail"));
const SystemHealth = lazy(() => import("../modules/admin/pages/SystemHealth"));
const AdminAssignmentList = lazy(() =>
  import("../modules/admin/pages/AdminAssignmentList")
);
const AdminAssignmentDetail = lazy(() =>
  import("../modules/admin/pages/AdminAssignmentDetail")
);
const AdminAssignmentCreate = lazy(() =>
  import("../modules/admin/pages/AdminAssignmentCreate")
);
const AdminStudentManagement = lazy(() =>
  import("../modules/admin/pages/AdminStudentManagement")
);
const AdminDoubtTicketManagement = lazy(() =>
  import("../modules/admin/pages/AdminDoubtTicketManagement")
);
const AdminDoubtTicketDetail = lazy(() =>
  import("../modules/admin/pages/AdminDoubtTicketDetail")
);
const RewardManagement = lazy(() =>
  import("../modules/admin/pages/RewardManagement")
);
const RedemptionRequestsManagement = lazy(() =>
  import("../modules/admin/pages/RedemptionRequestsManagement")
);
const AnnouncementManagement = lazy(() =>
  import("../modules/admin/AnnouncementManagement")
);
const AdminAnnouncementCreate = lazy(() =>
  import("../modules/admin/AnnouncementCreate")
);
const AdminAnnouncementDetail = lazy(() =>
  import("../modules/admin/AnnouncementDetail")
);
const ActiveSessions = lazy(() => import("../modules/admin/ActiveSessions"));
const BackupManagement = lazy(() =>
  import("../modules/admin/BackupManagement")
);
const PaymentManagement = lazy(() =>
  import("../modules/admin/PaymentManagement")
);
const CertificateManagement = lazy(() =>
  import("../modules/admin/CertificateManagement")
);
const LeadManagement = lazy(() => import("../modules/admin/LeadManagement"));
const LeadDetail = lazy(() => import("../modules/admin/LeadDetail"));
const ExpenseManagement = lazy(() =>
  import("../modules/admin/ExpenseManagement")
);
const FinancialDashboard = lazy(() =>
  import("../modules/admin/FinancialDashboard")
);

// Teacher pages - lazy loaded
const TeacherDashboard = lazy(() =>
  import("../modules/teacher/TeacherDashboard")
);
const TeacherLayout = lazy(() =>
  import("../modules/teacher/layout/TeacherLayout")
);
const CourseList = lazy(() => import("../modules/teacher/CourseList"));
const EbookList = lazy(() => import("../modules/teacher/EbookList"));
const QuizList = lazy(() => import("../modules/teacher/QuizList"));
const TeacherProfile = lazy(() => import("../modules/teacher/TeacherProfile"));
const CourseCreate = lazy(() => import("../modules/teacher/CourseCreate"));
const TeacherCourseDetail = lazy(() =>
  import("../modules/teacher/CourseDetail")
);
const EbookUpload = lazy(() => import("../modules/teacher/EbookUpload"));
const EbookDetail = lazy(() => import("../modules/teacher/EbookDetail"));
const QuizCreate = lazy(() => import("../modules/teacher/QuizCreate"));
const QuizAnalytics = lazy(() => import("../modules/teacher/QuizAnalytics"));
const QuizDetail = lazy(() => import("../modules/teacher/QuizDetail"));
const TeacherAnalytics = lazy(() =>
  import("../modules/teacher/TeacherAnalytics")
);
const StudentManagement = lazy(() =>
  import("../modules/teacher/StudentManagement")
);
const AssignmentCreate = lazy(() =>
  import("../modules/teacher/AssignmentCreate")
);
const AssignmentList = lazy(() => import("../modules/teacher/AssignmentList"));
const AssignmentDetail = lazy(() =>
  import("../modules/teacher/AssignmentDetail")
);
const DoubtTicketInbox = lazy(() =>
  import("../modules/teacher/DoubtTicketInbox")
);
const TeacherDoubtTicketDetail = lazy(() =>
  import("../modules/teacher/DoubtTicketDetail")
);
const AnnouncementList = lazy(() =>
  import("../modules/teacher/AnnouncementList")
);
const AnnouncementCreate = lazy(() =>
  import("../modules/teacher/AnnouncementCreate")
);
const AnnouncementDetail = lazy(() =>
  import("../modules/teacher/AnnouncementDetail")
);
const TeacherEarnings = lazy(() =>
  import("../modules/teacher/TeacherEarnings")
);
const PayoutRequests = lazy(() => import("../modules/teacher/PayoutRequests"));
const PaymentSlips = lazy(() => import("../modules/teacher/PaymentSlips"));

// Student pages - lazy loaded
const StudentDashboard = lazy(() =>
  import("../modules/student/StudentDashboard")
);
const EnrolledCourses = lazy(() =>
  import("../modules/student/EnrolledCourses")
);
const PointsHistory = lazy(() => import("../modules/student/PointsHistory"));
const ApplicationHistory = lazy(() =>
  import("../modules/student/ApplicationHistory")
);
const StudentLayout = lazy(() =>
  import("../modules/student/layout/StudentLayout")
);
const StudentProfile = lazy(() => import("../modules/student/StudentProfile"));
const StudentAssignmentList = lazy(() =>
  import("../modules/student/AssignmentList")
);
const StudentAssignmentDetail = lazy(() =>
  import("../modules/student/AssignmentDetail")
);
const PaymentHistory = lazy(() => import("../modules/student/PaymentHistory"));
const DownloadInvoice = lazy(() => import("../modules/student/DownloadInvoice"));
const DoubtTicketList = lazy(() =>
  import("../modules/student/DoubtTicketList")
);
const DoubtTicketCreate = lazy(() =>
  import("../modules/student/DoubtTicketCreate")
);
const DoubtTicketDetail = lazy(() =>
  import("../modules/student/DoubtTicketDetail")
);
const StudentAnnouncementList = lazy(() =>
  import("../modules/student/AnnouncementList")
);
const StudentAnnouncementDetail = lazy(() =>
  import("../modules/student/AnnouncementDetail")
);
const BatchInformation = lazy(() =>
  import("../modules/student/BatchInformation")
);
const CertificateList = lazy(() =>
  import("../modules/student/CertificateList")
);
const QuizLeaderboard = lazy(() =>
  import("../modules/student/QuizLeaderboard")
);
const CourseVideoPlayer = lazy(() =>
  import("../modules/student/CourseVideoPlayer")
);

// Business management pages - lazy loaded
const CorporateTrainingCourses = lazy(() =>
  import(
    "../modules/business-management/cources-pages/Corporate-training-cources"
  )
);
const DigitalMarketingCourses = lazy(() =>
  import(
    "../modules/business-management/cources-pages/Digital-marketing-cources"
  )
);
const EnglishLanguageCourses = lazy(() =>
  import(
    "../modules/business-management/cources-pages/English-language-cources"
  )
);
const Books = lazy(() =>
  import("../modules/business-management/business-pages/Books")
);
const BookDetail = lazy(() =>
  import("../modules/business-management/business-pages/BookDetail")
);
const BookPayment = lazy(() =>
  import("../modules/business-management/business-pages/BookPayment")
);
const GiftPayment = lazy(() =>
  import("../modules/business-management/gift-pages/GiftPayment")
);
const OurStory = lazy(() =>
  import("../modules/business-management/business-pages/OurStory")
);
const MissionVision = lazy(() =>
  import("../modules/business-management/business-pages/MissionVision")
);
const MeetTheFounder = lazy(() =>
  import("../modules/business-management/business-pages/MeetTheFounder")
);
const StudentSuccessStories = lazy(() =>
  import("../modules/business-management/business-pages/StudentSuccessStories")
);
const Disclaimer = lazy(() =>
  import("../modules/business-management/business-pages/Disclaimer")
);
const PrivacyPolicy = lazy(() =>
  import("../modules/business-management/business-pages/PrivacyPolicy")
);
const RefundCancellationPolicy = lazy(() =>
  import(
    "../modules/business-management/business-pages/RefundCancellationPolicy"
  )
);
const TermsConditions = lazy(() =>
  import("../modules/business-management/business-pages/TermsConditions")
);
const CustomPaymentCheck = lazy(() =>
  import("../modules/business-management/business-pages/CustomPaymentCheck")
);
const CoursePayment = lazy(() =>
  import("../modules/business-management/business-pages/CoursePayment")
);
const CourseDetail = lazy(() =>
  import("../modules/business-management/business-pages/CourseDetail")
);
const PaymentCallback = lazy(() =>
  import("../modules/payment/PaymentCallback")
);
const BookDemo = lazy(() =>
  import("../modules/business-management/contact-pages/BookDemo")
);
const BusinessCollaboration = lazy(() =>
  import("../modules/business-management/contact-pages/BusinessCollaboration")
);
const FranchiseInquiry = lazy(() =>
  import("../modules/business-management/contact-pages/FranchiseInquiry")
);
const TeacherLogin = lazy(() =>
  import("../modules/business-management/login-pages/TeacherLogin")
);
const StudentLogin = lazy(() =>
  import("../modules/business-management/login-pages/StudentLogin")
);
const RecruiterLogin = lazy(() =>
  import("../modules/business-management/login-pages/RecruiterLogin")
);
const BranchOwnerLogin = lazy(() =>
  import("../modules/business-management/login-pages/BranchOwnerLogin")
);
const ForgotPassword = lazy(() =>
  import("../modules/business-management/login-pages/ForgotPassword")
);
const ResetPassword = lazy(() =>
  import("../modules/business-management/login-pages/ResetPassword")
);
const VerifyEmail = lazy(() =>
  import("../modules/business-management/login-pages/VerifyEmail")
);
const TeacherRegister = lazy(() =>
  import("../modules/business-management/login-pages/TeacherRegister")
);
const StudentRegister = lazy(() =>
  import("../modules/business-management/login-pages/StudentRegister")
);
const RecruiterRegister = lazy(() =>
  import("../modules/business-management/login-pages/RecruiterRegister")
);
const BranchOwnerRegister = lazy(() =>
  import("../modules/business-management/login-pages/BranchOwnerRegister")
);
const JoinAsTeacher = lazy(() =>
  import("../modules/business-management/join-us-pages/JoinAsTeacher")
);
const JoinInfluencer = lazy(() =>
  import("../modules/business-management/join-us-pages/JoinInfluencer")
);
const JoinFreelancer = lazy(() =>
  import("../modules/business-management/join-us-pages/JoinFreelancer")
);
const JoinBuildAfterLife = lazy(() =>
  import("../modules/business-management/join-us-pages/JoinBuildAfterLife")
);
const FreeLibrary = lazy(() =>
  import("../modules/business-management/free-library/FreeLibrary")
);
const FreeLibraryReader = lazy(() =>
  import("../modules/business-management/free-library/FreeLibraryReader")
);
const PDFEbookReader = lazy(() =>
  import("../modules/business-management/free-library/PDFEbookReader")
);
const Gallery = lazy(() =>
  import("../modules/business-management/business-pages/Gallery")
);

// Blog pages - lazy loaded
const BlogsHome = lazy(() => import("../modules/blogs/pages/BlogsHome"));
const BlogDetails = lazy(() => import("../modules/blogs/pages/BlogDetails"));
const CreateBlog = lazy(() => import("../modules/blogs/pages/CreateBlog"));
const MyBlogs = lazy(() => import("../modules/blogs/pages/MyBlogs"));

// Explore Jobs pages - lazy loaded
const ExploreJobsLayout = lazy(() =>
  import("../modules/explore-jobs/layout/ExploreJobsLayout")
);
const ExploreFeed = lazy(() =>
  import("../modules/explore-jobs/pages/ExploreFeed")
);
const SeekerDashboard = lazy(() =>
  import("../modules/explore-jobs/pages/SeekerDashboard")
);
const ExplorePostDetailPage = lazy(() =>
  import("../modules/explore-jobs/pages/PostDetailPage")
);

// Recruiter pages - lazy loaded
const RecruiterDashboard = lazy(() =>
  import("../modules/recruiter/RecruiterDashboard")
);
const RecruiterAnalyticsHub = lazy(() =>
  import("../modules/recruiter/RecruiterAnalyticsHub")
);
const JobApplicationAnalytics = lazy(() =>
  import("../modules/recruiter/JobApplicationAnalytics")
);
const ApplicantProfilePage = lazy(() =>
  import("../modules/recruiter/ApplicantProfilePage")
);

// Community pages - lazy loaded
const CommunityHub = lazy(() =>
  import("../modules/community/pages/CommunityHub")
);
const StudentProfileDetail = lazy(() =>
  import("../modules/community/pages/StudentProfileDetail")
);
const TeacherProfileDetail = lazy(() =>
  import("../modules/community/pages/TeacherProfileDetail")
);
const RecruiterProfileDetail = lazy(() =>
  import("../modules/community/pages/RecruiterProfileDetail")
);

export const App = () => {
  const location = useLocation();
  const isAdminLogin =
    location.pathname === "/admin/login" ||
    location.pathname === "/reset-password" ||
    location.pathname.startsWith(
      "/super-admin/settings/financial-password/reset"
    );

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

  // Preload critical routes for better performance
  useEffect(() => {
    // Preload Home on initial load
    if (location.pathname === "/" || location.pathname === "/home") {
      import("../modules/business-management/business-pages/Home");
    }
    // Preload login pages when user might navigate there
    if (
      location.pathname.includes("/login") ||
      location.pathname.includes("/register")
    ) {
      import("../modules/business-management/business-components/Navbar");
    }
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <ToastContainer position="top-right" autoClose={3200} theme="dark" />
      {!isAdminLogin && (
        <Suspense fallback={<div className="h-20 bg-[#020409]" />}>
          <Navbar />
        </Suspense>
      )}
      <Routes>
        <Route
          path="/"
          element={
            <Suspense
              fallback={<LoadingFallback message="Loading home page..." />}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path="/home"
          element={
            <Suspense
              fallback={<LoadingFallback message="Loading home page..." />}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<LoadingFallback message="Loading login..." />}>
              <AdminLogin />
            </Suspense>
          }
        />
        <Route
          path="/super-admin/*"
          element={
            <ProtectedRoute roles={["super-admin"]}>
              <Suspense
                fallback={<LoadingFallback message="Loading admin panel..." />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }>
          <Route
            index
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading dashboard..." />}>
                <SuperAdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="users/:role"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading users..." />}>
                <UserManagement />
              </Suspense>
            }
          />
          <Route
            path="users/id/:userId"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading user details..." />
                }>
                <UserDetail />
              </Suspense>
            }
          />
          <Route
            path="approvals/:type"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading approvals..." />}>
                <ApprovalPage />
              </Suspense>
            }
          />
          <Route
            path="reviews/moderate"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading reviews..." />}>
                <ReviewModeration />
              </Suspense>
            }
          />
          <Route
            path="live-rooms/moderate"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading live rooms..." />}>
                <LiveRoomModeration />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading analytics..." />}>
                <AdvancedAnalytics />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading settings..." />}>
                <SystemSettings />
              </Suspense>
            }
          />
          <Route
            path="system-health"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading system health..." />
                }>
                <SystemHealth />
              </Suspense>
            }
          />
          <Route
            path="create/course"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading course creator..." />
                }>
                <AdminCourseCreate />
              </Suspense>
            }
          />
          <Route
            path="courses/:courseId"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading course..." />}>
                <AdminCourseDetail />
              </Suspense>
            }
          />
          <Route
            path="categories"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading category management..." />
                }>
                <AdminCategoryManagement />
              </Suspense>
            }
          />
          <Route
            path="create/book"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading book creator..." />
                }>
                <AdminBookCreate />
              </Suspense>
            }
          />
          <Route
            path="create/blog"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading blog creator..." />
                }>
                <AdminBlogCreate />
              </Suspense>
            }
          />
          <Route
            path="content-management"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading content management..." />
                }>
                <ContentManagement />
              </Suspense>
            }
          />
          <Route
            path="gallery-management"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading gallery..." />}>
                <GalleryManagement />
              </Suspense>
            }
          />
          <Route
            path="testimonials"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading testimonials..." />
                }>
                <TestimonialManagement />
              </Suspense>
            }
          />
          <Route
            path="payments"
            element={
              <FinancialProtectedRoute>
                <Suspense
                  fallback={<LoadingFallback message="Loading payments..." />}>
                  <PaymentManagement />
                </Suspense>
              </FinancialProtectedRoute>
            }
          />
          <Route
            path="certificates"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading certificates..." />
                }>
                <CertificateManagement />
              </Suspense>
            }
          />
          <Route
            path="crm/leads"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading leads..." />}>
                <LeadManagement />
              </Suspense>
            }
          />
          <Route
            path="crm/leads/:leadId"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading lead details..." />
                }>
                <LeadDetail />
              </Suspense>
            }
          />
          <Route
            path="expenses"
            element={
              <FinancialProtectedRoute>
                <Suspense
                  fallback={<LoadingFallback message="Loading expenses..." />}>
                  <ExpenseManagement />
                </Suspense>
              </FinancialProtectedRoute>
            }
          />
          <Route
            path="financial-dashboard"
            element={
              <FinancialProtectedRoute>
                <Suspense
                  fallback={
                    <LoadingFallback message="Loading financial dashboard..." />
                  }>
                  <FinancialDashboard />
                </Suspense>
              </FinancialProtectedRoute>
            }
          />
          <Route
            path="announcements"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading announcements..." />
                }>
                <AnnouncementManagement />
              </Suspense>
            }
          />
          <Route
            path="announcements/create"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading announcement creator..." />
                }>
                <AdminAnnouncementCreate />
              </Suspense>
            }
          />
          <Route
            path="announcements/:announcementId"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading announcement..." />
                }>
                <AdminAnnouncementDetail />
              </Suspense>
            }
          />
          <Route
            path="active-sessions"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading active sessions..." />
                }>
                <ActiveSessions />
              </Suspense>
            }
          />
          <Route
            path="backups"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading backups..." />}>
                <BackupManagement />
              </Suspense>
            }
          />
          <Route
            path="rewards"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading rewards..." />}>
                <RewardManagement />
              </Suspense>
            }
          />
          <Route
            path="redemption-requests"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading redemption requests..." />
                }>
                <RedemptionRequestsManagement />
              </Suspense>
            }
          />
          <Route
            path="assignments"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading assignments..." />}>
                <AdminAssignmentList />
              </Suspense>
            }
          />
          <Route
            path="assignments/create"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading assignment creator..." />
                }>
                <AdminAssignmentCreate />
              </Suspense>
            }
          />
          <Route
            path="assignments/:assignmentId"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading assignment..." />}>
                <AdminAssignmentDetail />
              </Suspense>
            }
          />
          <Route
            path="students"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading students..." />}>
                <AdminStudentManagement />
              </Suspense>
            }
          />
          <Route
            path="doubt-tickets"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading doubt tickets..." />
                }>
                <AdminDoubtTicketManagement />
              </Suspense>
            }
          />
          <Route
            path="doubt-tickets/:ticketId"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading doubt ticket..." />
                }>
                <AdminDoubtTicketDetail />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute roles={["teacher", "super-admin"]}>
              <Suspense
                fallback={
                  <LoadingFallback message="Loading teacher dashboard..." />
                }>
                <TeacherLayout />
              </Suspense>
            </ProtectedRoute>
          }>
          <Route
            path="dashboard"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading dashboard..." />}>
                <TeacherDashboard />
              </Suspense>
            }
          />
          <Route
            path="courses"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading courses..." />}>
                <CourseList />
              </Suspense>
            }
          />
          <Route
            path="courses/new"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading course creator..." />
                }>
                <CourseCreate />
              </Suspense>
            }
          />
          <Route
            path="courses/:courseId"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading course..." />}>
                <TeacherCourseDetail />
              </Suspense>
            }
          />
          <Route
            path="courses/:courseId/students"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading students..." />}>
                <StudentManagement />
              </Suspense>
            }
          />
          <Route
            path="ebooks"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading ebooks..." />}>
                <EbookList />
              </Suspense>
            }
          />
          <Route
            path="ebooks/upload"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading ebook upload..." />
                }>
                <EbookUpload />
              </Suspense>
            }
          />
          <Route
            path="ebooks/:ebookId"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading ebook..." />}>
                <EbookDetail />
              </Suspense>
            }
          />
          <Route
            path="quizzes"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading quizzes..." />}>
                <QuizList />
              </Suspense>
            }
          />
          <Route
            path="quizzes/new"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading quiz creator..." />
                }>
                <QuizCreate />
              </Suspense>
            }
          />
          <Route
            path="quizzes/:quizId"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading quiz..." />}>
                <QuizDetail />
              </Suspense>
            }
          />
          <Route
            path="quizzes/:quizId/analytics"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading quiz analytics..." />
                }>
                <QuizAnalytics />
              </Suspense>
            }
          />
          <Route
            path="assignments"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading assignments..." />}>
                <AssignmentList />
              </Suspense>
            }
          />
          <Route
            path="assignments/create"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading assignment creator..." />
                }>
                <AssignmentCreate />
              </Suspense>
            }
          />
          <Route
            path="assignments/:assignmentId"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading assignment..." />}>
                <AssignmentDetail />
              </Suspense>
            }
          />
          <Route
            path="students"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading students..." />}>
                <StudentManagement />
              </Suspense>
            }
          />
          <Route
            path="analytics"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading analytics..." />}>
                <TeacherAnalytics />
              </Suspense>
            }
          />
          <Route
            path="earnings"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading earnings..." />}>
                <TeacherEarnings />
              </Suspense>
            }
          />
          <Route
            path="doubt-tickets"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading doubt tickets..." />
                }>
                <DoubtTicketInbox />
              </Suspense>
            }
          />
          <Route
            path="doubt-tickets/:ticketId"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading doubt ticket..." />
                }>
                <TeacherDoubtTicketDetail />
              </Suspense>
            }
          />
          <Route
            path="announcements"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading announcements..." />
                }>
                <AnnouncementList />
              </Suspense>
            }
          />
          <Route
            path="announcements/create"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading announcement creator..." />
                }>
                <AnnouncementCreate />
              </Suspense>
            }
          />
          <Route
            path="announcements/:announcementId"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading announcement..." />
                }>
                <AnnouncementDetail />
              </Suspense>
            }
          />
          <Route
            path="payout-requests"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading payout requests..." />
                }>
                <PayoutRequests />
              </Suspense>
            }
          />
          <Route
            path="payment-slips"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading payment slips..." />
                }>
                <PaymentSlips />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading profile..." />}>
                <TeacherProfile />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/student/*"
          element={
            <ProtectedRoute roles={["student", "super-admin"]}>
              <Suspense
                fallback={
                  <LoadingFallback message="Loading student dashboard..." />
                }>
                <StudentLayout />
              </Suspense>
            </ProtectedRoute>
          }>
          <Route
            path="dashboard"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading dashboard..." />}>
                <StudentDashboard />
              </Suspense>
            }
          />
          <Route
            path="courses"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading courses..." />}>
                <EnrolledCourses />
              </Suspense>
            }
          />
          <Route
            path="courses/:courseId"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading course..." />}>
                <EnrolledCourses />
              </Suspense>
            }
          />
          <Route
            path="points/history"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading points history..." />
                }>
                <PointsHistory />
              </Suspense>
            }
          />
          <Route
            path="applications"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading applications..." />
                }>
                <ApplicationHistory />
              </Suspense>
            }
          />
          <Route
            path="assignments"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading assignments..." />}>
                <StudentAssignmentList />
              </Suspense>
            }
          />
          <Route
            path="assignments/:assignmentId"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading assignment..." />}>
                <StudentAssignmentDetail />
              </Suspense>
            }
          />
          <Route
            path="payments"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading payments..." />}>
                <PaymentHistory />
              </Suspense>
            }
          />
          <Route
            path="payments/:paymentId/invoice"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading invoice..." />}>
                <DownloadInvoice />
              </Suspense>
            }
          />
          <Route
            path="certificates"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading certificates..." />
                }>
                <CertificateList />
              </Suspense>
            }
          />
          <Route
            path="doubt-tickets"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading doubt tickets..." />
                }>
                <DoubtTicketList />
              </Suspense>
            }
          />
          <Route
            path="doubt-tickets/create"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading doubt ticket creator..." />
                }>
                <DoubtTicketCreate />
              </Suspense>
            }
          />
          <Route
            path="doubt-tickets/:ticketId"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading doubt ticket..." />
                }>
                <DoubtTicketDetail />
              </Suspense>
            }
          />
          <Route
            path="announcements"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading announcements..." />
                }>
                <StudentAnnouncementList />
              </Suspense>
            }
          />
          <Route
            path="announcements/:announcementId"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading announcement..." />
                }>
                <StudentAnnouncementDetail />
              </Suspense>
            }
          />
          <Route
            path="batch"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading batch information..." />
                }>
                <BatchInformation />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading profile..." />}>
                <StudentProfile />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/courses/videos/:videoId"
          element={
            <ProtectedRoute roles={["student", "teacher", "super-admin"]}>
              <Suspense
                fallback={
                  <LoadingFallback message="Loading video player..." />
                }>
                <CourseVideoPlayer />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/learn-earn"
          element={
            <Suspense fallback={<LoadingFallback message="Loading..." />}>
              <LearnEarnLayout />
            </Suspense>
          }
          key="learn-earn">
          {/* Public routes - accessible without login */}
          <Route
            path="live-debate-room"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading live debates..." />
                }>
                <LiveDebates />
              </Suspense>
            }
          />
          <Route
            path="live-debate-room/voice-room/:roomId"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading voice room..." />}>
                <VoiceRoom />
              </Suspense>
            }
          />
          <Route
            path="activities"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading activities..." />}>
                <ActivitiesHub />
              </Suspense>
            }
          />

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
                <Suspense
                  fallback={<LoadingFallback message="Loading dashboard..." />}>
                  <DashboardOverview />
                </Suspense>
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
                <Suspense
                  fallback={<LoadingFallback message="Loading dashboard..." />}>
                  <DashboardOverview />
                </Suspense>
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
                <Suspense
                  fallback={
                    <LoadingFallback message="Loading notifications..." />
                  }>
                  <NotificationCenter />
                </Suspense>
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
                <Suspense
                  fallback={<LoadingFallback message="Loading profile..." />}>
                  <ProfilePage />
                </Suspense>
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
                <Suspense
                  fallback={<LoadingFallback message="Loading chat..." />}>
                  <ChatCentre />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="find-learners"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading learners..." />}>
                <FindLearners />
              </Suspense>
            }
          />
          <Route
            path="user/:userId"
            element={
              <Suspense
                fallback={
                  <LoadingFallback message="Loading user profile..." />
                }>
                <UserProfileView />
              </Suspense>
            }
          />
          <Route
            path="quiz/:quizId"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading quiz..." />}>
                <QuizPlay />
              </Suspense>
            }
          />
          <Route
            path="quiz/:quizId/leaderboard"
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading leaderboard..." />}>
                <QuizLeaderboard />
              </Suspense>
            }
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
                <Suspense
                  fallback={<LoadingFallback message="Loading wallet..." />}>
                  <WalletDashboard />
                </Suspense>
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
                <Suspense
                  fallback={
                    <LoadingFallback message="Loading redemption history..." />
                  }>
                  <RedemptionHistory />
                </Suspense>
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
                <Suspense
                  fallback={<LoadingFallback message="Loading ratings..." />}>
                  <RatingsReviews />
                </Suspense>
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
                <Suspense
                  fallback={
                    <LoadingFallback message="Loading leaderboard..." />
                  }>
                  <FullLeaderboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={["super-admin"]}>
                <Suspense
                  fallback={
                    <LoadingFallback message="Loading admin control..." />
                  }>
                  <AdminControl />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/courses/corporate-training"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CorporateTrainingCourses />
            </Suspense>
          }
        />
        <Route
          path="/courses/digital-marketing"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <DigitalMarketingCourses />
            </Suspense>
          }
        />
        <Route
          path="/courses/english-language"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <EnglishLanguageCourses />
            </Suspense>
          }
        />
        <Route
          path="/books"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Books />
            </Suspense>
          }
        />
        <Route
          path="/books/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <BookDetail />
            </Suspense>
          }
        />
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
              <Suspense fallback={<LoadingFallback />}>
                <BookPayment />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:slug"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CourseDetail />
            </Suspense>
          }
        />
        <Route
          path="/courses/id/:courseId"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CourseDetail />
            </Suspense>
          }
        />
        <Route
          path="/courses/payment"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CoursePayment />
            </Suspense>
          }
        />
        <Route
          path="/payment/callback"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PaymentCallback />
            </Suspense>
          }
        />
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
              <Suspense fallback={<LoadingFallback />}>
                <GiftPayment />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/free-library"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FreeLibrary />
            </Suspense>
          }
        />
        <Route
          path="/free-library/:bookId"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FreeLibraryReader />
            </Suspense>
          }
        />
        <Route
          path="/free-library/ebook/:ebookId/read"
          element={
            <Suspense
              fallback={<LoadingFallback message="Loading PDF reader..." />}>
              <PDFEbookReader />
            </Suspense>
          }
        />
        <Route
          path="/gallery"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Gallery />
            </Suspense>
          }
        />
        <Route
          path="/about/our-story"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <OurStory />
            </Suspense>
          }
        />
        <Route
          path="/about/mission-vision"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <MissionVision />
            </Suspense>
          }
        />
        <Route
          path="/about/founder"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <MeetTheFounder />
            </Suspense>
          }
        />
        <Route
          path="/about/success-stories"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <StudentSuccessStories />
            </Suspense>
          }
        />
        <Route
          path="/disclaimer"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Disclaimer />
            </Suspense>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PrivacyPolicy />
            </Suspense>
          }
        />
        <Route
          path="/refund-cancellation-policy"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <RefundCancellationPolicy />
            </Suspense>
          }
        />
        <Route
          path="/terms-conditions"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <TermsConditions />
            </Suspense>
          }
        />
        <Route
          path="/contact/book-demo"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <BookDemo />
            </Suspense>
          }
        />
        <Route
          path="/contact/business-collaboration"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <BusinessCollaboration />
            </Suspense>
          }
        />
        <Route
          path="/contact/franchise-partnership"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FranchiseInquiry />
            </Suspense>
          }
        />
        <Route
          path="/blogs"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <BlogsHome />
            </Suspense>
          }
        />
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
              <Suspense fallback={<LoadingFallback />}>
                <CreateBlog />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/blogs/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <BlogDetails />
            </Suspense>
          }
        />
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
              <Suspense fallback={<LoadingFallback />}>
                <MyBlogs />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/join-us/teacher"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <JoinAsTeacher />
            </Suspense>
          }
        />
        <Route
          path="/join-us/influencer"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <JoinInfluencer />
            </Suspense>
          }
        />
        <Route
          path="/join-us/freelancer"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <JoinFreelancer />
            </Suspense>
          }
        />
        <Route
          path="/join-us/afterlife"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <JoinBuildAfterLife />
            </Suspense>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute
              roles={["student", "teacher", "recruiter", "super-admin"]}>
              <Suspense fallback={<LoadingFallback />}>
                <CommunityHub />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/community/students/:userId"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <StudentProfileDetail />
            </Suspense>
          }
        />
        <Route
          path="/community/teachers/:userId"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <TeacherProfileDetail />
            </Suspense>
          }
        />
        <Route
          path="/community/recruiters/:userId"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <RecruiterProfileDetail />
            </Suspense>
          }
        />
        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute roles={["recruiter", "super-admin"]}>
              <ExploreJobsProvider>
                <Suspense
                  fallback={
                    <LoadingFallback message="Loading recruiter dashboard..." />
                  }>
                  <RecruiterDashboard />
                </Suspense>
              </ExploreJobsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/analytics"
          element={
            <ProtectedRoute roles={["recruiter", "super-admin"]}>
              <ExploreJobsProvider>
                <Suspense fallback={<LoadingFallback />}>
                  <RecruiterAnalyticsHub />
                </Suspense>
              </ExploreJobsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/analytics/jobs/:jobId"
          element={
            <ProtectedRoute roles={["recruiter", "super-admin"]}>
              <ExploreJobsProvider>
                <Suspense fallback={<LoadingFallback />}>
                  <JobApplicationAnalytics />
                </Suspense>
              </ExploreJobsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/jobs/:jobId/applicants/:applicationId"
          element={
            <ProtectedRoute roles={["recruiter", "super-admin"]}>
              <ExploreJobsProvider>
                <Suspense fallback={<LoadingFallback />}>
                  <ApplicantProfilePage />
                </Suspense>
              </ExploreJobsProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore-jobs/*"
          element={
            <ExploreJobsProvider>
              <Suspense
                fallback={<LoadingFallback message="Loading jobs..." />}>
                <ExploreJobsLayout />
              </Suspense>
            </ExploreJobsProvider>
          }>
          <Route
            index
            element={
              <Suspense
                fallback={<LoadingFallback message="Loading jobs feed..." />}>
                <ExploreFeed />
              </Suspense>
            }
          />
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
                <Suspense
                  fallback={
                    <LoadingFallback message="Loading seeker dashboard..." />
                  }>
                  <SeekerDashboard />
                </Suspense>
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
                <Suspense
                  fallback={<LoadingFallback message="Loading job post..." />}>
                  <ExplorePostDetailPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/forgot-password"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ForgotPassword />
            </Suspense>
          }
        />
        <Route
          path="/reset-password"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ResetPassword />
            </Suspense>
          }
        />
        <Route
          path="/super-admin/settings/financial-password/reset"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FinancialPasswordReset />
            </Suspense>
          }
        />
        <Route
          path="/verify-email"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <VerifyEmail />
            </Suspense>
          }
        />
        <Route
          path="/login/teacher"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <TeacherLogin />
            </Suspense>
          }
        />
        <Route
          path="/register/teacher"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <TeacherRegister />
            </Suspense>
          }
        />
        <Route
          path="/login/student"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <StudentLogin />
            </Suspense>
          }
        />
        <Route
          path="/register/student"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <StudentRegister />
            </Suspense>
          }
        />
        <Route
          path="/login/recruiter"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <RecruiterLogin />
            </Suspense>
          }
        />
        <Route
          path="/register/recruiter"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <RecruiterRegister />
            </Suspense>
          }
        />
        <Route
          path="/login/branch-owner"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <BranchOwnerLogin />
            </Suspense>
          }
        />
        <Route
          path="/register/branch-owner"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <BranchOwnerRegister />
            </Suspense>
          }
        />
        <Route
          path="/payment/confirm"
          element={
            <Suspense fallback={<LoadingFallback message="Loading payment details..." />}>
              <CustomPaymentCheck />
            </Suspense>
          }
        />
      </Routes>
      {!isAdminLogin && !isDashboard && (
        <Suspense fallback={null}>
          <LeadCaptureBar />
          <Footer />
        </Suspense>
      )}
      {!isAdminLogin &&
        (location.pathname === "/" || location.pathname === "/home") && (
          <FloatingDebateButton />
        )}
      <WebsitePopupForm />
    </>
  );
};
export default App;
