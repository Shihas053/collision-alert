import { useState, useEffect } from "react";
import axios from "axios";
import { History as HistoryIcon, CheckCircle2, AlertTriangle, Siren, Clock, FileVideo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const History = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/analysis-history`);
      setAnalyses(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityConfig = (severity) => {
    const configs = {
      normal: {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/15',
        label: 'Normal',
      },
      mild: {
        icon: AlertTriangle,
        color: 'text-amber-500',
        bg: 'bg-amber-500/15',
        label: 'Mild Impact',
      },
      severe: {
        icon: Siren,
        color: 'text-rose-500',
        bg: 'bg-rose-500/15',
        label: 'SEVERE',
      },
    };
    return configs[severity] || configs.normal;
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }} data-testid="history-title">
          Analysis History
        </h1>
        <p className="text-sm text-muted-foreground">Complete record of all collision analyses</p>
      </div>

      {/* History List */}
      {loading ? (
        <Card className="bg-card/50 backdrop-blur-md border-border/40">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading history...</p>
          </CardContent>
        </Card>
      ) : analyses.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-md border-border/40">
          <CardContent className="py-12 text-center">
            <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No analysis history yet.</p>
            <p className="text-sm text-muted-foreground">Start analyzing videos to see them here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="history-list">
          {analyses.map((analysis) => {
            const config = getSeverityConfig(analysis.severity);
            const Icon = config.icon;
            return (
              <Card
                key={analysis.id}
                className="bg-card/50 backdrop-blur-md border-border/40 hover:border-primary/50 transition-all"
                data-testid={`history-item-${analysis.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${config.bg} flex-shrink-0`}>
                      <Icon className={`w-8 h-8 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <FileVideo className="w-5 h-5 text-muted-foreground" />
                          <span data-testid="video-name">{analysis.video_name}</span>
                        </h3>
                        <Badge className={`${config.color} ${config.bg} border-0`} data-testid="severity-badge">
                          {config.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-4" data-testid="analysis-text">
                        {analysis.analysis_details}
                      </p>

                      <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(analysis.timestamp).toLocaleString()}</span>
                        </div>
                        {analysis.alerts_sent && analysis.alerts_sent.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Alerts Sent: {analysis.alerts_sent.join(', ')}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;