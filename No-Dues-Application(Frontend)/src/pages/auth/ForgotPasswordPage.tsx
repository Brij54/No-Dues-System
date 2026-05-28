import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Mail,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../../api/auth.api";

type Step = "email" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success("OTP sent to your email");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.response?.data || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }
    setStep("reset");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword: password });
      toast.success("Password reset successfully!");
      setStep("success");
    } catch (err: any) {
      toast.error(
        err.response?.data ||
          "Failed to reset password. OTP might be invalid or expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  // return (
  //   <div>
  //     {/* Mobile brand */}
  //     <div className="lg:hidden flex items-center gap-3 mb-8">
  //       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
  //         ND
  //       </div>
  //     </div>

  //     {/* Step 1: Enter Email */}
  //     {step === 'email' && (
  //       <div className="space-y-6">
  //         <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 mx-auto">
  //           <Mail className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
  //         </div>
  //         <div className="text-center space-y-2">
  //           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Forgot Password?</h2>
  //           <p className="text-sm text-slate-500 dark:text-slate-400">Enter your email and we'll send you an OTP</p>
  //         </div>
  //         <form onSubmit={handleSendOtp} className="space-y-4">
  //           <div className="space-y-1.5">
  //             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
  //             <input
  //               type="email"
  //               className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-slate-900 dark:text-white"
  //               placeholder="you@example.com"
  //               value={email}
  //               onChange={(e) => setEmail(e.target.value)}
  //               required
  //             />
  //           </div>
  //           <button
  //             type="submit"
  //             disabled={loading}
  //             className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 shadow-sm"
  //           >
  //             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
  //             {loading ? 'Sending...' : 'Send OTP'}
  //           </button>
  //           <Link
  //             to="/login"
  //             className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
  //           >
  //             <ArrowLeft className="w-4 h-4" />
  //             Back to Login
  //           </Link>
  //         </form>
  //       </div>
  //     )}

  //     {/* Step 2: Verify OTP */}
  //     {step === 'otp' && (
  //       <div className="space-y-6">
  //         <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 mx-auto">
  //           <KeyRound className="w-7 h-7 text-amber-600 dark:text-amber-400" />
  //         </div>
  //         <div className="text-center space-y-2">
  //           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verify OTP</h2>
  //           <p className="text-sm text-slate-500 dark:text-slate-400">
  //             We sent a code to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>
  //           </p>
  //         </div>
  //         <form onSubmit={handleVerifyOtp} className="space-y-4">
  //           <div className="space-y-1.5">
  //             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Enter OTP</label>
  //             <input
  //               type="text"
  //               maxLength={6}
  //               className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-slate-900 dark:text-white"
  //               placeholder="• • • • • •"
  //               value={otp}
  //               onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
  //               required
  //             />
  //           </div>
  //           <button
  //             type="submit"
  //             disabled={loading}
  //             className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
  //           >
  //             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
  //             {loading ? 'Verifying...' : 'Verify OTP'}
  //           </button>
  //           <button
  //             type="button"
  //             onClick={() => setStep('email')}
  //             className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
  //           >
  //             <ArrowLeft className="w-4 h-4" />
  //             Try another email
  //           </button>
  //         </form>
  //       </div>
  //     )}

  //     {/* Step 3: Reset Password */}
  //     {step === 'reset' && (
  //       <div className="space-y-6">
  //         <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 mx-auto">
  //           <KeyRound className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
  //         </div>
  //         <div className="text-center space-y-2">
  //           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
  //           <p className="text-sm text-slate-500 dark:text-slate-400">Create a new secure password</p>
  //         </div>
  //         <form onSubmit={handleResetPassword} className="space-y-4">
  //           <div className="space-y-1.5">
  //             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
  //             <input
  //               type="password"
  //               className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-slate-900 dark:text-white"
  //               placeholder="Enter new password"
  //               value={password}
  //               onChange={(e) => setPassword(e.target.value)}
  //               required
  //             />
  //           </div>
  //           <div className="space-y-1.5">
  //             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
  //             <input
  //               type="password"
  //               className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-slate-900 dark:text-white"
  //               placeholder="Confirm new password"
  //               value={confirmPassword}
  //               onChange={(e) => setConfirmPassword(e.target.value)}
  //               required
  //             />
  //           </div>
  //           <button
  //             type="submit"
  //             disabled={loading}
  //             className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
  //           >
  //             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
  //             {loading ? 'Resetting...' : 'Reset Password'}
  //           </button>
  //         </form>
  //       </div>
  //     )}

  //     {/* Step 4: Success */}
  //     {step === 'success' && (
  //       <div className="space-y-6 text-center">
  //         <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 mx-auto">
  //           <CheckCircle className="w-8 h-8 text-emerald-500" />
  //         </div>
  //         <div className="space-y-2">
  //           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Password Reset!</h2>
  //           <p className="text-sm text-slate-500 dark:text-slate-400">
  //             Your password has been successfully reset. You can now log in with your new password.
  //           </p>
  //         </div>
  //         <Link
  //           to="/login"
  //           className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
  //         >
  //           Back to Login
  //           <ArrowRight className="w-4 h-4" />
  //         </Link>
  //       </div>
  //     )}
  //   </div>
  // );

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* STEP 1 - EMAIL */}
        {step === "email" && (
          <>
            <h2 className="text-3xl font-bold text-center text-[#2D88D4] mb-4">
              Forgot Password
            </h2>

            <p className="text-center text-gray-500 text-sm mb-6">
              Enter your registered email to receive an OTP
            </p>

            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <input
                  type="email"
                  placeholder="Enter Email ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D88D4]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2D88D4] hover:bg-[#2373b5] text-white py-3 rounded-xl font-semibold transition duration-200"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>

              <Link
                to="/login"
                className="block text-center text-sm text-[#2D88D4] hover:underline"
              >
                Back to Login
              </Link>
            </form>
          </>
        )}

        {/* STEP 2 - OTP */}
        {step === "otp" && (
          <>
            <h2 className="text-3xl font-bold text-center text-[#2D88D4] mb-4">
              Verify OTP
            </h2>

            <p className="text-center text-gray-500 text-sm mb-6">
              We sent an OTP to {email}
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-center tracking-[0.4em] text-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D88D4]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2D88D4] hover:bg-[#2373b5] text-white py-3 rounded-xl font-semibold transition duration-200"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-center text-sm text-[#2D88D4] hover:underline"
              >
                Try another email
              </button>
            </form>
          </>
        )}

        {/* STEP 3 - RESET PASSWORD */}
        {step === "reset" && (
          <>
            <h2 className="text-3xl font-bold text-center text-[#2D88D4] mb-4">
              Reset Password
            </h2>

            <p className="text-center text-gray-500 text-sm mb-6">
              Create your new password
            </p>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <input
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D88D4]"
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D88D4]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2D88D4] hover:bg-[#2373b5] text-white py-3 rounded-xl font-semibold transition duration-200"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {/* STEP 4 - SUCCESS */}
        {step === "success" && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#2D88D4] mb-4">
              Password Reset!
            </h2>

            <p className="text-gray-500 text-sm mb-6">
              Your password has been reset successfully.
            </p>

            <Link
              to="/login"
              className="inline-block w-full bg-[#2D88D4] hover:bg-[#2373b5] text-white py-3 rounded-xl font-semibold transition duration-200"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
