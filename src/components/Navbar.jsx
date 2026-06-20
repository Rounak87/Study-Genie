import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Modal from "./Modal";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import {
  HomeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowUpIcon,
  MapIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  BeakerIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("login"); // 'login' or 'signup'
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem("VITE_GEMINI_API_KEY") || "");

  const navigation = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Roadmap", href: "/roadmap", icon: MapIcon },
    { name: "Study Guide", href: "/study-guide", icon: DocumentTextIcon },
    { name: "Visualization", href: "/visualization", icon: BeakerIcon },
    { name: "Community", href: "/community", icon: ChatBubbleLeftRightIcon },
  ];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate("/");
  };

  const openLoginModal = () => {
    setModalType("login");
    setShowModal(true);
  };

  const openSignupModal = () => {
    setModalType("signup");
    setShowModal(true);
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 shadow-2xl border-b border-white/20 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                className="text-2xl font-bold text-white hover:text-yellow-400 transition-colors duration-300"
              >
                StudyGenie
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? "bg-yellow-500/20 border-yellow-400 text-yellow-400"
                        : "border-transparent text-gray-300 hover:bg-white/10 hover:text-white"
                    } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium rounded-t-lg transition-all duration-300`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* API Settings Button */}
            <button
              onClick={() => {
                setCustomApiKey(localStorage.getItem("VITE_GEMINI_API_KEY") || "");
                setShowSettingsModal(true);
              }}
              className="text-gray-300 hover:text-white p-2 rounded-xl transition-all duration-300 hover:bg-white/10 mr-3 border border-white/10"
              title="AI Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{user?.name || "User"}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 py-2 z-50">
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-white/10 w-full text-left rounded-lg mx-2 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={openLoginModal}
                  className="text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/20 hover:bg-white/10"
                >
                  Log In
                </button>
                <button
                  onClick={openSignupModal}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden bg-white/10 backdrop-blur-lg border-t border-white/20">
          <div className="pt-2 pb-3 space-y-1 px-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? "bg-yellow-500/20 border-yellow-400 text-yellow-400"
                      : "border-transparent text-gray-300 hover:bg-white/10 hover:text-white"
                  } block pl-3 pr-4 py-3 border-l-4 text-base font-medium rounded-r-lg transition-all`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5 inline mr-3" />
                  {item.name}
                </Link>
              );
            })}

            {/* Mobile AI Settings Button */}
            <button
              onClick={() => {
                setCustomApiKey(localStorage.getItem("VITE_GEMINI_API_KEY") || "");
                setIsOpen(false);
                setShowSettingsModal(true);
              }}
              className="flex items-center w-full px-3 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
            >
              <Cog6ToothIcon className="w-5 h-5 mr-3" />
              AI Settings
            </button>

            {/* Mobile auth buttons */}
            <div className="pt-4 space-y-2">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                  Log Out
                </button>
              ) : (
                <>
                  <button
                    onClick={openLoginModal}
                    className="w-full text-left px-3 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={openSignupModal}
                    className="w-full text-left px-3 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg transition-all"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Login/Signup */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalType === "login" ? "Welcome Back" : "Join StudyGenie"}
      >
        {modalType === "login" ? (
          <LoginModal
            onClose={() => setShowModal(false)}
            onSwitchToSignup={() => setModalType("signup")}
          />
        ) : (
          <SignupModal
            onClose={() => setShowModal(false)}
            onSwitchToLogin={() => setModalType("login")}
          />
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="AI Settings"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            Configure your custom Gemini API key. If provided, this key will be used instead of the default key. It is saved securely in your browser's local storage and is never sent to any third-party servers.
          </p>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                localStorage.removeItem("VITE_GEMINI_API_KEY");
                setCustomApiKey("");
                setShowSettingsModal(false);
                window.location.reload();
              }}
              className="text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/20 hover:bg-white/10"
            >
              Clear Key
            </button>
            <button
              onClick={() => {
                if (customApiKey.trim()) {
                  localStorage.setItem("VITE_GEMINI_API_KEY", customApiKey.trim());
                } else {
                  localStorage.removeItem("VITE_GEMINI_API_KEY");
                }
                setShowSettingsModal(false);
                window.location.reload();
              }}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all"
            >
              Save & Reload
            </button>
          </div>
        </div>
      </Modal>
    </nav>
  );
};

export default Navbar;
