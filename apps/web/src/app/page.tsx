'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { ROUTES } from '@/lib/config';

import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Metrics from '@/components/landing/Metrics';
import Capabilities from '@/components/landing/Capabilities';
import HowItWorks from '@/components/landing/HowItWorks';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import DemoForm from '@/components/landing/DemoForm';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(ROUTES.DASHBOARD_ROOT);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <main>
        <Hero />
        <Metrics />
        <Capabilities />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <DemoForm />
      </main>
      <Footer />
    </div>
  );
}
