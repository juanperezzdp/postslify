"use client";

import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faPenToSquare, 
  faCalendarDays, 
  faBoxArchive,
  faMicrophone, 
  faGrip, 
  faBriefcase, 
  faCreditCard, 
  faUser,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import type { ActionItemProps, NavItemProps, SidebarProps } from "@/types/sidebar";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

const NavItem = ({ href, icon, label, isActive, onboardingId, onClick }: NavItemProps) => {
    
    
    
    return (
  <Link
    href={href}
    data-onboarding-id={onboardingId}
    onClick={onClick}
    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 overflow-hidden
      ${isActive 
        ? "bg-white text-blue-600 shadow-lg shadow-blue-900/20" 
        : "text-blue-100 hover:bg-white/10 hover:text-white"
      }`}
  >
    <div className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ${isActive ? "hidden" : "block"}`} />
    
    <FontAwesomeIcon 
      icon={icon} 
      className={`h-4 w-4 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} 
    />
    <span className="relative z-10">{label}</span>
    {isActive && (
      <FontAwesomeIcon 
        icon={faChevronRight} 
        className="ml-auto h-2.5 w-2.5 text-blue-500" 
      />
    )}
  </Link>
)};

const ActionItem = ({ icon, label, onClick, onboardingId }: ActionItemProps) => (
  <button
    type="button"
    onClick={onClick}
    data-onboarding-id={onboardingId}
    className="group relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 overflow-hidden text-blue-100 hover:bg-white/10 hover:text-white"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    <FontAwesomeIcon 
      icon={icon} 
      className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" 
    />
    <span className="relative z-10">{label}</span>
  </button>
);

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const t = useTranslations('Sidebar');
  const { data: session } = useSession();
  const params = useParams();
  const urlUserId = params?.id as string;
  const userId = urlUserId || session?.user?.id;
  const router = useRouter();
  const pathname = usePathname();
  const isRouteActive = (path: string) => {
    if (!pathname || !userId) return false;
    const currentPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const targetPath = path.endsWith('/') ? path.slice(0, -1) : path;

    return currentPath === targetPath;
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-blue-900/40 backdrop-blur-md md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 z-50 h-screen w-full md:w-66 bg-gradient-to-b from-blue-600 to-blue-500 transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1)
        right-0 shadow-2xl shadow-blue-900/20
        md:left-0 md:right-auto 
        ${isOpen ? "translate-x-0" : "translate-x-full"} 
        md:translate-x-0`}>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[50%] rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute top-[40%] -left-[20%] w-[60%] h-[40%] rounded-full bg-blue-700/20 blur-3xl" />
        </div>
        
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white md:hidden transition-all"
        >
          <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
        </button>

        <div className="relative flex h-full flex-col z-10">
          <div className="shrink-0 px-8 pt-10 pb-8">
            <Link href="/" className="group block">
              <span className="font-tan text-4xl tracking-tighter text-white drop-shadow-sm transition-opacity group-hover:opacity-90">
                Postslify
              </span>
              <div className="mt-2 flex gap-1">
                <div className="h-1 w-8 bg-white/90 rounded-full transition-all duration-500 group-hover:w-4" />
                <div className="h-1 w-2 bg-white/50 rounded-full transition-all duration-500 group-hover:w-8" />
              </div>
            </Link>
          </div>

          <nav className="flex-1 flex flex-col gap-2 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent">
            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-200/80">
              {t('createAndManage')}
            </div>
            <NavItem
              href={userId ? `/${userId}/create-post` : "/"}
              icon={faPenToSquare}
              label={t('createPost')}
              isActive={isRouteActive(userId ? `/${userId}/create-post` : "/")}
              onboardingId="nav-create-post"
              onClick={onClose}
            />
            <NavItem
              href={userId ? `/${userId}/calendar` : "/"}
              icon={faCalendarDays}
              label={t('calendar')}
              isActive={isRouteActive(userId ? `/${userId}/calendar` : "/")}
              onboardingId="nav-calendar"
              onClick={onClose}
            />
            <NavItem
              href={userId ? `/${userId}/archived-posts` : "/"}
              icon={faBoxArchive}
              label={t('archivedPosts')}
              isActive={isRouteActive(userId ? `/${userId}/archived-posts` : "/")}
              onboardingId="nav-archived"
              onClick={onClose}
            />
            
            <div className="mt-6 mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-blue-200/80">
              {t('voiceAndPersonality')}
            </div>
            <NavItem
              href={userId ? `/${userId}/voice-profile` : "/"}
              icon={faMicrophone}
              label={t('newVoiceProfile')}
              isActive={isRouteActive(userId ? `/${userId}/voice-profile` : "/")}
              onboardingId="nav-voice-profile"
              onClick={onClose}
            />
            <NavItem
              href={userId ? `/${userId}/voice-profiles` : "/"}
              icon={faGrip}
              label={t('myProfiles')}
              isActive={isRouteActive(userId ? `/${userId}/voice-profiles` : "/")}
              onboardingId="nav-voice-profiles"
              onClick={onClose}
            />

            <div className="mt-6 mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-blue-200/80">
              {t('account')}
            </div>
            <NavItem
              href={userId ? `/${userId}/business-page` : "/"}
              icon={faBriefcase}
              label={t('businessPages')}
              isActive={isRouteActive(userId ? `/${userId}/business-page` : "/")}
              onboardingId="nav-business"
              onClick={onClose}
            />
            <NavItem
              href={userId ? `/${userId}/billing` : "/"}
              icon={faCreditCard}
              label={t('billing')}
              isActive={isRouteActive(userId ? `/${userId}/billing` : "/")}
              onboardingId="nav-billing"
              onClick={onClose}
            />
            {userId && (
              <ActionItem
                icon={faUser}
                label={t('userDetails')}
                onClick={() => {
                  onClose?.();
                  if (userId) {
                    router.push(`/${userId}/settings`);
                  }
                }}
                onboardingId="nav-user-details"
              />
            )}

            <div className="mt-4 px-2">
                <LanguageSwitcher menuPlacement="top" />
            </div>
          </nav>

        </div>
      </aside>
    </>
  );
}
