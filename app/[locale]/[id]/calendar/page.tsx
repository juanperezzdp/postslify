"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ScheduledPost } from "@/types/posts";
import { PREDEFINED_TIMEZONES } from "@/lib/timezone";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronLeft, 
  faChevronRight, 
  faCheck, 
  faTimes, 
  faFile, 
  faDownload, 
  faTrash,
  faClock,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { useLocale, useTranslations } from "next-intl";

export default function CalendarioPage() {
  const t = useTranslations("Calendar");
  const locale = useLocale();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState<{ url: string; name: string }[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const inferMimeType = (kind?: string, fileName?: string) => {
    if (kind && kind.includes("/")) return kind;
    const name = (fileName || "").toLowerCase();
    const ext = name.includes(".") ? name.split(".").pop() || "" : "";

    if (kind === "image") {
      if (ext === "png") return "image/png";
      if (ext === "webp") return "image/webp";
      if (ext === "gif") return "image/gif";
      if (ext === "svg") return "image/svg+xml";
      return "image/jpeg";
    }

    if (kind === "video") {
      if (ext === "webm") return "video/webm";
      if (ext === "mov") return "video/quicktime";
      return "video/mp4";
    }

    if (kind === "document") {
      if (ext === "pdf") return "application/pdf";
      if (ext === "txt") return "text/plain";
      if (ext === "doc") return "application/msword";
      if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      return "application/octet-stream";
    }

    return "application/octet-stream";
  };

  const resolveTargetName = (post: ScheduledPost) => {
    if (post.linkedin_target_name && post.linkedin_target_name.trim().length > 0) {
      return post.linkedin_target_name;
    }
    return post.linkedin_target === "page"
      ? t("targetFallbackPage")
      : t("targetFallbackProfile");
  };

  const resolveTargetImage = (post: ScheduledPost) => {
    const targetImage = post.linkedin_target_image?.trim();
    return targetImage && targetImage.length > 0 ? targetImage : null;
  };

  const normalizeScheduledContent = (content: string) =>
    content.replace(/[\u200B\u200C\u2060\u2063]/g, "").trim();

  const getPostGroupKey = (post: ScheduledPost) => {
    const normalized = normalizeScheduledContent(post.content);
    const timeKey = Math.floor(new Date(post.scheduled_at).getTime() / 60000);
    return `${normalized}|${timeKey}`;
  };

  const groupPostsByKey = (pool: ScheduledPost[]) => {
    const groups = new Map<string, { post: ScheduledPost; posts: ScheduledPost[] }>();
    pool.forEach((post) => {
      const key = getPostGroupKey(post);
      const existing = groups.get(key);
      if (existing) {
        existing.posts.push(post);
      } else {
        groups.set(key, { post, posts: [post] });
      }
    });
    return Array.from(groups.values());
  };

  const getTargetsForPost = (post: ScheduledPost, pool: ScheduledPost[]) => {
    const key = getPostGroupKey(post);
    const matches = pool.filter((candidate) => getPostGroupKey(candidate) === key);
    const unique = new Map<string, { name: string; image: string | null; initial: string }>();
    matches.forEach((match) => {
      const name = resolveTargetName(match);
      const image = resolveTargetImage(match);
      const id = `${name}|${image ?? ""}`;
      if (!unique.has(id)) {
        unique.set(id, {
          name,
          image,
          initial: name.charAt(0).toUpperCase(),
        });
      }
    });
    return Array.from(unique.values());
  };

  const openImageCarousel = (items: { url: string; name: string }[], startIndex: number) => {
    if (items.length === 0) return;
    setCarouselItems(items);
    setCarouselIndex(Math.min(Math.max(0, startIndex), items.length - 1));
    setIsImageCarouselOpen(true);
  };

  const closeImageCarousel = useCallback(() => {
    setIsImageCarouselOpen(false);
    setCarouselItems([]);
    setCarouselIndex(0);
  }, []);

  const showPrevCarouselImage = useCallback(() => {
    setCarouselIndex((current) => {
      if (carouselItems.length === 0) return 0;
      return (current - 1 + carouselItems.length) % carouselItems.length;
    });
  }, [carouselItems.length]);

  const showNextCarouselImage = useCallback(() => {
    setCarouselIndex((current) => {
      if (carouselItems.length === 0) return 0;
      return (current + 1) % carouselItems.length;
    });
  }, [carouselItems.length]);

  useEffect(() => {
    if (!isImageCarouselOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeImageCarousel();
      if (event.key === "ArrowLeft") showPrevCarouselImage();
      if (event.key === "ArrowRight") showNextCarouselImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeImageCarousel, isImageCarouselOpen, showNextCarouselImage, showPrevCarouselImage]);

  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [dayPosts, setDayPosts] = useState<ScheduledPost[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTimezone, setEditTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts/scheduled");
      const data = await response.json();
      if (response.ok) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDay }, (_, i) => i);
  const selectedTargets = selectedPost
    ? getTargetsForPost(selectedPost, dayPosts.length > 0 ? dayPosts : posts)
    : [];
  const selectedTargetNames = selectedTargets.map((target) => target.name).join(" / ");
  const groupedDayPosts = groupPostsByKey(dayPosts);

  const getPostsForDay = (day: number) => {
    return posts.filter((post) => {
      const postDate = new Date(post.scheduled_at);
      return (
        postDate.getDate() === day &&
        postDate.getMonth() === currentDate.getMonth() &&
        postDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const monthNames = [
    t("months.january"),
    t("months.february"),
    t("months.march"),
    t("months.april"),
    t("months.may"),
    t("months.june"),
    t("months.july"),
    t("months.august"),
    t("months.september"),
    t("months.october"),
    t("months.november"),
    t("months.december"),
  ];

  const localeTag = locale === "es" ? "es-ES" : "en-US";

  const handlePostClick = (post: ScheduledPost) => {
    setSelectedPost(post);
    
    const clickedDate = new Date(post.scheduled_at);
    const sameDayPosts = posts.filter(p => {
      const pDate = new Date(p.scheduled_at);
      return (
        pDate.getDate() === clickedDate.getDate() &&
        pDate.getMonth() === clickedDate.getMonth() &&
        pDate.getFullYear() === clickedDate.getFullYear()
      );
    });
    setDayPosts(sameDayPosts);

    updateEditForm(post);
    setIsContentExpanded(false);
    setIsEditingSchedule(false);
    setIsEditModalOpen(true);
  };

  const handleDayClick = (postsForDay: ScheduledPost[]) => {
    if (postsForDay.length === 0) return;
    
    const firstPost = postsForDay[0];
    setSelectedPost(firstPost);
    setDayPosts(postsForDay);
    updateEditForm(firstPost);
    setIsContentExpanded(false);
    setIsEditingSchedule(false);
    setIsEditModalOpen(true);
  };

  const updateEditForm = (post: ScheduledPost) => {
    const targetTimezone = post.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    setEditTimezone(targetTimezone);

    try {
      const date = new Date(post.scheduled_at);
      
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: targetTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const parts = formatter.format(date);
      setEditDate(parts.replace(' ', 'T').substring(0, 16));
    } catch (e) {
      console.error("Error converting date:", e);
      const date = new Date(post.scheduled_at);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const localString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      setEditDate(localString);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPost || !editDate) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/posts/scheduled/${selectedPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: editDate,
          timezone: editTimezone
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("errors.update"));
      }

      await fetchPosts();
      setIsEditModalOpen(false);
      setSelectedPost(null);
    } catch (error) {
      console.error("Update error:", error);
      alert(t("errors.updateAlert"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/scheduled/${selectedPost.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(t("errors.delete"));
      }

      await fetchPosts();
      setIsDeleteConfirmOpen(false);
      setIsEditModalOpen(false);
      setSelectedPost(null);
    } catch (error) {
      console.error("Delete error:", error);
      alert(t("errors.deleteAlert"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            {t("title")}
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            {t("subtitle")}
          </p>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/50 ring-1 ring-slate-200">
          {/* Calendar Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white p-8">
            <h2 className="text-3xl font-bold text-slate-900 capitalize tracking-tight">
              {monthNames[currentDate.getMonth()]} <span className="text-slate-300 font-medium">{currentDate.getFullYear()}</span>
            </h2>
            <div className="flex gap-2 rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-100">
              <button onClick={prevMonth} className="rounded-xl p-3 text-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-md hover:shadow-slate-200/50 transition-all active:scale-95">
                <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
              </button>
              <button onClick={nextMonth} className="rounded-xl p-3 text-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-md hover:shadow-slate-200/50 transition-all active:scale-95">
                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
            {[
              t("days.mon"),
              t("days.tue"),
              t("days.wed"),
              t("days.thu"),
              t("days.fri"),
              t("days.sat"),
              t("days.sun"),
            ].map((day) => (
              <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Body */}
          <div className="grid grid-cols-7 auto-rows-fr bg-slate-100 gap-px border-b border-slate-100">
            {padding.map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[160px] bg-white/50 p-2" />
            ))}
            
            {days.map((day) => {
              const dayPosts = getPostsForDay(day);
              const groupedPosts = groupPostsByKey(dayPosts);
              const displayPosts = groupedPosts.slice(0, 3);
              const remainingPosts = groupedPosts.length - 3;
              const isToday = 
                day === new Date().getDate() && 
                currentDate.getMonth() === new Date().getMonth() && 
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(dayPosts)}
                  className={`group relative min-h-[160px] bg-white p-3 transition-all hover:bg-blue-50/30 ${dayPosts.length > 0 ? "cursor-pointer" : ""}`}
                >
                  <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    isToday 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-700"
                  }`}>
                    {day}
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    {displayPosts.map((group) => {
                      const targetList = getTargetsForPost(group.post, group.posts);
                      const targetNames = targetList.map((target) => target.name).join(" / ");
                      return (
                      <div 
                        key={group.post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostClick(group.post);
                        }}
                        className="group/card relative flex cursor-pointer items-center gap-2 rounded-lg bg-white px-2.5 py-2 shadow-sm ring-1 ring-slate-100 transition-all hover:ring-blue-400 hover:shadow-md hover:shadow-blue-100/50 hover:-translate-y-0.5"
                        title={group.post.content}
                      >
                        <div className="flex -space-x-1">
                          {targetList.map((target) => (
                            <div
                              key={`${target.name}-${target.image ?? "fallback"}`}
                              className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-blue-50 text-[10px] font-semibold text-blue-900 shadow-sm ring-1 ring-blue-100"
                            >
                              {target.image ? (
                                <Image
                                  src={target.image}
                                  alt={target.name}
                                  width={20}
                                  height={20}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                <span>{target.initial}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[10px] font-semibold text-slate-500">
                            {targetNames}
                          </span>
                          <span className="truncate text-xs font-semibold text-slate-600 group-hover/card:text-slate-900">
                            {group.post.content}
                          </span>
                        </div>
                        
                        {group.post.status === 'published' && (
                          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 shadow-sm ring-2 ring-white">
                            <FontAwesomeIcon icon={faCheck} className="h-2 w-2 text-white" />
                          </div>
                        )}
                        {group.post.status === 'failed' && (
                          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 shadow-sm ring-2 ring-white">
                            <FontAwesomeIcon icon={faTimes} className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      );
                    })}
                    {remainingPosts > 0 && (
                       <div className="mt-1 text-center text-[10px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                         {t("morePosts", { count: remainingPosts })}
                       </div>
                     )}
                  </div>
                </div>
              );
            })}
            
            {/* Fill remaining cells to complete the grid if needed */}
            {Array.from({ length: 42 - (days.length + padding.length) }).map((_, i) => (
              <div
                key={`end-pad-${i}`}
                className="min-h-[160px] bg-white/50"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Edit/Delete Modal */}
      {isEditModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md transition-all animate-in fade-in duration-200">
          <div className="w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-900/5 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6 backdrop-blur-sm">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t("modals.dayPosts.title")}</h3>
                <p className="text-sm font-medium text-slate-500">
                  {new Intl.DateTimeFormat(localeTag, { dateStyle: "full" }).format(new Date(selectedPost.scheduled_at))}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-100 hover:text-slate-900 hover:shadow-md"
              >
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
              {/* Sidebar List */}
              <div className="min-h-0 w-full overflow-y-auto border-r border-slate-100 bg-white p-6 md:w-1/3">
                <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-600">
                    {groupedDayPosts.length}
                  </span>
                  {t("modals.dayPosts.posts")}
                </h4>
                <div className="space-y-6">
                  {groupedDayPosts.map((group) => {
                    const targetList = getTargetsForPost(group.post, group.posts);
                    const targetNames = targetList.map((target) => target.name).join(" / ");
                    return (
                    <div 
                      key={group.post.id}
                      onClick={() => {
                        setSelectedPost(group.post);
                        updateEditForm(group.post);
                        setIsEditingSchedule(false);
                      }}
                      className={`group cursor-pointer rounded-2xl border p-4 transition-all ${
                        selectedPost.id === group.post.id
                          ? "bg-white border-0 border-blue-400 shadow-lg shadow-blue-200 ring-1 ring-blue-200"
                          : "bg-white border-slate-200  hover:border-blue-300 shadow-lg"
                      }`}
                    >
                      <div
                        className={`mb-3 flex gap-3 border-b pb-3 ${
                          selectedPost.id === group.post.id ? "border-blue-200" : "border-slate-100 hover:border-blue-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {targetList.map((target) => (
                                <div
                                  key={`${target.name}-${target.image ?? "fallback"}`}
                                  className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-blue-100 text-base text-blue-900 ring-2 ring-white"
                                >
                                  {target.image ? (
                                    <Image
                                      src={target.image}
                                      alt={target.name}
                                      width={32}
                                      height={32}
                                      className="h-full w-full rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-sm font-semibold">{target.initial}</span>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-zinc-900">
                                {targetNames}
                              </span>
                            </div>
                          </div>
                        </div>

  {/* Right block */}
  <div className="ml-auto flex flex-col items-end justify-center gap-1">
    <span
      className={`w-fit rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
        group.post.status === "published"
          ? "bg-green-100 text-green-700"
          : group.post.status === "failed"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {group.post.status === "published"
        ? t("status.published")
        : group.post.status === "failed"
          ? t("status.failed")
          : t("status.pending")}
    </span>

  {/* Date Row */}
  <div className="text-right flex flex-col -gap-2">
    <span className="text-[10px] text-zinc-400">
      {new Intl.DateTimeFormat(localeTag, {
        timeZone: group.post.timezone || undefined,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(new Date(group.post.scheduled_at))}
    </span>
    <span className="text-[10px] text-zinc-400">
      {group.post.timezone && ` (${group.post.timezone})`}
    </span>
  </div>
                      </div>

</div>


                     
                      <p className="line-clamp-2 text-zinc-700">
                        {group.post.content}
                      </p>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Edit Form */}
              <div className="min-h-0 w-full flex flex-col overflow-y-auto bg-white p-8 md:w-2/3">
                <div className="mb-8  rounded-[2rem] border border-slate-100 bg-white shadow-lg shadow-slate-400/50">
                  <div className="relative rounded-t-[2rem] overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-6 text-white">
                    <div className="absolute right-0 top-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
                    
                    <div className="relative flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {selectedTargets.map((target) => (
                          <div
                            key={`${target.name}-${target.image ?? "fallback"}`}
                            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/20 text-2xl backdrop-blur-md shadow-inner ring-1 ring-white/30"
                          >
                            {target.image ? (
                              <Image
                                src={target.image}
                                alt={target.name}
                                width={56}
                                height={56}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <span>{target.initial}</span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">
                            {selectedTargetNames}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm font-medium text-blue-100">
                          {t("targetUsed")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                   <div className="p-6">
                     <div className="h-fit whitespace-pre-wrap text-base leading-relaxed text-slate-700 ">
                       {isContentExpanded || selectedPost.content.length <= 150
                         ? selectedPost.content
                         : `${selectedPost.content.slice(0, 150)}...`}
                     </div>
                     {selectedPost.content.length > 150 && (
                       <button
                         type="button"
                         onClick={() => setIsContentExpanded(!isContentExpanded)}
                         aria-expanded={isContentExpanded}
                         className="mt-4 flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50"
                       >
                        {isContentExpanded ? t("content.collapse") : t("content.expand")}
                       </button>
                     )}
                   </div>

                  {/* Media Display */}
                  {selectedPost.media_base64 && (
                    <div className="border-t rounded-b-[2rem] border-slate-100 bg-slate-50/50 p-6">
                      {(() => {
                        const mediaType = selectedPost.media_type;
                        const mimeType = inferMimeType(mediaType, selectedPost.media_name);

                        if (mediaType === "image" || mediaType?.startsWith("image/")) {
                          let parsedImages: Array<{ base64?: string; name?: string; mime?: string | null } | string> | null = null;
                          try {
                            const parsed = JSON.parse(selectedPost.media_base64) as unknown;
                            if (Array.isArray(parsed)) parsedImages = parsed as Array<{ base64?: string; name?: string; mime?: string | null } | string>;
                          } catch {}

                          const normalized = (parsedImages && parsedImages.length > 0
                            ? parsedImages
                            : [selectedPost.media_base64]
                          ).map((item, index) => {
                            if (typeof item === "string") {
                              const url = `data:${inferMimeType(mediaType, selectedPost.media_name)};base64,${item}`;
                              return {
                                url,
                                name: selectedPost.media_name || `Imagen ${index + 1}`,
                              };
                            }

                            const base64 = typeof item.base64 === "string" ? item.base64 : "";
                            const name = typeof item.name === "string" ? item.name : selectedPost.media_name || `Imagen ${index + 1}`;
                            const mime = (typeof item.mime === "string" && item.mime) ? item.mime : inferMimeType(mediaType, name);
                            return {
                              url: `data:${mime};base64,${base64}`,
                              name,
                            };
                          }).filter((item) => item.url.length > 0);

                          const displayedItems = normalized.slice(0, 4);
                          const extraCount = Math.max(0, normalized.length - displayedItems.length);

                          return (
                            <div className="px-4 pb-4">
                              {normalized.length > 1 ? (
                                <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
                                  {displayedItems.map((item, itemIndex) => (
                                    <button
                                      key={`${item.url}-${itemIndex}`}
                                      type="button"
                                      onClick={() => openImageCarousel(normalized, itemIndex)}
                                      className="relative aspect-square bg-zinc-100"
                                    >
                                      <Image
                                        src={item.url}
                                        alt={item.name || t("media.imageAlt")}
                                        fill
                                        unoptimized
                                        sizes="(max-width: 768px) 100vw, 400px"
                                        className="object-cover"
                                      />
                                      {extraCount > 0 && itemIndex === displayedItems.length - 1 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                                          +{extraCount}
                                        </div>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openImageCarousel(normalized, 0)}
                                  className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-100"
                                >
                                  <Image
                                    src={normalized[0]?.url}
                                    alt={normalized[0]?.name || t("media.imageAlt")}
                                    fill
                                    unoptimized
                                    sizes="(max-width: 768px) 100vw, 600px"
                                    className="object-cover"
                                  />
                                </button>
                              )}
                            </div>
                          );
                        }

                        if (mediaType === "video" || mediaType?.startsWith("video/")) {
                          const dataUrl = `data:${mimeType};base64,${selectedPost.media_base64}`;
                          return (
                        <div className="relative aspect-video w-full bg-zinc-100">
                          <video
                            src={dataUrl}
                            controls
                            className="h-full w-full"
                          />
                        </div>
                          );
                        }

                        const dataUrl = `data:${mimeType};base64,${selectedPost.media_base64}`;
                        return (
                        <div className="mx-4 mb-4 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-red-100 text-red-600">
                            <FontAwesomeIcon icon={faFile} className="h-5 w-5" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium text-zinc-900">
                              {selectedPost.media_name || t("media.documentFallback")}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {selectedPost.media_type || t("media.fileFallback")}
                            </p>
                          </div>
                          <a
                            href={dataUrl}
                            download={selectedPost.media_name || t("media.downloadFallback")}
                            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                          >
                            <FontAwesomeIcon icon={faDownload} className="h-5 w-5" />
                          </a>
                        </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {!isEditingSchedule ? (
                  <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-lg">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600  ">
                          <FontAwesomeIcon icon={faClock} className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                            {t("schedule.title")}
                          </p>
                          <p className="font-bold text-slate-900">
                            {new Intl.DateTimeFormat(localeTag, {
                              dateStyle: 'long',
                              timeStyle: 'short',
                              timeZone: selectedPost.timezone || undefined
                            }).format(new Date(selectedPost.scheduled_at))}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingSchedule(true)}
                        className="shrink-0 cursor-pointer rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm ring-1 ring-blue-400 transition-all hover:bg-blue-600 hover:shadow-md active:scale-95"
                      >
                        {t("schedule.reschedule")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                    <h4 className="mb-4 text-sm font-bold text-slate-900">{t("schedule.editTitle")}</h4>
                    
                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        {t("schedule.timezone")}
                      </label>
                      <select
                        value={editTimezone}
                        onChange={(e) => setEditTimezone(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      >
                        {PREDEFINED_TIMEZONES.map((timezone) => (
                          <option key={timezone.value} value={timezone.value}>
                            {timezone.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-6">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        {t("schedule.dateTime")}
                      </label>
                      <input
                        type="datetime-local"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setIsEditingSchedule(false)}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                      >
                        {t("actions.cancel")}
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                            {t("actions.saving")}
                          </>
                        ) : (
                          t("actions.saveChanges")
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-auto border-t border-slate-100 pt-6 ">
                  <div className="flex items-center justify-between rounded-xl bg-red-50 p-4 border border-red-100 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                        <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-900">{t("delete.title")}</p>
                        <p className="text-xs text-red-500">{t("delete.subtitle")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      disabled={isDeleting}
                      className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-sm ring-1 ring-red-400 transition-all hover:bg-red-600 hover:shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isDeleting ? t("actions.deleting") : t("actions.delete")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 ring-8 ring-red-50/50">
                <FontAwesomeIcon icon={faTrash} className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                {t("delete.confirmTitle")}
              </h3>
              <p className="text-slate-500">
                {t("delete.confirmDescription")}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 px-8 py-6">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
              >
                {t("actions.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 hover:shadow-xl hover:shadow-red-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                    <span>{t("actions.deleting")}</span>
                  </>
                ) : (
                  t("actions.delete")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isImageCarouselOpen && carouselItems.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeImageCarousel();
          }}
        >
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={closeImageCarousel}
              className="absolute -top-10 right-0 cursor-pointer rounded p-2 text-white hover:bg-white/10"
              aria-label={t("carousel.close")}
            >
              <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
            </button>

            <div className="relative h-[80vh] w-full overflow-hidden rounded-xl bg-black">
              <Image
                src={carouselItems[carouselIndex]?.url}
                alt={carouselItems[carouselIndex]?.name || t("media.imageFallback")}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
              />
              {carouselItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevCarouselImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                    aria-label={t("carousel.previous")}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextCarouselImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                    aria-label={t("carousel.next")}
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="h-5 w-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                {carouselIndex + 1}/{carouselItems.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
