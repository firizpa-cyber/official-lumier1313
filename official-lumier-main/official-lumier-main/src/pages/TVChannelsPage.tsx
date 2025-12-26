import { Layout } from "@/components/layout/Layout";
import { TVChannelCard } from "@/components/cards/TVChannelCard";
import { useState, useEffect } from "react";

const TVChannelsPage = () => {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/channels')
      .then(res => res.json())
      .then(data => {
        setChannels(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
          ТВ-каналы
        </h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {channels.map((channel) => (
              <TVChannelCard
                key={channel.id}
                id={channel.id.toString()}
                name={channel.title}
                logo={channel.logo}
                currentShow={channel.title}
                progress={Math.floor(Math.random() * 60) + 20}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TVChannelsPage;
