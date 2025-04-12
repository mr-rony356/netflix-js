import { useState, useEffect, useRef, useCallback } from "react";
import ContentCard from "./content-card";
import { Loader2 } from "lucide-react";

export default function InfiniteGrid({
  fetchItems,
  onItemClick,
  initialItems = [],
  filters,
}) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const observer = useRef(null);
  const loadingRef = useCallback(
    (node) => {
      if (loading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Load initial items
  useEffect(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [initialItems, filters]);

  // Fetch more items when page changes
  useEffect(() => {
    if (page === 1 && initialItems.length > 0) return;

    const loadMoreItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const newItems = await fetchItems(page);

        if (newItems.length === 0) {
          setHasMore(false);
        } else {
          // Filter out duplicates
          const itemIds = new Set(items.map((item) => item.id));
          const uniqueNewItems = newItems.filter(
            (item) => !itemIds.has(item.id)
          );

          setItems((prevItems) => [...prevItems, ...uniqueNewItems]);
        }
      } catch (err) {
        setError("Failed to load content. Please try again.");
        console.error("Error fetching items:", err);
      } finally {
        setLoading(false);
      }
    };

    if (hasMore) {
      loadMoreItems();
    }
  }, [page, filters, fetchItems, hasMore]);

  // Empty state handling
  if (items.length === 0 && !loading && !error) {
    return (
      <div className="flex justify-center items-center min-h-[300px] text-gray-400">
        <p>No content found matching your criteria</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Content grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {items.map((item) => (
          <ContentCard
            key={`${item.id}-${item.media_type || "unknown"}`}
            item={item}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error message */}
      {error && <div className="text-red-500 text-center my-4">{error}</div>}

      {/* Infinite scroll trigger element */}
      {hasMore && !loading && (
        <div ref={loadingRef} className="h-10 mt-4"></div>
      )}

      {/* End of content message */}
      {!hasMore && items.length > 0 && (
        <div className="text-gray-500 text-center my-8 text-sm">
          You've reached the end of the list
        </div>
      )}
    </div>
  );
}
