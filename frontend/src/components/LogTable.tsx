import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { fetchLogs, searchGin, fetchFilterOptions, fetchFilteredLogs } from "../api/logs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import LogFilters from "../components/LogFilters";
import { Table as TableIcon, ArrowDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";

const ITEMS_PER_PAGE = 10;

type ViewSource = "all" | "search_gin" | "filter";

export default function LogTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "scroll">("table");

  const [viewSource, setViewSource] = useState<ViewSource>("all");

  const [query, setQuery] = useState("");
  const [searchTime, setSearchTime] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);

  const [filterApp, setFilterApp] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState({ apps: [], services: [] });

  const observerTarget = useRef(null);
  const pageRef = useRef(1);
  const isFetching = useRef(false);

  useEffect(() => {
    fetchFilterOptions()
      .then((data) => setDropdownOptions(data))
      .catch(console.error);
  }, []);

  const loadData = useCallback(async (page: number, append: boolean = false, sourceOverride?: ViewSource) => {
    if (isFetching.current) return;

    const source = sourceOverride || viewSource;

    try {
      isFetching.current = true;
      setLoading(true);

      let data;

      switch (source) {
        case "search_gin":
          data = await searchGin(query, page, ITEMS_PER_PAGE);
          setSearchTime(`GIN Search: ${data.time_ms} ms`);
          break;
        case "filter":
          data = await fetchFilteredLogs(filterApp, filterLevel, filterService, page, ITEMS_PER_PAGE);
          setSearchTime(null);
          break;
        default:
          data = await fetchLogs(page, ITEMS_PER_PAGE);
          setSearchTime(null);
          break;
      }

      const newLogs = data.logs || data.rows || [];
      setLogs((prev) => (append ? [...prev, ...newLogs] : newLogs));

      if (data.totalPages) setTotalPages(data.totalPages);
      pageRef.current = page;
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [viewSource, query, filterApp, filterLevel, filterService]);

  useEffect(() => {
    if (viewMode === "table") {
      loadData(currentPage, false);
    }
  }, [currentPage, viewMode, loadData]);

  useEffect(() => {
    if (viewMode !== "scroll") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isFetching.current && pageRef.current < totalPages) {
          loadData(pageRef.current + 1, true);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [viewMode, totalPages, loadData]);

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }
    for (let i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l > 2) rangeWithDots.push("...");
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Application Logs</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Search log messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[300px]"
          />

          <Button
            onClick={() => {
              setLogs([]);
              setViewSource("search_gin");
              setCurrentPage(1);
              setIsLive(false);
            }}
          >
            GIN Search
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setFilterApp("");
              setFilterService("");
              setFilterLevel("");
              setQuery("");
              setLogs([]);
              setViewSource("all");
              setCurrentPage(1);
              setIsLive(true);
            }}
          >
            Reset
          </Button>
        </div>

        {searchTime && <div className="text-sm text-muted-foreground">⏱ {searchTime}</div>}

        <LogFilters
          filterApp={filterApp}
          setFilterApp={setFilterApp}
          filterService={filterService}
          setFilterService={setFilterService}
          filterLevel={filterLevel}
          setFilterLevel={setFilterLevel}
          dropdownOptions={dropdownOptions}
          onApply={() => {
            setLogs([]);
            setViewSource("filter");
            setCurrentPage(1);
            setIsLive(false);
          }}
        />

        <Separator />

        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => {
            if (!value) return;
            setViewMode(value as "table" | "scroll");
            setCurrentPage(1);
            setLogs([]);
          }}
        >
          <ToggleGroupItem value="table"><TableIcon className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="scroll"><ArrowDown className="h-4 w-4" /></ToggleGroupItem>
        </ToggleGroup>

        <div className={cn("relative border rounded-md w-full", viewMode === "scroll" ? "h-[600px] overflow-y-scroll" : "h-auto")}>
          <Table className="w-full">
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead>App</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="w-full">Message</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => (
                <TableRow key={`${log.id}-${index}`}>
                  <TableCell className="font-medium">{log.app_name}</TableCell>
                  <TableCell>{log.service}</TableCell>
                  <TableCell>
                    <Badge variant={log.level.toLowerCase() as any}>{log.level.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">{log.message}</TableCell>
                  <TableCell className="text-right">{new Date(log.received_at).toLocaleTimeString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {viewMode === "scroll" && (
            <div ref={observerTarget} className="py-4 flex justify-center w-full">
              {loading ? <span className="animate-pulse">Loading more...</span> : currentPage >= totalPages ? <span>No more logs.</span> : null}
            </div>
          )}
        </div>

        {viewMode === "table" && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {getPaginationRange().map((page, i) => (
                <PaginationItem key={i}>
                  {page === "..." ? <span className="px-3">...</span> : (
                    <PaginationLink isActive={currentPage === page} onClick={() => setCurrentPage(page as number)} className="cursor-pointer">
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}