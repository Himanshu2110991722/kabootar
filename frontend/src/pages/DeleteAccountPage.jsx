import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DeleteAccountPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center px-5 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-3xl">🕊️</span>
          <span className="text-2xl font-black text-orange-500">kabutar</span>
        </div>

        <h1 className="text-2xl font-black text-stone-900 mb-2">Account Deletion</h1>
        <p className="text-stone-500 text-sm mb-8 leading-relaxed">
          You can permanently delete your Kabutar account and all associated data at any time.
        </p>

        {/* Option 1 — In-app */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📱</span>
            <h2 className="font-bold text-stone-900">Delete via the App</h2>
          </div>
          <p className="text-sm text-stone-500 leading-relaxed mb-3">
            Open the Kabutar app → tap <strong>Me</strong> tab → scroll to the bottom → tap <strong>Delete account</strong>.
          </p>
          <p className="text-xs text-stone-400 bg-stone-50 rounded-xl px-3 py-2">
            Your account will be scheduled for deletion. If you do not log in within 3 days, all your data is permanently deleted.
          </p>
          {user && (
            <button onClick={() => navigate('/profile')}
              className="mt-3 w-full py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl active:scale-95 transition-all">
              Go to Profile → Delete Account
            </button>
          )}
        </div>

        {/* Option 2 — Email */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✉️</span>
            <h2 className="font-bold text-stone-900">Request via Email</h2>
          </div>
          <p className="text-sm text-stone-500 leading-relaxed mb-3">
            Email us from the address linked to your account. We will delete your account and all data within <strong>7 working days</strong>.
          </p>
          <a href="mailto:kabutar.support@gmail.com?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20Kabutar%20account%20and%20all%20associated%20data."
            className="block w-full py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl text-center active:scale-95 transition-all">
            📧 kabutar.support@gmail.com
          </a>
        </div>

        {/* What gets deleted */}
        <div className="bg-stone-100 rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-stone-800 text-sm mb-3">What gets deleted</h3>
          <ul className="space-y-1.5">
            {[
              'Your profile — name, photo, phone number',
              'All trips you have posted',
              'All parcel requests you have created',
              'Your chat messages',
              'Your ratings and reviews',
              'Your KYC documents',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-xs text-stone-600">
                <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-stone-400 mt-3 leading-relaxed">
            Deletion is permanent and cannot be undone. Some anonymised data may be retained for legal and compliance purposes as described in our Privacy Policy.
          </p>
        </div>

        <p className="text-center text-xs text-stone-400">
          Questions?{' '}
          <a href="mailto:kabutar.support@gmail.com" className="text-orange-500 font-semibold underline">
            kabutar.support@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
