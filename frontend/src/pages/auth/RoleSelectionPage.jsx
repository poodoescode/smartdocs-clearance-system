import { motion } from 'framer-motion';
import Particles from '../../components/visuals/Particles';
import logo from '../../assets/logo.png';

export default function RoleSelectionPage({ onRoleSelect, onBackToHome, isDark }) {
  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'Submit and track your document requests',
      icon: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'green',
      features: [
        'Submit document requests',
        'Track request status',
        'Upload supporting files',
        'View clearance certificates'
      ]
    },
    {
      id: 'admin',
      title: 'Admin',
      description: 'Process and manage document requests',
      icon: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'blue',
      features: [
        'Review and approve requests',
        'Manage student accounts',
        'View system analytics',
        'Process clearances'
      ]
    }
  ];

  return (
    <div className={`relative flex min-h-screen items-center justify-center p-4 overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-[0.15]"></div>
        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={
              isDark ? ["#4ade80", "#facc15"] : ["#22c55e", "#eab308"]
            }
            particleCount={120}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>
        {/* Blobs */}
        <div
          className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[80px] animate-float transition-colors duration-500 ${isDark ? "bg-green-900/20" : "bg-green-200/40"}`}
        ></div>
        <div
          className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[80px] animate-float transition-colors duration-500 ${isDark ? "bg-emerald-900/20" : "bg-emerald-200/30"}`}
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-20 w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <img src={logo} alt="SmartDocs Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
            <h1 className={`text-5xl font-extrabold font-display transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
              SmartDocs
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-xl font-medium transition-colors ${isDark ? 'text-slate-300' : 'text-gray-600'}`}
          >
            Select your role to continue
          </motion.p>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onClick={onBackToHome}
            className={`mt-4 flex items-center gap-2 mx-auto text-sm font-medium transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </motion.button>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => onRoleSelect(role.id)}
              className={`cursor-pointer rounded-3xl overflow-hidden transition-all duration-300 ${
                isDark 
                  ? 'spatial-glass-dark hover:shadow-2xl hover:shadow-green-500/20' 
                  : 'spatial-glass hover:shadow-2xl hover:shadow-green-500/30'
              }`}
            >
              <div className="p-8">
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl mb-6 transition-colors ${
                  role.color === 'green'
                    ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                    : isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                }`}>
                  {role.icon}
                </div>

                {/* Title & Description */}
                <h2 className={`text-3xl font-bold mb-3 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {role.title}
                </h2>
                <p className={`text-base mb-6 transition-colors ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {role.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {role.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg 
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          role.color === 'green' ? 'text-green-500' : 'text-blue-500'
                        }`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-4 rounded-full font-bold text-white shadow-lg transition-all ${
                    role.color === 'green'
                      ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30'
                      : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30'
                  }`}
                >
                  Continue as {role.title}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className={`mt-12 max-w-2xl mx-auto rounded-2xl p-6 border transition-colors ${
            isDark 
              ? 'bg-slate-900/50 border-slate-700' 
              : 'bg-white/50 border-gray-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className={`font-bold mb-2 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Important Information
              </h3>
              <ul className={`text-sm space-y-1 transition-colors ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                <li>• <strong>Students:</strong> Login with your school-provided credentials. Contact admin for account creation.</li>
                <li>• <strong>Admins:</strong> Signup requires a valid admin secret code from your supervisor.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
