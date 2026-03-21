"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useFieldArray, useForm } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faCheck,
  faExclamationTriangle,
  faPaperPlane,
  faImage,
  faVideo,
  faFile,
  faTimes,
  faChevronLeft,
  faChevronRight,
  faWandMagicSparkles,
  faEllipsis,
  faPenToSquare,
  faBoxArchive,
  faCalendarDays,
  faSpinner,
  faGlobe,
  faThumbsUp,
  faHandsClapping,
  faHeart,
  faComment,
  faRetweet,
  faChevronDown,
  faArrowRight,
  faTrash,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { PREDEFINED_TIMEZONES } from "@/lib/timezone";
import type { Message } from "@/types/posts";
import type { LinkedInUser, PageSettingsResponse, PageData } from "@/types/linkedin";
import type { VoiceProfile, VoiceProfileSnapshot } from "@/types/voice-profile";
import type { ChatHistoryListResponse, ChatHistoryUpdateRequest } from "@/types/chat-history";
import type { ImageStyleOption, ImagePromptFormValues, ImageGenerationRequest, ImageGenerationResponse } from "@/types/image-generation";
import { useTranslations } from "next-intl";
import { getProxiedImageUrl } from "@/lib/image-proxy";
 

const styleEmojis: Record<string, string> = {
  formal: "🎩",
  informal: "✌️",
  humor: "😂",
  motivacional: "💪",
  educativo: "📚",
  inspirador: "🌟",
  corporativo: "🏢",
  tecnico: "🛠️",
  storytelling: "📖",
  directo: "⚡",
  autoridad: "👑",
  empatico: "🤝",
  creativo: "🎨",
  analitico: "📊",
  polemico: "🔥",
  reflexivo: "🧠",
  visionario: "🚀",
  minimalista: "✨",
  comunidad: "🧑‍🤝‍🧑",
  emocional: "💖",
};

const imageStyleOptions: ImageStyleOption[] = [
  { id: "caricatura", label: "Caricatura", emoji: "🧑‍🎨", image: "/images/styles/cartoon.png" },
  { id: "graficas", label: "Gráficas", emoji: "📊", image: "/images/styles/chart.png" },
  { id: "3d-modern", label: "3D Modern", emoji: "🧊", image: "/images/styles/3d.png" },
  { id: "fotografia", label: "Fotografía", emoji: "📷", image: "/images/styles/photo.png" },
  { id: "acuarela", label: "Acuarela", emoji: "🎨", image: "/images/styles/acuarela.png" },
  { id: "minimalista", label: "Minimalista", emoji: "✨", image: "/images/styles/minimal.png" },
  { id: "futurista", label: "Futurista", emoji: "🚀", image: "/images/styles/futuristic.png" },
  { id: "retro", label: "Retro", emoji: "📼", image: "/images/styles/retro.png" },
  { id: "cyberpunk", label: "Cyberpunk", emoji: "🌆", image: "/images/styles/cyberpunk.png" },
  { id: "plano", label: "Ilustración plana", emoji: "🟦", image: "/images/styles/flat.png" },
  { id: "isometrico", label: "Isométrico", emoji: "🧱", image: "/images/styles/isometric.png" },
  { id: "comic", label: "Cómic", emoji: "💥", image: "/images/styles/comic.png" },
  { id: "neon", label: "Neón", emoji: "🌈", image: "/images/styles/neon.png" },
  { id: "pastel", label: "Pastel", emoji: "🍡", image: "/images/styles/pastel.png" },
  { id: "noir", label: "Noir", emoji: "🕵️", image: "/images/styles/noir.png" },
  { id: "vintage", label: "Vintage", emoji: "📻", image: "/images/styles/vintage.png" },
  { id: "sketch", label: "Sketch", emoji: "✏️", image: "/images/styles/sketch.png" },
  { id: "low-poly", label: "Low Poly", emoji: "🔷", image: "/images/styles/low-poly.png" },
  { id: "surrealista", label: "Surrealista", emoji: "🌀", image: "/images/styles/surreal.png" },
];

import { DateTimePicker } from "@/app/components/DateTimePicker";
import { Select } from "@/app/components/Select";

