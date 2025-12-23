import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Play, Trophy, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const SportsPage = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    // Find sports channels from the API
    fetch('/api/channels')
      .then(res => res.json())
      .then(data => {
        const sports = data.filter((c: any) =>
          c.title.toLowerCase().includes('матч') ||
          c.title.toLowerCase().includes('спорт') ||
          c.title.toLowerCase().includes('premium') ||
          c.title.toLowerCase().includes('game') ||
          c.id === 68 // Add some variety
        );
        setMatches(sports);
      })
      .catch(err => console.error(err));
  }, []);

  const featuredMatch = {
    id: "68",
    league: "UEFA CHAMPIONS LEAGUE",
    homeTeam: "Chelsea",
    awayTeam: "Real Madrid",
    time: "17:20",
    homeEmoji: "🦁",
    awayEmoji: "👑"
  };

  return (
    <Layout>
      {/* Premium Sport Hero */}
      <section className="relative min-h-[500px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070')] bg-cover bg-center opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent z-10" />

        <div className="container mx-auto px-4 relative z-20 pt-20">
          <div className="flex flex-col items-center">
            <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20 tracking-[0.2em] mb-8 uppercase">
              {featuredMatch.league}
            </span>

            <div className="flex items-center justify-center gap-12 md:gap-24 mb-12">
              {/* Home */}
              <div className="flex flex-col items-center group">
                <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-blue-600/20 backdrop-blur-xl border-2 border-blue-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.2)] transition-transform duration-500 group-hover:scale-110">
                  <span className="text-5xl md:text-7xl drop-shadow-lg">{featuredMatch.homeEmoji}</span>
                </div>
                <h3 className="mt-6 text-xl md:text-2xl font-black text-white uppercase tracking-wider">{featuredMatch.homeTeam}</h3>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center">
                <div className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 opacity-50">VS</div>
              </div>

              {/* Away */}
              <div className="flex flex-col items-center group">
                <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-yellow-600/20 backdrop-blur-xl border-2 border-yellow-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.2)] transition-transform duration-500 group-hover:scale-110">
                  <span className="text-5xl md:text-7xl drop-shadow-lg">{featuredMatch.awayEmoji}</span>
                </div>
                <h3 className="mt-6 text-xl md:text-2xl font-black text-white uppercase tracking-wider">{featuredMatch.awayTeam}</h3>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span className="text-lg font-medium">СЕГОДНЯ В {featuredMatch.time}</span>
              </div>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 h-14 rounded-full text-lg font-bold gap-3 shadow-glow" onClick={() => navigate(`/watch/${featuredMatch.id}`)}>
                <Play className="w-6 h-6 fill-current" />
                СМОТРЕТЬ ЭФИР
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Matches & Channels */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Спортивные каналы</h2>
            <div className="h-0.5 flex-1 bg-white/5 mx-8 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {matches.map((match) => (
              <Link key={match.id} to={`/watch/${match.id}`} className="group relative bg-card/40 backdrop-blur-sm border border-border/30 rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-primary/50 hover:bg-card/60">
                <div className="h-40 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center p-8 relative">
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span className="text-[10px] font-black text-white/60 tracking-widest uppercase">LIVE</span>
                  </div>
                  <img src={match.logo} alt={match.title} className="max-w-full max-h-20 object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-white truncate">{match.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-white/10 text-white/70 px-1 rounded border border-white/10 font-bold">0+</span>
                        <p className="text-xs text-muted-foreground">Спорт</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-primary" style={{ width: '45%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span>45:00</span>
                    <span>90:00</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Replay Section Placeholder */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-8">Повторы матчей</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 opacity-60">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-video rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SportsPage;
