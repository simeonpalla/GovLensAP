
import React from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  setRole: (role: UserRole) => void;
  onNavigate: (path: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, role, setRole, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('/')}>
              <div className="w-8 h-8 bg-[#5B7C99] rounded-lg flex items-center justify-center text-white font-bold text-xl mr-2">G</div>
              <h1 className="text-xl font-bold text-[#2C3E50] hidden sm:block">GovLens AP</h1>
            </div>
            
            <nav className="flex space-x-4 items-center">
              {role === 'citizen' ? (
                <>
                  <button onClick={() => onNavigate('/')} className="text-[#5B7C99] hover:text-[#2E5266] px-3 py-2 text-sm font-medium">Home</button>
                  <button onClick={() => onNavigate('/my-complaints')} className="text-[#5B7C99] hover:text-[#2E5266] px-3 py-2 text-sm font-medium">My Trackings</button>
                  <button 
                    onClick={() => setRole('officer')}
                    className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-200 transition"
                  >
                    Officer View
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => onNavigate('/officer')} className="text-[#5B7C99] hover:text-[#2E5266] px-3 py-2 text-sm font-medium">Dashboard</button>
                  <button onClick={() => onNavigate('/officer/analytics')} className="text-[#5B7C99] hover:text-[#2E5266] px-3 py-2 text-sm font-medium">Analytics</button>
                  <button 
                    onClick={() => { setRole('citizen'); onNavigate('/'); }}
                    className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-200 transition"
                  >
                    Citizen View
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          &copy; 2026 GovLens AP - Powered by Gemini 3. Transparency for Andhra Pradesh.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
