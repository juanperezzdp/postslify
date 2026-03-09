"use client";

import { useEffect, useState, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { 
  faLinkedin, 
} from "@fortawesome/free-brands-svg-icons";
import { 
  faRightFromBracket, 
  faPlus, 
  faChevronRight,
  faXmark,
  faCircleCheck,
  faCircleXmark,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import type { LinkedInUser, PageSettingsResponse, DraggablePosition, DragState } from "@/types/linkedin";

export function LinkedInFloatingButton() {
  const t = useTranslations("LinkedInFloating");
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<LinkedInUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageSettings, setPageSettings] = useState<PageSettingsResponse | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [fabPosition, setFabPosition] = useState<DraggablePosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const wasDraggedRef = useRef(false);

  const userId = session?.user?.id;
  const avatarUrl = user?.picture ?? session?.user?.image ?? null;

  const pages = pageSettings?.pages?.length
    ? pageSettings.pages
    : pageSettings?.page
      ? [pageSettings.page]
      : [];

  useEffect(() => {
    fetch("/api/auth/linkedin/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.connected && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/linkedin/page-settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: PageSettingsResponse) => {
        setPageSettings(data);
      })
      .catch(() => {});
  }, []);

  const isMobileViewport = () => window.matchMedia("(max-width: 768px)").matches;

  const clampPosition = (
    position: DraggablePosition,
    width: number,
    height: number,
    lockLeft: boolean
  ) => {
    const maxX = Math.max(0, window.innerWidth - width);
    const maxY = Math.max(0, window.innerHeight - height);
    return {
      x: lockLeft ? 8 : Math.min(Math.max(0, position.x), maxX),
      y: Math.min(Math.max(0, position.y), maxY),
    };
  };

  useEffect(() => {
    if (fabPosition || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const isMobileNow = isMobileViewport();
    const initial: DraggablePosition = {
      x: window.innerWidth - rect.width - 16,
      y: window.innerHeight - rect.height - 16,
    };
    const leftOffset = isMobileNow ? 8 : initial.x;
    const bottomOffset = isMobileNow ? 10 : initial.y;
    setFabPosition(
      clampPosition(
        { x: leftOffset, y: bottomOffset },
        rect.width,
        rect.height,
        isMobileNow
      )
    );
  }, [fabPosition]);

  useEffect(() => {
    function handleResize() {
      if (!containerRef.current || !fabPosition) return;
      const isMobileNow = isMobileViewport();
      const rect = containerRef.current.getBoundingClientRect();
      setFabPosition((current) => {
        if (!current) return current;
        return clampPosition(current, rect.width, rect.height, isMobileNow);
      });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fabPosition]);

  useEffect(() => {
    if (!isDragging) return;
    function handlePointerMove(event: PointerEvent) {
      if (!dragStateRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = event.clientX - dragStateRef.current.startX;
      const deltaY = event.clientY - dragStateRef.current.startY;
      const isMobileNow = isMobileViewport();
      const next = {
        x: dragStateRef.current.originX + deltaX,
        y: dragStateRef.current.originY + deltaY,
      };
      if (Math.abs(deltaX) + Math.abs(deltaY) > 4) {
        wasDraggedRef.current = true;
      }
      setFabPosition(clampPosition(next, rect.width, rect.height, isMobileNow));
    }
    function handlePointerUp() {
      setIsDragging(false);
      dragStateRef.current = null;
    }
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  const handleFabPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!containerRef.current || !fabPosition) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    wasDraggedRef.current = false;
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: fabPosition.x,
      originY: fabPosition.y,
    };
    setIsDragging(true);
  };

  const handleFabClick = () => {
    if (wasDraggedRef.current) {
      wasDraggedRef.current = false;
      return;
    }
    setIsOpen(!isOpen);
  };

  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnectLinkedin = () => {
    router.push("/api/auth/linkedin");
  };

  const handleLogout = async () => {
    try {
      setIsDisconnecting(true);
      await fetch("/api/auth/linkedin/logout", { method: "POST", keepalive: true });
      setUser(null);
      setPageSettings(null);
      setIsOpen(false);
      setShowDisconnectModal(false);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (loading) return null;

  return (
    <div
      className={`fixed z-50 flex flex-col items-start sm:items-end ${fabPosition ? "" : "bottom-4 left-4 sm:bottom-6 sm:right-6 sm:left-auto"}`}
      style={fabPosition ? { left: fabPosition.x, top: fabPosition.y } : undefined}
      ref={containerRef}
    >
      
      {/* Popover Window */}
      <div 
        className={`
          mb-4 w-80 transform transition-all duration-300 origin-bottom-left sm:origin-bottom-right
          ${isOpen ? "scale-100 opacity-100 translate-y-0" : "hidden"}
        `}
      >
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl  shadow-xl shadow-black/20 overflow-hidden">
          
          {/* Header / User Info */}
          <div className="bg-gradient-to-br from-blue-600/90 to-blue-800/90 p-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={user.name || t("userFallback")}
                        width={48}
                        height={48}
                        className="rounded-full object-cover ring-2 ring-white/30 shadow-md"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600 ring-2 ring-white/30 shadow-md">
                        {user.name?.charAt(0) || t("userFallback").charAt(0)}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-blue-600 shadow-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-white">{user.name}</p>
                    <p className="truncate text-xs text-blue-100 font-medium tracking-wide opacity-80">
                      {t("connected")}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDisconnectModal(true)}
                    disabled={isDisconnecting}
                    className="group flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-red-500/50 cursor-pointer transition-all"
                    title={t("disconnectTitle")}
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={handleConnectLinkedin}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                >
                  <FontAwesomeIcon icon={faLinkedin} className="text-lg" />
                  {t("reconnect")}
                </button>
              </div>
            ) : (
              <div className="text-center py-2">
                <h3 className="text-white font-bold text-lg mb-1">{t("connectTitle")}</h3>
                <p className="text-blue-100 text-xs mb-3">{t("connectSubtitle")}</p>
                <button
                  onClick={handleConnectLinkedin}
                  className="w-full py-2 bg-white text-blue-600 rounded-lg font-bold text-sm shadow-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faLinkedin} className="text-3xl" />
                  {t("connectNow")}
                </button>
              </div>
            )}
          </div>

          {/* Pages List */}
          {(user || (pageSettings?.configured && pages.length > 0)) && (
            <div className="bg-blue-500/10  p-4 space-y-3">
              {pageSettings?.configured && pages.length > 0 ? (
                <>
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest ">
                      {t("pagesCount", { count: pages.length })}
                    </p>
                    <Link
                      href={`/${userId}/business-page`}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white transition-all hover:bg-blue-600 hover:scale-110"
                      title={t("managePages")}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </Link>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {pages.map((page) => (
                      <Link
                        key={page.id}
                        href={`/${userId}/business-page`}
                        className="group flex items-center gap-3 rounded-xl bg-blue-500/40 p-2 transition-all hover:bg-blue-500/70 border border-white/5 hover:border-white/10"
                      >
                        <div className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-blue-800 ${pageSettings?.page?.id !== page.id ? "grayscale" : ""}`}>
                          {page.logoUrl ? (
                            <Image
                              src={page.logoUrl}
                              alt={page.name || t("pageAltFallback")}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-700 text-white text-xs font-bold">
                              {page.name?.charAt(0)}
                            </div>
                          )}
                          {/* Inactive Status Overlay */}
                          {pageSettings?.page?.id !== page.id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                              <FontAwesomeIcon icon={faXmark} className="h-5 w-5 text-white drop-shadow-md" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-white transition-colors">
                            {page.name}
                          </p>
                          <p className="truncate text-[9px] font-medium text-slate-600">
                            {page.vanityName || t("companyFallback")}
                          </p>
                        </div>
                        <FontAwesomeIcon 
                          icon={faChevronRight} 
                          className="h-2.5 w-2.5 text-white transition-colors" 
                        />
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-xs mb-3">{t("noPages")}</p>
                  <Link
                    href={`/${userId}/business-page`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                    {t("addPage")}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onPointerDown={handleFabPointerDown}
        onClick={handleFabClick}
        style={{ touchAction: "none" }}
        className={`
          group relative flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 cursor-grab active:cursor-grabbing
          ${isOpen 
            ? "bg-red-600 text-white rotate-90" 
            : user 
              ? "bg-blue-600 text-white hover:bg-blue-500 hover:scale-110" 
              : "bg-white text-blue-600 hover:scale-110"
          }
        `}
      >
        <span className={`absolute inset-0 rounded-full animate-ping opacity-20 duration-3000 ${isOpen ? 'bg-red-400' : 'bg-blue-500'}`} style={{ animationDuration: '3s' }} />
        
        {isOpen ? (
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
        ) : (
          <div className="relative">
             <FontAwesomeIcon icon={faLinkedin} className="text-xl sm:text-2xl" />
             {user && (
               <span className="absolute -top-1 -right-1 flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
             )}
          </div>
        )}
      </button>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDisconnectModal(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className=" p-6 pb-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <FontAwesomeIcon icon={faRightFromBracket} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t("disconnectModalTitle")}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {t("disconnectModalDescription")}
                  </p>
                  <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-600" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-bold text-red-800">
                          {t("disconnectModalWarning")}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4">
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleLogout}
                disabled={isDisconnecting}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isDisconnecting ? t("disconnecting") : t("confirmDisconnect")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