export default function CrearPostPage() {
  const t = useTranslations('CreatePost');
  const params = useParams<{ id: string; locale: string }>();
  const activeLocale = params?.locale === "es" ? "es" : "en";
  const CHARACTER_LIMIT = 10;
  const CHARACTER_NAME_MAX = 400;
  const CHAT_INPUT_MAX_LENGTH = 5000;
  const IMPROVE_CONTEXT_MAX_LENGTH = 1250;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [user, setUser] = useState<LinkedInUser | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [attachingTo, setAttachingTo] = useState<{ index: number; type: "image" | "video" | "document" } | null>(null);
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [messageToSchedule, setMessageToSchedule] = useState<Message | null>(null);
  const [scheduleMessageIndex, setScheduleMessageIndex] = useState<number | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState<{ scheduledAt: string; timezone: string } | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isPublishPreviewOpen, setIsPublishPreviewOpen] = useState(false);
  const [messageToPublish, setMessageToPublish] = useState<Message | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [maxFilesError, setMaxFilesError] = useState(false);
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState<{ url: string; name: string }[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselMessageIndex, setCarouselMessageIndex] = useState<number | null>(null);
  const [isDeleteImageConfirmOpen, setIsDeleteImageConfirmOpen] = useState(false);
  const [deleteImageTarget, setDeleteImageTarget] = useState<{ messageIndex: number; itemIndex: number } | null>(null);
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);
  const [linkedinModalMode, setLinkedinModalMode] = useState<"schedule" | "publish" | null>(null);
  const [publishTargets, setPublishTargets] = useState({
    linkedinProfile: true,
    linkedinPage: false,
  });
  const [publishError, setPublishError] = useState<string | null>(null);
  const [pageSettings, setPageSettings] = useState<PageSettingsResponse | null>(null);
  const [selectedPageUrns, setSelectedPageUrns] = useState<string[]>([]);
  const [scheduleProfile, setScheduleProfile] = useState(true);
  const [schedulePageUrns, setSchedulePageUrns] = useState<string[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [messageForImage, setMessageForImage] = useState<Message | null>(null);
  const [messageForImageIndex, setMessageForImageIndex] = useState<number | null>(null);
  const [selectedImageStyleId, setSelectedImageStyleId] = useState<string | null>(null);
  const [imagePromptPreviewValue, setImagePromptPreviewValue] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [streamingAssistantIndex, setStreamingAssistantIndex] = useState<number | null>(null);

  const {
    register: registerImagePrompt,
    handleSubmit: handleImageFormSubmit,
    reset: resetImagePrompt,
    control: imagePromptControl,
    setValue: setImagePromptValue,
    watch: watchImagePrompt,
    formState: { errors: imagePromptErrors },
  } = useForm<ImagePromptFormValues>({
    defaultValues: {
      extraContext: "",
      characterInput: "",
      characters: [],
      includePostTitle: "",
    },
  });
  const { fields: characterFields, append: appendCharacter, remove: removeCharacter } = useFieldArray({
    control: imagePromptControl,
    name: "characters",
  });
  const characterInputValue = watchImagePrompt("characterInput") ?? "";
  const extraContextValue = watchImagePrompt("extraContext") ?? "";
  const includePostTitle = watchImagePrompt("includePostTitle");
  const canAddCharacter =
    characterFields.length < CHARACTER_LIMIT && characterInputValue.trim().length > 0;
  const selectedImageStyle =
    imageStyleOptions.find((style) => style.id === selectedImageStyleId) || null;
  const currentImageCount = messageForImage?.media?.type === "image"
    ? messageForImage.media.items?.length ?? 1
    : 0;
 

  useEffect(() => {
    if (publishSuccess) {
      const timer = setTimeout(() => {
        setPublishSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [publishSuccess]);

  useEffect(() => {
    if (!isPublishPreviewOpen) return;
    setPublishError(null);
  }, [isPublishPreviewOpen]);

  useEffect(() => {
    if (maxFilesError) {
      const timer = setTimeout(() => {
        setMaxFilesError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [maxFilesError]);

 

  useEffect(() => {
    if (!scheduleSuccess) return;
    const timer = setTimeout(() => {
      setScheduleSuccess(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [scheduleSuccess]);

  const router = useRouter();

  useEffect(() => {
    
    setSelectedTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const isInitialLoadRef = useRef(true);
  const prevLastMessageRef = useRef<Message | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return typeof error === "string" ? error : t('errors.unknown');
  };

  const openImageCarousel = (
    items: { url: string; name: string }[],
    startIndex: number,
    messageIndex: number | null = null,
  ) => {
    if (items.length === 0) return;
    setCarouselItems(items);
    setCarouselIndex(Math.min(Math.max(0, startIndex), items.length - 1));
    setCarouselMessageIndex(messageIndex);
    setIsImageCarouselOpen(true);
  };

  const closeImageCarousel = useCallback(() => {
    setIsImageCarouselOpen(false);
    setCarouselItems([]);
    setCarouselIndex(0);
    setCarouselMessageIndex(null);
    setIsDeleteImageConfirmOpen(false);
    setDeleteImageTarget(null);
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
      if (event.key === "Escape") {
        closeImageCarousel();
        return;
      }
      if (event.key === "ArrowLeft") {
        showPrevCarouselImage();
        return;
      }
      if (event.key === "ArrowRight") {
        showNextCarouselImage();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isImageCarouselOpen, closeImageCarousel, showNextCarouselImage, showPrevCarouselImage]);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (isInitialLoadRef.current) {
      scrollToBottom("auto");
      isInitialLoadRef.current = false;
    } else if (lastMessage !== prevLastMessageRef.current) {
      scrollToBottom("smooth");
    }
    
    prevLastMessageRef.current = lastMessage;
  }, [messages]);

  useLayoutEffect(() => {
    if (prevScrollHeightRef.current > 0 && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeightRef.current;
      
      container.scrollTop = heightDifference;
      
      prevScrollHeightRef.current = 0;
    }
  }, [messages]);

  useEffect(() => {
    let active = true;

    const loadChatHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await fetch("/api/chat/history?limit=10", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as ChatHistoryListResponse;
        if (!active) return;
        if (!data?.items?.length) return;

        const historyMessages = data.items.flatMap((item) => {
          const batch: Message[] = [
            { role: "user", content: item.user_message },
            {
              role: "assistant",
              content: item.ai_response,
              media: item.media,
              historyId: item.id,
              voiceProfileName: item.voice_profile?.name,
              voiceProfileStyleTag: item.voice_profile?.style_tag,
              voiceProfileEmoji: item.voice_profile?.style_emoji,
              voiceProfileLanguage: item.voice_profile?.language,
            },
          ];
          return batch;
        });

        setMessages((prev) => (prev.length > 0 ? prev : historyMessages));
        setHistoryCursor(data.nextCursor ?? null);
        setHasMoreHistory(Boolean(data.hasMore));
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        if (active) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadChatHistory();

    return () => {
      active = false;
    };
  }, []);

  const loadMoreHistory = async () => {
    if (!hasMoreHistory || isLoadingHistory || !historyCursor) return;
    
    
    if (chatContainerRef.current) {
      prevScrollHeightRef.current = chatContainerRef.current.scrollHeight;
    }

    try {
      setIsLoadingHistory(true);
      const params = new URLSearchParams({
        limit: "10",
        cursor: historyCursor,
      });
      const response = await fetch(`/api/chat/history?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as ChatHistoryListResponse;
      if (!data?.items?.length) {
        setHasMoreHistory(false);
        return;
      }

      const historyMessages = data.items.flatMap((item) => {
        const batch: Message[] = [
          { role: "user", content: item.user_message },
          {
            role: "assistant",
            content: item.ai_response,
            media: item.media,
            historyId: item.id,
            voiceProfileName: item.voice_profile?.name,
            voiceProfileStyleTag: item.voice_profile?.style_tag,
            voiceProfileEmoji: item.voice_profile?.style_emoji,
            voiceProfileLanguage: item.voice_profile?.language,
          },
        ];
        return batch;
      });

      setMessages((prev) => [...historyMessages, ...prev]);
      setHistoryCursor(data.nextCursor ?? null);
      setHasMoreHistory(Boolean(data.hasMore));
    } catch (error) {
      console.error("Error loading more history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadLinkedinData = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/linkedin/session", { cache: "no-store" });
        const sessionData = await sessionResponse.json();
        if (!active) return;

        if (!sessionData?.connected || !sessionData?.user) {
          setUser(null);
          return;
        }

        const userData = sessionData.user as LinkedInUser;
        setUser(userData);
      } catch (err) {
        console.error("Error fetching LinkedIn session:", err);
      }
    };

    loadLinkedinData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const pages = pageSettings?.pages?.length
      ? pageSettings.pages
      : pageSettings?.page
        ? [pageSettings.page]
        : [];

    if (!pageSettings?.configured || pages.length === 0) {
      setSelectedPageUrns([]);
      setSchedulePageUrns([]);
      return;
    }

    setSelectedPageUrns((current) =>
      current.filter((urn) => pages.some((page) => page.urn === urn)),
    );

    setSchedulePageUrns((current) =>
      current.filter((urn) => pages.some((page) => page.urn === urn)),
    );
  }, [pageSettings]);

  useEffect(() => {
    if (selectedPageUrns.length === 0 && publishTargets.linkedinPage) {
      setPublishTargets((prev) => ({
        ...prev,
        linkedinPage: false,
      }));
      return;
    }

    if (selectedPageUrns.length > 0 && !publishTargets.linkedinPage) {
      setPublishTargets((prev) => ({
        ...prev,
        linkedinPage: true,
      }));
    }
  }, [selectedPageUrns, publishTargets.linkedinPage]);

  useEffect(() => {
    let active = true;

    const loadPageSettings = async () => {
      try {
        const response = await fetch("/api/linkedin/page-settings", { cache: "no-store" });
        const data = (await response.json()) as PageSettingsResponse;
        if (!active) return;
        setPageSettings(data);
      } catch {
        if (!active) return;
      }
    };

    loadPageSettings();

    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch("/api/voice-profiles", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setVoiceProfiles(data);
        } else {
          console.error("Failed to load voice profiles:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error fetching voice profiles:", error);
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    fetchProfiles();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleFileSelect = (index: number, type: "image" | "video" | "document") => {
    setAttachingTo({ index, type });
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "image" ? "image/*" : type === "video" ? "video/*" : ".pdf,.doc,.docx,.txt";
      fileInputRef.current.multiple = type === "image";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && attachingTo) {
      const attachmentTarget = attachingTo;
      const files = Array.from(e.target.files);
      let historyIdToPersist: string | null = null;
      let mediaToPersist: Message["media"] | null = null;

      if (attachmentTarget.type === "image" && files.length > 9) {
        setMaxFilesError(true);
        files.splice(9);
      }

      const items = files.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name
      }));

      setMessages((prev) => {
        const newMessages = [...prev];
        const targetMessage = newMessages[attachmentTarget.index];
        if (targetMessage) {
          historyIdToPersist = targetMessage.historyId ?? null;
          if (attachmentTarget.type === "image") {
            const existingItems =
              targetMessage.media?.type === "image"
                ? targetMessage.media.items && targetMessage.media.items.length > 0
                  ? targetMessage.media.items
                  : [{ url: targetMessage.media.url, name: targetMessage.media.name }]
                : [];
            const mergedItems = [...existingItems, ...items].slice(0, 9);
            if (existingItems.length + items.length > 9) {
              setMaxFilesError(true);
            }
            const primaryItem = mergedItems[0];
            mediaToPersist = {
              type: "image",
              url: primaryItem.url,
              name: primaryItem.name,
              items: mergedItems
            };
            newMessages[attachmentTarget.index] = {
              ...targetMessage,
              media: mediaToPersist
            };
            return newMessages;
          }

          const primaryItem = items[0];
          mediaToPersist = {
            type: attachmentTarget.type,
            url: primaryItem.url,
            name: primaryItem.name,
            items: [{ url: primaryItem.url, name: primaryItem.name }]
          };
          newMessages[attachmentTarget.index] = {
            ...targetMessage,
            media: mediaToPersist
          };
        }
        return newMessages;
      });

      if (historyIdToPersist && mediaToPersist) {
        void persistHistoryMedia(historyIdToPersist, mediaToPersist);
      }
      
      setAttachingTo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSchedule = (message: Message, index: number) => {
    setMessageToSchedule(message);
    setScheduleMessageIndex(index);
    setScheduleError(null);
    
    const selectedProfile = voiceProfiles.find(p => p.id === selectedProfileId);
    if (selectedProfile?.timezone) {
      setSelectedTimezone(selectedProfile.timezone);
    } else {
      setSelectedTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    
    setSchedulePageUrns([]);
    setScheduleProfile(false);

    setIsScheduleModalOpen(true);
  };

  const handleEditPost = (message: Message, index: number) => {
    setEditingMessageIndex(index);
    setEditingContent(message.content);
  };

  const handleArchivePost = async (message: Message, index: number) => {
    if (message.role !== "assistant") return;

    const historyId = message.historyId;
    if (historyId) {
      try {
        await fetch("/api/chat/history/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: historyId }),
        });
      } catch (error) {
        console.error("Error archiving post:", error);
      }
    }

    setMessages((prev) => {
      const next = [...prev];
      const removeIndexes = [index];
      if (index > 0 && next[index - 1]?.role === "user") {
        removeIndexes.push(index - 1);
      }
      return next.filter((_, idx) => !removeIndexes.includes(idx));
    });
  };

  const handleSaveEdit = (index: number) => {
    setMessages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], content: editingContent };
      return next;
    });
    setEditingMessageIndex(null);
    setEditingContent("");
  };

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
    setEditingContent("");
  };

  const handleOpenImageModal = (message: Message, index: number) => {
    setMessageForImage(message);
    setMessageForImageIndex(index);
    setIsImageModalOpen(true);
    setSelectedImageStyleId(null);
    setImagePromptPreviewValue("");
    setGeneratedImageUrl(null);
    setImageGenerationError(null);
    resetImagePrompt({ extraContext: "", characterInput: "", characters: [], includePostTitle: "" });
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setMessageForImage(null);
    setMessageForImageIndex(null);
    setSelectedImageStyleId(null);
    setImagePromptPreviewValue("");
    setGeneratedImageUrl(null);
    setImageGenerationError(null);
    resetImagePrompt({ extraContext: "", characterInput: "", characters: [], includePostTitle: "" });
  };

  const persistHistoryMedia = async (historyId: string, media: Message["media"] | null) => {
    try {
      const payload: ChatHistoryUpdateRequest = { id: historyId, media };
      await fetch("/api/chat/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Error updating chat history media:", error);
    }
  };

  const buildNextAiImageMedia = (
    currentMedia: Message["media"] | undefined,
    aiItem: { url: string; name: string },
    aiName: string,
  ): Message["media"] => {
    if (currentMedia?.type === "image") {
      const existingItems =
        currentMedia.items && currentMedia.items.length > 0
          ? currentMedia.items
          : [{ url: currentMedia.url, name: currentMedia.name }];
      const nextItems = [...existingItems, aiItem].slice(-3);
      const [primaryItem] = nextItems;
      return {
        type: "image",
        url: primaryItem.url,
        name: primaryItem.name,
        items: nextItems,
      };
    }
    return {
      type: "image",
      url: aiItem.url,
      name: aiItem.name,
      items: [aiItem],
    };
  };

  const buildImageMediaFromItems = (
    items: { url: string; name: string }[],
  ): Message["media"] | null => {
    if (items.length === 0) return null;
    const [primary] = items;
    return {
      type: "image",
      url: primary.url,
      name: primary.name,
      items,
    };
  };

  const deleteImageAtIndex = async (messageIndex: number, itemIndex: number) => {
    const target = messages[messageIndex];
    if (!target?.media || target.media.type !== "image") return;
    const currentItems =
      target.media.items && target.media.items.length > 0
        ? target.media.items
        : [{ url: target.media.url, name: target.media.name }];
    const nextItems = currentItems.filter((_, idx) => idx !== itemIndex);
    const nextMedia = buildImageMediaFromItems(nextItems);

    setMessages((prev) =>
      prev.map((msg, index) => {
        if (index !== messageIndex) return msg;
        return { ...msg, media: nextMedia || undefined };
      }),
    );
    const historyId = (target as Message & { historyId?: string }).historyId;
    if (historyId) {
      await persistHistoryMedia(historyId, nextMedia);
    }
    return nextItems;
  };

  const handleRequestDeleteMediaItem = (messageIndex: number, itemIndex: number) => {
    setDeleteImageTarget({ messageIndex, itemIndex });
    setIsDeleteImageConfirmOpen(true);
  };

  const handleRequestDeleteCarouselImage = () => {
    if (carouselMessageIndex === null) return;
    handleRequestDeleteMediaItem(carouselMessageIndex, carouselIndex);
  };

  const handleCancelDeleteImage = () => {
    setIsDeleteImageConfirmOpen(false);
    setDeleteImageTarget(null);
  };

  const handleConfirmDeleteImage = async () => {
    if (!deleteImageTarget) return;
    setIsDeleteImageConfirmOpen(false);
    const { messageIndex, itemIndex } = deleteImageTarget;
    setDeleteImageTarget(null);
    const nextItems = await deleteImageAtIndex(messageIndex, itemIndex);
    if (!nextItems || !isImageCarouselOpen || carouselMessageIndex !== messageIndex) return;
    if (nextItems.length === 0) {
      closeImageCarousel();
      return;
    }
    setCarouselItems(nextItems);
    setCarouselIndex((current) => Math.min(current, nextItems.length - 1));
  };

  const resolvePostTitle = (content: string) => {
    const stopWords =
      activeLocale === "es"
        ? new Set([
            "para",
            "como",
            "pero",
            "sobre",
            "este",
            "esta",
            "estos",
            "estas",
            "cuando",
            "donde",
            "desde",
            "hasta",
            "porque",
            "dentro",
            "fuera",
            "entre",
            "sobre",
            "tiene",
            "tener",
            "puede",
            "pueden",
            "hacer",
            "hace",
            "hacia",
            "mucho",
            "muchos",
            "muchas",
            "todo",
            "toda",
            "todos",
            "todas",
            "algo",
            "algun",
            "alguna",
            "algunos",
            "algunas",
            "para",
            "por",
            "con",
            "sin",
            "sus",
            "las",
            "los",
            "una",
            "uno",
            "unos",
            "unas",
            "que",
            "del",
            "el",
            "la",
            "y",
            "o",
            "u",
            "en",
            "a",
            "de",
          ])
        : new Set([
            "about",
            "above",
            "after",
            "again",
            "against",
            "because",
            "before",
            "below",
            "between",
            "could",
            "should",
            "would",
            "their",
            "there",
            "these",
            "those",
            "this",
            "that",
            "with",
            "without",
            "your",
            "yours",
            "from",
            "into",
            "over",
            "under",
            "about",
            "than",
            "then",
            "when",
            "where",
            "while",
            "which",
            "what",
            "have",
            "has",
            "will",
            "just",
            "like",
            "more",
            "most",
            "some",
            "such",
            "the",
            "and",
            "for",
            "are",
            "was",
            "were",
            "you",
            "our",
            "out",
            "too",
            "but",
            "not",
            "all",
            "any",
            "can",
            "its",
            "yet",
            "may",
            "one",
            "two",
            "new",
            "use",
            "how",
            "why",
            "who",
            "whoa",
            "with",
            "into",
            "from",
            "over",
            "under",
            "on",
            "in",
            "to",
            "of",
            "is",
            "it",
            "as",
            "at",
            "be",
          ]);
    const templates =
      activeLocale === "es"
        ? [
            "La clave de {keyword}",
            "El secreto de {keyword}",
            "Cómo impulsar {keyword}",
            "{keyword}: lo que nadie te dijo",
            "Guía rápida de {keyword}",
          ]
        : [
            "The key to {keyword}",
            "The secret to {keyword}",
            "How to boost {keyword}",
            "{keyword}: what no one tells you",
            "Quick guide to {keyword}",
          ];
    const normalizeText = (text: string) =>
      text
        .toLowerCase()
        .replace(/[#*_`>]/g, " ")
        .replace(/[^\p{L}\p{N}\s]/gu, " ");
    const extractKeywords = (text: string) => {
      const words = normalizeText(text)
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stopWords.has(word));
      const counts = new Map<string, number>();
      words.forEach((word) => {
        counts.set(word, (counts.get(word) ?? 0) + 1);
      });
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
        .map(([word]) => word);
    };
    const hash = (value: string) =>
      value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
    const clampText = (value: string, max: number) =>
      value.length <= max ? value : `${value.slice(0, max - 1)}…`;
    const firstLine = content
      .split("\n")
      .find((line) => line.trim().length > 0) ?? "";
    const cleaned = firstLine.replace(/^#+\s*/, "").trim();
    const fallback = content.trim().slice(0, 140);
    const keywords = extractKeywords(`${cleaned}\n${content}`);
    const keywordPhrase = keywords.slice(0, 2).join(" ").trim();
    const safeKeyword =
      keywordPhrase ||
      cleaned ||
      (activeLocale === "es" ? "tu publicación" : "your post");
    const templateIndex = Math.abs(hash(content)) % templates.length;
    const rawTitle = templates[templateIndex].replace("{keyword}", safeKeyword);
    const trimmedTitle = clampText(rawTitle, 70);
    if (trimmedTitle.trim().length >= 12) {
      return trimmedTitle;
    }
    const baseTitle = cleaned || fallback || t('labels.postTopic');
    return clampText(baseTitle, 70);
  };

  const handleGenerateImage = async (values: ImagePromptFormValues) => {
    if (
      !messageForImage ||
      !selectedImageStyleId ||
      values.extraContext.trim().length === 0
    )
      return;
    const existingImageCount =
      messageForImage.media?.type === "image"
        ? messageForImage.media.items?.length ?? 1
        : 0;
    const extraContext = values.extraContext.trim();
    const characterNames = values.characters
      .map((item) => item.name.trim())
      .filter((name) => name.length > 0)
      .slice(0, CHARACTER_LIMIT);
    const selectedProfile = voiceProfiles.find((profile) => profile.id === selectedProfileId);
    const languageInstruction = selectedProfile?.language
      ? t('prompts.mandatoryLanguage', { language: selectedProfile.language })
      : "";
    const visualGuidance = t('prompts.creativeDirection');
    const textLegibility = t('prompts.textLegibility');
    const isSketchStyle = selectedImageStyle?.id === "sketch";
    const isCaricatureStyle = selectedImageStyle?.id === "caricatura";
    const isNeonStyle = selectedImageStyle?.id === "neon";
    const isIsometricStyle = selectedImageStyle?.id === "isometrico";
    const isRetroStyle = selectedImageStyle?.id === "retro";
    const isWatercolorStyle = selectedImageStyle?.id === "acuarela";
    const is3DModernStyle = selectedImageStyle?.id === "3d-modern";
    const isGraphicsStyle = selectedImageStyle?.id === "graficas";
    const isNoirStyle = selectedImageStyle?.id === "noir";
    const isPhotographyStyle = selectedImageStyle?.id === "fotografia";
    const isMinimalistStyle = selectedImageStyle?.id === "minimalista";
    const isFuturistStyle = selectedImageStyle?.id === "futurista";
    const isCyberpunkStyle = selectedImageStyle?.id === "cyberpunk";
    const isFlatStyle = selectedImageStyle?.id === "plano";
    const isComicStyle = selectedImageStyle?.id === "comic";
    const isPastelStyle = selectedImageStyle?.id === "pastel";
    const isVintageStyle = selectedImageStyle?.id === "vintage";
    const isLowPolyStyle = selectedImageStyle?.id === "low-poly";
    const isSurrealistStyle = selectedImageStyle?.id === "surrealista";
    const isCustomStyle = isSketchStyle || isCaricatureStyle || isNeonStyle || isIsometricStyle || isRetroStyle || isWatercolorStyle || is3DModernStyle || isGraphicsStyle || isNoirStyle || isPhotographyStyle || isMinimalistStyle || isFuturistStyle || isCyberpunkStyle || isFlatStyle || isComicStyle || isPastelStyle || isVintageStyle || isLowPolyStyle || isSurrealistStyle;
    const includeTitleInstruction =
      values.includePostTitle.trim().length > 0
        ? t('prompts.includePostTitle')
        : t('prompts.excludePostTitle');
    const titleLine =
      values.includePostTitle.trim().length > 0
        ? `${t('labels.postTitle')}: ${values.includePostTitle.trim()}`
        : "";
    const topicLine =
      messageForImage.content
        .split("\n")
        .find((line) => line.trim().length > 0) ?? "";
    const topicCleaned = topicLine.replace(/^#+\s*/, "").trim();
    const topicSource = topicCleaned || messageForImage.content.trim();
    const topicForPrompt =
      topicSource.length > 140 ? `${topicSource.slice(0, 139)}…` : topicSource;
    const sketchPrompt = `hand drawn pencil sketch illustration representing ${topicForPrompt}, cute minimal cartoon character interacting with the scene, loose graphite pencil lines, soft shading, monochrome warm beige with one strong accent color, simple cozy environment with minimal furniture and objects, sketchbook paper texture, playful and friendly style, editorial blog illustration, clean and balanced composition.`;
    const caricaturePrompt = `Beautiful cartoon vector illustration depicting ${topicForPrompt}, clean vector design, semi-hard black outlines, intense black line art, rounded shapes, soft color palette, flat shading, simple and friendly composition, objects or characters related to the topic, pure white background, modern editorial blog illustration style.`;
    const neonPrompt = `futuristic neon geometric illustration representing ${topicForPrompt}, bold geometric shapes and abstract forms, vibrant neon gradients in blue, pink and green, glowing light effects, dark background, high contrast cyberpunk aesthetic, modern tech style, dynamic composition, digital art hero image`;
    const isometricPrompt = `clean 3D isometric illustration representing ${topicForPrompt}, viewed from a consistent 30-degree isometric angle, precise parallel lines, crisp edges, geometric shapes, flat colors with subtle gradients, modern minimal composition, clean tech aesthetic, detailed isometric environment, modern SaaS style hero illustration`;
    const retroPrompt = `Ilustración retro vintage que representa ${topicForPrompt}, estética nostálgica inspirada en los años 70 y 80, paleta de colores apagados, tonos cálidos, colores ligeramente descoloridos, composición estilo póster vintage, textura sutil de grano de película, iluminación suave, atmósfera nostálgica, diseño retro clásico`;
    const watercolorPrompt = `Pintura de acuarela suave que representa ${topicForPrompt}, lavados de color delicados, sangrados de color orgánicos, bordes fluidos, pigmentos transparentes en capas, textura de papel de acuarela visible, imperfecciones artísticas, paleta natural suave, estilo de ilustración artesanal, elegante obra de arte en acuarela`;
    const modern3dPrompt = `modern 3D render illustration representing ${topicForPrompt}, smooth 3D surfaces, abstract objects related to the topic, soft studio lighting, subtle reflections, soft realistic shadows, minimal composition, clean materials, modern tech aesthetic, professional 3D rendered scene`;
    const graphicsPrompt = `modern data visualization about ${topicForPrompt}, clean infographic style, beautiful charts and graphs, minimal design, balanced layout, modern color palette, smooth gradients, clear labels, professional dashboard aesthetic, high contrast, elegant and readable`;
    const noirPrompt = `film noir style image about ${topicForPrompt}, dramatic black and white lighting, high contrast shadows, cinematic atmosphere, moody composition, mysterious mood, vintage 1940s aesthetic, deep shadows, light through blinds, classic detective noir style, grainy film texture`;
    const photographyPrompt = `ultra realistic photograph of ${topicForPrompt}, professional DSLR photography, natural lighting, sharp focus, shallow depth of field, realistic textures and details, authentic colors, high resolution, 50mm lens, real life photography`;
    const minimalistPrompt = `minimalist artistic style representing ${topicForPrompt}, clean lines, negative space, simple geometric forms, neutral color palette, balanced composition, elegant and sophisticated, modern design aesthetic, soft lighting, uncluttered visual`;
    const futuristPrompt = `futuristic sci-fi illustration about ${topicForPrompt}, high-tech aesthetic, sleek metallic surfaces, holograms, floating UI elements, futuristic city background, neon accents, advanced technology, cinematic lighting, hyper-realistic detail`;
    const cyberpunkPrompt = `cyberpunk style illustration of ${topicForPrompt}, night city setting, neon rain, high-tech low-life aesthetic, vibrant pink and blue neon lights, futuristic cybernetic details, gritty atmosphere, urban environment, cinematic lighting, detailed digital art`;
    const flatPrompt = `flat design illustration representing ${topicForPrompt}, vector art style, solid colors, no gradients, clean shapes, bold colors, simple composition, modern UI illustration, corporate art style, 2D vector graphics`;
    const comicPrompt = `comic book style illustration of ${topicForPrompt}, bold black outlines, halftone patterns, dynamic action lines, vibrant comic colors, speech bubbles (optional), dramatic angles, superhero comic aesthetic, expressive characters, detailed ink work`;
    const pastelPrompt = `soft pastel color illustration about ${topicForPrompt}, gentle dreamlike atmosphere, light airy colors, smooth textures, whimsical style, delicate details, mint greens and baby blues, soothing visual, artistic painting style`;
    const vintagePrompt = `vintage 1950s poster style illustration of ${topicForPrompt}, distressed texture, muted colors, retro typography feel, classic advertising look, aged paper effect, nostalgic atmosphere, old-school design elements`;
    const lowPolyPrompt = `low poly 3D art representing ${topicForPrompt}, geometric polygon mesh, sharp edges, faceted surfaces, vibrant colors, digital art style, 3D game asset aesthetic, isometric perspective (optional), clean and abstract`;
    const surrealistPrompt = `surrealist digital art about ${topicForPrompt}, dreamlike scene, impossible physics, melting objects, mysterious atmosphere, dali-inspired, weird and wonderful, hyper-realistic textures in unreal combinations, artistic imagination`;
    const basePrompt = isSketchStyle
      ? sketchPrompt
      : isCaricatureStyle
        ? caricaturePrompt
        : isNeonStyle
          ? neonPrompt
          : isIsometricStyle
            ? isometricPrompt
            : isRetroStyle
              ? retroPrompt
              : isWatercolorStyle
                ? watercolorPrompt
                : is3DModernStyle
                  ? modern3dPrompt
                  : isGraphicsStyle
                    ? graphicsPrompt
                    : isNoirStyle
                      ? noirPrompt
                      : isPhotographyStyle
                        ? photographyPrompt
                        : isMinimalistStyle
                          ? minimalistPrompt
                          : isFuturistStyle
                            ? futuristPrompt
                            : isCyberpunkStyle
                              ? cyberpunkPrompt
                              : isFlatStyle
                                ? flatPrompt
                                : isComicStyle
                                  ? comicPrompt
                                  : isPastelStyle
                                    ? pastelPrompt
                                    : isVintageStyle
                                      ? vintagePrompt
                                      : isLowPolyStyle
                                        ? lowPolyPrompt
                                        : isSurrealistStyle
                                          ? surrealistPrompt
                                          : messageForImage.content.trim();
    const promptParts = [
      basePrompt,
      extraContext ? `${t('labels.extraContext')}: ${extraContext}` : "",
      characterNames.length > 0
        ? `${t('labels.characters')}:\n${characterNames
            .map((name, index) => `${index + 1}. ${name}`)
            .join("\n")}`
        : "",
      !isCustomStyle && selectedImageStyle
        ? `${t('labels.imageStyle')}: ${t(`imageStyles.${selectedImageStyle.id}`)}`
        : "",
      titleLine,
      languageInstruction,
      includeTitleInstruction,
      textLegibility,
      isCustomStyle ? "" : visualGuidance,
      t('prompts.formatSquare'),
    ].filter(Boolean);
    const finalPrompt = promptParts.join("\n\n");
    setImagePromptPreviewValue(finalPrompt);
    setIsGeneratingImage(true);
    setIsImageModalOpen(false);
    setImageGenerationError(null);
    setGeneratedImageUrl(null);
    try {
      const payload: ImageGenerationRequest = {
        prompt: finalPrompt,
        size: "1024x1024",
        quality: "auto",
      };
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as ImageGenerationResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || t('errors.imageGeneration'));
      }
      const resizedImage = await resizeImageDataUrl(data.imageUrl, 512);
      setGeneratedImageUrl(resizedImage);
      if (messageForImageIndex !== null) {
        const aiName = t('aiImageName');
        const aiItem = { url: resizedImage, name: aiName };
        const nextMedia = buildNextAiImageMedia(messageForImage.media, aiItem, aiName);
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === messageForImageIndex ? { ...msg, media: nextMedia } : msg,
          ),
        );
        const historyId = (messageForImage as Message & { historyId?: string }).historyId;
        if (historyId) {
          await persistHistoryMedia(historyId, nextMedia);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('errors.imageGeneration');
      setImageGenerationError(message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAddCharacter = () => {
    const name = characterInputValue.trim().slice(0, CHARACTER_NAME_MAX);
    if (!name || characterFields.length >= CHARACTER_LIMIT) return;
    appendCharacter({ name });
    setImagePromptValue("characterInput", "");
  };

  const blobToBase64 = async (blobUrl: string): Promise<string> => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(",")[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const resizeImageDataUrl = (dataUrl: string, size: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error(t('errors.imageProcessing')));
          return;
        }
        context.drawImage(image, 0, 0, size, size);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => reject(new Error(t('errors.imageProcessing')));
      image.src = dataUrl;
    });
  };

  const confirmSchedule = async () => {
    if (!scheduledDate) {
      setScheduleError("Por favor selecciona una fecha y hora");
      return;
    }
    
    if (!messageToSchedule) return;

    if (scheduleProfile && !user) {
      setScheduleProfile(false);
    }

    if (schedulePageUrns.length > 0) {
      if (!pageSettings?.configured) {
        alert("Configura el token y URN de la página antes de programar.");
        return;
      }

      if (schedulePageUrns.length === 0) {
        alert("Selecciona una o más páginas antes de programar.");
        return;
      }
    }

    if (!scheduleProfile && schedulePageUrns.length === 0) {
      alert(t('errors.selectProfileOrPage'));
      return;
    }

    try {
      setIsScheduling(true);
      
      let mediaData = undefined;
      if (messageToSchedule.media) {
        try {
          const mediaType = messageToSchedule.media.type;
          const mediaItems =
            mediaType === "image" &&
            messageToSchedule.media.items &&
            messageToSchedule.media.items.length > 0
              ? messageToSchedule.media.items.slice(0, 9)
              : [{ url: messageToSchedule.media.url, name: messageToSchedule.media.name }];

          if (mediaType === "image" && mediaItems.length > 1) {
            const processedItems = await Promise.all(
              mediaItems.map(async (item) => {
                const response = await fetch(item.url);
                const blob = await response.blob();
                const base64 = await blobToBase64(item.url);
                return {
                  base64,
                  name: item.name,
                  mime: blob.type || null,
                };
              })
            );

            mediaData = {
              base64: JSON.stringify(processedItems),
              type: mediaType,
              name: messageToSchedule.media.name,
            };
          } else {
            const base64 = await blobToBase64(messageToSchedule.media.url);
          mediaData = {
            base64,
              type: mediaType,
              name: messageToSchedule.media.name,
          };
          }
        } catch (e) {
          console.error("Error processing media:", e);
          alert(t('errors.attachmentError'));
          setIsScheduling(false);
          return;
        }
      }

      const pagesForTargets = pageSettings?.pages?.length
        ? pageSettings.pages
        : pageSettings?.page
          ? [pageSettings.page]
          : [];
      const resolveTargetInfo = (
        targetValue: "profile" | "page",
        pageUrn: string | null,
      ): { targetName: string | null; targetImage: string | null } => {
        if (targetValue === "page" && pageUrn) {
          const page = pagesForTargets.find((item) => item.urn === pageUrn);
          return {
            targetName: page?.name ?? null,
            targetImage: page?.logoUrl ?? null,
          };
        }
        return {
          targetName: user?.name ?? null,
          targetImage: user?.picture ?? null,
        };
      };

      const scheduleTargets: Array<{
        target: "profile" | "page";
        pageUrn: string | null;
        targetName: string | null;
        targetImage: string | null;
      }> = [];
      if (scheduleProfile) {
        const info = resolveTargetInfo("profile", null);
        scheduleTargets.push({
          target: "profile",
          pageUrn: null,
          targetName: info.targetName,
          targetImage: info.targetImage,
        });
      }
      schedulePageUrns.forEach((pageUrn) => {
        const info = resolveTargetInfo("page", pageUrn);
        scheduleTargets.push({
          target: "page",
          pageUrn,
          targetName: info.targetName,
          targetImage: info.targetImage,
        });
      });

      const invisibleBase = "\u200B\u200C\u2060\u2063";
      for (let index = 0; index < scheduleTargets.length; index += 1) {
        const targetValue = scheduleTargets[index];
        const contentToUse =
          targetValue.target === "page"
            ? `${messageToSchedule.content}${invisibleBase}${"\u2060".repeat(index + 1)}`
            : messageToSchedule.content;
        const response = await fetch("/api/posts/schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: contentToUse,
            media: mediaData,
            scheduledAt: scheduledDate, 
            timezone: selectedTimezone,
            voiceProfile: {
              name: messageToSchedule.voiceProfileName,
              emoji: messageToSchedule.voiceProfileEmoji,
              style: messageToSchedule.voiceProfileStyleTag,
            },
            target: targetValue.target,
            pageUrn: targetValue.pageUrn,
            targetName: targetValue.targetName,
            targetImage: targetValue.targetImage,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || t('errors.scheduleError'));
        }

        if (scheduleTargets.length > 1 && index < scheduleTargets.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      const scheduledAt = scheduledDate;
      const timezone = selectedTimezone;
      const historyId = messageToSchedule.historyId;
      const removeIndex = scheduleMessageIndex;
      if (removeIndex !== null) {
        if (historyId) {
          try {
            await fetch("/api/chat/history", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: historyId }),
            });
          } catch (error) {
            console.error("Error deleting history:", error);
          }
        }

        setMessages((prev) => {
          const next = [...prev];
          const removeIndexes = [removeIndex];
          if (removeIndex > 0 && next[removeIndex - 1]?.role === "user") {
            removeIndexes.push(removeIndex - 1);
          }
          return next.filter((_, idx) => !removeIndexes.includes(idx));
        });
      }
      setIsScheduleModalOpen(false);
      setScheduledDate("");
      setMessageToSchedule(null);
      setScheduleMessageIndex(null);
      setScheduleError(null);
      setScheduleSuccess({ scheduledAt, timezone });
    } catch (error: unknown) {
      console.error("Schedule error:", error);
      alert(getErrorMessage(error) || t('errors.scheduleError'));
    } finally {
      setIsScheduling(false);
    }
  };

  const buildPublishFormData = async (
    content: string,
    media: Message["media"] | undefined,
    extraFields?: Record<string, string>,
  ) => {
    const formData = new FormData();
    formData.append("content", content);
    if (extraFields) {
      Object.entries(extraFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    if (media) {
      const mediaType = media.type;
      if (mediaType === "image" && media.items && media.items.length > 0) {
        const items = (media.items.length > 0
          ? media.items
          : [{ url: media.url, name: media.name }]).slice(0, 9);
        const blobs = await Promise.all(
          items.map(async (item) => {
            const response = await fetch(item.url);
            const blob = await response.blob();
            return { blob, name: item.name };
          }),
        );
        blobs.forEach(({ blob, name }) => {
          formData.append("file", blob, name);
        });
        formData.append("mediaType", "image");
      } else {
        const response = await fetch(media.url);
        const blob = await response.blob();
        formData.append("file", blob, media.name);
        formData.append("mediaType", mediaType);
      }
    }

    return formData;
  };

  const handlePublish = async (
    content: string,
    media: Message["media"] | undefined,
    targets: { linkedinProfile: boolean; linkedinPage: boolean },
  ) => {
    if (isPublishing) return;

    const resolvedTargets = {
      linkedinProfile: targets.linkedinProfile && !!user,
      linkedinPage: targets.linkedinPage && !!pageSettings?.configured,
    };

    const targetList = [
      resolvedTargets.linkedinProfile ? "LinkedIn (perfil)" : null,
      resolvedTargets.linkedinPage ? "LinkedIn (página)" : null,
    ].filter(Boolean) as string[];

    if (targetList.length === 0) {
      if (!user && !pageSettings?.configured) {
        setLinkedinModalMode("publish");
        setShowLinkedinModal(true);
        return;
      }
      setPublishError("Selecciona al menos un destino válido para publicar");
      return;
    }

    if (targets.linkedinProfile && !user && !pageSettings?.configured) {
      setLinkedinModalMode("publish");
      setShowLinkedinModal(true);
      return;
    }

    if (resolvedTargets.linkedinPage && selectedPageUrns.length === 0) {
      setPublishError("Selecciona una o más páginas antes de publicar.");
      return;
    }

    setIsPublishing(true);
    setPublishError(null);

    try {
      const dedupSuffix =
        resolvedTargets.linkedinProfile && resolvedTargets.linkedinPage
          ? "\u200B\u200C\u2060\u2063"
          : "";
      if (resolvedTargets.linkedinProfile) {
        const formData = await buildPublishFormData(content, media, {
          visibility: "PUBLIC",
          target: "profile",
        });

        const response = await fetch("/api/linkedin/share", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || t('errors.unknown'));
        }
      }

      if (resolvedTargets.linkedinPage) {
        for (let index = 0; index < selectedPageUrns.length; index += 1) {
          const pageUrn = selectedPageUrns[index];
          if (!pageUrn) continue;

          if (resolvedTargets.linkedinProfile || index > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
          }

          const formData = await buildPublishFormData(
            `${content}${dedupSuffix}`,
            media,
            {
              visibility: "PUBLIC",
              target: "page",
              pageUrn,
            },
          );

          const response = await fetch("/api/linkedin/share", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || t('errors.unknown'));
          }
        }
      }

      setPublishSuccess(t('success.published', { targets: targetList.join(", ") }));
    } catch (error: unknown) {
      console.error("Error publishing:", error);
      setPublishError(t('errors.publishError', { error: getErrorMessage(error) }));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setProfileError(null);
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const selectedProfile = voiceProfiles.find(
      (p) => p.id === selectedProfileId
    );

    if (!selectedProfile) {
      setProfileError(t('errors.selectProfile'));
      return;
    }

    const userMessage: Message = { role: "user", content: trimmedInput };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const styleEmoji =
        selectedProfile.style_emoji ||
        styleEmojis[selectedProfile.style_tag] ||
        "🎯";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedInput,
          messages: nextMessages.map((message) => ({ role: message.role, content: message.content })),
          voiceProfile: {
            ...selectedProfile,
            style_emoji: styleEmoji,
          },
        }),
      });

      if (!response.ok) {
        let errorMessage = t('errors.processingRequest');
        try {
          const data = (await response.json()) as { error?: string; message?: string };
          if (data?.error) {
            errorMessage = data.error;
          } else if (data?.message) {
            errorMessage = data.message;
          }
        } catch {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        }
        throw new Error(errorMessage);
      }

      const historyIdHeader = response.headers.get("X-Chat-History-Id");
      const historyId = historyIdHeader ? historyIdHeader : undefined;

      if (!response.body) {
        throw new Error(t('errors.noAIResponse'));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let buffer = "";

      const likesBase = Math.floor(80 + Math.random() * 220);
      const commentsBase = Math.floor(likesBase * (0.08 + Math.random() * 0.07));
      const sharesBase = Math.floor(likesBase * (0.03 + Math.random() * 0.05));

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          historyId,
          voiceProfileName: selectedProfile.voice_name,
          voiceProfileStyleTag: selectedProfile.style_tag,
          voiceProfileEmoji: styleEmoji,
          voiceProfileLanguage: selectedProfile.language,
          stats: {
            likes: likesBase,
            comments: commentsBase,
            shares: sharesBase,
          },
        },
      ]);
      setStreamingAssistantIndex(nextMessages.length);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split("\n");
        
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  newMessages[newMessages.length - 1] = {
                    ...lastMsg,
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              console.error("Error parsing JSON chunk", e);
            }
          }
        }
      }
      setStreamingAssistantIndex(null);

    } catch (error) {
      console.error("Error submitting message:", error);
      const errorMessage = getErrorMessage(error);
      if (
        errorMessage.toLowerCase().includes("openai api key not found") ||
        errorMessage.toLowerCase().includes("openai_api_key")
      ) {
        setProfileError(t('errors.missingApiKey'));
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMessage || t('errors.processingRequest') },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingAssistantIndex(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const availablePages = pageSettings?.pages?.length
    ? pageSettings.pages
    : pageSettings?.page
      ? [pageSettings.page]
      : [];
  const selectedProfileForHeader = voiceProfiles.find(
    (profile) => profile.id === selectedProfileId
  );
  const selectedProfileSnapshot: VoiceProfileSnapshot | null = selectedProfileForHeader
    ? {
        name: selectedProfileForHeader.voice_name,
        style: selectedProfileForHeader.style_tag,
        language: selectedProfileForHeader.language,
        emoji:
          selectedProfileForHeader.style_emoji ||
          styleEmojis[selectedProfileForHeader.style_tag] ||
          "🎯",
      }
    : null;
  const isLinkedinProfileConnected = !!user;
  const scheduledDateTimestamp = scheduledDate ? new Date(scheduledDate).getTime() : null;
  const isScheduledDateValid =
    scheduledDateTimestamp !== null && !Number.isNaN(scheduledDateTimestamp);

  const hasSelectedPublishTarget =
    (publishTargets.linkedinProfile && isLinkedinProfileConnected) ||
    selectedPageUrns.length > 0;
  const now = Date.now();
  const isPageActive = (page: PageData) =>
    page.isValid !== false && (!page.expiresAt || page.expiresAt > now);

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans">
      {/* Toast Notifications */}
      {publishSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-xl animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">{publishSuccess}</span>
        </div>
      )}
      {maxFilesError && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-xl animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">{t('errors.maxFiles')}</span>
        </div>
      )}

      {/* Schedule Success Modal */}
      {scheduleSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            setScheduleSuccess(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <FontAwesomeIcon icon={faCheck} className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t('success.postScheduled')}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {t('success.scheduledFor')}<br/>
              <span className="font-medium text-slate-900">{scheduleSuccess.scheduledAt.replace("T", " ")} ({scheduleSuccess.timezone})</span>
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setScheduleSuccess(null)}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                {t('modals.understood')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn Modal */}
      {showLinkedinModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            setShowLinkedinModal(false);
            setLinkedinModalMode(null);
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-300 slide-in-from-bottom-4">
            <div className="bg-slate-50/50 p-8 pb-6 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0077b5] text-white shadow-lg shadow-blue-900/20 ring-4 ring-white">
                <FontAwesomeIcon icon={faLinkedin} className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {t('modals.connectAccount')}
              </h3>
              <p className="mt-3 text-base text-slate-500 leading-relaxed max-w-xs mx-auto">
                {linkedinModalMode === "schedule" &&
                  t('modals.connectForSchedule')}
                {linkedinModalMode === "publish" &&
                  t('modals.connectForPublish')}
                {!linkedinModalMode &&
                  t('modals.connectForFeatures')}
              </p>
            </div>
            
            <div className="p-8 pt-2">
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-1">
                <div className="flex flex-col gap-1">
                  {isLinkedinProfileConnected ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPublishTargets((prev) => ({
                          ...prev,
                          linkedinProfile: !prev.linkedinProfile,
                        }));
                      }}
                      className={`group flex items-center gap-4 rounded-xl border p-3 text-left transition-all duration-200 ${
                        publishTargets.linkedinProfile
                          ? "border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm ring-1 ring-blue-500/20"
                          : "border-transparent bg-transparent text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-bold text-slate-600 ring-2 ring-white shadow-sm transition-transform group-hover:scale-105">
                        {user?.picture ? (
                          <Image
                            src={getProxiedImageUrl(user.picture) || user.picture}
                            alt={user.name || t('labels.profile')}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            unoptimized={!!getProxiedImageUrl(user.picture)?.startsWith('/api/proxy-image')}
                          />
                        ) : (
                        (user?.name || "P").charAt(0).toUpperCase()
                      )}
                      {publishTargets.linkedinProfile && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 backdrop-blur-[1px]">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                            <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate text-base font-bold text-slate-900">
                        {user?.name || t('labels.personalProfile')}
                      </span>
                      <span className="truncate text-xs font-medium text-slate-500">
                        {user?.headline || t('labels.personalLinkedIn')}
                      </span>
                    </div>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        publishTargets.linkedinProfile
                          ? "border-blue-500 bg-blue-500 text-white scale-110"
                          : "border-slate-200 bg-white group-hover:border-slate-300"
                      }`}>
                        {publishTargets.linkedinProfile && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push("/api/auth/linkedin")}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#0077b5] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#006097] hover:shadow-blue-900/30 active:scale-[0.98]"
                    >
                      <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
                      {t('buttons.connectPersonalProfile')}
                    </button>
                  )}

                  {availablePages.map((page) => {
                    const pageIsActive = isPageActive(page);
                    return (
                    <button
                      key={page.urn}
                      type="button"
                      disabled={!pageIsActive}
                      onClick={() => {
                        if (!pageIsActive) return;
                        setSelectedPageUrns((current) => {
                          if (current.includes(page.urn)) {
                            return current.filter((urn) => urn !== page.urn);
                          }
                          return [...current, page.urn];
                        });
                      }}
                      className={`group flex items-center gap-4 rounded-xl border p-3 text-left transition-all duration-200 ${
                        !pageIsActive
                          ? "opacity-50 cursor-not-allowed bg-slate-50 border-transparent"
                          : selectedPageUrns.includes(page.urn)
                            ? "border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm ring-1 ring-blue-500/20"
                            : "border-transparent bg-transparent text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-bold text-slate-600 ring-2 ring-white shadow-sm transition-transform group-hover:scale-105">
                        {page.logoUrl ? (
                          <Image
                            src={getProxiedImageUrl(page.logoUrl) || page.logoUrl}
                            alt={page.name || t('defaults.page')}
                            width={48}
                            height={48}
                            className={`h-full w-full object-cover ${
                              !pageIsActive ? "grayscale" : ""
                            }`}
                            unoptimized={!!getProxiedImageUrl(page.logoUrl)?.startsWith('/api/proxy-image')}
                          />
                        ) : (
                          (page.name || "P").charAt(0).toUpperCase()
                        )}
                        {pageIsActive && selectedPageUrns.includes(page.urn) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 backdrop-blur-[1px]">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                              <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <span className="truncate text-base font-bold text-slate-900">
                          {page.name || t('defaults.linkedinPage')}
                        </span>
                        <span className="truncate text-xs font-medium text-slate-500">
                          {page.description || t('defaults.corporatePage')}
                        </span>
                      </div>
                      {pageIsActive ? (
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                          selectedPageUrns.includes(page.urn) 
                            ? "border-blue-500 bg-blue-500 text-white scale-110" 
                            : "border-slate-200 bg-white group-hover:border-slate-300"
                        }`}>
                          {selectedPageUrns.includes(page.urn) && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-rose-300 bg-rose-50 text-rose-500">
                          <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  )})}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkedinModal(false);
                    setLinkedinModalMode(null);
                  }}
                  className="flex-1 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkedinModal(false);
                    setLinkedinModalMode(null);
                    router.push("/api/auth/linkedin");
                  }}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-[#0077b5] px-4 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-900/20 hover:bg-[#006097] hover:shadow-2xl hover:shadow-blue-900/30 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                >
                  <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
                  {t('buttons.connectLinkedIn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Messages Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-4">
          {hasMoreHistory && messages.length > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={loadMoreHistory}
                disabled={isLoadingHistory}
                className="rounded-full border border-transparent bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingHistory ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                ) : (
                  "Ver más"
                )}
              </button>
            </div>
          )}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl shadow-blue-500/30 ring-4 ring-white">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="h-9 w-9" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {t('prompts.whatOnMind')}
              </h2>
              <p className="mt-4 max-w-md text-lg text-slate-500 leading-relaxed">
                {t('prompts.ideaHelp')}
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              if (message.role === "user") {
                 return (
                  <div key={index} className="flex justify-end px-4 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="group relative max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-900 px-5 py-3.5 text-white shadow-md transition-all hover:shadow-lg">
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div className="absolute -right-1 top-0 h-3 w-3 bg-slate-900 [clip-path:polygon(0_0,100%_0,0_100%)]"></div>
                    </div>
                  </div>
                );
              }
              const normalizedContent = message.content.toLowerCase();
              const isInsufficientCredits =
                normalizedContent.includes("créditos insuficientes") ||
                normalizedContent.includes("insufficient credits");

              const resolvedProfile: VoiceProfileSnapshot | null =
                message.voiceProfileName
                  ? {
                      name: message.voiceProfileName,
                      style: message.voiceProfileStyleTag || "",
                      language: message.voiceProfileLanguage,
                      emoji:
                        message.voiceProfileEmoji ||
                        (message.voiceProfileStyleTag
                          ? styleEmojis[message.voiceProfileStyleTag]
                          : undefined),
                    }
                  : selectedProfileSnapshot;
              return (
                <div key={index} className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-900/5 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {/* Header con perfil de voz */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-blue-50 px-5 py-4 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-slate-200/60 transition-transform hover:scale-105">
                        {resolvedProfile?.emoji ||
                          (resolvedProfile?.style
                            ? styleEmojis[resolvedProfile.style]
                            : undefined) ||
                          "🤖"}
                      </div>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-800">
                            {resolvedProfile?.name || t('labels.aiAssistant')}
                          </h3>
                          {resolvedProfile?.language && (
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 ring-1 ring-inset ring-slate-500/10">
                              {resolvedProfile.language}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {resolvedProfile?.style && (
                            <span className="font-medium text-blue-600">
                              {resolvedProfile.style}
                            </span>
                          )}
                          {resolvedProfile?.style && <span className="text-slate-300">•</span>}
                          <span className="font-medium text-slate-400">
                             {t('labels.generatedWithAI')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                      <FontAwesomeIcon icon={faEllipsis} className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    {editingMessageIndex === index ? (
                      <div className="flex flex-col gap-3">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-900 shadow-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                          rows={8}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            {t("buttons.cancel")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(index)}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/10 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98]"
                          >
                            <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                            {t("buttons.saveChanges")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                          {streamingAssistantIndex === index ? (
                            <div className="flex items-center gap-2 text-slate-400 italic py-2">
                              <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                              <span>Generando contenido...</span>
                            </div>
                          ) : (
                            message.content
                          )}
                        </div>
                        {isInsufficientCredits && (
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4 text-amber-600" />
                              <span>Créditos insuficientes para esta operación.</span>
                            </div>
                            <Link
                              href={`/${params?.id ?? ""}/billing`}
                              className="rounded-lg bg-amber-200 px-3 py-1.5 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-300"
                            >
                              Comprar créditos
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Media and Loading Display */}
                  {(message.media || (isGeneratingImage && messageForImageIndex === index)) && (
                    <div className="w-full px-5 pb-5 sm:px-6 sm:pb-6">
                      <div className="relative w-full">
                        {/* Media Display */}
                        {message.media && (
                          <div className="w-full">
                            {message.media.type === "image" ? (() => {
                        const mediaItems =
                          message.media.items && message.media.items.length > 0
                            ? message.media.items
                            : [{ url: message.media.url, name: message.media.name }];

                        const displayedItems = mediaItems.slice(0, 4);
                        const extraCount = Math.max(0, mediaItems.length - displayedItems.length);
                        const primaryItem = mediaItems[0];

                        return (
                          <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                            {mediaItems.length > 1 ? (
                              <div className="grid grid-cols-2 gap-0.5 bg-slate-100">
                                {displayedItems.map((item, itemIndex) => (
                                  <div
                                    key={`${item.url}-${itemIndex}`}
                                    className="group relative aspect-square overflow-hidden bg-slate-100"
                                  >
                                    <button
                                      type="button"
                                    onClick={() => openImageCarousel(mediaItems, itemIndex, index)}
                                      className="absolute inset-0"
                                    >
                                      <Image
                                        src={item.url}
                                        alt={item.name || "Imagen adjunta"}
                                        fill
                                        unoptimized
                                        sizes="(max-width: 768px) 100vw, 400px"
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                      />
                                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10">
                                        {item.name === "Imagen IA" && (
                                          <img
                                            src={item.url}
                                            alt="Imagen generada por IA"
                                            className="h-full w-full object-contain"
                                          />
                                        )}
                                      </div>
                                      {extraCount > 0 &&
                                        itemIndex === displayedItems.length - 1 && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-xl font-bold text-white backdrop-blur-sm">
                                            +{extraCount}
                                          </div>
                                        )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleRequestDeleteMediaItem(index, itemIndex);
                                      }}
                                      className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm transition hover:bg-white"
                                    >
                                      <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="group relative aspect-video w-full overflow-hidden bg-slate-100">
                                <button
                                  type="button"
                                  onClick={() => openImageCarousel(mediaItems, 0, index)}
                                  className="absolute inset-0"
                                >
                                  <Image
                                    src={primaryItem?.url || message.media.url}
                                    alt={primaryItem?.name || message.media.name || "Imagen adjunta"}
                                    fill
                                    unoptimized
                                    sizes="(max-width: 768px) 100vw, 600px"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10">
                                    {primaryItem?.name === "Imagen IA" && (
                                      <img
                                        src={primaryItem.url}
                                        alt="Imagen generada por IA"
                                        className="h-full w-full object-contain"
                                      />
                                    )}
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleRequestDeleteMediaItem(index, 0);
                                  }}
                                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm transition hover:bg-white"
                                >
                                  <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })() : null}
                      
                      {message.media.type === "video" && (
                        <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                          <div className="relative aspect-video w-full bg-slate-900">
                            <video
                              src={message.media.items?.[0]?.url || message.media.url}
                              controls
                              className="h-full w-full"
                            />
                          </div>
                        </div>
                      )}
                      {message.media.type === "document" && (
                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-red-500 shadow-sm ring-1 ring-slate-200">
                            <FontAwesomeIcon icon={faFile} className="h-6 w-6" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-semibold text-slate-900">{message.media.name}</p>
                            <p className="text-xs font-medium text-slate-500">Documento adjunto</p>
                          </div>
                          <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm transition-all">
                             <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4 -rotate-45" />
                          </button>
                        </div>
                      )}
                           </div>
                         )}

                         {/* Loading Image Display overlay - shown ABOVE images when media exists */}
                        {isGeneratingImage && messageForImageIndex === index && (
                          <div className={`${message.media ? 'absolute inset-0 z-10' : 'relative mt-3 aspect-video'} flex w-full items-center justify-center overflow-hidden rounded-xl bg-black/80`}>
                            <div className="flex flex-col items-center gap-2">
                              <FontAwesomeIcon icon={faImage} className="text-4xl text-slate-300 animate-pulse" />
                              <span className="text-xs font-medium text-slate-400 animate-pulse">
                                {t('labels.generatingImagePosition', { position: (currentImageCount || 0) + 1 })}
                              </span>
                            </div>
                          </div>
                        )}
                       </div>
                     </div>
                   )}

                  {/* Utility Toolbar */}
                  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => handleFileSelect(index, 'image')}
                        disabled={streamingAssistantIndex === index}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-600 hover:text-white hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t("buttons.addImage")}
                      >
                        <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleFileSelect(index, 'video')}
                        disabled={streamingAssistantIndex === index}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-600 hover:text-white hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t("buttons.addVideo")}
                      >
                        <FontAwesomeIcon icon={faVideo} className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleFileSelect(index, 'document')} 
                        disabled={streamingAssistantIndex === index}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-600 hover:text-white hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                        title={t("buttons.addDocument")}
                      >
                        <FontAwesomeIcon icon={faFile} className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                      <button
                        onClick={() => handleEditPost(message, index)}
                        disabled={streamingAssistantIndex === index}
                        className="group flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
                        {t("buttons.edit")}
                      </button>
                      <button
                        onClick={() => {
                          if (!message.content.trim()) return;
                          handleOpenImageModal(message, index);
                        }}
                        disabled={streamingAssistantIndex === index}
                        className="group flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                      >
                        <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
                        {t("buttons.generateImage")}
                      </button>
                      <button
                        onClick={() => {
                          if (!user && !pageSettings?.configured) {
                            setLinkedinModalMode("schedule");
                            setShowLinkedinModal(true);
                            return;
                          }
                          if (isScheduling) return;
                          handleSchedule(message, index);
                        }}
                        disabled={streamingAssistantIndex === index}
                        className="group flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                      >
                        <FontAwesomeIcon icon={faCalendarDays} className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
                        {t("buttons.schedule")}
                      </button>
                      <button
                        onClick={() => handleArchivePost(message, index)}
                        disabled={streamingAssistantIndex === index}
                        className="group flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                      >
                        <FontAwesomeIcon icon={faBoxArchive} className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
                        {t("buttons.archive")}
                      </button>
                      <button
                        onClick={() => {
                          if (!message.content.trim()) return;
                          setMessageToPublish(message);
                          setIsPublishPreviewOpen(true);
                        }}
                        disabled={isPublishing || streamingAssistantIndex === index}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/10 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                      >
                        {isPublishing ? (
                          <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
                        )}
                        {isPublishing ? t("buttons.publishing") : t("buttons.publish")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
                    )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white animate-pulse">
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Generando post...</h3>
                  <p className="text-sm text-zinc-500">Estamos procesando tu solicitud</p>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {isPublishPreviewOpen && messageToPublish && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center  bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl  bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                  <FontAwesomeIcon icon={faPaperPlane} className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Vista previa de publicación
                  </h2>
                  <p className="text-xs font-medium text-slate-500">Revisa cómo se verá tu post antes de publicar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isPublishing) return;
                  setIsPublishPreviewOpen(false);
                  setMessageToPublish(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all"
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto p-6 bg-slate-50/30">
              <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-100 ring-2 ring-white shadow-sm">
                        {user?.picture ? (
                          <Image
                            src={getProxiedImageUrl(user.picture) || user.picture}
                            alt={user.name || "User"}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            unoptimized={!!getProxiedImageUrl(user.picture)?.startsWith('/api/proxy-image')}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-base font-bold text-slate-500">
                             {messageToPublish.voiceProfileEmoji && (
                            <span className="text-sm">
                              {messageToPublish.voiceProfileEmoji}
                            </span>
                          )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col pt-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {user?.name ||
                              messageToPublish.voiceProfileName ||
                              "Nombre de usuario"}
                          </span>
                         
                          <span className="flex items-center gap-0.5 rounded-[2px] bg-[#0a66c2] px-[4px] py-[1px] text-[10px] font-bold text-white shadow-sm">
                            in
                          </span>
                        </div>
                        {user?.headline && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {user.headline}
                          </p>
                        )}

                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                          <span>1 sem</span>
                          <span>·</span>
                          <FontAwesomeIcon icon={faGlobe} className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
                      <FontAwesomeIcon icon={faEllipsis} className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
                    {messageToPublish.content}
                  </div>
                  
                  {messageToPublish.media && (
                    <div className="mt-4 w-full">
                      {messageToPublish.media.type === "image" ? (() => {
                        const mediaItems =
                          messageToPublish.media.items && messageToPublish.media.items.length > 0
                            ? messageToPublish.media.items
                            : [{ url: messageToPublish.media.url, name: messageToPublish.media.name }];

                        const displayedItems = mediaItems.slice(0, 4);
                        const extraCount = Math.max(0, mediaItems.length - displayedItems.length);
                        const primaryItem = mediaItems[0];

                        return (
                          <div className="overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                            {mediaItems.length > 1 ? (
                              <div className="grid grid-cols-2 gap-0.5 bg-slate-100">
                                {displayedItems.map((item, itemIndex) => (
                                  <button
                                    key={`${item.url}-${itemIndex}`}
                                    type="button"
                                    onClick={() => openImageCarousel(mediaItems, itemIndex, null)}
                                    className="group relative aspect-square bg-slate-100"
                                  >
                                    <Image
                                      src={getProxiedImageUrl(item.url) || item.url}
                                      alt={item.name || "Imagen adjunta"}
                                      fill
                                      unoptimized
                                      sizes="(max-width: 768px) 100vw, 400px"
                                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {extraCount > 0 && itemIndex === displayedItems.length - 1 && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-xl font-bold text-white backdrop-blur-sm">
                                        +{extraCount}
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openImageCarousel(mediaItems, 0, null)}
                                className="group relative aspect-video w-full bg-slate-100"
                              >
                                <Image
                                  src={getProxiedImageUrl(primaryItem?.url || messageToPublish.media.url) || primaryItem?.url || messageToPublish.media.url}
                                  alt={primaryItem?.name || messageToPublish.media.name || "Imagen adjunta"}
                                  fill
                                  unoptimized
                                  sizes="(max-width: 768px) 100vw, 600px"
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              </button>
                            )}
                          </div>
                        );
                      })() : null}
                    
                      {messageToPublish.media.type === "video" && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 shadow-sm">
                          <video
                            src={messageToPublish.media.items?.[0]?.url || messageToPublish.media.url}
                            controls
                            className="h-full w-full"
                          />
                        </div>
                      )}
                      {messageToPublish.media.type === "document" && (
                        <div className="mt-2 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-red-500 shadow-sm ring-1 ring-slate-200">
                            <FontAwesomeIcon icon={faFile} className="h-6 w-6" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {messageToPublish.media.items?.[0]?.name || messageToPublish.media.name}
                            </p>
                            <p className="text-xs font-medium text-slate-500">
                              Documento PDF • 2.4 MB
                            </p>
                          </div>
                          <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4 -rotate-45 text-slate-400" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#378fe9]">
                            <FontAwesomeIcon icon={faThumbsUp} className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                        <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-green-500">
                            <FontAwesomeIcon icon={faHandsClapping} className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                        <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-red-500">
                            <FontAwesomeIcon icon={faHeart} className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                      </div>
                      <span className="ml-1 font-medium hover:text-blue-600 hover:underline cursor-pointer">
                        {messageToPublish.stats?.likes || 0}
                      </span>
                    </div>
                    <div className="hover:text-blue-600 hover:underline cursor-pointer">
                      {(messageToPublish.stats?.comments ?? 0) +
                        " comentarios · " +
                        (messageToPublish.stats?.shares ?? 0) +
                        " veces compartido"}
                    </div>
                  </div>
                  
                  <div className="mt-1 flex items-center justify-between px-1 pt-1 text-xs text-slate-600">
                    <button className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-3 hover:bg-slate-100 transition-colors">
                      <FontAwesomeIcon icon={faThumbsUp} className="h-[18px] w-[18px] text-slate-500" />
                      <span className="font-semibold text-slate-500">Recomendar</span>
                    </button>
                    <button className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-3 hover:bg-slate-100 transition-colors">
                      <FontAwesomeIcon icon={faComment} className="h-[18px] w-[18px] text-slate-500" />
                      <span className="font-semibold text-slate-500">Comentar</span>
                    </button>
                    <button className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-3 hover:bg-slate-100 transition-colors">
                      <FontAwesomeIcon icon={faRetweet} className="h-[18px] w-[18px] text-slate-500" />
                      <span className="font-semibold text-slate-500">Compartir</span>
                    </button>
                    <button className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-3 hover:bg-slate-100 transition-colors">
                      <FontAwesomeIcon icon={faPaperPlane} className="h-[18px] w-[18px] text-slate-500" />
                      <span className="font-semibold text-slate-500">Enviar</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <FontAwesomeIcon icon={faGlobe} className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Destinos de publicación</h3>
                    <p className="text-xs text-slate-500">Selecciona dónde quieres publicar este contenido</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  {isLinkedinProfileConnected ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPublishTargets((prev) => ({
                          ...prev,
                          linkedinProfile: !prev.linkedinProfile,
                        }));
                      }}
                      className={`flex items-center gap-4 rounded-xl border p-3 text-left transition-all ${
                        publishTargets.linkedinProfile
                          ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm ring-1 ring-blue-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-bold text-blue-600 ring-2 ring-white shadow-sm">
                        {user?.picture ? (
                          <Image
                            src={user.picture}
                            alt={user.name || "Perfil"}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (user?.name || "P").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {user?.name || "Perfil personal"}
                        </span>
                        <span className="truncate text-xs text-slate-500">
                          {user?.headline || "LinkedIn personal"}
                        </span>
                      </div>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                        publishTargets.linkedinProfile
                          ? "border-blue-500 bg-blue-500 text-white scale-110"
                          : "border-slate-300 bg-white"
                      }`}>
                        {publishTargets.linkedinProfile && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push("/api/auth/linkedin")}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#0077b5] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#006097] hover:shadow-blue-900/30 active:scale-[0.98]"
                    >
                      <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
                      {t('buttons.connectPersonalProfile')}
                    </button>
                  )}

                  {(pageSettings?.pages?.length
                    ? pageSettings.pages
                    : pageSettings?.page
                      ? [pageSettings.page]
                      : []
                  ).map((page) => {
                    const pageIsActive = isPageActive(page);
                    return (
                      <button
                        key={page.urn}
                        type="button"
                        disabled={!pageIsActive}
                        onClick={() => {
                          if (!pageIsActive) return;
                          setSelectedPageUrns((current) =>
                            current.includes(page.urn)
                              ? current.filter((urn) => urn !== page.urn)
                              : [...current, page.urn],
                          );
                        }}
                        className={`flex items-center gap-4 rounded-xl border p-3 text-left transition-all ${
                          !pageIsActive
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : selectedPageUrns.includes(page.urn)
                              ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm ring-1 ring-blue-500/20"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-600 ring-2 ring-white shadow-sm">
                          {page.logoUrl ? (
                            <Image
                              src={page.logoUrl}
                              alt={page.name || "Página"}
                              width={40}
                              height={40}
                              className={`h-full w-full object-cover ${
                                !pageIsActive ? "grayscale opacity-80" : ""
                              }`}
                            />
                          ) : (
                            (page.name || "P").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-1 flex-col overflow-hidden">
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {page.name || page.urn}
                          </span>
                        <span className="truncate text-xs text-slate-500">
                          {page.description || "Página corporativa"}
                        </span>
                        </div>
                        {pageIsActive ? (
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                            selectedPageUrns.includes(page.urn)
                              ? "border-blue-500 bg-blue-500 text-white scale-110"
                              : "border-slate-300 bg-white"
                          }`}>
                            {selectedPageUrns.includes(page.urn) && (
                              <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                            )}
                          </div>
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-rose-300 bg-rose-50 text-rose-500">
                            <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {publishError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 animate-in slide-in-from-top-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
                    {publishError}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-5 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => {
                  if (isPublishing) return;
                  setIsPublishPreviewOpen(false);
                  setMessageToPublish(null);
                }}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                {t("buttons.cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!messageToPublish) return;
                  await handlePublish(
                    messageToPublish.content,
                    messageToPublish.media,
                    publishTargets
                  );
                  setIsPublishPreviewOpen(false);
                  setMessageToPublish(null);
                }}
                disabled={isPublishing || !hasSelectedPublishTarget}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isPublishing ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />
                )}
                {isPublishing ? t('buttons.publishing') : t('buttons.publishNow')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isImageModalOpen && messageForImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {t('modals.generateImageTitle')}
                  </h2>
                  <p className="text-xs font-medium text-slate-500">
                    {t('modals.generateImageSubtitle')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseImageModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all"
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleImageFormSubmit(handleGenerateImage)}>
              <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('labels.includePostTitle')}
                  </label>
                  <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                    <FontAwesomeIcon icon={faLightbulb} className="mt-0.5 h-3.5 w-3.5 text-blue-600" />
                    <p className="text-xs font-medium leading-relaxed text-blue-900">
                      {t('labels.imageTitleWarning')}
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      {...registerImagePrompt("includePostTitle", {
                        maxLength: {
                          value: 100,
                          message: activeLocale === "es" ? "Máximo 100 caracteres" : "Max 100 characters"
                        }
                      })}
                      placeholder={t('placeholders.imageTitle')}
                      maxLength={100}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-14 text-sm text-slate-900 outline-none ring-0 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                      {(watchImagePrompt("includePostTitle") || "").length}/100
                    </span>
                  </div>
                  {imagePromptErrors.includePostTitle && (
                    <p className="text-xs font-semibold text-rose-500">
                      {imagePromptErrors.includePostTitle.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t('labels.improveContext')}
                    </label>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                    <FontAwesomeIcon icon={faLightbulb} className="mt-0.5 h-3.5 w-3.5 text-blue-600" />
                    <p className="text-xs font-medium leading-relaxed text-blue-900">
                      {t('labels.improveContextWarning')}
                    </p>
                  </div>
                  <div className="relative">
                    <textarea
                      {...registerImagePrompt("extraContext", {
                        required: t('errors.contextRequired'),
                        maxLength: {
                          value: IMPROVE_CONTEXT_MAX_LENGTH,
                          message: activeLocale === "es" ? `Máximo ${IMPROVE_CONTEXT_MAX_LENGTH} caracteres` : `Max ${IMPROVE_CONTEXT_MAX_LENGTH} characters`
                        }
                      })}
                      placeholder={t('placeholders.contextExample')}
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      maxLength={IMPROVE_CONTEXT_MAX_LENGTH}
                    />
                    <div className="absolute bottom-3 right-3 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-slate-400 backdrop-blur-sm">
                      {extraContextValue.length}/{IMPROVE_CONTEXT_MAX_LENGTH}
                    </div>
                  </div>
                  {imagePromptErrors.extraContext && (
                    <p className="text-xs font-semibold text-rose-500">
                      {imagePromptErrors.extraContext.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t('labels.characters')}
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {characterFields.length}/{CHARACTER_LIMIT}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                    <FontAwesomeIcon icon={faLightbulb} className="mt-0.5 h-3.5 w-3.5 text-blue-600" />
                    <p className="text-xs font-medium leading-relaxed text-blue-900">
                      {t('labels.charactersWarning')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative w-full">
                      <input
                        {...registerImagePrompt("characterInput", { maxLength: CHARACTER_NAME_MAX })}
                        placeholder={t('placeholders.characterName')}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-14 text-sm text-slate-900 outline-none ring-0 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleAddCharacter();
                          }
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                        {characterInputValue.length}/{CHARACTER_NAME_MAX}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCharacter}
                      disabled={!canAddCharacter}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-slate-900/15 transition-all hover:bg-blue-600 hover:shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                    >
                      {t('buttons.addCharacter')}
                    </button>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">
                    {t('labels.charactersLimit', { max: CHARACTER_LIMIT })}
                  </p>
                  {characterFields.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {characterFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          <span>{index + 1}.</span>
                          <span>{field.name}</span>
                          <button
                            type="button"
                            onClick={() => removeCharacter(index)}
                            className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t('labels.visualStyle')}
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {imageStyleOptions.map((style) => {
                      const isActive = selectedImageStyleId === style.id;
                      
                      if (style.image) {
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setSelectedImageStyleId(style.id)}
                            className={`group relative flex flex-col items-center justify-end overflow-hidden rounded-xl border text-left text-xs font-semibold transition-all hover:shadow-md ${
                              isActive
                                ? "border-slate-900 ring-2 ring-slate-900 ring-offset-2"
                                : "border-slate-200 hover:border-slate-300"
                            } aspect-square`}
                          >
                            <Image
                              src={style.image}
                              alt={style.label}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              sizes="(max-width: 768px) 50vw, 25vw"
                            />
                            <div className={`absolute inset-0 transition-colors ${
                              isActive ? "bg-slate-900/20" : "bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90"
                            }`} />
                            
                            <div className="relative z-10 flex w-full items-center gap-2 p-3 text-white">
                              <span className="text-lg drop-shadow-md">{style.emoji}</span>
                              <span className="truncate font-bold drop-shadow-md">{t(`imageStyles.${style.id}`)}</span>
                              {isActive && (
                                <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm">
                                   <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setSelectedImageStyleId(style.id)}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all ${
                            isActive
                              ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-lg">{style.emoji}</span>
                          <span className="truncate">{t(`imageStyles.${style.id}`)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-5 backdrop-blur-sm">
                {imageGenerationError && (
                  <p className="text-xs font-semibold text-rose-500">
                    {imageGenerationError}
                  </p>
                )}
                <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseImageModal}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedImageStyleId ||
                    isGeneratingImage ||
                    extraContextValue.trim().length === 0
                  }
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isGeneratingImage ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4" />
                  )}
                  {isGeneratingImage ? t('buttons.generating') : t('buttons.generateImage')}
                </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {isImageCarouselOpen && carouselItems.length > 0 && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/95 p-4 backdrop-blur-md animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeImageCarousel();
          }}
        >
          <div className="relative w-full max-w-6xl animate-in zoom-in-95 duration-300">
           

            <div className="relative h-[85vh] w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
              <Image
                src={carouselItems[carouselIndex]?.url}
                alt={carouselItems[carouselIndex]?.name || "Imagen"}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
              />
              {carouselMessageIndex !== null && (
                <button
                  type="button"
                  onClick={handleRequestDeleteCarouselImage}
                  className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-red-600/30 backdrop-blur-md transition hover:bg-red-600"
                >
                  <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                  {t("buttons.delete")}
                </button>
              )}
              <button
                type="button"
                onClick={closeImageCarousel}
                className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                aria-label="Cerrar"
              >
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
              </button>
              {carouselItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevCarouselImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-110 active:scale-95"
                    aria-label="Anterior"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextCarouselImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-110 active:scale-95"
                    aria-label="Siguiente"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm font-medium text-white/90">
              <div className="truncate max-w-[80%]">{carouselItems[carouselIndex]?.name}</div>
              <div className="shrink-0 rounded-full bg-white/10 px-3 py-1 backdrop-blur-md">
                {carouselIndex + 1} / {carouselItems.length}
              </div>
            </div>
          </div>
        </div>
      )}
      {isDeleteImageConfirmOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center flex flex-col justify-center items-center">
              <div className="mb-6  flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
                <FontAwesomeIcon icon={faTrash} className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{t("modals.deleteImageTitle")}</h3>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {t("modals.deleteImageDescription")}
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCancelDeleteImage}
                  className="flex-1 rounded-2xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  {t("buttons.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteImage}
                  className="flex-1 rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-700"
                >
                  {t("buttons.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Input Area */}
      <div className="sticky bottom-0 z-10 border-t border-slate-200/80 bg-white/80 p-1 md:p-4 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-col gap-1 md:gap-2 rounded-3xl border border-slate-200 bg-white p-1 md:p-3 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholders.inputPrompt')}
              className="max-h-[200px] min-h-[40px] md:min-h-[60px] w-full resize-none bg-transparent px-3 py-1.5 md:px-5 md:py-3 text-sm md:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
              rows={1}
              maxLength={CHAT_INPUT_MAX_LENGTH}
            />
            
            <div className="flex items-center justify-between gap-2 px-3 pb-1">
              <div
                ref={profileMenuRef}
                className="relative inline-flex items-center"
              >
                <button
                  type="button"
                  disabled={isLoadingProfiles || voiceProfiles.length === 0}
                  onClick={() =>
                    !isLoadingProfiles &&
                    voiceProfiles.length > 0 &&
                    setIsProfileMenuOpen((open) => !open)
                  }
                  className={[
                    "group flex max-w-[240px] items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                    isLoadingProfiles || voiceProfiles.length === 0
                      ? "cursor-not-allowed bg-blue-400 text-white"
                      : "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md"
                  ].join(" ")}
                  title={t('labels.selectVoiceProfileTitle')}
                >
                  {selectedProfileId && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-sm shadow-sm ring-1 ring-slate-200 transition-transform group-hover:scale-110">
                      {(() => {
                        const profile = voiceProfiles.find(
                          (p) => p.id === selectedProfileId
                        );
                        if (!profile) return "🎯";
                        if (profile.style_emoji) return profile.style_emoji;
                        return styleEmojis[profile.style_tag] ?? "🎯";
                      })()}
                    </span>
                  )}
                  
                  <div className="flex flex-col items-start overflow-hidden text-left">
                    <span className="truncate text-xs font-bold leading-tight text-white transition-colors">
                      {selectedProfileId
                        ? voiceProfiles.find((p) => p.id === selectedProfileId)?.voice_name ?? t('labels.selectedProfile')
                        : t('labels.chooseVoiceProfile')}
                    </span>
                    {selectedProfileId && (
                      <span className="truncate text-[10px] text-blue-100 font-medium">
                        {(() => {
                          const profile = voiceProfiles.find(
                            (p) => p.id === selectedProfileId
                          );
                          const parts = [];
                          if (profile?.style_tag) parts.push(profile.style_tag);
                          if (profile?.language) parts.push(profile.language.toUpperCase());
                          return parts.join(" • ");
                        })()}
                      </span>
                    )}
                  </div>

                  <FontAwesomeIcon icon={faChevronDown} className={`h-3 w-3 text-blue-200 ml-1 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isProfileMenuOpen && !isLoadingProfiles && voiceProfiles.length > 0 && (
                  <div className="absolute left-0 bottom-full z-20 mb-3 w-80 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200 slide-in-from-bottom-2">
                    <div className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('labels.availableProfiles')}
                    </div>
                    <div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pr-1">
                      {voiceProfiles.map((profile) => {
                        const isActive = selectedProfileId === profile.id;
                        const emoji =
                          profile.style_emoji ||
                          styleEmojis[profile.style_tag] ||
                          "🎯";
                        return (
                          <button
                            key={profile.id}
                            type="button"
                            onClick={() => {
                              setSelectedProfileId(profile.id);
                              setProfileError(null);
                              setIsProfileMenuOpen(false);
                            }}
                            className={[
                              "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200",
                              isActive
                                ? "bg-blue-500 text-white shadow-md ring-1 ring-blue-600"
                                : "bg-slate-50 text-slate-600 hover:bg-blue-500 hover:text-white hover:shadow-md"
                            ].join(" ")}
                          >
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm ring-1 transition-all ${isActive ? "ring-blue-400 scale-105" : "ring-slate-200 group-hover:ring-blue-400 group-hover:scale-105"}`}>
                              {emoji}
                            </span>
                            <div className="flex flex-col overflow-hidden">
                              <span className={`truncate text-sm font-bold ${isActive ? 'text-white' : 'text-slate-900 group-hover:text-white'}`}>
                                {profile.voice_name}
                              </span>
                              <div className={`flex items-center gap-1.5 truncate text-xs font-medium ${isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-100'}`}>
                                {profile.style_tag && <span>{profile.style_tag}</span>}
                                {profile.style_tag && profile.language && <span>•</span>}
                                {profile.language && <span className="uppercase">{profile.language}</span>}
                              </div>
                            </div>
                            {isActive && (
                              <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 border-t border-slate-100 pt-2 px-1">
                      <Link
                        href={`/${params?.id ?? ""}/voice-profiles`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} className="h-3 w-3" />
                        {t('labels.manageProfiles')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className=" group flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-blue-600 hover:shadow-blue-600/30 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100 disabled:bg-slate-900"
                >
                  {isLoading ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faArrowUp} className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
                  )}
                </button>
              </div>
            </div>
          </form>
          
          <div className="mt-1 md:mt-3 flex items-center justify-between px-2">
            {profileError && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-500 animate-in slide-in-from-top-1">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-3 w-3" />
                {profileError}
              </p>
            )}
            
            {input.length >= CHAT_INPUT_MAX_LENGTH && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-500 animate-in slide-in-from-top-1 ml-auto">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-3 w-3" />
                {activeLocale === "es" ? "Has excedido el límite de 5.000 caracteres." : "You have exceeded the limit of 5,000 characters."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                  <FontAwesomeIcon icon={faCalendarDays} className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t('modals.scheduleTitle')}</h3>
                  <p className="text-xs font-medium text-slate-500">{t('modals.scheduleSubtitle')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setScheduleError(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all"
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="grid gap-6">
                <div className="group">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 group-focus-within:text-blue-600 transition-colors">
                    {t('labels.dateAndTime')}
                  </label>
                  <div className="relative">
                    <DateTimePicker
                      value={scheduledDate}
                      onChange={(value) => {
                        setScheduledDate(value);
                        if (scheduleError) setScheduleError(null);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 group-focus-within:text-blue-600 transition-colors">
                      {t('labels.timezone')}
                    </label>
                  <div className="relative">
                    <Select
                      value={selectedTimezone}
                      onChange={setSelectedTimezone}
                      options={PREDEFINED_TIMEZONES}
                      className="w-full"
                    />
                  </div>
                  {selectedProfileId && voiceProfiles.find(p => p.id === selectedProfileId)?.timezone && (
                     <div className="mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 ring-1 ring-blue-500/10">
                       <FontAwesomeIcon icon={faGlobe} className="h-3 w-3" />
                       <span>{t('labels.suggested')}: <strong>{voiceProfiles.find(p => p.id === selectedProfileId)?.timezone?.replace(/_/g, " ")}</strong></span>
                     </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('labels.scheduleDestinations')}</h4>
                  
                  <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
                    {isLinkedinProfileConnected ? (
                      <button
                        type="button"
                        onClick={() => {
                          setScheduleProfile((current) => !current);
                        }}
                        className={`group flex items-center gap-4 rounded-xl border p-3 text-left transition-all duration-200 ${
                          scheduleProfile
                            ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-md ring-1 ring-blue-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50 hover:shadow-sm"
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 transition-all ${scheduleProfile ? "ring-blue-200 bg-blue-100" : "ring-slate-100 bg-slate-100 group-hover:ring-blue-100"}`}>
                          {user?.picture ? (
                            <Image
                              src={user.picture}
                              alt={user.name || "Perfil"}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-600">{(user?.name || "P").charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col overflow-hidden">
                          <span className="truncate text-sm font-bold text-slate-900">
                            {user?.name || t('labels.personalProfile')}
                          </span>
                          <span className="truncate text-xs font-medium text-slate-500">
                            {user?.headline || t('labels.personalLinkedIn')}
                          </span>
                        </div>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 ${
                          scheduleProfile ? "border-blue-500 bg-blue-500 text-white scale-110 shadow-sm" : "border-slate-300 bg-white group-hover:border-blue-300"
                        }`}>
                          {scheduleProfile && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push("/api/auth/linkedin")}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#0077b5] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#006097] hover:shadow-blue-900/30 active:scale-[0.98]"
                      >
                        <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
                        {t('buttons.connectPersonalProfile')}
                      </button>
                    )}

                    {availablePages.map((page) => {
                      const pageIsActive = isPageActive(page);
                      return (
                      <button
                        key={page.urn}
                        type="button"
                        disabled={!pageIsActive}
                        onClick={() => {
                          if (!pageIsActive) return;
                          setSchedulePageUrns((current) =>
                            current.includes(page.urn)
                              ? current.filter((urn) => urn !== page.urn)
                              : [...current, page.urn],
                          );
                        }}
                        className={`group flex items-center gap-4 rounded-xl border p-3 text-left transition-all duration-200 ${
                          !pageIsActive
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : schedulePageUrns.includes(page.urn)
                              ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-md ring-1 ring-blue-500/20"
                              : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50 hover:shadow-sm"
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 transition-all ${
                          !pageIsActive
                            ? "ring-white bg-slate-100"
                            : schedulePageUrns.includes(page.urn)
                              ? "ring-blue-200 bg-blue-100"
                              : "ring-slate-100 bg-slate-100 group-hover:ring-blue-100"
                        }`}>
                          {page.logoUrl ? (
                            <Image
                              src={page.logoUrl}
                              alt={page.name || "Página"}
                              width={40}
                              height={40}
                              className={`h-full w-full object-cover ${!pageIsActive ? "grayscale opacity-80" : ""}`}
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-600">{(page.name || "P").charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col overflow-hidden">
                          <span className="truncate text-sm font-bold text-slate-900">
                            {page.name || t('labels.linkedinPage')}
                          </span>
                          <span className="truncate text-xs font-medium text-slate-500">
                            {page.description || t('labels.corporatePage')}
                          </span>
                        </div>
                        {pageIsActive ? (
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 ${
                            schedulePageUrns.includes(page.urn) ? "border-blue-500 bg-blue-500 text-white scale-110 shadow-sm" : "border-slate-300 bg-white group-hover:border-blue-300"
                          }`}>
                            {schedulePageUrns.includes(page.urn) && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
                          </div>
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-rose-300 bg-rose-50 text-rose-500">
                            <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    )})}
                  </div>
                </div>
                {scheduleError && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700 animate-in slide-in-from-top-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="h-4 w-4" />
                    {scheduleError}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-5 backdrop-blur-sm">
              <button
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setScheduleError(null);
                }}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={confirmSchedule}
                disabled={isScheduling || (!scheduleProfile && schedulePageUrns.length === 0)}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isScheduling ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4" />
                )}
                {isScheduling ? t('buttons.scheduling') : t('buttons.schedulePost')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
