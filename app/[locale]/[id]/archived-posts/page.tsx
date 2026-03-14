"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProxiedImageUrl } from "@/lib/image-proxy";
import { useFieldArray, useForm } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faImage,
  faVideo,
  faFile,
  faTimes,
  faPenToSquare,
  faBoxOpen,
  faCalendarDays,
  faWandMagicSparkles,
  faSpinner,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faExclamationTriangle,
  faCheck,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { useTranslations } from "next-intl";
import { PREDEFINED_TIMEZONES } from "@/lib/timezone";
import type { Message } from "@/types/posts";
import type { ArchivedPostItem, ChatHistoryListResponse, ChatHistoryUpdateRequest } from "@/types/chat-history";
import type {
  ImageStyleOption,
  ImagePromptFormValues,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "@/types/image-generation";
import type { LinkedInUser, PageSettingsResponse, PageData } from "@/types/linkedin";

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

export default function ArchivedPostsPage() {
  const t = useTranslations("CreatePost");
  const tArchived = useTranslations("ArchivedPosts");
  const params = useParams<{ id: string; locale: string }>();
  const activeLocale = params?.locale === "es" ? "es" : "en";
  const router = useRouter();
  const CHARACTER_LIMIT = 10;
  const CHARACTER_NAME_MAX = 400;
  const [archivedPosts, setArchivedPosts] = useState<ArchivedPostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishPreviewOpen, setIsPublishPreviewOpen] = useState(false);
  const [messageToPublish, setMessageToPublish] = useState<Message | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachingTo, setAttachingTo] = useState<{ index: number; type: "image" | "video" | "document" } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [messageForImage, setMessageForImage] = useState<Message | null>(null);
  const [messageForImageIndex, setMessageForImageIndex] = useState<number | null>(null);
  const [selectedImageStyleId, setSelectedImageStyleId] = useState<string | null>(null);
  const [imagePromptPreviewValue, setImagePromptPreviewValue] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState<{ url: string; name: string }[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselMessageIndex, setCarouselMessageIndex] = useState<number | null>(null);
  const [isDeleteImageConfirmOpen, setIsDeleteImageConfirmOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [messageToSchedule, setMessageToSchedule] = useState<Message | null>(null);
  const [scheduleHistoryId, setScheduleHistoryId] = useState<string | null>(null);
  const [scheduleMessageIndex, setScheduleMessageIndex] = useState<number | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<{ scheduledAt: string; timezone: string } | null>(null);
  const [scheduleProfile, setScheduleProfile] = useState(true);
  const [schedulePageUrns, setSchedulePageUrns] = useState<string[]>([]);
  const [user, setUser] = useState<LinkedInUser | null>(null);
  const [pageSettings, setPageSettings] = useState<PageSettingsResponse | null>(null);
  const [selectedPageUrns, setSelectedPageUrns] = useState<string[]>([]);
  const [publishTargets, setPublishTargets] = useState({
    linkedinProfile: true,
    linkedinPage: false,
  });
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);
  const [linkedinModalMode, setLinkedinModalMode] = useState<"schedule" | "publish" | null>(null);

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

  const characterInputValue = watchImagePrompt("characterInput");
  const extraContextValue = watchImagePrompt("extraContext") ?? "";
  const includePostTitle = watchImagePrompt("includePostTitle");
  const selectedImageStyle = imageStyleOptions.find((style) => style.id === selectedImageStyleId) || null;
  const currentImageCount = messageForImage?.media?.type === "image"
    ? messageForImage.media.items?.length ?? 1
    : 0;
  const pages = useMemo(() => {
    if (pageSettings?.pages?.length) {
      return pageSettings.pages;
    }
    if (pageSettings?.page) {
      return [pageSettings.page];
    }
    return [];
  }, [pageSettings]);
  const availablePages = pages;
  const isLinkedinProfileConnected = !!user;
  const now = Date.now();
  const isPageActive = (page: PageData) =>
    page.isValid !== false && (!page.expiresAt || page.expiresAt > now);
  const canAddCharacter = characterInputValue.trim().length > 0 && characterFields.length < CHARACTER_LIMIT;

  useEffect(() => {
    setSelectedTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    fetchArchivedPosts();
  }, []);

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
      } catch (error) {
        if (!active) return;
      }
    };
    loadLinkedinData();
    return () => {
      active = false;
    };
  }, []);

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
  }, [pageSettings, pages]);

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

  const fetchArchivedPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chat/history?archived=true");
      if (response.ok) {
        const data = (await response.json()) as ChatHistoryListResponse;
        setArchivedPosts(data.items);
      }
    } catch (error) {
      console.error("Error fetching archived posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return typeof error === "string" ? error : t("errors.unknown");
  };

  const openImageCarousel = (
    items: { url: string; name: string }[],
    startIndex: number,
    messageIndex: number,
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

  const buildMessageFromArchived = (item: ArchivedPostItem): Message => ({
    role: "assistant",
    content: item.ai_response,
    media: item.media,
    voiceProfileName: item.voice_profile?.name,
    voiceProfileStyleTag: item.voice_profile?.style_tag,
    voiceProfileEmoji: item.voice_profile?.style_emoji,
    voiceProfileLanguage: item.voice_profile?.language,
  });

  const handleUnarchivePost = async (historyId: string, index: number) => {
    const newPosts = [...archivedPosts];
    newPosts.splice(index, 1);
    setArchivedPosts(newPosts);
    try {
      const response = await fetch("/api/chat/history/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: historyId,
          archived: false,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to unarchive");
      }
    } catch (error) {
      console.error("Error unarchiving post:", error);
      fetchArchivedPosts();
    }
  };

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
        alert(t("errors.maxFiles"));
        files.splice(9);
      }
      const items = files.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setArchivedPosts((prev) =>
        prev.map((item, idx) => {
          if (idx !== attachmentTarget.index) return item;
          historyIdToPersist = item.id;
          if (attachmentTarget.type === "image") {
            const existingItems =
              item.media?.type === "image"
                ? item.media.items && item.media.items.length > 0
                  ? item.media.items
                  : [{ url: item.media.url, name: item.media.name }]
                : [];
            const mergedItems = [...existingItems, ...items].slice(0, 9);
            if (existingItems.length + items.length > 9) {
              alert(t("errors.maxFiles"));
            }
            const primaryItem = mergedItems[0];
            mediaToPersist = {
              type: "image",
              url: primaryItem.url,
              name: primaryItem.name,
              items: mergedItems,
            };
            return {
              ...item,
              media: mediaToPersist,
            };
          }
          const primary = items[0];
          mediaToPersist = {
            type: attachmentTarget.type,
            url: primary.url,
            name: primary.name,
            items,
          };
          return {
            ...item,
            media: mediaToPersist,
          };
        }),
      );
      if (historyIdToPersist && mediaToPersist) {
        void persistHistoryMedia(historyIdToPersist, mediaToPersist);
      }
      setAttachingTo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEditPost = (message: ArchivedPostItem, index: number) => {
    setEditingMessageIndex(index);
    setEditingContent(message.ai_response);
  };

  const handleSaveEdit = async (index: number) => {
    const target = archivedPosts[index];
    if (!target) return;
    setArchivedPosts((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return { ...item, ai_response: editingContent };
      }),
    );
    setEditingMessageIndex(null);
    setEditingContent("");
    await persistHistoryContent(target.id, editingContent);
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

  const persistHistoryContent = async (historyId: string, content: string) => {
    try {
      const payload: ChatHistoryUpdateRequest = { id: historyId, ai_response: content };
      await fetch("/api/chat/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Error updating chat history content:", error);
    }
  };

  const buildImageMediaFromItems = (
    items: { url: string; name: string }[],
  ): Message["media"] | null => {
    if (items.length === 0) return null;
    const [primaryItem] = items;
    return {
      type: "image",
      url: primaryItem.url,
      name: primaryItem.name,
      items,
    };
  };

  const handleDeleteCarouselImage = async () => {
    if (carouselMessageIndex === null) return;
    const target = archivedPosts[carouselMessageIndex];
    if (!target?.media || target.media.type !== "image") return;
    const currentItems =
      target.media.items && target.media.items.length > 0
        ? target.media.items
        : [{ url: target.media.url, name: target.media.name }];
    const nextItems = currentItems.filter((_, itemIndex) => itemIndex !== carouselIndex);
    const nextMedia = buildImageMediaFromItems(nextItems);

    setArchivedPosts((prev) =>
      prev.map((item, idx) => {
        if (idx !== carouselMessageIndex) return item;
        return {
          ...item,
          media: nextMedia || undefined,
        };
      }),
    );

    if (nextItems.length === 0) {
      closeImageCarousel();
    } else {
      setCarouselItems(nextItems);
      setCarouselIndex((current) => Math.min(current, nextItems.length - 1));
    }

    await persistHistoryMedia(target.id, nextMedia);
  };

  const handleRequestDeleteCarouselImage = () => {
    if (carouselMessageIndex === null) return;
    setIsDeleteImageConfirmOpen(true);
  };

  const handleCancelDeleteCarouselImage = () => {
    setIsDeleteImageConfirmOpen(false);
  };

  const handleConfirmDeleteCarouselImage = async () => {
    setIsDeleteImageConfirmOpen(false);
    await handleDeleteCarouselImage();
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
    const baseTitle = cleaned || fallback || t("labels.postTopic");
    return clampText(baseTitle, 70);
  };

  const handleGenerateImage = async (values: ImagePromptFormValues) => {
    if (
      !messageForImage ||
      !selectedImageStyleId ||
      !values.includePostTitle ||
      values.extraContext.trim().length === 0
    )
      return;
    const existingImageCount =
      messageForImage.media?.type === "image"
        ? messageForImage.media.items?.length ?? 1
        : 0;
    if (existingImageCount >= 3) {
      setImageGenerationError(t("errors.imageLimitReached"));
      return;
    }
    const extraContext = values.extraContext.trim();
    const characterNames = values.characters
      .map((item) => item.name.trim())
      .filter((name) => name.length > 0)
      .slice(0, CHARACTER_LIMIT);
    const languageInstruction = messageForImage.voiceProfileLanguage
      ? t("prompts.mandatoryLanguage", { language: messageForImage.voiceProfileLanguage })
      : "";
    const visualGuidance = t("prompts.creativeDirection");
    const textLegibility = t("prompts.textLegibility");
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
      values.includePostTitle === "withTitle"
        ? t("prompts.includePostTitle")
        : t("prompts.excludePostTitle");
    const titleLine =
      values.includePostTitle === "withTitle"
        ? `${t("labels.postTitle")}: ${resolvePostTitle(messageForImage.content)}`
        : "";
    const topicLine =
      messageForImage.content
        .split("\n")
        .find((line) => line.trim().length > 0) ?? "";
    const topicCleaned = topicLine.replace(/^#+\s*/, "").trim();
    const topicSource = topicCleaned || messageForImage.content.trim();
    const topicForPrompt =
      topicSource.length > 140 ? `${topicSource.slice(0, 139)}…` : topicSource;
    const sketchPrompt = `hand drawn pencil sketch illustration representing ${topicForPrompt}, cute minimal cartoon character interacting with the scene, loose graphite pencil lines, soft shading, monochrome warm beige palette with one strong accent color, simple cozy environment with minimal furniture and objects, sketchbook paper texture, playful and friendly style, editorial blog illustration, clean and balanced composition.`;
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
      extraContext ? `${t("labels.extraContext")}: ${extraContext}` : "",
      characterNames.length > 0
        ? `${t("labels.characters")}:\n${characterNames
            .map((name, index) => `${index + 1}. ${name}`)
            .join("\n")}`
        : "",
      !isCustomStyle && selectedImageStyle
        ? `${t("labels.imageStyle")}: ${t(`imageStyles.${selectedImageStyle.id}`)}`
        : "",
      titleLine,
      languageInstruction,
      includeTitleInstruction,
      textLegibility,
      isCustomStyle ? "" : visualGuidance,
      t("prompts.formatSquare"),
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
        quality: "medium",
      };
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as ImageGenerationResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || t("errors.imageGeneration"));
      }
      const resizedImage = await resizeImageDataUrl(data.imageUrl, 512);
      setGeneratedImageUrl(resizedImage);
      if (messageForImageIndex !== null) {
        const aiName = t("aiImageName");
        const aiItem = { url: resizedImage, name: aiName };
        const currentMedia = archivedPosts[messageForImageIndex]?.media;
        const nextMedia = buildNextAiImageMedia(currentMedia, aiItem, aiName);
        setArchivedPosts((prev) =>
          prev.map((item, index) =>
            index === messageForImageIndex ? { ...item, media: nextMedia } : item,
          ),
        );
        const historyId = archivedPosts[messageForImageIndex]?.id;
        if (historyId) {
          await persistHistoryMedia(historyId, nextMedia);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("errors.imageGeneration");
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
          reject(new Error(t("errors.imageProcessing")));
          return;
        }
        context.drawImage(image, 0, 0, size, size);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => reject(new Error(t("errors.imageProcessing")));
      image.src = dataUrl;
    });
  };

  const handleSchedule = (message: Message, historyId: string, index: number) => {
    setMessageToSchedule(message);
    setScheduleError(null);
    setScheduleHistoryId(historyId);
    setScheduleMessageIndex(index);
    setSelectedTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setSchedulePageUrns([]);
    setScheduleProfile(true);
    setIsScheduleModalOpen(true);
  };

  const confirmSchedule = async () => {
    if (!scheduledDate) {
      setScheduleError(t("errors.selectDateAndTime"));
      return;
    }
    if (!messageToSchedule) return;
    if (scheduleProfile && !user) {
      setScheduleProfile(false);
    }
    if (schedulePageUrns.length > 0) {
      if (!pageSettings?.configured) {
        alert(t("errors.configurePageToken"));
        return;
      }
      if (schedulePageUrns.length === 0) {
        alert(t("errors.selectPageBeforeSchedule"));
        return;
      }
    }
    if (!scheduleProfile && schedulePageUrns.length === 0) {
      alert(t("errors.selectProfileOrPage"));
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
              }),
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
        } catch (error) {
          console.error("Error processing media:", error);
          alert(t("errors.attachmentError"));
          setIsScheduling(false);
          return;
        }
      }
      const resolveTargetInfo = (
        targetValue: "profile" | "page",
        pageUrn: string | null,
      ): { targetName: string | null; targetImage: string | null } => {
        if (targetValue === "page" && pageUrn) {
          const page = pages.find((item) => item.urn === pageUrn);
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
          throw new Error(data.error || t("errors.scheduleError"));
        }
        if (scheduleTargets.length > 1 && index < scheduleTargets.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
      const scheduledAt = scheduledDate;
      const timezone = selectedTimezone;
      const historyId = scheduleHistoryId;
      const removeIndex = scheduleMessageIndex;
      if (historyId) {
        try {
          const response = await fetch("/api/chat/history", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: historyId }),
          });
          if (!response.ok) {
            throw new Error("Error al eliminar historial");
          }
        } catch (error) {
          console.error("Error deleting history:", error);
        }
      }
      if (removeIndex !== null) {
        setArchivedPosts((prev) => prev.filter((_, idx) => idx !== removeIndex));
      }
      setIsScheduleModalOpen(false);
      setScheduledDate("");
      setMessageToSchedule(null);
      setScheduleHistoryId(null);
      setScheduleMessageIndex(null);
      setScheduleError(null);
      setScheduleSuccess({ scheduledAt, timezone });
    } catch (error: unknown) {
      console.error("Schedule error:", error);
      alert(getErrorMessage(error) || t("errors.scheduleError"));
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
        const items = (media.items.length > 0 ? media.items : [{ url: media.url, name: media.name }]).slice(0, 9);
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

  const handlePublishRequest = async (
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
      setPublishError(t("errors.selectDestination"));
      return;
    }
    if (targets.linkedinProfile && !user && !pageSettings?.configured) {
      setLinkedinModalMode("publish");
      setShowLinkedinModal(true);
      return;
    }
    if (resolvedTargets.linkedinPage && selectedPageUrns.length === 0) {
      setPublishError(t("errors.selectPage"));
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
          throw new Error(data.error || t("errors.unknown"));
        }
      }
      if (resolvedTargets.linkedinPage) {
        for (let index = 0; index < selectedPageUrns.length; index += 1) {
          const pageUrn = selectedPageUrns[index];
          if (!pageUrn) continue;
          if (resolvedTargets.linkedinProfile || index > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
          }
          const formData = await buildPublishFormData(`${content}${dedupSuffix}`, media, {
            visibility: "PUBLIC",
            target: "page",
            pageUrn,
          });
          const response = await fetch("/api/linkedin/share", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || t("errors.unknown"));
          }
        }
      }
      setPublishSuccess(t("success.published", { targets: targetList.join(", ") }));
    } catch (error: unknown) {
      console.error("Error publishing:", error);
      setPublishError(t("errors.publishError", { error: getErrorMessage(error) }));
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublish = (message: Message) => {
    setMessageToPublish(message);
    setPublishError(null);
    setPublishSuccess(null);
    setIsPublishPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-24 ">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="border border-slate-200 rounded-2xl p-4 shadow-md shadow-slate-300 w-full">
            <div className="flex items-center gap-2">
             
              <h1 className="text-2xl font-bold text-slate-900">{tArchived("title")}</h1>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-500/90 max-w-xl">
              {tArchived("description")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : archivedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-4 py-16 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
              <FontAwesomeIcon icon={faBoxOpen} className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{tArchived("emptyTitle")}</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {tArchived("emptyDescription")}
            </p>
            <Link
              href={`/${params.locale}/${params.id}/create-post`}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
            >
              {tArchived("emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
            {archivedPosts.map((message, index) => {
              const hasMedia = !!message.media;
              const mediaItems =
                message.media?.type === "image" && message.media.items && message.media.items.length > 0
                  ? message.media.items
                  : message.media?.type === "image"
                    ? [{ url: message.media.url, name: message.media.name }]
                    : [];
              const resolvedProfile = message.voice_profile
                ? {
                    name: message.voice_profile.name,
                    style: message.voice_profile.style_tag || "",
                    language: message.voice_profile.language,
                    emoji:
                      message.voice_profile.style_emoji ||
                      (message.voice_profile.style_tag
                        ? styleEmojis[message.voice_profile.style_tag]
                        : undefined),
                  }
                : null;
              return (
                <div
                  key={message.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="border-b border-slate-100 bg-blue-50 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-slate-200/60 transition-transform hover:scale-105">
                          {resolvedProfile?.emoji || (resolvedProfile?.style ? styleEmojis[resolvedProfile.style] : undefined) || "🤖"}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-800">
                              {resolvedProfile?.name || t("labels.aiAssistant")}
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
                              {t("labels.generatedWithAI")}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="font-medium text-slate-400">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 px-5 py-4">
                    {editingMessageIndex === index ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingContent}
                          onChange={(event) => setEditingContent(event.target.value)}
                          className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(index)}
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                          >
                            {t("buttons.saveChanges")}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            {t("buttons.cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                        {message.ai_response}
                      </div>
                    )}

                    {hasMedia &&
                      message.media?.type === "image" &&
                      (() => {
                        const displayedItems = mediaItems.slice(0, 2);
                        const extraCount = Math.max(0, mediaItems.length - displayedItems.length);
                        const primaryItem = mediaItems[0];
                        return (
                          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            {mediaItems.length > 1 ? (
                              <div className="grid grid-cols-2 gap-0.5 bg-slate-100">
                                {displayedItems.map((item, itemIndex) => (
                                  <button
                                    key={`${item.url}-${itemIndex}`}
                                    type="button"
                                    onClick={() => openImageCarousel(mediaItems, itemIndex, index)}
                                    className="group relative aspect-square overflow-hidden bg-slate-100"
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
                                    {isGeneratingImage && messageForImageIndex === index && (
                                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 animate-pulse">
                                        <FontAwesomeIcon icon={faImage} className="h-10 w-10 text-slate-300" />
                                      </div>
                                    )}
                                  </button>
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
                                    src={getProxiedImageUrl(primaryItem?.url || message.media.url) || primaryItem?.url || message.media.url}
                                    alt={primaryItem?.name || message.media.name || "Imagen adjunta"}
                                    fill
                                    unoptimized
                                    sizes="(max-width: 768px) 100vw, 600px"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                </button>
                                {isGeneratingImage && messageForImageIndex === index && (
                                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 animate-pulse">
                                    <FontAwesomeIcon icon={faImage} className="h-10 w-10 text-slate-300" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                    {!hasMedia &&
                      isGeneratingImage &&
                      messageForImageIndex === index &&
                      messageForImage?.content === message.ai_response && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <div className="flex aspect-video items-center justify-center bg-slate-100 animate-pulse">
                            <FontAwesomeIcon icon={faImage} className="h-10 w-10 text-slate-300" />
                          </div>
                        </div>
                      )}

                    {hasMedia && message.media?.type === "video" && (
                      <div className="mt-4">
                        <video src={message.media.url} controls className="w-full rounded-xl border border-slate-200" />
                      </div>
                    )}

                    {hasMedia && message.media?.type === "document" && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {message.media.name}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row  items-center sm:items-start sm:justify-center">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleFileSelect(index, "image")}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                        title={t("buttons.addImage")}
                      >
                        <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleFileSelect(index, "video")}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                        title={t("buttons.addVideo")}
                      >
                        <FontAwesomeIcon icon={faVideo} className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleFileSelect(index, "document")}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                        title={t("buttons.addDocument")}
                      >
                        <FontAwesomeIcon icon={faFile} className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                      <button
                        onClick={() => handleEditPost(message, index)}
                        className="group flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        title={t("buttons.edit")}
                      >
                        <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
                        {t("buttons.edit")}
                      </button>

                      <button
                        onClick={() => handleOpenImageModal(buildMessageFromArchived(message), index)}
                        className="group flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        title={t("buttons.generateImage")}
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
                          handleSchedule(buildMessageFromArchived(message), message.id, index);
                        }}
                        className="group flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        title={t("buttons.schedule")}
                      >
                        <FontAwesomeIcon icon={faCalendarDays} className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
                        {t("buttons.schedule")}
                      </button>

                      <button
                        onClick={() => handleUnarchivePost(message.id, index)}
                        className="group flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        title="Desarchivar"
                      >
                        <FontAwesomeIcon icon={faBoxOpen} className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
                        Desarchivar
                      </button>

                      <button
                        onClick={() => handlePublish(buildMessageFromArchived(message))}
                        disabled={isPublishing}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/10 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {isPublishing ? (
                          <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
                        )}
                        {t("buttons.publish")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />

      {isPublishPreviewOpen && messageToPublish && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                  <FontAwesomeIcon icon={faPaperPlane} className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Vista previa de publicación</h2>
                  <p className="text-xs font-medium text-slate-500">Revisa cómo se verá tu post antes de publicar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPublishPreviewOpen(false);
                  setMessageToPublish(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-600"
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto bg-slate-50/30 p-6">
              <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 rounded-full bg-slate-200" />
                      <div>
                        <div className="font-bold text-slate-900">Usuario</div>
                        <div className="text-xs text-slate-500">Headline</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
                    {messageToPublish.content}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">{t("labels.target")}</div>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPublishTargets((prev) => ({
                        ...prev,
                        linkedinProfile: !prev.linkedinProfile,
                      }))
                    }
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      publishTargets.linkedinProfile
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600"
                    }`}
                  >
                    <span>{t("labels.linkedinProfile")}</span>
                    {publishTargets.linkedinProfile && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPublishTargets((prev) => ({
                        ...prev,
                        linkedinPage: !prev.linkedinPage,
                      }))
                    }
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      publishTargets.linkedinPage
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600"
                    }`}
                    disabled={pages.length === 0}
                  >
                    <span>{t("labels.linkedinPage")}</span>
                    {publishTargets.linkedinPage && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
                  </button>
                </div>

                {pages.length > 0 && publishTargets.linkedinPage && (
                  <div className="mt-4 space-y-2">
                    {pages.map((page) => {
                      const isSelected = selectedPageUrns.includes(page.urn);
                      return (
                        <button
                          key={page.urn}
                          type="button"
                          onClick={() =>
                            setSelectedPageUrns((current) =>
                              current.includes(page.urn)
                                ? current.filter((urn) => urn !== page.urn)
                                : [...current, page.urn],
                            )
                          }
                          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-600"
                              : "border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600"
                          }`}
                        >
                          <span>{page.name ?? page.urn}</span>
                          {isSelected && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {publishError && <div className="mt-3 text-xs font-semibold text-rose-500">{publishError}</div>}
                {publishSuccess && <div className="mt-3 text-xs font-semibold text-emerald-600">{publishSuccess}</div>}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPublishPreviewOpen(false);
                    setMessageToPublish(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {t("buttons.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePublishRequest(messageToPublish.content, messageToPublish.media, publishTargets)
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  disabled={isPublishing}
                >
                  {isPublishing ? t("buttons.publishing") : t("buttons.publishNow")}
                </button>
              </div>
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
                  <h2 className="text-lg font-bold text-slate-900">{t("modals.generateImageTitle")}</h2>
                  <p className="text-xs font-medium text-slate-500">{t("modals.generateImageSubtitle")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseImageModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-600"
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleImageFormSubmit(handleGenerateImage)}>
              <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("labels.postContext")}
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
                    {messageForImage.content}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("labels.improveContext")}
                  </label>
                  <textarea
                    {...registerImagePrompt("extraContext", {
                      required: t("errors.contextRequired"),
                    })}
                    placeholder={t("placeholders.contextExample")}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                  {imagePromptErrors.extraContext && (
                    <p className="text-xs font-semibold text-rose-500">
                      {imagePromptErrors.extraContext.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t("labels.characters")}
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {characterFields.length}/{CHARACTER_LIMIT}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative w-full">
                      <input
                        {...registerImagePrompt("characterInput", { maxLength: CHARACTER_NAME_MAX })}
                        placeholder={t("placeholders.characterName")}
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
                      {t("buttons.addCharacter")}
                    </button>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">
                    {t("labels.charactersLimit", { max: CHARACTER_LIMIT })}
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

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("labels.includePostTitle")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setImagePromptValue("includePostTitle", "withTitle")}
                      className={`rounded-2xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        includePostTitle === "withTitle"
                          ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {t("labels.includePostTitleYes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setImagePromptValue("includePostTitle", "withoutTitle")}
                      className={`rounded-2xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        includePostTitle === "withoutTitle"
                          ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {t("labels.includePostTitleNo")}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("labels.visualStyle")}
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
                {currentImageCount >= 3 && (
                  <p className="text-xs font-semibold text-rose-500">
                    {t("errors.imageLimitReached")}
                  </p>
                )}
                <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseImageModal}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  {t("buttons.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedImageStyleId ||
                    isGeneratingImage ||
                    !includePostTitle ||
                    extraContextValue.trim().length === 0 ||
                    currentImageCount >= 3
                  }
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isGeneratingImage ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4" />
                  )}
                  {isGeneratingImage ? t("buttons.generating") : t("buttons.generateImage")}
                </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImageCarouselOpen && carouselItems.length > 0 && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/95 p-4 backdrop-blur-md animate-in fade-in duration-300"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeImageCarousel();
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
              <button
  type="button"
  onClick={closeImageCarousel}
  className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
  aria-label="Cerrar"
>
  <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
</button>
              {carouselMessageIndex !== null && (
                <button
                  type="button"
                  onClick={handleRequestDeleteCarouselImage}
                  className="absolute right-4 bottom-4 z-10 inline-flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-red-600/30 backdrop-blur-md transition hover:bg-red-600"
                >
                  <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              )}
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
              <div className="truncate max-w-[70%]">{carouselItems[carouselIndex]?.name}</div>
              <div className="shrink-0 rounded-full bg-white/10 px-3 py-1 backdrop-blur-md">
                {carouselIndex + 1} / {carouselItems.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteImageConfirmOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center px-8 py-10 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
                <FontAwesomeIcon icon={faTrash} className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Eliminar imagen</h3>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Esta acción elimina la imagen seleccionada del carrusel.
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCancelDeleteCarouselImage}
                  className="flex-1 rounded-2xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCarouselImage}
                  className="flex-1 rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {scheduleSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            setScheduleSuccess(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <FontAwesomeIcon icon={faCheck} className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t("success.postScheduled")}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {t("success.scheduledFor")}
              <br />
              <span className="font-medium text-slate-900">
                {scheduleSuccess.scheduledAt.replace("T", " ")} ({scheduleSuccess.timezone})
              </span>
            </p>
            <button
              type="button"
              onClick={() => setScheduleSuccess(null)}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
            >
              {t("buttons.close")}
            </button>
          </div>
        </div>
      )}

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                  <FontAwesomeIcon icon={faCalendarDays} className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t("modals.scheduleTitle")}</h3>
                  <p className="text-xs font-medium text-slate-500">{t("modals.scheduleSubtitle")}</p>
                </div>
              </div>
              <button
                type="button"
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
                    {t("labels.dateAndTime")}
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
                    {t("labels.timezone")}
                  </label>
                  <div className="relative">
                    <Select
                      value={selectedTimezone}
                      onChange={setSelectedTimezone}
                      options={PREDEFINED_TIMEZONES}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("labels.scheduleDestinations")}
                  </h4>

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
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 transition-all ${
                            scheduleProfile
                              ? "ring-blue-200 bg-blue-100"
                              : "ring-slate-100 bg-slate-100 group-hover:ring-blue-100"
                          }`}
                        >
                          {user?.picture ? (
                            <Image
                              src={user.picture}
                              alt={user.name || "Perfil"}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-600">
                              {(user?.name || "P").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col overflow-hidden">
                          <span className="truncate text-sm font-bold text-slate-900">
                            {user?.name || t("labels.personalProfile")}
                          </span>
                          <span className="truncate text-xs font-medium text-slate-500">
                            {user?.headline || t("labels.personalLinkedIn")}
                          </span>
                        </div>
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 ${
                            scheduleProfile
                              ? "border-blue-500 bg-blue-500 text-white scale-110 shadow-sm"
                              : "border-slate-300 bg-white group-hover:border-blue-300"
                          }`}
                        >
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
                        {t("buttons.connectPersonalProfile")}
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
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 transition-all ${
                              !pageIsActive
                                ? "ring-white bg-slate-100"
                                : schedulePageUrns.includes(page.urn)
                                  ? "ring-blue-200 bg-blue-100"
                                  : "ring-slate-100 bg-slate-100 group-hover:ring-blue-100"
                            }`}
                          >
                            {page.logoUrl ? (
                              <Image
                                src={page.logoUrl}
                                alt={page.name || "Página"}
                                width={40}
                                height={40}
                                className={`h-full w-full object-cover ${!pageIsActive ? "grayscale opacity-80" : ""}`}
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-600">
                                {(page.name || "P").charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col overflow-hidden">
                            <span className="truncate text-sm font-bold text-slate-900">
                              {page.name || t("labels.linkedinPage")}
                            </span>
                            <span className="truncate text-xs font-medium text-slate-500">
                              {page.description || t("labels.corporatePage")}
                            </span>
                          </div>
                          {pageIsActive ? (
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 ${
                                schedulePageUrns.includes(page.urn)
                                  ? "border-blue-500 bg-blue-500 text-white scale-110 shadow-sm"
                                  : "border-slate-300 bg-white group-hover:border-blue-300"
                              }`}
                            >
                              {schedulePageUrns.includes(page.urn) && (
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
                type="button"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setScheduleError(null);
                }}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                {t("buttons.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmSchedule}
                disabled={isScheduling || (!scheduleProfile && schedulePageUrns.length === 0)}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isScheduling ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4" />
                )}
                {isScheduling ? t("buttons.scheduling") : t("buttons.schedulePost")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLinkedinModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                  <FontAwesomeIcon icon={faLinkedin} className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t("modals.connectAccount")}</h3>
                  <p className="text-xs font-medium text-slate-500">
                    {linkedinModalMode === "schedule" && t("modals.connectForSchedule")}
                    {linkedinModalMode === "publish" && t("modals.connectForPublish")}
                    {!linkedinModalMode && t("modals.connectForFeatures")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkedinModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-600"
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <button
                type="button"
                onClick={() => router.push("/api/auth/linkedin")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077b5] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#006097] hover:shadow-blue-900/30 active:scale-[0.98]"
              >
                <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
                {t("buttons.connectPersonalProfile")}
              </button>

              <button
                type="button"
                onClick={() => setShowLinkedinModal(false)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {t("buttons.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
