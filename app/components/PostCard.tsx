import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import {
  faUser,
  faGlobe,
  faEllipsis,
  faHeart,
  faComment,
  faRetweet,
} from "@fortawesome/free-solid-svg-icons";
import { PostCardProps } from "@/types/landing";
import { useTranslations } from "next-intl";
import { getProxiedImageUrl } from "@/lib/image-proxy";

export function PostCard({
  authorName,
  authorRole,
  timeAgo,
  content,
  likes,
  comments,
  reposts,
  views,
  isOptimized,
  avatarUrl,
  postImageUrl,
}: PostCardProps) {
  const t = useTranslations('PostCard');
  
  const proxiedAvatarUrl = avatarUrl ? getProxiedImageUrl(avatarUrl) : null;
  const proxiedPostImageUrl = typeof postImageUrl === "string" ? getProxiedImageUrl(postImageUrl) : postImageUrl;

  return (
    <div
      className={`relative w-full max-w-[320px] sm:max-w-[400px] md:max-w-[500px] overflow-hidden rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5 transition-all duration-300 text-left ${
        isOptimized ? "scale-105 shadow-blue-900/20" : "scale-95 opacity-100 grayscale-0"
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
          {proxiedAvatarUrl ? (
            <Image
              src={proxiedAvatarUrl}
              alt={authorName}
              width={40}
              height={40}
              className="h-full w-full object-cover"
              unoptimized={proxiedAvatarUrl.startsWith('data:') || proxiedAvatarUrl.startsWith('/api/proxy-image')}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
              <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="truncate text-sm font-semibold text-slate-900">{authorName}</h4>
          <p className="truncate text-xs text-slate-500">{authorRole}</p>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>{timeAgo}</span>
            <span>•</span>
            <FontAwesomeIcon icon={faGlobe} className="h-3 w-3" />
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <FontAwesomeIcon icon={faEllipsis} className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4 space-y-2">
        {proxiedPostImageUrl && (
          <div className="relative overflow-hidden rounded-lg border border-slate-100">
            {typeof proxiedPostImageUrl === "string" ? (
              <img 
                src={proxiedPostImageUrl} 
                alt="Post content" 
                className="w-full object-cover"
              />
            ) : (
              <Image 
                src={proxiedPostImageUrl} 
                alt="Post content" 
                className="w-full object-cover"
              />
            )}
          </div>
        )}

        <p className="text-sm leading-relaxed text-slate-800">
          {content}
        </p>

        <span className="cursor-pointer text-sm font-medium text-blue-600 hover:underline">
          {t('seeMore')}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex flex-col  items-center gap-1">
          <div className="flex flex-col-reverse  sm:flex-row  mr-1">
            <div className="flex -space-x-1">
              <img src="/recommend.svg" alt="Recomendar" className="h-4 w-4 rounded-full ring-1 ring-white" />
              <img src="/celebrate.svg" alt="Celebrar" className="h-4 w-4 rounded-full ring-1 ring-white" />
              <img src="/heart.svg" alt="Me encanta" className="h-4 w-4 rounded-full ring-1 ring-white" />
            </div>
            
            <span className="text-xs text-slate-500 hover:text-blue-600 hover:underline cursor-pointer">
            {likes}
          </span>
          </div>
          
        </div>
        <div className="flex gap-2 text-xs text-slate-500">
          <span className="hover:text-blue-600 hover:underline cursor-pointer">{comments} {t('comments')}</span>
          <span>•</span>
          <span className="hover:text-blue-600 hover:underline cursor-pointer">{reposts} {t('shares')}</span>
          {views && (
            <>
              <span>•</span>
              <span className="font-medium text-slate-700">{views.toLocaleString()} {t('views')}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 gap-1 sm:gap-2">
        <button className="flex items-center gap-1 sm:gap-2 rounded px-1 sm:px-2 py-2 text-[10px] sm:text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
           <FontAwesomeIcon icon={faHeart} />
           <span>{t('recommend')}</span>
        </button>
        <button className="flex items-center gap-1 sm:gap-2 rounded px-1 sm:px-2 py-2 text-[10px] sm:text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
           <FontAwesomeIcon icon={faComment} />
           <span>{t('comment')}</span>
        </button>
        <button className="flex items-center gap-1 sm:gap-2 rounded px-1 sm:px-2 py-2 text-[10px] sm:text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
           <FontAwesomeIcon icon={faRetweet} />
           <span>{t('share')}</span>
        </button>
      </div>
    </div>
  );
}
