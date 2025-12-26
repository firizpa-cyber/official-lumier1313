import { ReactNode, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContentRowProps {
  title: string;
  children: ReactNode;
  className?: string;
  showAllLink?: string;
}

export function ContentRow({ title, children, className, showAllLink }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollStartRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    isScrollingRef.current = true;
    scrollStartRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    setIsScrolling(true);
  };

  const handleMouseLeave = () => {
    isScrollingRef.current = false;
    setIsScrolling(false);
  };

  const handleMouseUp = () => {
    isScrollingRef.current = false;
    setIsScrolling(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isScrollingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - scrollStartRef.current) * 2;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    isScrollingRef.current = true;
    scrollStartRef.current = e.touches[0].pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isScrollingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - scrollStartRef.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleTouchEnd = () => {
    isScrollingRef.current = false;
  };

  return (
    <section className={cn("py-6", className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
          
          <div className="flex items-center gap-2">
            {showAllLink && (
              <a 
                href={showAllLink}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors mr-4"
              >
                Смотреть все
              </a>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full bg-muted/50 hover:bg-muted"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full bg-muted/50 hover:bg-muted"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={scrollRef}
          className={cn(
            "content-row -mx-4 px-4",
            isScrolling ? "cursor-grabbing" : "cursor-grab"
          )}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
