import { useState } from "react";
import axios from "axios";
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle, Siren, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analyze = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [sendingAlerts, setSendingAlerts] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error analyzing video:', error);
      toast.error(error.response?.data?.detail || 'Failed to analyze video');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendAlerts = async () => {
    if (!result) return;

    setSendingAlerts(true);
    try {
      const response = await axios.post(`${API}/send-alerts`, {
        analysis_id: result.id,
        severity: result.severity,
      });

      if (response.data.alerts_sent.length > 0) {
        toast.success(`Alerts sent to: ${response.data.alerts_sent.join(', ')}`);
      } else {
        toast.warning('No alerts sent. Please configure emergency contacts and Twilio.');
      }
    } catch (error) {
      console.error('Error sending alerts:', error);
      toast.error('Failed to send alerts');
    } finally {
      setSendingAlerts(false);
    }
  };

  const getSeverityConfig = (severity) => {
    const configs = {
      normal: {
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/50',
        label: 'NORMAL',
        description: 'Police notified',
      },
      mild: {
        icon: AlertTriangle,
        color: 'text-amber-500',
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/50',
        label: 'MILD IMPACT',
        description: 'Police & Ambulance notified',
      },
      severe: {
        icon: Siren,
        color: 'text-rose-500',
        bg: 'bg-rose-500/15',
        border: 'border-rose-500/50',
        label: 'SEVERE COLLISION',
        description: 'All emergency services notified',
      },
    };
    return configs[severity] || configs.normal;
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }} data-testid="analyze-title">
          Collision Analysis
        </h1>
        <p className="text-sm text-muted-foreground">Upload video footage for AI-powered severity analysis</p>
      </div>

      {/* Upload Section */}
      <Card className="bg-card/50 backdrop-blur-md border-border/40 mb-6" data-testid="upload-section">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Upload Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className="upload-zone border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer"
              onClick={() => document.getElementById('video-upload').click()}
              data-testid="upload-zone"
            >
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="file-input"
              />
              <UploadCloud className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {selectedFile ? selectedFile.name : 'Click to upload video'}
              </p>
              <p className="text-sm text-muted-foreground">
                Supports MP4, MOV, AVI and other video formats
              </p>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!selectedFile || analyzing}
              className="w-full h-12 bg-primary hover:bg-primary/90 shadow-[0_0_10px_rgba(59,130,246,0.5)] uppercase tracking-wider font-bold"
              data-testid="analyze-button"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Collision'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Result */}
      {result && (
        <Card
          className={`bg-card/50 backdrop-blur-md border-2 ${getSeverityConfig(result.severity).border} ${result.severity === 'severe' ? 'severe-alert' : ''}`}
          data-testid="analysis-result"
        >
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Analysis Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Severity Badge */}
            <div className="text-center py-8">
              {(() => {
                const config = getSeverityConfig(result.severity);
                const Icon = config.icon;
                return (
                  <div>
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${config.bg} mb-4`}>
                      <Icon className={`w-10 h-10 ${config.color}`} />
                    </div>
                    <h2 className={`text-3xl font-bold tracking-tight uppercase mb-2 ${config.color}`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }} data-testid="severity-label">
                      {config.label}
                    </h2>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                );
              })()}
            </div>

            {/* Analysis Details */}
            <div className="p-4 bg-black/40 rounded-lg border border-white/10">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Analysis Details
              </h3>
              <p className="text-sm leading-relaxed" data-testid="analysis-details">{result.analysis}</p>
            </div>

            {/* Send Alerts Button */}
            <Button
              onClick={handleSendAlerts}
              disabled={sendingAlerts}
              className="w-full h-12 bg-destructive hover:bg-destructive/90 shadow-[0_0_10px_rgba(239,68,68,0.4)] uppercase tracking-wider font-bold"
              data-testid="send-alerts-button"
            >
              {sendingAlerts ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending Alerts...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Emergency Alerts
                </>
              )}
            </Button>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Video File
                </p>
                <p className="text-sm font-medium">{result.video_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Timestamp
                </p>
                <p className="text-sm font-medium">{new Date(result.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analyze;