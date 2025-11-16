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
import RecruiterDashboard from "../modules/explore-jobs/pages/RecruiterDashboard";
import SeekerDashboard from "../modules/explore-jobs/pages/SeekerDashboard";
import ExploreProfilePage from "../modules/explore-jobs/pages/ProfilePage";
import ExplorePostDetailPage from "../modules/explore-jobs/pages/PostDetailPage";
import { ExploreJobsProvider } from "../modules/explore-jobs/context/ExploreJobsContext";
import JoinAsTeacher from "../modules/business-management/join-us-pages/JoinAsTeacher";
import JoinInfluencer from "../modules/business-management/join-us-pages/JoinInfluencer";
import JoinFreelancer from "../modules/business-management/join-us-pages/JoinFreelancer";
import JoinBuildAfterLife from "../modules/business-management/join-us-pages/JoinBuildAfterLife";
import FreeLibrary from "../modules/business-management/free-library/FreeLibrary";
import FreeLibraryReader from "../modules/business-management/free-library/FreeLibraryReader";
import SuperAdminDashboard from "../modules/admin/SuperAdminDashboard";
import AdminLogin from "../modules/admin/AdminLogin";
import AdminLayout from "../modules/admin/layout/AdminLayout";
import UserManagement from "../modules/admin/pages/UserManagement";
import ApprovalPage from "../modules/admin/pages/ApprovalPage";
import AdminCourseCreate from "../modules/admin/pages/AdminCourseCreate";
import AdminBookCreate from "../modules/admin/pages/AdminBookCreate";
import AdminBlogCreate from "../modules/admin/pages/AdminBlogCreate";
import UserDetail from "../modules/admin/pages/UserDetail";
import SystemHealth from "../modules/admin/pages/SystemHealth";
import TeacherDashboard from "../modules/teacher/TeacherDashboard";
import TeacherMarketplace from "../modules/teacher/TeacherMarketplace";
import StudentDashboard from "../modules/student/StudentDashboard";
import CourseCreate from "../modules/teacher/CourseCreate";
import TeacherCourseDetail from "../modules/teacher/CourseDetail";
import EbookUpload from "../modules/teacher/EbookUpload";
import EbookDetail from "../modules/teacher/EbookDetail";
import QuizCreate from "../modules/teacher/QuizCreate";
import QuizDetail from "../modules/teacher/QuizDetail";
import StudentProfileDetail from "../modules/community/pages/StudentProfileDetail";
import TeacherProfileDetail from "../modules/community/pages/TeacherProfileDetail";
import RecruiterProfileDetail from "../modules/community/pages/RecruiterProfileDetail";

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
          <Route path="system-health" element={<SystemHealth />} />
          <Route path="create/course" element={<AdminCourseCreate />} />
          <Route path="create/book" element={<AdminBookCreate />} />
          <Route path="create/blog" element={<AdminBlogCreate />} />
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
          path="/student/dashboard"
          element={
            <ProtectedRoute roles={["student", "super-admin"]}>
              <StudentDashboard />
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
        <Route path="/about/our-story" element={<OurStory />} />
        <Route path="/about/mission-vision" element={<MissionVision />} />
        <Route path="/about/founder" element={<MeetTheFounder />} />
        <Route
          path="/about/success-stories"
          element={<StudentSuccessStories />}
        />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-cancellation-policy" element={<RefundCancellationPolicy />} />
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
        <Route path="/community/students/:userId" element={<StudentProfileDetail />} />
        <Route path="/community/teachers/:userId" element={<TeacherProfileDetail />} />
        <Route path="/community/recruiters/:userId" element={<RecruiterProfileDetail />} />
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
            path="recruiter-dashboard"
            element={
              <ProtectedRoute roles={["recruiter", "super-admin"]}>
                <RecruiterDashboard />
              </ProtectedRoute>
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
                <SeekerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile/:username"
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
                <ExploreProfilePage />
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
