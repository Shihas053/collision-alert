import { useState } from "react";
import axios from "axios";
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle, Siren, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analyze = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [gpsDialogOpen, setGpsDialogOpen] = useState(false);
  const [manualGPS, setManualGPS] = useState({ latitude: '', longitude: '' });
  const [updatingGPS, setUpdatingGPS] = useState(false);
  const [preAnalysisGPS, setPreAnalysisGPS] = useState({ latitude: '', longitude: '', enabled: false });

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
      
      // Show success message with alert info
      if (response.data.alerts_sent && response.data.alerts_sent.length > 0) {
        toast.success(`Analysis complete! Alerts sent to: ${response.data.alerts_sent.join(', ')}`);
      } else {
        toast.success('Analysis complete! No alerts sent (configure contacts and Twilio)');
      }
    } catch (error) {
      console.error('Error analyzing video:', error);
      toast.error(error.response?.data?.detail || 'Failed to analyze video');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualGPSUpdate = async () => {
    if (!manualGPS.latitude || !manualGPS.longitude) {
      toast.error('Please enter both latitude and longitude');
      return;
    }

    if (!result || !result.id) {
      toast.error('No analysis to update');
      return;
    }

    setUpdatingGPS(true);
    try {
      const response = await axios.post(`${API}/update-gps`, {
        analysis_id: result.id,
        latitude: parseFloat(manualGPS.latitude),
        longitude: parseFloat(manualGPS.longitude)
      });

      // Update result with new GPS data
      setResult({
        ...result,
        gps_coordinates: response.data.gps_coordinates,
        location_address: response.data.location_address,
        gps_source: 'manual',
        traffic_info: response.data.traffic_info
      });

      toast.success('GPS location updated successfully!');
      setGpsDialogOpen(false);
      setManualGPS({ latitude: '', longitude: '' });
    } catch (error) {
      console.error('Error updating GPS:', error);
      toast.error('Failed to update GPS');
    } finally {
      setUpdatingGPS(false);
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

            {/* Collision Condition */}
            {result.condition && (
              <div className="p-4 bg-black/40 rounded-lg border border-white/10">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Collision Condition
                </h3>
                <p className="text-sm leading-relaxed" data-testid="collision-condition">{result.condition}</p>
              </div>
            )}

            {/* GPS Location */}
            {result.gps_coordinates && (
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-wider text-blue-400 flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    GPS Location ({result.gps_source === 'manual' ? 'Manual' : 'Auto-detected'})
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Coordinates: </span>
                    <span className="font-mono text-blue-300" data-testid="gps-coordinates">
                      {result.gps_coordinates.latitude.toFixed(6)}, {result.gps_coordinates.longitude.toFixed(6)}
                    </span>
                    <a 
                      href={`https://www.google.com/maps?q=${result.gps_coordinates.latitude},${result.gps_coordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-400 hover:text-blue-300 underline text-xs"
                    >
                      View on Map
                    </a>
                  </div>
                  {result.location_address && (
                    <div>
                      <span className="text-muted-foreground">Address: </span>
                      <span className="text-foreground" data-testid="location-address">{result.location_address}</span>
                    </div>
                  )}
                  {result.traffic_info && result.traffic_info.nearby_roads > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-500/20">
                      <p className="text-xs text-blue-400 mb-2">🚦 Traffic Information</p>
                      <p className="text-xs text-muted-foreground">
                        {result.traffic_info.nearby_roads} nearby road(s) detected
                      </p>
                      {result.traffic_info.road_types && result.traffic_info.road_types.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {result.traffic_info.road_types.slice(0, 3).map((road, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="text-blue-300">{road.name || 'Unnamed'}</span>
                              <span className="text-muted-foreground ml-2">({road.type})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!result.gps_coordinates && (
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs uppercase tracking-wider text-amber-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    ⚠ GPS Not Available
                  </h3>
                  <Dialog open={gpsDialogOpen} onOpenChange={setGpsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        Add GPS Manually
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0f172a] border-border/40">
                      <DialogHeader>
                        <DialogTitle className="text-xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          Add GPS Location Manually
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="latitude" className="text-xs uppercase tracking-wider">Latitude</Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="0.000001"
                            value={manualGPS.latitude}
                            onChange={(e) => setManualGPS({ ...manualGPS, latitude: e.target.value })}
                            placeholder="37.774929"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="longitude" className="text-xs uppercase tracking-wider">Longitude</Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="0.000001"
                            value={manualGPS.longitude}
                            onChange={(e) => setManualGPS({ ...manualGPS, longitude: e.target.value })}
                            placeholder="-122.419416"
                            className="mt-2"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>💡 Tip: You can get coordinates from Google Maps:</p>
                          <p className="mt-1">Right-click on location → Click coordinates to copy</p>
                        </div>
                        <Button 
                          onClick={handleManualGPSUpdate} 
                          disabled={updatingGPS}
                          className="w-full"
                        >
                          {updatingGPS ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            'Update GPS Location'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-muted-foreground">No GPS metadata found in video. Add location manually for better emergency response.</p>
              </div>
            )}

            {/* Alerts Sent Info */}
            {result.alerts_sent && result.alerts_sent.length > 0 && (
              <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <h3 className="text-xs uppercase tracking-wider text-emerald-500 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ✓ Alerts Sent Successfully
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.alerts_sent.map((alert, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-sm text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {alert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(!result.alerts_sent || result.alerts_sent.length === 0) && (
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <h3 className="text-xs uppercase tracking-wider text-amber-500 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ⚠ No Alerts Sent
                </h3>
                <p className="text-xs text-muted-foreground">Configure emergency contacts and Twilio credentials to enable automated SMS alerts.</p>
              </div>
            )}

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