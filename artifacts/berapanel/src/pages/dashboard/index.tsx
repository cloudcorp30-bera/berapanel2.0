import { useListProjects, useGetMe } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Server, Plus, Activity, Cpu, Code2, Globe } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

export function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: projects, isLoading } = useListProjects();
  const { data: user } = useGetMe();

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'running': return 'success';
      case 'error': return 'destructive';
      case 'building': return 'warning';
      default: return 'outline';
    }
  };

  if (isLoading) return <div className="animate-pulse flex gap-4"><div className="h-32 w-full bg-card rounded-xl"></div></div>;

  const runningCount = projects?.filter(p => p.status === 'running').length || 0;

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Server className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Total Instances</p>
            <h3 className="text-3xl font-bold">{projects?.length || 0}</h3>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center border border-success/30">
            <Activity className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Active (Running)</p>
            <h3 className="text-3xl font-bold">{runningCount}</h3>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30">
            <Cpu className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Plan Level</p>
            <h3 className="text-3xl font-bold uppercase">{user?.role}</h3>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Projects</h2>
        <Button onClick={() => setLocation("/projects/new")} className="gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {projects?.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center border-dashed">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Code2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No projects deployed yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">Deploy your first app in seconds. We support Node.js, Python, Go, and static sites.</p>
          <Button onClick={() => setLocation("/projects/new")} size="lg">Deploy from Github</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <div key={project.id} className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col h-full cursor-pointer" onClick={() => setLocation(`/projects/${project.id}`)}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {project.name}
                    {project.pinned && <span className="text-accent text-xs bg-accent/10 px-2 py-0.5 rounded">Pinned</span>}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{project.runtime} • {project.branch}</p>
                </div>
                <Badge variant={getStatusColor(project.status) as any}>{project.status}</Badge>
              </div>
              
              <div className="mt-auto space-y-4">
                {project.liveUrl && (
                  <div className="flex items-center gap-2 text-sm text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    <Globe className="w-4 h-4" />
                    <a href={project.liveUrl.startsWith('http') ? project.liveUrl : `http://${project.liveUrl}`} target="_blank" rel="noreferrer" className="truncate">
                      {project.liveUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                  <span>Deploys: {project.deployCount}</span>
                  <span>{project.lastDeployedAt ? formatTimeAgo(project.lastDeployedAt) : 'Never deployed'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
