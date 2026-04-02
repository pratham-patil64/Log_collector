import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { fetchLogs, searchNormal, searchGin, fetchFilterOptions, fetchFilteredLogs } from "../api/logs";
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

export default function LogTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "scroll">("table");
  const [query, setQuery] = useState("");
  const [searchTime, setSearchTime] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [filterApp, setFilterApp] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState({ apps: [], services: [], });
  const observerTarget = useRef(null);
  const pageRef = useRef(1);
  const isFetching = useRef(false);

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }
    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFilterOptions()
      .then((data) => setDropdownOptions(data))
      .catch(console.error);
  }, []);

  

  const loadLogs = useCallback(async (page: number, append: boolean = false) => {
    if (isFetching.current) return; // EXIT if already fetching

    try {
      isFetching.current = true; // LOCK
      setLoading(true);
      const data = await fetchLogs(page, ITEMS_PER_PAGE);

      setLogs((prev) => (append ? [...prev, ...(data.logs || [])] : (data.logs || [])));
      if (data.totalPages) setTotalPages(data.totalPages);
      pageRef.current = page;
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to fetch logs");
    } finally {
      setLoading(false);
      isFetching.current = false; 
    }
  }, []);

  // useCallback useMemo React.memo memoization

  // Effect for Table Pagination
  useEffect(() => {
    if (viewMode === "table") {
      loadLogs(currentPage, false);
    }
  }, [currentPage, viewMode, loadLogs]);

  useEffect(() => {
    if (viewMode !== "scroll") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isFetching.current && pageRef.current < totalPages) {
          const nextPage = pageRef.current + 1;
          loadLogs(nextPage, true);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [viewMode, totalPages, loadLogs]);


  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-4">
            Application Logs
          </CardTitle>


        </div>
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
            onClick={async () => {
              const data = await searchNormal(query, 1, ITEMS_PER_PAGE);
              setLogs(data.rows);
              setSearchTime(`Normal Search: ${data.time_ms} ms`);
              if (data.totalPages) setTotalPages(data.totalPages);
              setIsLive(false);
              setViewMode("table");
            }}
          >
            Normal Search
          </Button>

          <Button
            onClick={async () => {
              const data = await searchGin(query, 1, ITEMS_PER_PAGE);
              setLogs(data.rows);
              setSearchTime(`GIN Search: ${data.time_ms} ms`);
              if (data.totalPages) setTotalPages(data.totalPages);
              setIsLive(false);
              setViewMode("table");
            }}
          >
            GIN Search
          </Button>

          <Button
            onClick={() => {
              setFilterApp("");
              setFilterService("");
              setFilterLevel("");
              setCurrentPage(1);
              setIsLive(true);
              setSearchTime(null);
              setViewMode("table");
              loadLogs(1, false);
            }}
          >
            Reset
          </Button>

          {!isLive && (
            <Button
              variant="destructive"
              onClick={() => {
                setIsLive(true);
                setCurrentPage(1);
                setSearchTime(null);
                loadLogs(1, false);
              }}
            >
              Go Live
            </Button>
          )}
        </div>


        {searchTime && (
          <div className="text-sm text-muted-foreground">
            ⏱ {searchTime}
          </div>
        )}
        <LogFilters
          filterApp={filterApp}
          setFilterApp={setFilterApp}
          filterService={filterService}
          setFilterService={setFilterService}
          filterLevel={filterLevel}
          setFilterLevel={setFilterLevel}
          dropdownOptions={dropdownOptions}
          onApply={async () => {
            const data = await fetchFilteredLogs(
              filterApp,
              filterLevel,
              filterService,
              1,
              ITEMS_PER_PAGE
            );

            setLogs(data.logs || data);

            if (data.totalPages) setTotalPages(data.totalPages);

            setIsLive(false);
            setSearchTime(null);
            setViewMode("table");
          }}
        />

        <Separator />
        <div className="inline-flex items-center gap-2 bg-muted/30 p-2 rounded-md border w-fit">

          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (!value) return;

              const mode = value as "table" | "scroll";

              setViewMode(mode);
              setCurrentPage(1);
              setLogs([]);
              pageRef.current = 1;

              if (mode === "scroll") {
                loadLogs(1, false);
              }
            }}
          >
            <ToggleGroupItem value="table">
              <TableIcon className="h-4 w-4" />
            </ToggleGroupItem>

            <ToggleGroupItem value="scroll">
              <ArrowDown className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div
          ref={scrollContainerRef}
          id="log-scroll-container"
          className={cn(
            "relative border rounded-md transition-all w-full",
            viewMode === "scroll"
              ? "h-[600px] overflow-y-scroll overflow-x-hidden"
              : "h-auto overflow-visible"
          )}
        >
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
                    <Badge variant={log.level.toLowerCase() as any}>
                      {log.level.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">
                    {log.message}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(log.received_at).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* IMPORTANT: This must be INSIDE the scrollable container */}
          {viewMode === "scroll" && (
            <div ref={observerTarget} className="py-4 flex justify-center w-full">
              {loading ? (
                <span className="text-sm text-muted-foreground animate-pulse">Loading more logs...</span>
              ) : currentPage >= totalPages ? (
                <span className="text-sm text-muted-foreground">All relevant logs loaded.</span>
              ) : null}
            </div>
          )}
        </div>

        {viewMode === "table" && (
          <>
            <Separator />
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {getPaginationRange().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === "..." ? (
                      <span className="px-3 py-2">...</span>
                    ) : (
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page as number)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </>
        )}
      </CardContent>
    </Card>
  );
}