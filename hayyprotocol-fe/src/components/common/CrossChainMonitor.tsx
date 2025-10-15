import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RelayerEvent {
  id: string;
  txHash: string;
  timestamp: string;
}

interface RelayerStats {
  lastHeight: number;
  totalProcessed: number;
  recentProcessed: number;
  isProcessing: boolean;
  nextPoll: string;
}

interface RelayerHealth {
  ok: boolean;
  timestamp: string;
  isProcessing: boolean;
  uptime: number;
  evm?: {
    relayerAddress: string;
    balance: string;
  };
  error?: string;
}

interface CrossChainMonitorProps {
  className?: string;
}

export const CrossChainMonitor: React.FC<CrossChainMonitorProps> = ({ className }) => {
  const [health, setHealth] = useState<RelayerHealth | null>(null);
  const [stats, setStats] = useState<RelayerStats | null>(null);
  const [events, setEvents] = useState<RelayerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const RELAYER_URL = 'http://localhost:3000';

  const fetchRelayerData = async () => {
    setIsLoading(true);
    try {
      // Fetch health, stats, and events in parallel
      const [healthRes, statsRes, eventsRes] = await Promise.all([
        fetch(`${RELAYER_URL}/health`).then(r => r.json()).catch(() => null),
        fetch(`${RELAYER_URL}/stats`).then(r => r.json()).catch(() => null),
        fetch(`${RELAYER_URL}/events`).then(r => r.json()).catch(() => null)
      ]);

      if (healthRes) setHealth(healthRes);
      if (statsRes) setStats(statsRes);
      if (eventsRes?.events) setEvents(eventsRes.events);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch relayer data:', error);
      setHealth({ 
        ok: false, 
        timestamp: new Date().toISOString(), 
        isProcessing: false, 
        uptime: 0,
        error: 'Connection failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualSync = async () => {
    try {
      const response = await fetch(`${RELAYER_URL}/trigger-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        toast({
          title: "Manual Sync Triggered",
          description: "Relayer will process pending events",
          duration: 5000
        });
        // Refresh data after a delay
        setTimeout(fetchRelayerData, 3000);
      } else {
        throw new Error('Failed to trigger sync');
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to trigger manual sync",
        variant: "destructive"
      });
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchRelayerData();
    const interval = setInterval(fetchRelayerData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const isRelayerHealthy = health?.ok && !health.error;
  const hasRecentActivity = (stats?.recentProcessed || 0) > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Cross-Chain Monitor
          </div>
          <div className="flex items-center gap-2">
            {isRelayerHealthy ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={fetchRelayerData}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Relayer Status */}
        {health && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-medium">
                {health.ok ? 'Healthy' : 'Error'}
              </p>
              {health.error && (
                <p className="text-xs text-red-600">{health.error}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Uptime</p>
              <p className="text-sm font-medium">
                {formatUptime(health.uptime)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Processing</p>
              <div className="flex items-center gap-1">
                {health.isProcessing ? (
                  <>
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span className="text-sm text-blue-600">Active</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-600">Idle</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">EVM Balance</p>
              <p className="text-sm font-medium">
                {health.evm?.balance ? `${parseFloat(health.evm.balance).toFixed(4)} ETH` : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Processing Stats */}
        {stats && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold">{stats.totalProcessed}</p>
                <p className="text-xs text-gray-500">Total Processed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{stats.recentProcessed}</p>
                <p className="text-xs text-gray-500">Last 24h</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{stats.lastHeight}</p>
                <p className="text-xs text-gray-500">Last Block</p>
              </div>
            </div>
            {stats.nextPoll && (
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-500">
                  Next poll: {formatTimestamp(stats.nextPoll)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recent Events */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Recent Events</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={triggerManualSync}
              disabled={!isRelayerHealthy}
            >
              Manual Sync
            </Button>
          </div>
          
          {events.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                  <div>
                    <p className="text-xs font-mono">{event.id}</p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(event.timestamp)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-gray-600">
                      {event.txHash.slice(0, 8)}...{event.txHash.slice(-6)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No recent events</p>
              <p className="text-xs text-gray-400">
                Cross-chain transactions will appear here
              </p>
            </div>
          )}
        </div>

        {/* Connection Info */}
        <div className="border-t pt-4">
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Relayer URL:</strong> {RELAYER_URL}</p>
            {health?.evm?.relayerAddress && (
              <p><strong>Relayer Address:</strong> {health.evm.relayerAddress}</p>
            )}
            {lastUpdate && (
              <p><strong>Last Update:</strong> {formatTimestamp(lastUpdate.toISOString())}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CrossChainMonitor;
