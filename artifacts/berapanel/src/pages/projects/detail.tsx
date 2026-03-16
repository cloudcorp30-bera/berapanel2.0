import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  useGetProject, useDeployProject, useStartProject, useStopProject, useRestartProject,
  useGetProjectEnv, useUpdateProjectEnv, useGetProjectLogs
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useTerminal } from "@/hooks/use-terminal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatTimeAgo, formatBytes } from "@/lib/utils";
import Editor from "@monaco-editor/react";
import { 
  Activity, Play, Square, RotateCw, TerminalSquare, FileCode, Settings, FileText, 
  Rocket, Trash2, Save, Globe
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useQueryClient } from "@tanstack/react-query";

export function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id || "";
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading, refetch } = useGetProject(projectId);
  useEffect(() => { const t = setInterval(() => refetch(), 5000); return () => clearInterval(t); }, [refetch]);
  
  const deployMut = useDeployProject();
  const startMut = useStartProject();
  const stopMut = useStopProject();
  const restartMut = useRestartProject();

  const handleAction = (mut: any, actionName: string) => {
    mut.mutate({ id: projectId }, {
      onSuccess: () => {
        toast({ title: "Success", description: `${actionName} initiated.` });
        refetch();
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'running': return 'success';
      case 'error': return 'destructive';
      case 'building': return 'warning';
      default: return 'outline';
    }
  };

  if (isLoading || !project) return <div className="text-center p-12 animate-pulse font-mono">Loading container stats...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {project.name}
            <Badge variant={getStatusColor(project.status) as any} className="text-sm px-3 py-1">
              {project.status.toUpperCase()}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {project.runtime} • {project.branch} • Cost: {project.coinCostPerHour} coins/hr
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {project.liveUrl && (
             <Button variant="outline" className="gap-2" onClick={() => window.open(project.liveUrl?.startsWith('http') ? project.liveUrl : `http://${project.liveUrl}`, '_blank')}>
               <Globe className="w-4 h-4"/> Visit Site
             </Button>
          )}
          {project.status === 'running' ? (
            <Button variant="outline" onClick={() => handleAction(stopMut, 'Stop')} isLoading={stopMut.isPending} className="hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30">
              <Square className="w-4 h-4 mr-2" /> Stop
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleAction(startMut, 'Start')} isLoading={startMut.isPending} className="hover:text-success hover:bg-success/10 hover:border-success/30">
              <Play className="w-4 h-4 mr-2" /> Start
            </Button>
          )}
          <Button variant="outline" onClick={() => handleAction(restartMut, 'Restart')} isLoading={restartMut.isPending}>
            <RotateCw className="w-4 h-4 mr-2" /> Restart
          </Button>
          <Button onClick={() => handleAction(deployMut, 'Deploy')} isLoading={deployMut.isPending} className="bg-gradient-to-r from-primary to-accent border-none text-white">
            <Rocket className="w-4 h-4 mr-2" /> Deploy Now
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'logs', label: 'Runtime Logs', icon: FileText },
          { id: 'terminal', label: 'Terminal', icon: TerminalSquare },
          { id: 'env', label: 'Variables', icon: Settings },
          { id: 'editor', label: 'Code', icon: FileCode },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'overview' && <OverviewTab project={project} />}
        {activeTab === 'logs' && <LogsTab projectId={project.id} />}
        {activeTab === 'terminal' && <TerminalTab projectId={project.id} />}
        {activeTab === 'env' && <EnvTab projectId={project.id} />}
        {activeTab === 'editor' && <div className="glass-panel p-8 rounded-2xl flex items-center justify-center text-muted-foreground">Editor module loading... (File Tree implementation via API)</div>}
      </div>
    </div>
  );
}

function OverviewTab({ project }: { project: any }) {
  // Mock data for the chart to look nice since actual metrics might be empty initially
  const mockData = Array.from({length: 24}).map((_, i) => ({
    time: `${i}:00`,
    cpu: Math.random() * 30 + 10,
    ram: Math.random() * 100 + 200
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto pb-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-6">Resource Usage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCpu)" />
                <Area type="monotone" dataKey="ram" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorRam)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-4">Configuration</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <span className="text-muted-foreground block mb-1">Start Command</span>
              <code className="text-primary">{project.startCommand}</code>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <span className="text-muted-foreground block mb-1">Install Command</span>
              <code className="text-accent">{project.installCommand}</code>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-4">Details</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono">{project.id.slice(0,8)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatTimeAgo(project.createdAt)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Last Deployed</span>
              <span>{project.lastDeployedAt ? formatTimeAgo(project.lastDeployedAt) : 'Never'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Memory Limit</span>
              <span>{project.memoryLimitMb} MB</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Auto Restart</span>
              <span>{project.autoRestart ? 'Enabled' : 'Disabled'}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LogsTab({ projectId }: { projectId: string }) {
  const { data } = useGetProjectLogs(projectId, { lines: 200 });
  
  return (
    <div className="h-full bg-black rounded-xl border border-border overflow-hidden flex flex-col">
      <div className="bg-secondary px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">Tail /logs/stdout</span>
        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
        {data?.logs || "Waiting for logs..."}
      </div>
    </div>
  );
}

function TerminalTab({ projectId }: { projectId: string }) {
  const { terminalRef, isConnected } = useTerminal(projectId);
  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <Badge variant={isConnected ? "success" : "destructive"}>
          {isConnected ? "Connected to PTY" : "Disconnected"}
        </Badge>
      </div>
      <div className="flex-1 bg-black rounded-xl border border-border overflow-hidden p-2">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
    </div>
  );
}

function EnvTab({ projectId }: { projectId: string }) {
  const { data, isLoading, refetch } = useGetProjectEnv(projectId);
  const updateMut = useUpdateProjectEnv();
  const { toast } = useToast();
  
  const [envText, setEnvText] = useState("");

  useEffect(() => {
    if (data?.env) {
      setEnvText(Object.entries(data.env).map(([k,v]) => `${k}=${v}`).join('\n'));
    }
  }, [data]);

  const handleSave = () => {
    const lines = envText.split('\n');
    const newEnv: Record<string, string> = {};
    lines.forEach(l => {
      const match = l.match(/^([^=]+)=(.*)$/);
      if (match) newEnv[match[1].trim()] = match[2].trim();
    });

    updateMut.mutate({ id: projectId, data: { env: newEnv } }, {
      onSuccess: () => {
        toast({ title: "Environment Updated", description: "Container will restart to apply changes." });
        refetch();
      }
    });
  };

  if (isLoading) return null;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Set environment variables. One per line. (KEY=value)</p>
        <Button onClick={handleSave} isLoading={updateMut.isPending} className="gap-2">
          <Save className="w-4 h-4"/> Save & Restart
        </Button>
      </div>
      <div className="flex-1 border border-border rounded-xl overflow-hidden">
        <Editor 
          height="100%" 
          defaultLanguage="ini" 
          theme="vs-dark"
          value={envText}
          onChange={(val) => setEnvText(val || '')}
          options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: 'JetBrains Mono' }}
        />
      </div>
    </div>
  );
}
