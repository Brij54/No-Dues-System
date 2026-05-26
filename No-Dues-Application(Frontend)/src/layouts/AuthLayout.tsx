// import { Outlet } from 'react-router-dom';

// // Import images from src/images
// import backgroundImage from "../images/home_bg.jpg"
// import iiitLogo from '../images/iiit_logo.png';

// export default function AuthLayout() {
//   return (
//     <div className="min-h-screen flex">
//       {/* Left branding panel */}
//       <div
//         className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-cover bg-center"
//         style={{
//           backgroundImage: `url(${backgroundImage})`,
//         }}
//       >
//         {/* Overlay */}
//         <div className="absolute inset-0 bg-black/20" />

//         <div className="relative z-10 flex flex-col justify-center items-start px-12 xl:px-20 w-full">
//           {/* Logo */}
//           <img
//             src={iiitLogo}
//             alt="IIIT-B Logo"
//             className="w-40 xl:w-52 object-contain mb-8"
//           />

//           {/* Heading */}
//           <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight drop-shadow-lg">
//             No-Dues <br />
//             Management System
//           </h1>

//           {/* Description */}
//           <p className="mt-5 text-lg text-white/90 leading-relaxed max-w-md drop-shadow-md">
//             Streamlined clearance tracking for students and administration.
//             Manage department approvals, payments, and final degree clearance
//             all in one place.
//           </p>
//         </div>
//       </div>

//       {/* Right form panel */}
//       <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
//         <div className="w-full max-w-md">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// }

import { Outlet } from 'react-router-dom';

import backgroundImage from '../images/home_bg.jpg';
import iiitLogo from '../images/iiit_logo.png';

export default function AuthLayout() {
  return (
    <div
      className="h-screen w-screen flex relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Optional Dark Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Left Branding Section */}
      <div className="relative z-10 flex-1 flex flex-col justify-between items-center text-white px-10 py-12">
        {/* Center Content */}
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          {/* Logo */}
          <img
            src={iiitLogo}
            alt="IIIT-B Logo"
            className="w-28 h-28 object-contain mb-6"
            style={{
              filter: 'brightness(0) invert(1)',
            }}
          />

          {/* Institute Name */}
          <div className="mb-10">
            <h1 className="text-3xl font-light leading-relaxed drop-shadow-md">
              International Institute of
            </h1>

            <h1 className="text-3xl font-light leading-relaxed drop-shadow-md">
              Information Technology Bangalore
            </h1>
          </div>

          {/* Portal Title */}
          <div>
            <h2 className="text-4xl font-bold tracking-wide drop-shadow-lg">
              No-Dues Portal
            </h2>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center w-full">
          {/* Social Icons */}
          <div className="flex justify-center gap-5 mb-6">
            <a
              href="https://www.facebook.com/IIITBofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 transition text-white text-sm font-bold"
            >
              f
            </a>

            <a
              href="https://x.com/IIITB_official"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 transition text-white text-sm font-bold"
            >
              X
            </a>

            <a
              href="https://www.linkedin.com/school/iiitbofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 transition text-white text-sm font-bold"
            >
              in
            </a>

            <a
              href="https://www.youtube.com/user/iiitbmedia"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 transition text-white text-sm font-bold"
            >
              ▶
            </a>
          </div>

          {/* Footer Text */}
          <div className="text-xs text-white/90 leading-5">
            <p>
              © 2026 International Institute of Information Technology -
              Bangalore
            </p>

            {/* <p className="mt-1 text-white/70">
              Support - admissions2026@iiitb.ac.in | +91 80 4140 7777
            </p> */}
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="relative z-10 w-full max-w-md bg-white shadow-2xl flex items-center justify-center px-8 overflow-y-auto">
        <div className="w-full py-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}