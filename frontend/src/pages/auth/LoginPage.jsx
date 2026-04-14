import React, { useState, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowRight } from 'lucide-react';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';

// Lazy-load Spline so it doesn't block first paint
const Spline = lazy(() => import('@splinetool/react-spline'));

const SplineLoader = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
      <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-b-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
    </div>
    <p className="mt-6 text-sm text-zinc-500 font-medium tracking-wide animate-pulse">Loading 3D Scene...</p>
  </div>
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel - Spline 3D Animation */}
      <div className="hidden lg:block w-1/2 bg-zinc-950 relative overflow-hidden">
        {/* Ambient glow behind the 3D scene */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-violet-600/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[100px]" />
        </div>

        {/* Spline 3D Scene */}
        <Suspense fallback={<SplineLoader />}>
          <div className={`absolute inset-0 z-10 transition-opacity duration-1000 ${splineLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <Spline
              scene="https://prod.spline.design/EdyWYbkLWnk3fs0G/scene.splinecode"
              className="w-full h-full scale-110"
              onLoad={() => setSplineLoaded(true)}
            />
          </div>
          {!splineLoaded && <SplineLoader />}
        </Suspense>

        {/* Bottom branding overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-8 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            Geeta Edu
          </h1>
          <p className="text-zinc-400 text-sm max-w-md">
            Master new skills with live classes, expert mentors, and hands-on coding projects.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
             <GoogleAuthButton text="Sign in with Google" />
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Password</label>
                  <Link to="#" className="text-xs text-primary hover:underline">
                      Forgot password?
                  </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-muted/50"
              />
            </div>

            <Button type="submit" variant="gradient" className="w-full h-11" isLoading={isLoading}>
              Sign In <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
