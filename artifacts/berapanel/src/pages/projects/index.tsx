import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListProjects, useDeleteProject, useStartProject, useStopProject } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play, Square, Trash2, ExternalLink, Globe, Server, Clock } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

export function ProjectsList() {
  const { data: projects, isLoading, refetch } = useListProjects();
  useEffect(() => { const t = setInterval(() => refetch(), 8000); return () => clearInterval(t); }, [refetch]);
  const deleteMut = useDeleteProject();
  const startMut = useStartProject();
  const stopMut = useStopProject();
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "success";
      case "error": return "destructive";
      case "building": return "warning";
      default: return "outline";
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteMut.mutate({ id }, {
      onSuccess: () => { toast({ title: "Project deleted" }); refetch(); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  const handleStart = (id: string) => {
    startMut.mutate({ id }, {
      onSuccess: () => { toast({ title: "Starting..." }); refetch(); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  const handleStop = (id: string) => {
    stopMut.mutate({ id }, {
      onSuccess: () => { toast({ title: "Stopped" }); refetch(); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-panel rounded-2xl h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">{projects?.length || 0} project{(projects?.length || 0) !== 1 ? "s" : ""} deployed</p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent border-none text-white">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center">
          <Server className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h3 className="text-xl font-bold mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground mb-6">Deploy your first project and get 100 bonus coins!</p>
          <Link href="/projects/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Create First Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <div key={project.id} className="glass-panel rounded-2xl p-5 border border-border hover:border-primary/30 transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Server className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Link href={`/projects/${project.id}`}>
                        <h3 className="font-bold text-lg hover:text-primary transition-colors cursor-pointer truncate">{project.name}</h3>
                      </Link>
                      <Badge variant={getStatusColor(project.status) as any} className="text-xs px-2 flex-shrink-0">
                        {project.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-mono">{project.runtime}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeAgo(project.updatedAt)}</span>
                      {project.liveUrl && (
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:text-accent transition-colors">
                          <Globe className="w-3 h-3" /> Live
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0">
                  {project.status === "running" ? (
                    <Button size="sm" variant="outline" onClick={() => handleStop(project.id)} isLoading={stopMut.isPending} className="hover:text-destructive hover:border-destructive/30 text-xs px-3">
                      <Square className="w-3 h-3 mr-1" /> Stop
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleStart(project.id)} isLoading={startMut.isPending} className="hover:text-success hover:border-success/30 text-xs px-3">
                      <Play className="w-3 h-3 mr-1" /> Start
                    </Button>
                  )}
                  <Link href={`/projects/${project.id}`}>
                    <Button size="sm" variant="outline" className="text-xs px-3">
                      <ExternalLink className="w-3 h-3 mr-1" /> Manage
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(project.id, project.name)} className="hover:text-destructive hover:border-destructive/30 px-2">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
