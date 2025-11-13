"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { StoreCombobox } from "@/components/store/store-combobox";
import type { LightfunnelsStoreNode } from "@/lib/types/store";
import type { StoreConfigRecord } from "@/lib/services/store-config";
import { Loader2Icon, PlugIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  initialConfigs: StoreConfigRecord[];
};

type ApiResponse = StoreConfigRecord & {
  error?: string;
};

const toStorePayload = (
  store: LightfunnelsStoreNode,
) => ({
  store,
});

export function StoreManager({ initialConfigs }: Props) {
  const [configs, setConfigs] = React.useState(initialConfigs);
  const [selectedStore, setSelectedStore] =
    React.useState<LightfunnelsStoreNode | null>(null);
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const currentConfig = selectedStore
    ? configs.find((config) => config.storeId === selectedStore.id)
    : null;
  const isInstalled = currentConfig?.installed ?? false;

  const updateConfig = (next: StoreConfigRecord) => {
    setConfigs((prev) => {
      const existingIndex = prev.findIndex(
        (cfg) =>
          cfg.userId === next.userId && cfg.storeId === next.storeId,
      );
      if (existingIndex === -1) {
        return [next, ...prev];
      }
      const clone = [...prev];
      clone[existingIndex] = next;
      return clone;
    });
  };

  const handleInstall = async () => {
    if (!selectedStore) return;
    setIsInstalling(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/store-config", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(toStorePayload(selectedStore)),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error("Failed to install Searchier");
      }
      updateConfig(data);
      setMessage(`Searchier installed on ${selectedStore.name}.`);
    } catch (cause) {
      setError((cause as Error).message ?? "Unexpected error");
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUninstall = async () => {
    if (!selectedStore) return;
    setIsInstalling(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/store-config", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(toStorePayload(selectedStore)),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error("Failed to remove Searchier");
      }
      updateConfig(data);
      setMessage(`Searchier removed from ${selectedStore.name}.`);
    } catch (cause) {
      setError((cause as Error).message ?? "Unexpected error");
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="space-y-4">
      <StoreCombobox
        value={selectedStore}
        onChange={(store) => {
          setSelectedStore(store);
          setMessage(null);
          setError(null);
        }}
      />
      {selectedStore ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="font-medium">{selectedStore.name}</span>
            <span className="text-muted-foreground">
              {selectedStore.primary_domain?.name ??
                selectedStore.defaultDomain ??
                "No domain"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={isInstalling || isInstalled}
              onClick={handleInstall}
            >
              {isInstalling && !isInstalled ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              ) : (
                <PlugIcon className="mr-2 size-4" />
              )}
              Install Searchier
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isInstalling || !isInstalled}
              onClick={handleUninstall}
            >
              {isInstalling && isInstalled ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              ) : (
                <XIcon className="mr-2 size-4" />
              )}
              Remove Script
            </Button>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                isInstalled
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200",
              )}
            >
              {isInstalled ? "Installed" : "Not installed"}
            </span>
          </div>
          {message && (
            <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-300">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a store to configure the Searchier script.
        </p>
      )}
    </div>
  );
}
