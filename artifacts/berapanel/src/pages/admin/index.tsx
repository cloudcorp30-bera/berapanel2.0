import { useGetAdminDashboard, useAdminListUsers } from "@workspace/api-client-react";
import { Users, Server, DollarSign, Activity } from "lucide-react";

export function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminDashboard();
  const { data: usersObj } = useAdminListUsers();

  if (isLoading) return <div className="animate-pulse h-64 bg-card rounded-xl"></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Control Panel</h1>
        <p className="text-muted-foreground">Platform wide statistics and management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="text-primary" bg="bg-primary/20" border="border-primary/30" />
        <StatCard icon={Server} label="Running Projects" value={stats?.runningProjects || 0} color="text-success" bg="bg-success/20" border="border-success/30" />
        <StatCard icon={DollarSign} label="Revenue (KSH)" value={`KSH ${stats?.totalRevenue || 0}`} color="text-yellow-500" bg="bg-yellow-500/20" border="border-yellow-500/30" />
        <StatCard icon={Activity} label="Coins Circulating" value={stats?.coinsInCirculation || 0} color="text-accent" bg="bg-accent/20" border="border-accent/30" />
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-6">Recent Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Username</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Coins</th>
                <th className="pb-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {usersObj?.users.slice(0, 10).map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="py-3 font-medium">{u.username}</td>
                  <td className="py-3"><span className="px-2 py-1 rounded bg-secondary text-xs">{u.role}</span></td>
                  <td className="py-3 font-mono text-accent">{u.coins}</td>
                  <td className="py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, border }: any) {
  return (
    <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center border ${border}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
    </div>
  );
}
