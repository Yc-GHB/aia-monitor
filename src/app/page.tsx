"use client";

import { useEffect, useState, useCallback } from 'react';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Activity, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

const AIA_TOKEN_TYPE = "0x8b449b4dc0f8c5f996734eaf23d36a5f6724e02e312a7e4af34bd0bb74de7b17::deagent_token::DEAGENT_TOKEN";
const DECIMALS = 9;

const TARGET_ADDRESSES = [
  "0x9c44906cb29a4eff54931a261c19ea4fd949314b55f5c072b5ea87e6447b23cb",
  "0x4f40add70587301bcb7f7894a24b0412c1be564e2683a61457e0b301fdd10fcf",
  "0xd6eef1f2dd336e7d0f15b24727b52c4a6a0e315fb4c2851b37c005ba6fd0145b",
  "0x15be36e417f5b8dcdaf6a5f4a730341c51e827ecff82bb4494126abd47a7ada0",
  "0x47af2bb2365bd1c47857151601b900eaa5cfbbe8a581151a400936af24dc5c7a",
  "0x961e27e1b0cf785eea3654fd1d30ff0126f758b82f98c574ad31b96c5316187e"
];

// Initial values from the user provided image
const INITIAL_VALUES: Record<string, string> = {
  "0x9c44906cb29a4eff54931a261c19ea4fd949314b55f5c072b5ea87e6447b23cb": "292000000",
  "0x4f40add70587301bcb7f7894a24b0412c1be564e2683a61457e0b301fdd10fcf": "210000000",
  "0xd6eef1f2dd336e7d0f15b24727b52c4a6a0e315fb4c2851b37c005ba6fd0145b": "199657987",
  "0x15be36e417f5b8dcdaf6a5f4a730341c51e827ecff82bb4494126abd47a7ada0": "180000000",
  "0x47af2bb2365bd1c47857151601b900eaa5cfbbe8a581151a400936af24dc5c7a": "50000000",
  "0x961e27e1b0cf785eea3654fd1d30ff0126f758b82f98c574ad31b96c5316187e": "2467772"
};

interface BalanceState {
  current: string;
  previous: string;
  hasChanged: boolean;
  lastUpdated: Date;
}

export default function MonitorPage() {
  const [balances, setBalances] = useState<Record<string, BalanceState>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize state with initial values
  useEffect(() => {
    const initial: Record<string, BalanceState> = {};
    TARGET_ADDRESSES.forEach(addr => {
      const val = INITIAL_VALUES[addr] || "0";
      initial[addr] = {
        current: val,
        previous: val,
        hasChanged: false,
        lastUpdated: new Date()
      };
    });
    setBalances(initial);
  }, []);

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

      const newBalances: Record<string, string> = {};

      // Fetch in parallel
      await Promise.all(TARGET_ADDRESSES.map(async (address) => {
        try {
          const result = await client.getBalance({
            owner: address,
            coinType: AIA_TOKEN_TYPE
          });
          // Convert raw balance (decimals) to human readable
          const rawBalance = Number(result.totalBalance);
          const formattedBalance = rawBalance / Math.pow(10, DECIMALS);
          newBalances[address] = formattedBalance.toString();
        } catch (e) {
          console.error(`Failed to fetch for ${address}`, e);
          // Keep old value if fetch fails? Or mark error?
          // For now, we'll just ignore update for this one or set to "Error"
        }
      }));

      setBalances(prev => {
        const next = { ...prev };
        let changed = false;

        TARGET_ADDRESSES.forEach(addr => {
          const newVal = newBalances[addr];
          if (newVal && newVal !== prev[addr].current) {
            next[addr] = {
              previous: prev[addr].current,
              current: newVal,
              hasChanged: true,
              lastUpdated: new Date()
            };
            changed = true;
          }
        });

        return changed ? next : prev;
      });

      setLastCheck(new Date());

    } catch (err) {
      console.error("Global fetch error", err);
      setError("Failed to fetch balances. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const formatBalance = (raw: string | bigint) => {
    const val = Number(raw);
    return val.toLocaleString(undefined, { maximumFractionDigits: DECIMALS });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">AIA Token Monitor</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Monitoring real-time balance changes for target addresses
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastCheck && (
              <span className="text-sm text-slate-500">
                Last updated: {lastCheck.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={fetchBalances}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Live Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[400px]">Address</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Previous Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Last Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TARGET_ADDRESSES.map((addr) => {
                    const state = balances[addr];
                    if (!state) return null;

                    const isChanged = state.hasChanged;
                    const diff = Number(state.current) - Number(state.previous);

                    return (
                      <TableRow key={addr} className={cn(isChanged && "bg-blue-50/50 dark:bg-blue-900/10")}>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {addr}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium">
                            {formatBalance(state.current)}
                            {isChanged && diff !== 0 && (
                              <Badge variant={diff > 0 ? "default" : "destructive"} className="ml-2 text-xs">
                                {diff > 0 ? "+" : ""}{formatBalance(diff.toString())}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {formatBalance(state.previous)}
                        </TableCell>
                        <TableCell>
                          {isChanged ? (
                            <Badge variant="outline" className="border-blue-500 text-blue-500">
                              Changed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-slate-500">
                              Stable
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-400">
                          {state.lastUpdated.toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
