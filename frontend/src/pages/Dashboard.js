import { useState, useEffect } from "react";
import axios from "axios";
import { LayoutDashboard, AlertTriangle, CheckCircle2, Siren, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    normal: 0,
    mild: 0,
    severe: 0,
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analysesRes, contactsRes] = await Promise.all([
        axios.get(`${API}/analysis-history`),
        axios.get(`${API}/contacts`),
      ]);

      const analyses = analysesRes.data;
      setRecentAnalyses(analyses.slice(0, 5));
      setContacts(contactsRes.data);

      // Calculate stats
      const statsData = {
        total: analyses.length,
        normal: analyses.filter((a) => a.severity === "normal").length,
        mild: analyses.filter((a) => a.severity === "mild").length,
        severe: analyses.filter((a) => a.severity === "severe").length,
      };
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const getSeverityBadge = (severity) => {
    const configs = {
      normal: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/15", label: "Normal" },
      mild: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/15", label: "Mild Impact" },
      severe: { icon: Siren, color: "text-rose-500", bg: "bg-rose-500/15", label: "SEVERE" },
    };
    const config = configs[severity] || configs.normal;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-xs font-semibold ${config.color} ${config.bg}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }} data-testid="dashboard-title">
          Command Center
        </h1>
        <p className="text-sm text-muted-foreground">Real-time collision analysis monitoring</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6" data-testid="stats-grid">
        <Card className="bg-card/50 backdrop-blur-md border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Total Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="total-analyses">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md border-border/40 border-emerald-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider text-emerald-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Normal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500" data-testid="normal-count">{stats.normal}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md border-border/40 border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider text-amber-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Mild Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500" data-testid="mild-count">{stats.mild}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md border-border/40 border-rose-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-wider text-rose-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Severe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-500" data-testid="severe-count">{stats.severe}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Analyses */}
      <Card className="bg-card/50 backdrop-blur-md border-border/40 mb-6" data-testid="recent-analyses">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Recent Analyses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAnalyses.length === 0 ? (
            <p className="text-muted-foreground text-sm">No analyses yet. Upload a video to get started.</p>
          ) : (
            <div className="space-y-3">
              {recentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-white/10"
                  data-testid={`analysis-${analysis.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{analysis.video_name}</h3>
                      {getSeverityBadge(analysis.severity)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{analysis.analysis_details}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-4">
                    <Clock className="w-3 h-3" />
                    {new Date(analysis.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card className="bg-card/50 backdrop-blur-md border-border/40" data-testid="contacts-overview">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No emergency contacts configured. Add contacts in the Contacts section.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 bg-black/40 rounded-lg border border-white/10"
                  data-testid={`contact-${contact.id}`}
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {contact.role}
                  </div>
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-muted-foreground">{contact.phone}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;