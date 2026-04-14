import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Zap, Crown, ArrowLeft, Flame, Award, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/ui/PageTransition';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const LEVEL_COLORS = {
  1: 'from-slate-500 to-slate-600',
  2: 'from-slate-400 to-slate-500',
  3: 'from-emerald-500 to-emerald-600',
  4: 'from-teal-500 to-teal-600',
  5: 'from-blue-500 to-blue-600',
  6: 'from-indigo-500 to-indigo-600',
  7: 'from-violet-500 to-violet-600',
  8: 'from-purple-500 to-purple-600',
  9: 'from-amber-500 to-amber-600',
  10: 'from-yellow-400 to-amber-500',
};

const RankBadge = ({ rank }) => {
  if (rank === 1) return <Crown className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-slate-300" />;
  if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
  return <span className="text-slate-500 font-bold text-lg">#{rank}</span>;
};

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbRes, meRes] = await Promise.all([
          api.get('/gamification/leaderboard'),
          api.get('/gamification/me')
        ]);
        setLeaderboard(lbRes.data?.data?.leaderboard || []);
        setMyRank(lbRes.data?.data?.myRank || null);
        setMyStats(meRes.data?.data || null);
      } catch (e) {
        console.error('Leaderboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-6 p-8 min-h-screen bg-slate-950">
        <SkeletonLoader type="text" className="w-1/3 h-10" />
        <div className="grid gap-4 md:grid-cols-3">
          <SkeletonLoader type="card" count={3} className="h-32" />
        </div>
        <SkeletonLoader type="card" className="h-96" />
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <PageTransition className="w-full min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 font-sans">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[40%] h-[40%] bg-amber-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all">
            <ArrowLeft className="h-5 w-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <Trophy className="h-8 w-8 text-amber-400" />
              Global Leaderboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">Compete with learners worldwide</p>
          </div>
        </div>

        {/* My Stats Bar */}
        {myStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Your Rank', value: myRank ? `#${myRank.rank}` : 'Unranked', icon: Award, color: 'text-amber-400' },
              { label: 'Total Points', value: myStats.totalPoints.toLocaleString(), icon: Star, color: 'text-yellow-400' },
              { label: 'Level', value: `Lv.${myStats.level} ${myStats.levelTitle}`, icon: TrendingUp, color: 'text-violet-400' },
              { label: 'Streak', value: `${myStats.currentStreak} Day${myStats.currentStreak !== 1 ? 's' : ''}`, icon: Flame, color: 'text-orange-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Badges */}
        {myStats?.badges?.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Your Badges</h3>
            <div className="flex flex-wrap gap-3">
              {myStats.badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm">
                  <span className="text-lg">{badge.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-xs">{badge.title}</p>
                    <p className="text-slate-500 text-xs">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {top3.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 items-end">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 pt-6 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-800 font-bold text-sm shadow-lg">2</div>
                </div>
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold text-lg mb-2">
                  {top3[1].student?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <p className="text-white font-semibold text-sm truncate">{top3[1].student?.name || 'Student'}</p>
                <p className="text-slate-400 text-xs mt-1">{top3[1].totalPoints.toLocaleString()} pts</p>
                <div className={`mt-2 inline-block px-2 py-0.5 rounded-full bg-gradient-to-r ${LEVEL_COLORS[top3[1].level] || LEVEL_COLORS[1]} text-xs text-white font-medium`}>
                  Lv.{top3[1].level}
                </div>
              </div>
            </div>
            
            {/* 1st Place */}
            <div className="text-center -mt-4">
              <div className="bg-gradient-to-b from-amber-900/30 to-slate-900/60 border border-amber-500/30 rounded-2xl p-5 pt-8 relative shadow-xl shadow-amber-900/20">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-amber-500/30">
                    <Crown className="h-5 w-5" />
                  </div>
                </div>
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold text-2xl mb-2 shadow-lg shadow-amber-500/30">
                  {top3[0].student?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <p className="text-white font-bold truncate">{top3[0].student?.name || 'Student'}</p>
                <p className="text-amber-300 text-sm font-semibold mt-1">{top3[0].totalPoints.toLocaleString()} pts</p>
                <div className={`mt-2 inline-block px-2 py-0.5 rounded-full bg-gradient-to-r ${LEVEL_COLORS[top3[0].level] || LEVEL_COLORS[1]} text-xs text-white font-medium`}>
                  Lv.{top3[0].level} {top3[0].levelTitle}
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="bg-slate-900/60 border border-amber-800/30 rounded-2xl p-4 pt-6 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold text-sm shadow-lg">3</div>
                </div>
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-bold text-lg mb-2">
                  {top3[2].student?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <p className="text-white font-semibold text-sm truncate">{top3[2].student?.name || 'Student'}</p>
                <p className="text-slate-400 text-xs mt-1">{top3[2].totalPoints.toLocaleString()} pts</p>
                <div className={`mt-2 inline-block px-2 py-0.5 rounded-full bg-gradient-to-r ${LEVEL_COLORS[top3[2].level] || LEVEL_COLORS[1]} text-xs text-white font-medium`}>
                  Lv.{top3[2].level}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Ranking List */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60">
            <div className="grid grid-cols-12 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="col-span-1">Rank</span>
              <span className="col-span-5">Student</span>
              <span className="col-span-2 text-center">Level</span>
              <span className="col-span-2 text-center">Badges</span>
              <span className="col-span-2 text-right">Points</span>
            </div>
          </div>
          
          <div className="divide-y divide-slate-800/50">
            {leaderboard.map((entry) => {
              const isMe = entry.student?._id === user?._id;
              return (
                <div 
                  key={entry.rank} 
                  className={`grid grid-cols-12 items-center px-5 py-3.5 transition-all hover:bg-slate-800/30 ${
                    isMe ? 'bg-indigo-900/20 border-l-2 border-indigo-500' : ''
                  }`}
                >
                  <div className="col-span-1 flex items-center">
                    <RankBadge rank={entry.rank} />
                  </div>
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${LEVEL_COLORS[entry.level] || LEVEL_COLORS[1]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {entry.student?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                        {entry.student?.name || 'Student'}
                        {isMe && <span className="ml-2 text-xs text-indigo-400">(You)</span>}
                      </p>
                      <p className="text-xs text-slate-500">{entry.levelTitle}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full bg-gradient-to-r ${LEVEL_COLORS[entry.level] || LEVEL_COLORS[1]} text-xs text-white font-medium`}>
                      Lv.{entry.level}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-sm text-slate-300">{entry.badges}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-white font-bold">{entry.totalPoints.toLocaleString()}</span>
                    <span className="text-slate-500 text-xs ml-1">pts</span>
                  </div>
                </div>
              );
            })}
          </div>

          {leaderboard.length === 0 && (
            <div className="py-16 text-center">
              <Trophy className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg">No rankings yet</h3>
              <p className="text-slate-500 text-sm mt-1">Start learning to earn points and climb the leaderboard!</p>
            </div>
          )}
        </div>

        {/* Weekly Activity */}
        {myStats?.weeklyActivity?.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Your Weekly Activity
            </h3>
            <div className="flex items-end gap-2 h-32">
              {myStats.weeklyActivity.map((day, i) => {
                const maxPts = Math.max(...myStats.weeklyActivity.map(d => d.points), 1);
                const height = Math.max(8, (day.points / maxPts) * 100);
                const dayName = new Date(day.date).toLocaleDateString('en', { weekday: 'short' });
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-400 font-mono">{day.points}</span>
                    <div 
                      className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-lg transition-all duration-500"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-slate-500">{dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Leaderboard;
