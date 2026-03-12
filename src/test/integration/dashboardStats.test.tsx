import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn() },
}));

vi.mock("@/contexts/CompanyContext", () => ({
  useCompany: () => ({
    currentCompany: { id: "company-test-uuid", name: "Test Co", code: "TEST" },
  }),
}));

import { useDashboardStats, useManufacturerManifests, useStockMovements } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

function buildChain(data: unknown[], error: unknown = null) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data, error }),
  };
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data, error }).then(resolve);
  return chain;
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useDashboardStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns stats successfully with empty data", async () => {
    mockFrom.mockReturnValue(buildChain([]));
    const { result } = renderHook(() => useDashboardStats(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalOrders).toBe(0);
    expect(result.current.data?.exceptions).toBe(0);
  });

  it("surfaces Supabase errors", async () => {
    mockFrom.mockReturnValue(buildChain([], { message: "Permission denied" }));
    const { result } = renderHook(() => useDashboardStats(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useManufacturerManifests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns manifests with items", async () => {
    mockFrom.mockReturnValue(
      buildChain([{ id: "mnf-1", status: "pending", manufacturer_manifest_items: [] }])
    );
    const { result } = renderHook(() => useManufacturerManifests(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].id).toBe("mnf-1");
  });
});

describe("useStockMovements", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns stock movements", async () => {
    mockFrom.mockReturnValue(
      buildChain([{ id: "mv-1", direction: "in", quantity: 10, movement_type: "purchase" }])
    );
    const { result } = renderHook(() => useStockMovements(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].direction).toBe("in");
  });
});
