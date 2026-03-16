import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateProject } from "@workspace/api-client-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Github, TerminalSquare } from "lucide-react";

export function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateProject();
  
  const [formData, setFormData] = useState({
    name: "",
    repoUrl: "",
    branch: "main",
    runtime: "node",
    startCommand: "npm start",
    installCommand: "npm install",
    buildCommand: "npm run build"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: formData }, {
      onSuccess: (project) => {
        toast({ title: "Project created", description: "Your project is ready to deploy." });
        setLocation(`/projects/${project.id}`);
      },
      onError: (err: any) => {
        toast({ title: "Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="glass-panel p-8 rounded-2xl border-t-4 border-t-primary">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
          <p className="text-muted-foreground">Configure your deployment settings below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Project Name</label>
              <input 
                required 
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                placeholder="my-awesome-app"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
              />
            </div>

            <div className="space-y-2 col-span-2 md:col-span-1">
              <label className="text-sm font-medium flex items-center gap-2"><Github className="w-4 h-4"/> GitHub Repo URL</label>
              <input 
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                placeholder="https://github.com/user/repo"
                value={formData.repoUrl}
                onChange={e => setFormData(p => ({ ...p, repoUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Branch</label>
              <input 
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                placeholder="main"
                value={formData.branch}
                onChange={e => setFormData(p => ({ ...p, branch: e.target.value }))}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Runtime Environment</label>
              <select 
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none"
                value={formData.runtime}
                onChange={e => setFormData(p => ({ ...p, runtime: e.target.value }))}
              >
                <option value="node">Node.js</option>
                <option value="python">Python 3</option>
                <option value="go">Go</option>
                <option value="bun">Bun</option>
                <option value="bash">Bash / Shell</option>
              </select>
            </div>

            <div className="space-y-4 col-span-2 p-6 rounded-xl bg-secondary/50 border border-border/50">
              <h3 className="font-semibold flex items-center gap-2"><TerminalSquare className="w-4 h-4"/> Build & Run Settings</h3>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-mono">Install Command</label>
                <input 
                  className="w-full px-4 py-2 bg-background border border-border rounded focus:border-primary outline-none font-mono text-sm"
                  value={formData.installCommand}
                  onChange={e => setFormData(p => ({ ...p, installCommand: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-mono">Build Command</label>
                <input 
                  className="w-full px-4 py-2 bg-background border border-border rounded focus:border-primary outline-none font-mono text-sm"
                  value={formData.buildCommand}
                  onChange={e => setFormData(p => ({ ...p, buildCommand: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-mono">Start Command</label>
                <input 
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded focus:border-primary outline-none font-mono text-sm"
                  value={formData.startCommand}
                  onChange={e => setFormData(p => ({ ...p, startCommand: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" size="lg" isLoading={createMutation.isPending}>
              Create & Proceed to Deploy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
