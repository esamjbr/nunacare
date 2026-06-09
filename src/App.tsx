import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { syncNightMode } from './utils/nightMode';
import { SplashScreen } from './features/onboarding/SplashScreen';
import { WelcomeScreen } from './features/onboarding/WelcomeScreen';
import { PrivacyScreen } from './features/onboarding/PrivacyScreen';
import { CreateProfileScreen } from './features/onboarding/CreateProfileScreen';
import { HomeScreen } from './features/home/HomeScreen';
import { TimelineScreen } from './features/timeline/TimelineScreen';
import { CalendarScreen } from './features/calendar/CalendarScreen';
import { AppointmentDetailScreen } from './features/calendar/AppointmentDetailScreen';
import { MedicineScreen } from './features/medicine/MedicineScreen';
import { GrowthScreen } from './features/growth/GrowthScreen';
import { DoctorReportScreen } from './features/doctor/DoctorReportScreen';
import { DoctorQuestionsScreen } from './features/doctor/DoctorQuestionsScreen';
import { FirstFoodsScreen } from './features/firstfoods/FirstFoodsScreen';
import { MomRecoveryScreen } from './features/mom/MomRecoveryScreen';
import { PostpartumExerciseScreen } from './features/mom/PostpartumExerciseScreen';
import { FamilyScreen } from './features/family/FamilyScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { PremiumScreen } from './features/premium/PremiumScreen';
import { MoreScreen } from './features/more/MoreScreen';
import { useStore } from './store/useStore';
import { AuthRoute, PublicAuthRoute } from './components/AuthRoute';
import { LoginScreen } from './features/auth/LoginScreen';
import { ChangePasswordScreen } from './features/auth/ChangePasswordScreen';
import { AdminCustomersScreen } from './features/admin/AdminCustomersScreen';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
  const { settings, babyProfile, coreLoaded, coreLoading, coreError, loadCoreData } = useStore();
  const { accessToken, role, mustChangePassword } = useAuthStore();

  useEffect(() => {
    if (accessToken && role === 'Customer' && !mustChangePassword && !coreLoaded && !coreLoading) {
      void loadCoreData();
    }
  }, [accessToken, role, mustChangePassword, coreLoaded, coreLoading, loadCoreData]);

  // Auto night-mode ticker — only active when nightModeAuto is on.
  // Re-evaluates every minute so the transition at 19:00 and 06:00 is applied promptly.
  useEffect(() => {
    if (!settings.nightModeAuto) return;
    const id = setInterval(() => syncNightMode(settings), 60_000);
    return () => clearInterval(id);
  }, [settings.nightModeAuto, settings.nightMode]);

  const isReady = settings.onboardingComplete && babyProfile;
  const shouldLoadCustomerData = accessToken && role === 'Customer' && !mustChangePassword && !coreLoaded;

  if (shouldLoadCustomerData) {
    return <CustomerDataLoading error={coreError} onRetry={loadCoreData} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicAuthRoute><LoginScreen /></PublicAuthRoute>} />
        <Route path="/change-password" element={<AuthRoute roles={['Customer']}><ChangePasswordScreen /></AuthRoute>} />
        <Route path="/admin/customers" element={<AuthRoute roles={['Admin']}><AdminCustomersScreen /></AuthRoute>} />

        <Route path="/" element={<AuthRoute roles={['Customer']}><SplashScreen /></AuthRoute>} />
        
        {/* Onboarding */}
        <Route path="/onboarding/welcome" element={<AuthRoute roles={['Customer']}><WelcomeScreen /></AuthRoute>} />
        <Route path="/onboarding/privacy" element={<AuthRoute roles={['Customer']}><PrivacyScreen /></AuthRoute>} />
        <Route path="/onboarding/profile" element={<AuthRoute roles={['Customer']}><CreateProfileScreen /></AuthRoute>} />

        {/* Main App */}
        <Route path="/home" element={<AuthRoute roles={['Customer']}>{isReady ? <HomeScreen /> : <Navigate to="/onboarding/welcome" replace />}</AuthRoute>} />
        <Route path="/timeline" element={<AuthRoute roles={['Customer']}>{isReady ? <TimelineScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/calendar" element={<AuthRoute roles={['Customer']}>{isReady ? <CalendarScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/calendar/appointments/:id" element={<AuthRoute roles={['Customer']}>{isReady ? <AppointmentDetailScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/medicine" element={<AuthRoute roles={['Customer']}>{isReady ? <MedicineScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/growth" element={<AuthRoute roles={['Customer']}>{isReady ? <GrowthScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/doctor-report" element={<AuthRoute roles={['Customer']}>{isReady ? <DoctorReportScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/doctor-questions" element={<AuthRoute roles={['Customer']}>{isReady ? <DoctorQuestionsScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/first-foods" element={<AuthRoute roles={['Customer']}>{isReady ? <FirstFoodsScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/mom-recovery" element={<AuthRoute roles={['Customer']}>{isReady ? <MomRecoveryScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/postpartum-exercise" element={<AuthRoute roles={['Customer']}>{isReady ? <PostpartumExerciseScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/family" element={<AuthRoute roles={['Customer']}>{isReady ? <FamilyScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/settings" element={<AuthRoute roles={['Customer']}>{isReady ? <SettingsScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/premium" element={<AuthRoute roles={['Customer']}>{isReady ? <PremiumScreen /> : <Navigate to="/" replace />}</AuthRoute>} />
        <Route path="/more" element={<AuthRoute roles={['Customer']}>{isReady ? <MoreScreen /> : <Navigate to="/" replace />}</AuthRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function CustomerDataLoading({ error, onRetry }: { error: string | null; onRetry: () => Promise<void> }) {
  return (
    <div className="fixed inset-0 bg-background max-w-mobile mx-auto flex items-center justify-center px-6">
      <div className="w-full bg-white rounded-3xl shadow-soft p-6 text-center">
        <div className="w-14 h-14 bg-teal-soft rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">♡</div>
        <h1 className="text-xl font-extrabold text-text-primary mb-2">NunaCare</h1>
        <p className="text-sm text-text-secondary">{error || 'Loading your baby data...'}</p>
        {error && (
          <button
            onClick={() => void onRetry()}
            className="mt-5 w-full rounded-2xl bg-primary text-white font-bold py-3"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
