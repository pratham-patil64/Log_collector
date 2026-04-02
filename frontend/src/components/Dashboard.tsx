//WE CAN USE SERVER SIDE COMPONENTS TO REDUCE INITIAL LOAD.

import { useEffect, useState } from "react";
import { fetchStats, exportLogs, fetchLogs } from "../api/logs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Activity, AlertTriangle, CheckCircle, Download, Server } from "lucide-react";

const COLORS = {
  error: "#ef4444",
  warn: "#eab308",
  info: "#3b82f6",
  success: "#22c55e",
  debug: "#a855f7"
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchStats().then(setStats).catch(console.error);
    fetchLogs(1, 5).then((data) => setRecentLogs(data.logs || [])).catch(console.error);
  }, []);

  if (!stats) return <div className="p-8 text-center animate-pulse">Loading dashboard...</div>;

  const pieData = Object.entries(stats.levelCounts).map(([name, value]) => ({ name: name.toUpperCase(), value }));

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportLogs('csv')}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          <Button variant="outline" onClick={() => exportLogs('json')}><Download className="w-4 h-4 mr-2" /> Export JSON</Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Overall system logs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.errorRate}</div>
            <p className="text-xs text-muted-foreground mt-1">System Health: {stats.systemHealth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.levelCounts.warn || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Environments</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1 mt-2">
              {stats.environments.map((env: string) => (
                <Badge key={env} variant="secondary">{env}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Logs Over Time (Last 24h)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.logsOverTime}>
                <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                <YAxis />
                <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Level Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log, i) => (
                  <TableRow key={i}>
                    <TableCell>{log.service}</TableCell>
                    <TableCell>
                      <Badge variant={log.level.toLowerCase() as any}>{log.level.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">{log.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Services</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topServices} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" />
                <YAxis dataKey="service" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}