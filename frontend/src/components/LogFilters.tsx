import { Button } from "@/components/ui/button";
import {Popover, PopoverTrigger, PopoverContent} from "@/components/ui/popover";
import {Command, CommandInput, CommandList, CommandItem} from "@/components/ui/command";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  filterApp: string;
  setFilterApp: (value: string) => void;

  filterService: string;
  setFilterService: (value: string) => void;

  filterLevel: string;
  setFilterLevel: (value: string) => void;

  dropdownOptions: {
    apps: string[];
    services: string[];
  };

  onApply: () => void;
}

export default function LogFilters({
  filterApp,
  setFilterApp,
  filterService,
  setFilterService,
  filterLevel,
  setFilterLevel,
  dropdownOptions,
  onApply,
}: Props) {
  return (
    <Card>
      <CardContent className="pt-4 flex flex-wrap gap-2">
       <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-start">
          {filterService || "Select Service"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search service..." />

            <CommandList>
              {dropdownOptions.services.map((svc) => (
              <CommandItem
                key={svc}
                onSelect={() => setFilterService(svc)}
                className="data-[selected=true]:bg-[#e05d38] data-[selected=true]:text-white">
              {svc}
              </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-start">
            {filterApp || "Select App"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search app..." />

            <CommandList>
                {dropdownOptions.apps.map((app) => (
              <CommandItem
              key={app}
              onSelect={() => setFilterApp(app)}
              className="data-[selected=true]:bg-[#e05d38] data-[selected=true]:text-white">
              {app}
              </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

        <Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-[200px] justify-start">
      {filterLevel ? filterLevel.toUpperCase() : "Select Level"}
    </Button>
  </PopoverTrigger>

  <PopoverContent className="w-[200px] p-0">
    <Command>
      <CommandInput placeholder="Search level..." />

      <CommandList>
        {["info", "warn", "error", "debug"].map((level) => (
          <CommandItem
            key={level}
            onSelect={() => setFilterLevel(level)}
            className="data-[selected=true]:bg-[#e05d38] data-[selected=true]:text-white"
          >
            {level.toUpperCase()}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
        <Button onClick={onApply}>
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}