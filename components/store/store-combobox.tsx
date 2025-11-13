"use client";

import * as React from "react";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type {
  LightfunnelsStoreConnection,
  LightfunnelsStoreNode,
} from "@/lib/types/store";

type StoreComboboxProps = {
  value?: LightfunnelsStoreNode | null;
  onChange?: (store: LightfunnelsStoreNode | null) => void;
};

type LoadOptions = {
  cursor?: string | null;
  reset?: boolean;
};

export function StoreCombobox({ value, onChange }: StoreComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<LightfunnelsStoreNode | null>(
    value ?? null,
  );
  const [stores, setStores] = React.useState<LightfunnelsStoreNode[]>([]);
  const [searchInput, setSearchInput] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    setSelected(value ?? null);
  }, [value]);

  React.useEffect(() => {
    const handler = setTimeout(() => setQuery(searchInput.trim()), 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const loadStores = React.useCallback(
    async ({ cursor, reset }: LoadOptions = {}) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (cursor) params.set("cursor", cursor);

        const qs = params.toString();
        const response = await fetch(`/api/stores${qs ? `?${qs}` : ""}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load stores");
        }

        const data = (await response.json()) as LightfunnelsStoreConnection;
        const currentStores = data.edges.map((edge) => edge.node);

        setStores((prev) => {
          if (reset) {
            return currentStores;
          }
          const seen = new Map(prev.map((store) => [store.id, store]));
          currentStores.forEach((store) => {
            seen.set(store.id, store);
          });
          return Array.from(seen.values());
        });

        setNextCursor(data.pageInfo.endCursor ?? null);
        setHasNextPage(data.pageInfo.hasNextPage);
      } catch (cause) {
        if ((cause as Error).name === "AbortError") return;
        setError((cause as Error).message ?? "Unable to load stores");
      } finally {
        setIsLoading(false);
      }
    },
    [query],
  );

  React.useEffect(() => {
    void loadStores({ reset: true });
  }, [loadStores]);

  const handleSelect = (store: LightfunnelsStoreNode) => {
    setSelected(store);
    onChange?.(store);
    setOpen(false);
  };

  const handleLoadMore = () => {
    if (hasNextPage && nextCursor) {
      void loadStores({ cursor: nextCursor });
    }
  };

  const buttonLabel = selected
    ? selected.name
    : isLoading
      ? "Loading stores..."
      : "Select a store";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{buttonLabel}</span>
          <div className="flex items-center gap-1">
            {isLoading && <Loader2Icon className="size-4 animate-spin" />}
            <ChevronsUpDownIcon className="size-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0">
        <Command>
          <CommandInput
            placeholder="Search stores..."
            value={searchInput}
            onValueChange={setSearchInput}
          />
          <CommandList>
            {error ? (
              <div className="py-6 text-center text-sm text-destructive">
                {error}
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {isLoading ? "Loading stores..." : "No stores found."}
                </CommandEmpty>
                <CommandGroup heading="Stores">
                  {stores.map((store) => (
                    <CommandItem
                      key={store.id}
                      value={store.id}
                      onSelect={() => handleSelect(store)}
                      className="flex flex-col items-start gap-1"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-medium">{store.name}</span>
                        <CheckIcon
                          className={cn(
                            "size-4",
                            selected?.id === store.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {store.primary_domain?.name ??
                          store.defaultDomain ??
                          "No domain"}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {hasNextPage && (
                  <div className="border-t px-2 py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2Icon className="mr-2 size-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load more"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
