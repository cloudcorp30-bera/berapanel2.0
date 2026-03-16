import { useListBots, useDeployBot } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Bot, Download, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function Marketplace() {
  const { data: bots, isLoading } = useListBots();
  const deployMut = useDeployBot();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleDeploy = (bot: any) => {
    // Basic auto-deploy for this demo
    const name = `${bot.name.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random()*1000)}`;
    
    deployMut.mutate({
      id: bot.id,
      data: { projectName: name, envVars: {} }
    }, {
      onSuccess: (project) => {
        toast({ title: "Bot Deployed!", description: "Check your projects tab." });
        setLocation(`/projects/${project.id}`);
      }
    });
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-card rounded-xl"></div>;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bot Marketplace</h1>
        <p className="text-muted-foreground">Deploy pre-configured Discord, Telegram, and utility bots instantly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {bots?.map((bot) => (
          <div key={bot.id} className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl mb-4 border border-border">
              {bot.icon || <Bot className="w-6 h-6 text-primary" />}
            </div>
            
            <h3 className="font-bold text-lg mb-1">{bot.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{bot.description}</p>
            
            <div className="flex items-center justify-between mb-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><Download className="w-3 h-3"/> {bot.deployCount}</div>
              {bot.featured && <Badge variant="success">Featured</Badge>}
            </div>

            <Button className="w-full gap-2" onClick={() => handleDeploy(bot)} isLoading={deployMut.isPending}>
              Deploy for {bot.coinCost > 0 ? `${bot.coinCost} Coins` : 'Free'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
