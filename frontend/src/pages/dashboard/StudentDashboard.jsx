import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Video, Calendar, ArrowRight, Sparkles, TrendingUp, Zap, Clock, Bell, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/button'; 
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/ui/PageTransition';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [availableCourses, setAvailableCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [pendingTaskCount, setPendingTaskCount] = useState(0);
    const [announcements, setAnnouncements] = useState([]);
    const [learningStreak, setLearningStreak] = useState({ days: 0, label: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError(null);

                // 1. Fetch Available Courses
                const coursesRes = await api.get('/courses');
                setAvailableCourses(coursesRes.data?.data || []);

                // 2. Fetch Enrolled Courses (BatchEnrollments with course+batch populated)
                const enrollRes = await api.get('/enrollments');
                const enrollments = enrollRes.data?.data || [];
                setEnrolledCourses(enrollments);

                // 3. Fetch Upcoming Live Sessions
                try {
                    const sessionsRes = await api.get('/live-sessions/my/upcoming');
                    setUpcomingSessions(sessionsRes.data?.data || []);
                } catch (e) {
                    console.warn('Could not fetch upcoming sessions:', e.message);
                    setUpcomingSessions([]);
                }

                // 4. Fetch Announcements
                try {
                    const announcementsRes = await api.get('/announcements');
                    setAnnouncements((announcementsRes.data?.data || []).slice(0, 3));
                } catch (e) {
                    console.warn('Could not fetch announcements:', e.message);
                    setAnnouncements([]);
                }

                // 5. Calculate Pending Tasks (assignments + tests) across enrolled batches
                let totalPending = 0;
                const batchIds = enrollments
                    .map(e => e.batch?._id)
                    .filter(Boolean);

                for (const batchId of batchIds) {
                    try {
                        // Fetch assignments for this batch
                        const assignRes = await api.get(`/assignments/batch/${batchId}`);
                        const assignments = assignRes.data?.data || [];
                        // Count assignments where student hasn't submitted
                        const pendingAssignments = assignments.filter(a => {
                            const now = new Date();
                            const due = new Date(a.dueDate);
                            const hasSubmitted = a.submissions?.some(
                                s => s.student === user?._id || s.student?._id === user?._id
                            );
                            return a.status === 'active' && !hasSubmitted && due >= now;
                        });
                        totalPending += pendingAssignments.length;

                        // Fetch tests for this batch
                        const testRes = await api.get(`/tests/batch/${batchId}`);
                        const tests = testRes.data?.data || [];
                        // Count active tests that are open
                        const pendingTests = tests.filter(t => {
                            const now = new Date();
                            const end = t.endTime ? new Date(t.endTime) : null;
                            return t.status === 'active' && (!end || end >= now);
                        });
                        totalPending += pendingTests.length;
                    } catch (e) {
                        // If a batch has no assignments/tests API, just skip
                        console.warn(`Could not fetch tasks for batch ${batchId}:`, e.message);
                    }
                }
                setPendingTaskCount(totalPending);

                // 6. Calculate Learning Streak
                computeLearningStreak(enrollments);

            } catch (error) {
                console.error("Failed to fetch data", error);
                setError("Failed to load dashboard data. Please check your internet connection.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Compute a simple "learning streak" based on enrollment age
    // In a real app, this would track daily login/video watch activity
    const computeLearningStreak = (enrollments) => {
        if (enrollments.length === 0) {
            setLearningStreak({ days: 0, label: 'Enroll to start!' });
            return;
        }

        // Find the most recent enrollment date
        const dates = enrollments
            .map(e => e.enrolledAt ? new Date(e.enrolledAt) : null)
            .filter(Boolean)
            .sort((a, b) => b - a);

        if (dates.length === 0) {
            setLearningStreak({ days: 1, label: 'Just started!' });
            return;
        }

        const latestEnrollDate = dates[0];
        const now = new Date();
        const diffMs = now - latestEnrollDate;
        const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        let label = '';
        if (diffDays <= 1) label = 'Just started!';
        else if (diffDays <= 3) label = 'Building momentum!';
        else if (diffDays <= 7) label = 'Great consistency!';
        else if (diffDays <= 30) label = 'On fire! 🔥';
        else label = 'Veteran learner! 💪';

        setLearningStreak({ days: diffDays, label });
    };

    // Format date/time for upcoming sessions
    const formatSessionTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = date - now;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffMs < 0) return 'Starting now!';
        if (diffHrs < 1) return `In ${diffMins} mins`;
        if (diffHrs < 24) return `In ${diffHrs}h ${diffMins}m`;

        return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    // Format announcement time
    const formatTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHrs < 24) return `${diffHrs}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    // Build stats dynamically
    const stats = [
        { 
            title: 'Enrolled Courses', 
            value: enrolledCourses.length.toString(), 
            icon: BookOpen, 
            color: 'text-blue-400', 
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            trend: enrolledCourses.length === 0 
                ? 'Explore courses to enroll' 
                : enrolledCourses.length === 1 
                    ? '1 course active' 
                    : `${enrolledCourses.length} courses active`
        },
        { 
<<<<<<< HEAD
            title: 'Learning Streak', 
            value: `${learningStreak.days} Day${learningStreak.days !== 1 ? 's' : ''}`, 
=======
            title: 'Total Points', 
            value: (user?.points || 0).toString(), 
>>>>>>> f71efa3a210e045657c37b6faeabc30f96cb0598
            icon: Zap, 
            color: 'text-amber-400', 
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
<<<<<<< HEAD
            trend: learningStreak.label
        },
        { 
            title: 'Pending Tasks', 
            value: pendingTaskCount.toString(), 
            icon: Calendar, 
            color: pendingTaskCount > 0 ? 'text-rose-400' : 'text-emerald-400', 
            bg: pendingTaskCount > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10',
            border: pendingTaskCount > 0 ? 'border-rose-500/20' : 'border-emerald-500/20',
            trend: pendingTaskCount === 0 
                ? 'All caught up! ✅' 
                : pendingTaskCount === 1 
                    ? '1 task needs attention' 
                    : `${pendingTaskCount} tasks need attention`
=======
            trend: 'Keep earning!'
        },
        { 
            title: 'Badges Earned', 
            value: (user?.badges?.length || 0).toString(), 
            icon: Sparkles, 
            color: 'text-rose-400', 
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            trend: 'Collect them all'
>>>>>>> f71efa3a210e045657c37b6faeabc30f96cb0598
        },
    ];

    // Calculate overall progress
    const overallProgress = enrolledCourses.length > 0
        ? Math.round(enrolledCourses.reduce((sum, e) => sum + (e.progress || 0), 0) / enrolledCourses.length)
        : 0;

    if (loading) {
        return (
            <div className="w-full space-y-8 p-8 min-h-screen bg-slate-950">
                <div className="flex justify-between items-center mb-8">
                     <SkeletonLoader type="text" className="w-1/3 h-10" />
                     <SkeletonLoader type="rectangular" className="w-32 h-10 rounded-lg" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <SkeletonLoader type="card" count={3} className="h-40" />
                </div>
                <div className="grid gap-6 md:grid-cols-3 h-96">
                     <div className="md:col-span-2"><SkeletonLoader type="card" className="h-full" /></div>
                     <div><SkeletonLoader type="card" className="h-full" /></div>
                </div>
            </div>
        );
    }

    return (
        <PageTransition className="w-full min-h-screen bg-slate-950 text-slate-100 p-8 font-sans selection:bg-indigo-500/30">
            
            {/* Background Glows */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
                            Hello, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{user?.name}</span>
                            <span className="inline-block ml-3 animate-wave">👋</span>
                        </h1>
                        <p className="text-slate-400 text-lg flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            {pendingTaskCount > 0 
                                ? `You have ${pendingTaskCount} pending task${pendingTaskCount > 1 ? 's' : ''}. Let's get to work!`
                                : 'Ready to level up your skills today?'
                            }
                        </p>
                    </div>
                    <div>
                         <Button 
                            onClick={() => navigate('/courses')}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all rounded-full px-6 py-6"
                         >
                            Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
                         </Button>
                    </div>
                </div>
                
                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
                        <p>{error}</p>
                        <Button 
                            variant="link" 
                            className="text-red-400 underline mt-2" 
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {stats.map((stat, index) => (
                        <div 
                            key={index} 
                            className={`
                                relative overflow-hidden rounded-2xl p-6 border ${stat.border} bg-slate-900/50 backdrop-blur-sm
                                hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group
                            `}
                        >
                            <div className={`absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity`}>
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                            
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">{stat.title}</p>
                                <h3 className="text-4xl font-bold text-white mb-2">{stat.value}</h3>
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                    <TrendingUp className={`h-3 w-3 ${stat.title === 'Pending Tasks' && pendingTaskCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                                    <span>{stat.trend}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                    
                    {/* My Courses Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-indigo-400" />
                                {enrolledCourses.length > 0 ? 'Continue Learning' : 'Start Your Journey'}
                            </h2>
                            {enrolledCourses.length > 0 && (
                                <Button variant="link" className="text-indigo-400" onClick={() => navigate('/batches')}>View All</Button>
                            )}
                        </div>

                        {enrolledCourses.length > 0 ? (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {enrolledCourses.slice(0, 4).map(enrollment => {
                                    const course = enrollment.course;
                                    const batch = enrollment.batch;
                                    
                                    if (!course) return null;

                                    return (
                                        <div 
                                            key={enrollment._id} 
                                            className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer shadow-lg shadow-black/20"
                                            onClick={() => batch?._id ? navigate(`/batches/${batch._id}/learn`) : navigate(`/batches`)} 
                                        >
                                            <div className="aspect-video relative overflow-hidden">
                                                {course.thumbnail ? (
                                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                        <BookOpen className="h-10 w-10 text-slate-600" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block shadow-lg ${
                                                        (enrollment.progress || 0) === 100 
                                                            ? 'bg-emerald-500 text-white' 
                                                            : 'bg-indigo-500 text-white'
                                                    }`}>
                                                        {(enrollment.progress || 0) === 100 ? 'COMPLETED' : 'ENROLLED'}
                                                    </span>
                                                    <h4 className="font-bold text-white line-clamp-1">{course.title}</h4>
                                                    {batch && (
                                                        <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {batch.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                 <div className="flex justify-between text-xs text-slate-400 mb-2">
                                                     <span>Progress</span>
                                                     <span className={`font-semibold ${(enrollment.progress || 0) === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                                        {enrollment.progress || 0}%
                                                     </span>
                                                 </div>
                                                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                     <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ${
                                                            (enrollment.progress || 0) === 100 
                                                                ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                                                                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                                        }`}
                                                        style={{ width: `${enrollment.progress || 0}%` }}
                                                     />
                                                 </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {availableCourses.slice(0, 4).map(course => (
                                    <div 
                                        key={course._id} 
                                        className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer"
                                        onClick={() => navigate(`/courses/${course._id}`)}
                                    >
                                        <div className="aspect-video relative overflow-hidden">
                                            {course.thumbnail ? (
                                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                    <BookOpen className="h-10 w-10 text-slate-600" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                                                {course.price === 0 ? 'FREE' : `₹${course.price}`}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-bold text-white line-clamp-1 mb-1 group-hover:text-indigo-400 transition-colors">{course.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="bg-slate-800 px-2 py-1 rounded">{course.category}</span>
                                                <span>• {course.level}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Recent Announcements */}
                        {announcements.length > 0 && (
                            <div className="space-y-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Bell className="h-5 w-5 text-amber-400" />
                                        Recent Announcements
                                    </h2>
                                    <Button variant="link" className="text-indigo-400" onClick={() => navigate('/announcements')}>View All</Button>
                                </div>
                                <div className="space-y-3">
                                    {announcements.map(a => (
                                        <div 
                                            key={a._id}
                                            className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-amber-500/30 transition-all cursor-pointer"
                                            onClick={() => navigate('/announcements')}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {a.type === 'urgent' && <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />}
                                                        <h4 className="font-semibold text-white text-sm truncate">{a.title}</h4>
                                                    </div>
                                                    <p className="text-xs text-slate-400 line-clamp-1">{a.message}</p>
                                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                        <span>{a.batch?.name || 'General'}</span>
                                                        <span>•</span>
                                                        <span>{formatTimeAgo(a.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <ExternalLink className="h-4 w-4 text-slate-600 flex-shrink-0 mt-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                         {/* Upcoming Live Sessions */}
                         <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Video className="h-5 w-5 text-rose-400" />
                                Up Next
                            </h2>
                        </div>
                        
                        {upcomingSessions.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingSessions.slice(0, 3).map(session => (
                                    <div 
                                        key={session._id}
                                        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 hover:border-rose-500/30 transition-all group cursor-pointer"
                                        onClick={() => navigate('/live-classes')}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-xl flex-shrink-0 ${
                                                session.status === 'live' 
                                                    ? 'bg-red-500/20 text-red-400' 
                                                    : 'bg-rose-500/10 text-rose-400'
                                            }`}>
                                                <Video className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-white text-sm truncate group-hover:text-rose-300 transition-colors">
                                                    {session.title}
                                                </h4>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {session.batch?.name || 'Batch'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    {session.status === 'live' ? (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-red-400">
                                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                            LIVE NOW
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatSessionTime(session.scheduledStartTime)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" 
                                    className="w-full border-slate-700 hover:bg-slate-800 text-slate-300"
                                    onClick={() => navigate('/live-classes')}
                                >
                                    View Full Schedule
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 min-h-[200px] flex flex-col items-center justify-center text-center backdrop-blur-sm">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center mb-4">
                                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">You're all set!</h3>
                                <p className="text-slate-500 text-sm max-w-[200px]">
                                    No upcoming live sessions. Check back later for new schedules.
                                </p>
                                <Button 
                                    variant="outline" 
                                    className="mt-4 border-slate-700 hover:bg-slate-800 text-slate-300"
                                    onClick={() => navigate('/live-classes')}
                                >
                                    View Schedule
                                </Button>
                            </div>
                        )}

                         {/* Overall Progress + Motivation Card */}
                         <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10">
                                 <Zap className="h-24 w-24" />
                             </div>
                             <h3 className="font-bold text-lg mb-2 relative z-10">
                                {enrolledCourses.length > 0 ? 'Overall Progress' : 'Did you know?'}
                             </h3>
                             <p className="text-indigo-100 text-sm relative z-10 mb-4">
                                {enrolledCourses.length > 0 
                                    ? `You've completed ${overallProgress}% of your enrolled courses on average. ${overallProgress >= 50 ? 'Amazing progress! 🎉' : 'Keep pushing forward! 💪'}`
                                    : 'Consistency is key! Studying for just 30 mins a day is better than cramming for 5 hours once a week.'
                                }
                             </p>
                             <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-white/60 rounded-full transition-all duration-1000" 
                                    style={{ width: `${enrolledCourses.length > 0 ? overallProgress : 0}%` }} 
                                 />
                             </div>
                             <p className="text-xs text-indigo-200 mt-2 font-mono">
                                {enrolledCourses.length > 0 
                                    ? `Average: ${overallProgress}% complete`
                                    : 'Enroll in a course to track progress'
                                }
                             </p>
                         </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default StudentDashboard;