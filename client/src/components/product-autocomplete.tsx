import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@shared/schema";

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string, product?: Product) => void;
  placeholder?: string;
  disabled?: boolean;
  searchByDescription?: boolean;
}

export default function ProductAutocomplete({
  value,
  onChange,
  placeholder = "Digite o código do produto",
  disabled = false,
  searchByDescription = false,
}: ProductAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [displayValue, setDisplayValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter products based on search mode and term
  const filteredProducts = allProducts?.filter(product => {
    if (!searchTerm || searchTerm.length < 2) return false;
    
    if (searchByDescription) {
      return product.description.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return product.code.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  useEffect(() => {
    if (searchByDescription) {
      setDisplayValue(value);
    } else {
      setSearchTerm(value);
      setDisplayValue(value);
    }
  }, [value, searchByDescription]);

  const handleSelect = (product: Product) => {
    if (searchByDescription) {
      setDisplayValue(product.description);
      setSearchTerm(product.description);
      onChange(product.code, product);
    } else {
      setSearchTerm(product.code);
      setDisplayValue(product.code);
      onChange(product.code, product);
    }
    setOpen(false);
  };

  const handleInputChange = (inputValue: string) => {
    setDisplayValue(inputValue);
    setSearchTerm(inputValue);
    
    if (searchByDescription) {
      // In description mode, we pass empty string as code until selection
      onChange("", undefined);
    } else {
      onChange(inputValue);
    }
    
    // Only open dropdown if search term is 2+ characters
    if (inputValue && inputValue.length >= 2) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-8"
          />
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>
              {searchTerm.length < 2 
                ? "Digite pelo menos 2 caracteres para pesquisar"
                : "Nenhum produto encontrado"}
            </CommandEmpty>
            {filteredProducts && filteredProducts.length > 0 && (
              <CommandGroup>
                {filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => handleSelect(product)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        (searchByDescription 
                          ? displayValue === product.description 
                          : value === product.code) 
                          ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      {searchByDescription ? (
                        <>
                          <span className="font-medium">{product.description}</span>
                          <span className="text-sm text-muted-foreground">
                            Código: {product.code}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{product.code}</span>
                          <span className="text-sm text-muted-foreground">
                            {product.description}
                          </span>
                        </>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
