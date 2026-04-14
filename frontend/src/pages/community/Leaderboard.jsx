import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageTransition from '../../components/ui/PageTransition';
import { Trophy, Medal, Award, Zap, Star } from 'lucide-react';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';

const Leaderboard = () => {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('/gamification/leaderboard');
                setLeaderboard(res.data.data);
            } catch (err) {
                console.error("Failed to fetch leaderboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <SkeletonLoader type="text" className="w-1/3 h-10" />
                <SkeletonLoader type="card" count={3} className="h-24" />
            </div>
        );
    }

    return (
        <PageTransition className="w-full min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-100">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-900/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-orange-500/10 rounded-full mb-2 border border-orange-500/20">
                        <Trophy className="h-12 w-12 text-orange-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Hall of Fame</h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Top learners ranked by points. Complete assignments, attend classes, and participate to climb the ranks!
                    </p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Star className="h-5 w-5 text-amber-400" /> Global Rankings</h2>
                        <div className="px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-mono">
                            Your Points: {user?.points || 0}
                        </div>
                    </div>
                    
                    <div className="divide-y divide-slate-800/50">
                        {leaderboard.map((student, index) => {
                            const isCurrentUser = student._id === user?._id;
                            let rankStyle = "bg-slate-800 text-slate-400";
                            let icon = null;
                            
                            if (index === 0) {
                                rankStyle = "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
                                icon = <Trophy className="h-5 w-5" />;
                            } else if (index === 1) {
                                rankStyle = "bg-slate-300/20 text-slate-300 border border-slate-300/30";
                                icon = <Medal className="h-5 w-5" />;
                            } else if (index === 2) {
                                rankStyle = "bg-orange-600/20 text-orange-500 border border-orange-600/30";
                                icon = <Award className="h-5 w-5" />;
                            }
                            
                            return (
                                <div 
                                    key={student._id} 
                                    className={`p-4 md:p-6 flex items-center gap-4 md:gap-6 hover:bg-slate-800/30 transition-colors ${isCurrentUser ? 'bg-indigo-500/5 border-l-4 border-indigo-500' : ''}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${rankStyle}`}>
                                        {icon || <span>#{index + 1}</span>}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-white truncate flex items-center gap-2">
                                            {student.name}
                                            {isCurrentUser && <span className="text-xs bg-indigo-500 rounded px-2 py-0.5 font-normal text-white">You</span>}
                                        </h3>
                                        <p className="text-sm text-slate-400 truncate mt-1">Level {student.learningLevel || 'Intermediate'}</p>
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-6 shrink-0">
                                        <div className="flex gap-1 items-center">
                                            {student.badges?.slice(0, 3).map((b, i) => (
                                                <span key={i} title={b.name} className="text-lg">{b.icon || '🏅'}</span>
                                            ))}
                                            {student.badges?.length > 3 && <span className="text-xs text-slate-500">+{student.badges.length - 3}</span>}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-amber-400 flex items-center gap-1 justify-end">
                                                <Zap className="h-5 w-5" /> {student.points || 0}
                                            </div>
                                            <span className="text-xs text-slate-500 uppercase font-mono tracking-wider">Points</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {leaderboard.length === 0 && (
                            <div className="p-12 text-center text-slate-500">
                                No one has earned points yet. Be the first!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default Leaderboard;
