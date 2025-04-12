import React from "react";
import ContentCard from "./content-card";

export default function ContentRow({
  title,
  items,
  type = "movie",
  onItemClick,
}) {
  return (
    <div className="content-row mb-8">
      <h2 className="text-3xl font-bold mb-6 text-white">{title}</h2>
      <div className="flex  overflow-x-auto pb-6 scrollbar-hide flex-wrap gap-8 ">
        {items?.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            type={type}
            onClick={() => onItemClick(item)}
            className="flex-shrink-0 w-56 hover:scale-105 transition-transform duration-300"
          />
        ))}
      </div>
    </div>
  );
}
