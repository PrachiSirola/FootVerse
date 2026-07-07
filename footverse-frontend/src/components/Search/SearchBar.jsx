"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import useDebounce from "@/hooks/useDebounce";
import { searchProducts } from "@/lib/search";
import SearchDropdown from "./SearchDropdown";

export default function SearchBar() {

  const [query, setQuery] = useState("");

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query);

  useEffect(() => {

    async function load() {

      if (!debouncedQuery) {

        setProducts([]);

        return;

      }

      try {

        setLoading(true);

        const data = await searchProducts(debouncedQuery);

        setProducts(data);

      }

      catch (err) {

        console.error(err);

      }

      finally {

        setLoading(false);

      }

    }

    load();

  }, [debouncedQuery]);

  return (

    <div className="relative w-full max-w-xl">

      <div
        className="
        flex
        items-center
        rounded-2xl
        bg-white/80
        backdrop-blur-xl
        shadow-xl
        border
        px-4
        py-3
      "
      >

        <Search size={20} className="text-gray-500"/>

        <input

          value={query}

          onChange={(e)=>setQuery(e.target.value)}

          placeholder="Search furniture..."

          className="
          flex-1
          bg-transparent
          px-3
          outline-none
          text-gray-800
        "
        />

      </div>

      {(loading || products.length > 0) && (

        <SearchDropdown

          products={products}

          loading={loading}

        />

      )}

    </div>

  );

}