"use client";

import { useState, useEffect } from "react";
import { Upload, BarChart3, TrendingUp, Download, Lightbulb, Calendar, AlertCircle, CheckCircle, Activity, Zap, Target, Brain, Database, Cloud, Cpu } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, BarChart as RechartsBarChart, Bar } from "recharts";

export default function Home() {
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [modelStatus, setModelStatus] = useState<any>(null);

  // Check model status on mount
  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/training-status");
      const data = await response.json();
      setModelStatus(data);
      if (data.trained) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.log("Backend not ready yet");
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    setUploadStatus("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadStatus(`✅ ${data.message}`);
        setMetrics(data.data.metrics);
        await checkModelStatus();
      } else {
        setUploadStatus(`❌ Error: ${data.detail || "Upload failed"}`);
      }
    } catch (error) {
      setUploadStatus("❌ Connection error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const generateForecast = async () => {
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/forecast?days=30");
      const data = await response.json();

      if (data.success) {
        setForecastData(data.forecast);
        setAnalytics(data.insights);
      } else {
        console.error("Forecast error:", data.detail);
      }
    } catch (error) {
      console.error("Forecast error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950 text-zinc-100">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">SalesVista</h1>
                  <p className="text-emerald-400 text-sm">AI-Powered Sales Intelligence</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-2xl border border-zinc-700">
                <div className={`w-2 h-2 rounded-full ${modelStatus?.trained ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                <span className="text-sm text-zinc-300">
                  {modelStatus?.trained ? 'Model Ready' : 'No Data'}
                </span>
              </div>

              <a
                href="https://github.com/YOUR_USERNAME/FUTURE_ML_01_SalesForecast_System"
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-2xl border border-zinc-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel - Upload & Controls */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upload Zone */}
            <div className="bg-zinc-900/60 backdrop-blur-lg rounded-3xl border border-zinc-800 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
                <Database className="w-5 h-5 text-emerald-400" />
                Data Upload
              </h3>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDragging
                  ? "border-emerald-500 bg-emerald-950/30"
                  : "border-zinc-700 hover:border-emerald-500"
                  }`}
              >
                <Upload className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
                <p className="font-medium text-lg mb-2">Drop Superstore.csv here</p>
                <p className="text-zinc-500 text-sm mb-4">Order Date + Sales columns required</p>
                <label className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-2xl cursor-pointer text-sm font-semibold transition-all">
                  Browse Files
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadStatus && (
                <div className={`mt-4 p-4 rounded-2xl text-sm ${uploadStatus.includes("✅")
                  ? "bg-emerald-950/30 border border-emerald-500/30 text-emerald-400"
                  : "bg-red-950/30 border border-red-500/30 text-red-400"
                  }`}>
                  {uploadStatus}
                </div>
              )}

              <button
                onClick={generateForecast}
                disabled={loading || !modelStatus?.trained}
                className="w-full mt-6 py-4 text-lg font-semibold bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 disabled:from-zinc-600 disabled:to-zinc-700 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate Forecast
                  </>
                )}
              </button>
            </div>

            {/* Model Metrics */}
            {metrics && (
              <div className="bg-zinc-900/60 backdrop-blur-lg rounded-3xl border border-zinc-800 p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  <Target className="w-5 h-5 text-cyan-400" />
                  Model Performance
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-xl">
                    <span className="text-emerald-400 font-medium">MAE</span>
                    <span className="text-xl font-bold">{metrics.MAE}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-xl">
                    <span className="text-cyan-400 font-medium">RMSE</span>
                    <span className="text-xl font-bold">{metrics.RMSE}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-xl">
                    <span className="text-amber-400 font-medium">MAPE</span>
                    <span className="text-xl font-bold">{metrics.MAPE}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Model Quality</span>
                  </div>
                  <div className="text-xs text-emerald-300">
                    Accuracy: {Math.max(0, 100 - parseFloat(metrics.MAPE)).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Chart & Insights */}
          <div className="lg:col-span-8 space-y-6">
            {/* Forecast Chart */}
            {forecastData.length > 0 && (
              <div className="bg-zinc-900/60 backdrop-blur-lg rounded-3xl border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                    30-Day Sales Forecast
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Cloud className="w-4 h-4" />
                    95% Confidence Interval
                  </div>
                </div>

                <div className="bg-zinc-950/50 rounded-2xl p-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={forecastData}>
                      <defs>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="ds" stroke="#a3a3a3" />
                      <YAxis stroke="#a3a3a3" />
                      <Tooltip
                        formatter={(value: any) => [`$${parseFloat(value).toFixed(0)}`, ""]}
                        contentStyle={{
                          backgroundColor: '#09090b',
                          border: '1px solid #27272a',
                          borderRadius: '12px'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="yhat"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#colorForecast)"
                        name="Predicted Sales"
                      />
                      <Line
                        type="monotone"
                        dataKey="yhat_lower"
                        stroke="#64748b"
                        strokeDasharray="5 5"
                        name="Lower Bound"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="yhat_upper"
                        stroke="#64748b"
                        strokeDasharray="5 5"
                        name="Upper Bound"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Business Insights */}
            {analytics && (
              <div className="bg-zinc-900/60 backdrop-blur-lg rounded-3xl border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Lightbulb className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-2xl font-bold">Business Insights</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-emerald-950/30 to-emerald-900/20 border border-emerald-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Growth Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-300">
                      {analytics.growth_rate > 0 ? '+' : ''}{analytics.growth_rate}%
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-950/30 to-cyan-900/20 border border-cyan-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                      <span className="text-cyan-400 font-medium">Total Sales</span>
                    </div>
                    <div className="text-2xl font-bold text-cyan-300">
                      ${analytics.total_predicted_sales?.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-950/30 to-amber-900/20 border border-amber-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-amber-400" />
                      <span className="text-amber-400 font-medium">Daily Average</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-300">
                      ${analytics.avg_daily_prediction?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {analytics.potential_dips && analytics.potential_dips.length > 0 && (
                  <div className="mt-6 p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      <span className="text-amber-400 font-medium">Potential Dips Detected</span>
                    </div>
                    <div className="space-y-2">
                      {analytics.potential_dips.map((dip: any, index: number) => (
                        <div key={index} className="text-sm text-amber-300 flex justify-between">
                          <span>{dip.date}</span>
                          <span>~{dip.drop_percentage}% drop</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Welcome State */}
            {!forecastData.length && (
              <div className="bg-zinc-900/60 backdrop-blur-lg rounded-3xl border border-zinc-800 p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">AI Sales Forecasting</h2>
                <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                  Upload your sales data and let our advanced Prophet ML model generate accurate predictions with business insights
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <Database className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-xs text-zinc-400">Smart Data Processing</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <Cpu className="w-6 h-6 text-cyan-400" />
                    </div>
                    <p className="text-xs text-zinc-400">Advanced ML Model</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <Target className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-xs text-zinc-400">Business Insights</p>
                  </div>
                </div>
                <button
                  onClick={generateForecast}
                  disabled={!modelStatus?.trained}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-zinc-600 disabled:to-zinc-700 rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modelStatus?.trained ? "Generate Sample Forecast" : "Upload Data First"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-xl mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold">SalesVista</p>
                <p className="text-sm text-zinc-400">Future Interns ML Task 1</p>
              </div>
            </div>
            <div className="text-sm text-zinc-400 text-center">
              Real Kaggle Superstore Data • Advanced Prophet ML Model • AI-Powered Insights
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}