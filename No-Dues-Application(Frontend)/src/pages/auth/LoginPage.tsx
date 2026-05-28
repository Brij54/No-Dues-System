// import { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
// import { useAuth } from '../../hooks/useAuth';
// import { useAuthStore } from '../../store/auth.store';
// import { Role } from '../../constants/roles';
// import toast from 'react-hot-toast';

// const loginSchema = z.object({
//   email: z.string().min(1, 'Username or email is required'),
//   password: z.string().min(1, 'Password is required'),
//   remember: z.boolean().optional(),
// });

// type LoginForm = z.infer<typeof loginSchema>;

// export default function LoginPage() {
//   const [showPassword, setShowPassword] = useState(false);
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm<LoginForm>({
//     resolver: zodResolver(loginSchema),
//     defaultValues: { email: '', password: '', remember: false },
//   });

//   const onSubmit = async (data: LoginForm) => {
//     try {
//       await login(data.email, data.password);
//       toast.success('Login successful!');

//       // Redirect based on role
//       const role = useAuthStore.getState().getPrimaryRole();
//       if (role === Role.SUPER_ADMIN) navigate('/admin', { replace: true });
//       else if (role === Role.DEPARTMENT_ADMIN) navigate('/department', { replace: true });
//       else navigate('/student', { replace: true });
//     } catch (err: any) {
//       const msg = err.response?.data?.message || err.response?.data || 'Invalid credentials. Please try again.';
//       toast.error(typeof msg === 'string' ? msg : 'Login failed');
//     }
//   };

//   return (
//     <div>
//       {/* Mobile brand */}
//       <div className="lg:hidden flex items-center gap-3 mb-8">
//         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
//           ND
//         </div>
//         <div>
//           <p className="font-bold text-slate-900 dark:text-white">No-Dues Management</p>
//           <p className="text-xs text-slate-400">IIIT Bangalore</p>
//         </div>
//       </div>

//       <div className="space-y-2 mb-8">
//         <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
//         <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to your account to continue</p>
//       </div>

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
//         <div className="space-y-1.5">
//           <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
//             Username or Email
//           </label>
//           <input
//             id="email"
//             type="text"
//             autoComplete="username"
//             className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
//             placeholder="you@example.com"
//             {...register('email')}
//             disabled={isSubmitting}
//           />
//           {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
//         </div>

//         <div className="space-y-1.5">
//           <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
//             Password
//           </label>
//           <div className="relative">
//             <input
//               id="password"
//               type={showPassword ? 'text' : 'password'}
//               autoComplete="current-password"
//               className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
//               placeholder="Enter your password"
//               {...register('password')}
//               disabled={isSubmitting}
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
//               tabIndex={-1}
//             >
//               {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//             </button>
//           </div>
//           {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
//         </div>

//         <div className="flex items-center justify-between">
//           <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
//             <input
//               type="checkbox"
//               className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
//               {...register('remember')}
//             />
//             Remember me
//           </label>
//           <Link
//             to="/forgot-password"
//             className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
//           >
//             Forgot password?
//           </Link>
//         </div>

//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
//         >
//           {isSubmitting ? (
//             <>
//               <Loader2 className="w-4 h-4 animate-spin" />
//               Signing in...
//             </>
//           ) : (
//             <>
//               Sign in
//               <ArrowRight className="w-4 h-4" />
//             </>
//           )}
//         </button>
//       </form>
//     </div>
//   );
// }


import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';
import { Role } from '../../constants/roles';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);

      toast.success('Login successful!');

      const role = useAuthStore.getState().getPrimaryRole();

      if (role === Role.SUPER_ADMIN) {
        navigate('/admin', { replace: true });
      } else if (role === Role.DEPARTMENT_ADMIN) {
        navigate('/department', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        'Invalid credentials';

      toast.error(typeof msg === 'string' ? msg : 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Heading */}
        <h2 className="text-3xl font-bold text-center text-[#2D88D4] mb-8">
          Login
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <input
              id="email"
              type="text"
              autoComplete="username"
              placeholder="Enter Email ID"
              disabled={isSubmitting}
              {...register('email')}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D88D4]"
            />

            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter Password"
                disabled={isSubmitting}
                {...register('password')}
                className="w-full px-4 py-3 pr-12 bg-gray-100 border border-gray-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D88D4]"
              />

              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                {...register('remember')}
                className="rounded border-gray-300 text-[#2D88D4]"
              />
              Remember me
            </label>

            <Link
              to="/forgot-password"
              className="text-[#2D88D4] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#2D88D4] hover:bg-[#2373b5] text-white py-3 rounded-xl font-semibold transition duration-200"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              'Login'
            )}
          </button>

          {/* Register */}
          {/* <div className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/registration"
              className="text-[#2D88D4] hover:underline"
            >
              Register
            </Link>
          </div> */}

          {/* Reset Password */}
          {/* <div className="text-center text-sm text-gray-500">
            Forgot Password?{' '}
            <Link
              to="/reset-password"
              className="text-[#2D88D4] hover:underline"
            >
              Reset Password
            </Link>
          </div> */}
        </form>
      </div>
    </div>
  );
}