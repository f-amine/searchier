"use client";

import * as React from "react";
import { Loader2Icon, PackageIcon } from "lucide-react";

import type { ProductEdge } from "@/lib/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  storeId: string;
};

export function StoreProducts({ storeId }: Props) {
  const [edges, setEdges] = React.useState<ProductEdge[]>([]);
  const [search, setSearch] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
  const [hasNext, setHasNext] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handler = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(handler);
  }, [search]);

  React.useEffect(() => {
    setEdges([]);
    setCursor(undefined);
    setHasNext(false);
  }, [storeId, query]);

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ storeId, first: "10" });
      if (query) params.set("q", query);
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load products");
      }

      setEdges((prev) => [...prev, ...data.edges]);
      setHasNext(Boolean(data.pageInfo?.hasNextPage));
      setCursor(data.pageInfo?.endCursor ?? undefined);
    } catch (cause) {
      setError((cause as Error).message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [storeId, query, cursor]);

  React.useEffect(() => {
    setCursor(undefined);
    setEdges([]);
    setHasNext(false);
    void fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCursor(undefined);
            setEdges([]);
            setHasNext(false);
            void fetchProducts();
          }}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        {edges.map((edge) => (
          <div
            key={edge.cursor}
            className="flex items-center gap-3 rounded-md border p-3"
          >
            {edge.node.thumbnail?.path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={edge.node.thumbnail.path}
                alt={edge.node.name}
                className="size-10 rounded object-cover"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded bg-muted">
                <PackageIcon className="size-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{edge.node.name}</p>
              <p className="text-xs text-muted-foreground">{edge.node.id}</p>
            </div>
          </div>
        ))}
        {edges.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">No products found.</p>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" /> Loading products…
          </div>
        )}
      </div>
      {hasNext && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchProducts()}
          disabled={loading}
        >
          {loading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            "Load more"
          )}
        </Button>
      )}
    </div>
  );
}
