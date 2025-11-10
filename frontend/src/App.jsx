import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../modules/business-management/business-components/Navbar";
import Footer from "../modules/business-management/business-components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Home from "../modules/business-management/business-pages/Home";
import LearnEarnLayout from "../modules/learn-earn/layout/LearnEarnLayout";
import DashboardOverview from "../modules/learn-earn/pages/DashboardOverview";
import ProfilePage from "../modules/learn-earn/pages/ProfilePage";
import ChatCentre from "../modules/learn-earn/pages/ChatCentre";
import LiveDebates from "../modules/learn-earn/pages/LiveDebates";
import ActivitiesHub from "../modules/learn-earn/pages/ActivitiesHub";
import WalletDashboard from "../modules/learn-earn/pages/WalletDashboard";
import RatingsReviews from "../modules/learn-earn/pages/RatingsReviews";
import AdminControl from "../modules/learn-earn/pages/AdminControl";
import CorporateTrainingCourses from "../modules/business-management/cources-pages/Corporate-training-cources";
import DigitalMarketingCourses from "../modules/business-management/cources-pages/Digital-marketing-cources";
import EnglishLanguageCourses from "../modules/business-management/cources-pages/English-language-cources";
import Books from "../modules/business-management/business-pages/Books";
import BookDetail from "../modules/business-management/business-pages/BookDetail";
import BookPayment from "../modules/business-management/business-pages/BookPayment";
import DonatePayment from "../modules/business-management/donate-pages/DonatePayment";
import OurStory from "../modules/business-management/business-pages/OurStory";
import MissionVision from "../modules/business-management/business-pages/MissionVision";
import MeetTheFounder from "../modules/business-management/business-pages/MeetTheFounder";
import StudentSuccessStories from "../modules/business-management/business-pages/StudentSuccessStories";
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

export const App = () => {
  return (
    <>
      <ScrollToTop />
      <ToastContainer position="top-right" autoClose={3200} theme="dark" />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/learn-earn"
          element={<LearnEarnLayout />}
          key="learn-earn">
          <Route index element={<DashboardOverview />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="chat" element={<ChatCentre />} />
          <Route path="live-debates" element={<LiveDebates />} />
          <Route path="activities" element={<ActivitiesHub />} />
          <Route path="wallet" element={<WalletDashboard />} />
          <Route path="ratings" element={<RatingsReviews />} />
          <Route path="admin" element={<AdminControl />} />
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
        <Route path="/books/:id/payment" element={<BookPayment />} />
        <Route path="/donate/payment" element={<DonatePayment />} />
        <Route path="/about/our-story" element={<OurStory />} />
        <Route path="/about/mission-vision" element={<MissionVision />} />
        <Route path="/about/founder" element={<MeetTheFounder />} />
        <Route
          path="/about/success-stories"
          element={<StudentSuccessStories />}
        />
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
        <Route path="/blogs/create" element={<CreateBlog />} />
        <Route path="/blogs/:id" element={<BlogDetails />} />
        <Route path="/my-blogs" element={<MyBlogs />} />
        <Route path="/join-us/teacher" element={<JoinAsTeacher />} />
        <Route path="/join-us/influencer" element={<JoinInfluencer />} />
        <Route path="/join-us/freelancer" element={<JoinFreelancer />} />
        <Route path="/join-us/after-life" element={<JoinBuildAfterLife />} />
        <Route
          path="/explore-jobs/*"
          element={
            <ExploreJobsProvider>
              <ExploreJobsLayout />
            </ExploreJobsProvider>
          }>
          <Route index element={<ExploreFeed />} />
          <Route path="recruiter-dashboard" element={<RecruiterDashboard />} />
          <Route path="seeker-dashboard" element={<SeekerDashboard />} />
          <Route path="profile/:username" element={<ExploreProfilePage />} />
          <Route path="post/:id" element={<ExplorePostDetailPage />} />
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
      <Footer />
    </>
  );
};
export default App;
