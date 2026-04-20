import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import { toast } from "sonner";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Save,
  FileText,
  FolderPlus,
  Layers3,
  ArrowUp,
  ArrowDown,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Quote,
  AlignLeft,
} from "lucide-react";

const PAGE_SIZE = 8;

const POST_STATUS_OPTIONS = [
  { value: "Draft", label: "Bản nháp", apiValue: 0 },
  { value: "Published", label: "Đã xuất bản", apiValue: 1 },
];

const BLOCK_TYPES = {
  1: { label: "Tiêu đề lớn", icon: Heading1 },
  2: { label: "Tiêu đề nhỏ", icon: Heading2 },
  3: { label: "Đoạn văn", icon: AlignLeft },
  5: { label: "Trích dẫn", icon: Quote },
};

const EMPTY_CATEGORY_FORM = {
  name: "",
  slug: "",
};

const EMPTY_POST_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  status: "Draft",
  blogCategoryId: "",
};

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizePostStatus(status) {
  const raw = String(status ?? "").trim();
  const lowered = raw.toLowerCase();

  if (lowered === "published" || raw === "1") return "Published";
  if (lowered === "archived" || raw === "2") return "Archived";
  return "Draft";
}

function postStatusToApi(status) {
  const normalized = normalizePostStatus(status);
  const found = POST_STATUS_OPTIONS.find((item) => item.value === normalized);
  return found ? found.apiValue : 0;
}

function getBlockTypeMeta(type) {
  return BLOCK_TYPES[type] || BLOCK_TYPES[3];
}

function createEmptyBlock(type = 3, position = 1) {
  return {
    localId: `${Date.now()}-${Math.random()}`,
    postBlockId: null,
    postId: null,
    type,
    position,
    data: "",
    persisted: false,
  };
}

function normalizeImageUrls(img) {
  if (Array.isArray(img)) {
    return img.filter(Boolean);
  }

  if (typeof img === "string" && img.trim()) {
    if (img.startsWith("[")) {
      try {
        const parsed = JSON.parse(img);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [img];
      }
    }
    return [img];
  }

  return [];
}

export default function OwnerBlog() {
  const [sbExpanded, setSbExpanded] = React.useState(false);

  const [allPosts, setAllPosts] = React.useState([]);
  const [posts, setPosts] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const [openPostModal, setOpenPostModal] = React.useState(false);
  const [openCategoryModal, setOpenCategoryModal] = React.useState(false);

  const [selectedPost, setSelectedPost] = React.useState(null);
  const [postForm, setPostForm] = React.useState(EMPTY_POST_FORM);
  const [coverImageFile, setCoverImageFile] = React.useState(null);
  const [coverImagePreview, setCoverImagePreview] = React.useState("");
  const [existingCoverImage, setExistingCoverImage] = React.useState("");
  const [categoryForm, setCategoryForm] = React.useState(EMPTY_CATEGORY_FORM);
  const [blocks, setBlocks] = React.useState([createEmptyBlock(1, 1)]);

  const [submittingPost, setSubmittingPost] = React.useState(false);
  const [submittingCategory, setSubmittingCategory] = React.useState(false);
  const [deletingPost, setDeletingPost] = React.useState(false);
  const [autoPostSlug, setAutoPostSlug] = React.useState(true);
  const [autoCategorySlug, setAutoCategorySlug] = React.useState(true);

  const revokePreviewUrls = React.useCallback((urls) => {
    urls.forEach((url) => {
      if (typeof url === "string" && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
  }, []);

  React.useEffect(() => {
    return () => {
      if (
        typeof coverImagePreview === "string" &&
        coverImagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(coverImagePreview);
      }
    };
  }, [coverImagePreview]);

  const fetchJson = React.useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      headers: {
        accept: "*/*",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "Yêu cầu API thất bại");
    }

    return data;
  }, []);

  const uploadImageFile = React.useCallback(async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      body: formData,
      headers: {
        accept: "*/*",
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || "Upload ảnh thất bại");
    }

    return (
      data?.url ||
      data?.data?.url ||
      data?.path ||
      data?.data?.path ||
      data?.imageUrl ||
      data?.data?.imageUrl ||
      ""
    );
  }, []);

  const fetchAllPages = React.useCallback(
    async (basePath, pageSize = 50) => {
      let currentPage = 1;
      let total = 1;
      const merged = [];

      do {
        const data = await fetchJson(
          `${API_URL}${basePath}?page=${currentPage}&pageSize=${pageSize}`,
        );

        const items = Array.isArray(data?.items) ? data.items : [];
        merged.push(...items);
        total = Number(data?.totalPages || 1);
        currentPage += 1;
      } while (currentPage <= total);

      return merged;
    },
    [fetchJson],
  );

  const fetchBlockListByPostId = React.useCallback(
    async (postId) => {
      const data = await fetchJson(
        `${API_URL}/api/post-block?PostId=${postId}&page=1&pageSize=200`,
      );

      const items = Array.isArray(data?.items) ? data.items : [];
      return items
        .filter((item) => Number(item.postId) === Number(postId))
        .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
    },
    [fetchJson],
  );

  const fetchInitialData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [postItems, categoryItems] = await Promise.all([
        fetchAllPages("/api/post", 50),
        fetchAllPages("/api/blog-category", 50),
      ]);

      setAllPosts(postItems);
      setCategories(categoryItems);
    } catch (err) {
      const message = err.message || "Đã có lỗi xảy ra";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchAllPages]);

  React.useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredPosts = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return allPosts.filter((post) => {
      const postStatus = normalizePostStatus(post.status);
      const matchSearch =
        !keyword ||
        String(post.title || "")
          .toLowerCase()
          .includes(keyword) ||
        String(post.slug || "")
          .toLowerCase()
          .includes(keyword) ||
        String(post.excerpt || "")
          .toLowerCase()
          .includes(keyword) ||
        String(post.blogCategoryName || "")
          .toLowerCase()
          .includes(keyword);

      const matchStatus =
        statusFilter === "all" || String(postStatus) === String(statusFilter);

      const matchCategory =
        categoryFilter === "all" ||
        String(post.blogCategoryId) === String(categoryFilter);

      return matchSearch && matchStatus && matchCategory;
    });
  }, [allPosts, search, statusFilter, categoryFilter]);

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter]);

  React.useEffect(() => {
    const nextTotalPages = Math.max(
      1,
      Math.ceil(filteredPosts.length / PAGE_SIZE),
    );
    setTotalPages(nextTotalPages);

    const safePage = Math.min(page, nextTotalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    if (safePage !== page) {
      setPage(safePage);
      return;
    }

    setPosts(filteredPosts.slice(start, end));
  }, [filteredPosts, page]);

  React.useEffect(() => {
    if (autoPostSlug) {
      setPostForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [postForm.title, autoPostSlug]);

  React.useEffect(() => {
    if (autoCategorySlug) {
      setCategoryForm((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
  }, [categoryForm.name, autoCategorySlug]);

  const stats = React.useMemo(
    () => [
      {
        title: "Tổng bài viết",
        value: allPosts.length,
        icon: <FileText className="h-5 w-5" />,
        bg: "bg-orange-100",
        text: "text-orange-600",
      },
      {
        title: "Danh mục blog",
        value: categories.length,
        icon: <FolderPlus className="h-5 w-5" />,
        bg: "bg-blue-100",
        text: "text-blue-600",
      },
      {
        title: "Đã xuất bản",
        value: allPosts.filter(
          (item) => normalizePostStatus(item.status) === "Published",
        ).length,
        icon: <Layers3 className="h-5 w-5" />,
        bg: "bg-green-100",
        text: "text-green-600",
      },
    ],
    [allPosts, categories],
  );

  const resetPostForm = React.useCallback(() => {
    if (
      typeof coverImagePreview === "string" &&
      coverImagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(coverImagePreview);
    }

    setSelectedPost(null);
    setPostForm(EMPTY_POST_FORM);
    setCoverImageFile(null);
    setCoverImagePreview("");
    setExistingCoverImage("");
    setBlocks([createEmptyBlock(1, 1)]);
    setAutoPostSlug(true);
  }, [coverImagePreview]);

  const resetCategoryForm = React.useCallback(() => {
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setAutoCategorySlug(true);
  }, []);

  const openCreatePost = () => {
    resetPostForm();
    setOpenPostModal(true);
  };

  const openCreateCategory = () => {
    resetCategoryForm();
    setOpenCategoryModal(true);
  };

  const openEditPost = async (post) => {
    try {
      const blockItems = await fetchBlockListByPostId(post.postId);
      setSelectedPost(post);
      setPostForm({
        title: post.title || "",
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        status: normalizePostStatus(post.status),
        blogCategoryId: String(post.blogCategoryId || ""),
      });
      setAutoPostSlug(false);
      if (
        typeof coverImagePreview === "string" &&
        coverImagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(coverImagePreview);
      }

      setCoverImageFile(null);
      setCoverImagePreview("");

      const normalizedCover = normalizeImageUrls(
        post.coverImageFiles ||
          post.coverImages ||
          post.coverImage ||
          post.imgUrl ||
          post.imageUrls,
      );

      setExistingCoverImage(normalizedCover[0] || "");
      setBlocks(
        blockItems.length > 0
          ? blockItems.map((item) => ({
              localId: `${item.postBlockId}-${Math.random()}`,
              postBlockId: item.postBlockId,
              postId: item.postId,
              type: Number(item.type),
              position: Number(item.position),
              data: item.data || "",
              persisted: true,
            }))
          : [createEmptyBlock(1, 1)],
      );
      setOpenPostModal(true);
    } catch (err) {
      toast.error(err.message || "Không thể mở chi tiết bài viết");
    }
  };

  const closePostModal = () => {
    setOpenPostModal(false);
    resetPostForm();
  };

  const closeCategoryModal = () => {
    setOpenCategoryModal(false);
    resetCategoryForm();
  };

  const updateBlockPositions = React.useCallback((items) => {
    return items.map((item, index) => ({ ...item, position: index + 1 }));
  }, []);

  const addBlock = (type) => {
    setBlocks((prev) =>
      updateBlockPositions([...prev, createEmptyBlock(type, prev.length + 1)]),
    );
  };

  const updateBlockField = (localId, field, value) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.localId === localId ? { ...block, [field]: value } : block,
      ),
    );
  };

  const removeBlock = (localId) => {
    setBlocks((prev) => {
      const next = prev.filter((block) => block.localId !== localId);
      return updateBlockPositions(
        next.length > 0 ? next : [createEmptyBlock(3, 1)],
      );
    });
  };

  const moveBlock = (localId, direction) => {
    setBlocks((prev) => {
      const index = prev.findIndex((item) => item.localId === localId);
      if (index < 0) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return updateBlockPositions(next);
    });
  };

  const validateCategoryForm = () => {
    if (!categoryForm.name.trim()) return "Vui lòng nhập tên danh mục.";
    if (!categoryForm.slug.trim()) return "Slug danh mục không được để trống.";
    return "";
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const validationError = validateCategoryForm();
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    setSubmittingCategory(true);

    try {
      const payload = {
        name: categoryForm.name.trim(),
        slug: slugify(categoryForm.slug),
      };

      const data = await fetchJson(`${API_URL}/api/blog-category`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Tạo danh mục thành công.");
      await fetchInitialData();

      const createdId =
        data?.blogCategoryId ||
        data?.id ||
        data?.data?.blogCategoryId ||
        data?.data?.id;

      if (createdId) {
        setPostForm((prev) => ({ ...prev, blogCategoryId: String(createdId) }));
      }

      setOpenCategoryModal(false);
      resetCategoryForm();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const validatePostForm = () => {
    if (!postForm.title.trim()) return "Vui lòng nhập tiêu đề bài viết.";
    if (!postForm.slug.trim()) return "Slug bài viết không được để trống.";
    if (!postForm.excerpt.trim()) {
      return "Vui lòng nhập mô tả ngắn cho phần hiển thị ngoài danh sách bài viết.";
    }
    if (!postForm.blogCategoryId) return "Vui lòng chọn danh mục blog.";
    if (blocks.length === 0) return "Bài viết cần ít nhất 1 block nội dung.";

    for (const block of blocks) {
      if (!String(block.data || "").trim()) {
        const typeMeta = getBlockTypeMeta(block.type);
        return `${typeMeta.label} không được để trống.`;
      }
    }

    return "";
  };

  const createOrUpdatePost = async () => {
    const payload = {
      slug: slugify(postForm.slug),
      title: postForm.title.trim(),
      excerpt: postForm.excerpt.trim(),
      status: postStatusToApi(postForm.status),
      blogCategoryId: Number(postForm.blogCategoryId),
    };

    const isEdit = Boolean(selectedPost?.postId);
    const url = isEdit
      ? `${API_URL}/api/post/${selectedPost.postId}`
      : `${API_URL}/api/post`;

    const formData = new FormData();
    formData.append("Slug", payload.slug);
    formData.append("Title", payload.title);
    formData.append("Excerpt", payload.excerpt);
    formData.append("Status", String(payload.status));
    formData.append("BlogCategoryId", String(payload.blogCategoryId));

    if (coverImageFile) {
      formData.append("CoverImageFiles", coverImageFile);
    }

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      body: formData,
      headers: {
        accept: "*/*",
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || "Lưu bài viết thất bại");
    }
    return (
      data?.postId ||
      data?.id ||
      data?.data?.postId ||
      data?.data?.id ||
      selectedPost?.postId
    );

    return (
      data?.postId ||
      data?.id ||
      data?.data?.postId ||
      data?.data?.id ||
      selectedPost?.postId
    );
  };

  const syncBlocks = async (postId) => {
    const normalizedBlocks = updateBlockPositions(blocks);
    const existingIds = new Set(
      normalizedBlocks
        .filter((item) => item.persisted && item.postBlockId)
        .map((item) => Number(item.postBlockId)),
    );

    if (selectedPost?.postId) {
      const previousBlocks = await fetchBlockListByPostId(selectedPost.postId);
      const removedBlocks = previousBlocks.filter(
        (item) => !existingIds.has(Number(item.postBlockId)),
      );

      for (const block of removedBlocks) {
        await fetchJson(`${API_URL}/api/post-block/${block.postBlockId}`, {
          method: "DELETE",
        });
      }
    }

    for (const block of normalizedBlocks) {
      const payload = {
        postId: Number(postId),
        type: Number(block.type),
        position: Number(block.position),
        data: String(block.data || "").trim(),
      };

      if (block.persisted && block.postBlockId) {
        await fetchJson(`${API_URL}/api/post-block/${block.postBlockId}`, {
          method: "PUT",
          body: JSON.stringify({
            postBlockId: Number(block.postBlockId),
            ...payload,
          }),
        });
      } else {
        await fetchJson(`${API_URL}/api/post-block`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    const validationError = validatePostForm();
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    setSubmittingPost(true);
    try {
      const postId = await createOrUpdatePost();
      if (!postId) {
        throw new Error("Không lấy được mã bài viết sau khi lưu.");
      }

      await syncBlocks(postId);
      toast.success(
        selectedPost
          ? "Cập nhật bài viết thành công."
          : "Tạo bài viết thành công.",
      );
      await fetchInitialData();
      closePostModal();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost?.postId) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa bài viết "${selectedPost.title}" không?`,
    );
    if (!confirmed) return;

    setDeletingPost(true);
    try {
      const existingBlocks = await fetchBlockListByPostId(selectedPost.postId);
      for (const block of existingBlocks) {
        await fetchJson(`${API_URL}/api/post-block/${block.postBlockId}`, {
          method: "DELETE",
        });
      }

      await fetchJson(`${API_URL}/api/post/${selectedPost.postId}`, {
        method: "DELETE",
      });

      toast.success("Xóa bài viết thành công.");
      await fetchInitialData();
      closePostModal();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setDeletingPost(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F2] font-main">
      <Sidebar onExpandChange={setSbExpanded} />

      <div
        className={`min-h-screen transition-[margin] duration-300 ease-in-out ${
          sbExpanded ? "ml-72" : "ml-20"
        }`}
      >
        <Topbar
          breadcrumb={
            <>
              <span className="text-gray-400">QUẢN LÝ</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-[#2F3A67] font-bold">BLOG</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm bài viết, slug, mô tả ngắn, danh mục"
        />

        <main className="px-7 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {stats.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white px-6 py-5 flex items-center gap-4 shadow-sm"
              >
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${item.bg} ${item.text}`}
                >
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm text-[#8DA1C1]">{item.title}</div>
                  <div className="text-3xl font-bold text-[#1F2937]">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Quản lý Blog
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#2F3A67] outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                {POST_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#2F3A67] outline-none"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option
                    key={category.blogCategoryId}
                    value={String(category.blogCategoryId)}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={openCreateCategory}
                className="inline-flex items-center gap-2 rounded-xl border border-[#2F3A67] bg-white px-4 py-2 text-sm font-semibold text-[#2F3A67] hover:bg-[#F7F9FC]"
              >
                <FolderPlus className="h-4 w-4" />
                Tạo danh mục
              </button>

              <button
                type="button"
                onClick={openCreatePost}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Viết blog
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-[24px] font-bold text-[#2F3A67]">
                Danh sách bài viết
              </h2>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-10 w-10 rounded-full border border-[#D6DFEF] bg-white text-[#2F3A67] flex items-center justify-center disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="text-sm font-semibold text-[#2F3A67]">
                  {String(page).padStart(2, "0")}/
                  {String(totalPages).padStart(2, "0")}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-10 w-10 rounded-full border border-[#D6DFEF] bg-white text-[#2F3A67] flex items-center justify-center disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-gray-500">
                Đang tải bài viết...
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-red-500">
                {error}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-gray-500">
                Không tìm thấy bài viết nào.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {posts.map((post) => (
                  <button
                    key={post.postId}
                    type="button"
                    onClick={() => openEditPost(post)}
                    className="rounded-2xl border border-[#ECE7DF] bg-[#FFFCFA] p-5 text-left transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-bold text-[#2F3A67] line-clamp-2">
                          {post.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          /{post.slug}
                        </div>
                      </div>
                      <StatusBadge status={post.status} />
                    </div>

                    <div className="mt-3 inline-flex rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#2F3A67]">
                      {post.blogCategoryName || "Chưa có danh mục"}
                    </div>

                    <div className="mt-4 text-sm leading-6 text-[#42526B] line-clamp-3">
                      {post.excerpt || "Chưa có mô tả ngắn"}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>Post #{post.postId}</span>
                      <span>
                        {formatDate(
                          post.updatedAt || post.createdAt || post.publishedAt,
                        )}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {openCategoryModal && (
        <CategoryModal
          form={categoryForm}
          setForm={setCategoryForm}
          autoSlug={autoCategorySlug}
          setAutoSlug={setAutoCategorySlug}
          onClose={closeCategoryModal}
          onSubmit={handleCreateCategory}
          submitting={submittingCategory}
        />
      )}

      {openPostModal && (
        <PostModal
          selectedPost={selectedPost}
          form={postForm}
          setForm={setPostForm}
          coverImageFile={coverImageFile}
          setCoverImageFile={setCoverImageFile}
          coverImagePreview={coverImagePreview}
          setCoverImagePreview={setCoverImagePreview}
          existingCoverImage={existingCoverImage}
          setExistingCoverImage={setExistingCoverImage}
          blocks={blocks}
          categories={categories}
          autoSlug={autoPostSlug}
          setAutoSlug={setAutoPostSlug}
          onClose={closePostModal}
          onSubmit={handleSubmitPost}
          submitting={submittingPost}
          onCreateCategory={openCreateCategory}
          addBlock={addBlock}
          updateBlockField={updateBlockField}
          removeBlock={removeBlock}
          moveBlock={moveBlock}
          uploadImageFile={uploadImageFile}
          revokePreviewUrls={revokePreviewUrls}
          deleteButton={
            selectedPost ? (
              <button
                type="button"
                onClick={handleDeletePost}
                disabled={deletingPost}
                className="inline-flex items-center gap-2 rounded-xl border border-[#F6D7D7] bg-white px-4 py-2 text-sm font-medium text-[#C24141] hover:bg-[#FFF5F5] disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deletingPost ? "Đang xóa..." : "Xóa bài viết"}
              </button>
            ) : null
          }
        />
      )}
    </div>
  );
}

function CategoryModal({
  form,
  setForm,
  autoSlug,
  setAutoSlug,
  onClose,
  onSubmit,
  submitting,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-[#2F3A67]">
              Tạo danh mục blog
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F7FB] text-[#6B7280] hover:bg-[#EEF2F7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <FormField label="Tên danh mục" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
              placeholder="Ví dụ: Kinh nghiệm tổ chức tiệc"
            />
          </FormField>

          <FormField label="Slug" required>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false);
                setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
              }}
              className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
              placeholder="kinh-nghiem-to-chuc-tiec"
            />
            <label className="mt-2 inline-flex items-center gap-2 text-xs text-[#6B7280]">
              <input
                type="checkbox"
                checked={autoSlug}
                onChange={(e) => setAutoSlug(e.target.checked)}
              />
              Tự sinh slug theo tên danh mục
            </label>
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F7F9FC]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {submitting ? "Đang tạo..." : "Tạo danh mục"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PostModal({
  selectedPost,
  form,
  setForm,
  coverImageFile,
  setCoverImageFile,
  coverImagePreview,
  setCoverImagePreview,
  existingCoverImage,
  setExistingCoverImage,
  blocks,
  categories,
  autoSlug,
  setAutoSlug,
  onClose,
  onSubmit,
  submitting,
  onCreateCategory,
  addBlock,
  updateBlockField,
  removeBlock,
  moveBlock,
  uploadImageFile,
  deleteButton,
}) {
  const displayCoverImage = coverImagePreview || existingCoverImage || "";

  const handleCoverImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      typeof coverImagePreview === "string" &&
      coverImagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(coverImagePreview);
    }

    const preview = URL.createObjectURL(file);
    setCoverImageFile(file);
    setCoverImagePreview(preview);
    e.target.value = "";
  };

  const removeCoverImage = () => {
    if (
      typeof coverImagePreview === "string" &&
      coverImagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(coverImagePreview);
    }

    setCoverImageFile(null);
    setCoverImagePreview("");
    setExistingCoverImage("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#ECE7DF] px-6 py-5">
          <div>
            <h3 className="text-2xl font-bold text-[#2F3A67]">
              {selectedPost ? "Cập nhật bài viết" : "Viết blog mới"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F7FB] text-[#6B7280] hover:bg-[#EEF2F7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[1.02fr_1.18fr]">
            <div className="flex min-h-0 flex-col border-r border-[#ECE7DF] bg-[#FFFCFA]">
              <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-[#ECE7DF] bg-white p-5">
                    <div className="mb-4 text-lg font-bold text-[#2F3A67]">
                      Thông tin bài viết
                    </div>

                    <div className="space-y-4">
                      <FormField label="Tiêu đề" required>
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                          placeholder="Nhập tiêu đề bài viết"
                        />
                      </FormField>

                      <FormField label="Slug" required>
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) => {
                            setAutoSlug(false);
                            setForm((prev) => ({
                              ...prev,
                              slug: slugify(e.target.value),
                            }));
                          }}
                          className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                          placeholder="slug-bai-viet"
                        />
                        <label className="mt-2 inline-flex items-center gap-2 text-xs text-[#6B7280]">
                          <input
                            type="checkbox"
                            checked={autoSlug}
                            onChange={(e) => setAutoSlug(e.target.checked)}
                          />
                          Tự sinh slug theo tiêu đề
                        </label>
                      </FormField>

                      <FormField label="Mô tả ngắn" required>
                        <textarea
                          rows={4}
                          value={form.excerpt}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              excerpt: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                          placeholder="Nhập mô tả ngắn cho card bài viết"
                        />
                      </FormField>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField label="Trạng thái" required>
                          <select
                            value={form.status}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                status: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                          >
                            {POST_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FormField>

                        <FormField label="Ảnh bìa blog">
                          <div className="space-y-3">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm font-medium text-[#2F3A67] hover:bg-[#F7F9FC]">
                              <ImageIcon className="h-4 w-4" />
                              Chọn ảnh bìa
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverImageChange}
                                className="hidden"
                              />
                            </label>

                            <div className="text-xs text-[#8DA1C1]">
                              Blog chỉ sử dụng 1 ảnh bìa.
                            </div>

                            {displayCoverImage ? (
                              <div className="relative overflow-hidden rounded-2xl border border-[#DCE6F7] bg-[#F8FAFF]">
                                <img
                                  src={displayCoverImage}
                                  alt="cover-preview"
                                  className="h-52 w-full object-cover"
                                />

                                <button
                                  type="button"
                                  onClick={removeCoverImage}
                                  className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-white"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex h-52 w-full items-center justify-center rounded-2xl border border-dashed border-[#D6DFEF] bg-[#FAFBFD] text-sm text-[#8DA1C1]">
                                Chưa có ảnh bìa
                              </div>
                            )}
                          </div>
                        </FormField>
                      </div>

                      <FormField label="Danh mục blog" required>
                        <div className="flex gap-3">
                          <select
                            value={form.blogCategoryId}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                blogCategoryId: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
                          >
                            <option value="">Chọn danh mục</option>
                            {categories.map((category) => (
                              <option
                                key={category.blogCategoryId}
                                value={String(category.blogCategoryId)}
                              >
                                {category.name}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={onCreateCategory}
                            className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-[#2F3A67] bg-white px-4 py-3 text-sm font-semibold text-[#2F3A67] hover:bg-[#F7F9FC]"
                          >
                            <FolderPlus className="h-4 w-4" />
                            Danh mục
                          </button>
                        </div>
                      </FormField>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {blocks.map((block, index) => (
                      <BlockEditor
                        key={block.localId}
                        block={block}
                        index={index}
                        total={blocks.length}
                        onChange={updateBlockField}
                        onDelete={removeBlock}
                        onMove={moveBlock}
                        uploadImageFile={uploadImageFile}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-[#ECE7DF] bg-white/95 px-6 py-4 backdrop-blur">
                <div className="mb-3 text-sm font-semibold text-[#2F3A67]">
                  Thêm khối nội dung
                </div>
                <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {Object.entries(BLOCK_TYPES).map(([value, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => addBlock(Number(value))}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-3 py-2 text-sm font-medium text-[#2F3A67] hover:bg-[#F7F9FC]"
                      >
                        <Icon className="h-4 w-4" />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col bg-[#FFF8F2]">
              <div className="shrink-0 border-b border-[#ECE7DF] bg-white px-6 py-4">
                <div className="text-lg font-bold text-[#2F3A67]">
                  Xem trước nội dung
                </div>
              </div>

              <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <PostPreview
                  form={form}
                  blocks={blocks}
                  coverImage={coverImagePreview || existingCoverImage}
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#ECE7DF] bg-white px-6 py-4">
            <div>{deleteButton}</div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F7F9FC]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {submitting
                  ? "Đang lưu..."
                  : selectedPost
                    ? "Lưu thay đổi"
                    : "Tạo bài viết"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  index,
  total,
  onChange,
  onDelete,
  onMove,
  uploadImageFile,
}) {
  const meta = getBlockTypeMeta(block.type);
  const Icon = meta.icon;
  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const uploadedUrl = await uploadImageFile(file);

      if (!uploadedUrl) {
        throw new Error("Không lấy được URL ảnh sau khi upload");
      }

      onChange(block.localId, "data", uploadedUrl);
      toast.success("Upload ảnh thành công");
    } catch (err) {
      toast.error(err.message || "Upload ảnh thất bại");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-[#ECE7DF] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-[#2F3A67]">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <div className="font-bold text-[#2F3A67]">{meta.label}</div>
            <div className="text-xs text-[#8DA1C1]">Block {index + 1}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMove(block.localId, "up")}
            disabled={index === 0}
            className="rounded-lg border border-[#D6DFEF] p-2 text-[#2F3A67] disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(block.localId, "down")}
            disabled={index === total - 1}
            className="rounded-lg border border-[#D6DFEF] p-2 text-[#2F3A67] disabled:opacity-40"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(block.localId)}
            className="rounded-lg border border-[#F6D7D7] p-2 text-[#C24141] hover:bg-[#FFF5F5]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {block.type === 1 && (
        <input
          type="text"
          value={block.data}
          onChange={(e) => onChange(block.localId, "data", e.target.value)}
          placeholder="Nhập tiêu đề lớn"
          className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-xl font-bold outline-none focus:border-[#7CA3FF]"
        />
      )}

      {block.type === 2 && (
        <input
          type="text"
          value={block.data}
          onChange={(e) => onChange(block.localId, "data", e.target.value)}
          placeholder="Nhập tiêu đề nhỏ"
          className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-[#7CA3FF]"
        />
      )}

      {block.type === 3 && (
        <textarea
          rows={6}
          value={block.data}
          onChange={(e) => onChange(block.localId, "data", e.target.value)}
          placeholder="Nhập nội dung bài viết"
          className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-[#7CA3FF]"
        />
      )}

      {block.type === 4 && (
        <div className="space-y-3">
          <label className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#D6DFEF] bg-[#FAFBFD] px-4 py-6 text-sm font-medium text-[#2F3A67] hover:bg-[#F7F9FC]">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {uploading ? "Đang upload ảnh..." : "Chọn ảnh để upload"}
          </label>

          <input
            type="text"
            value={block.data}
            onChange={(e) => onChange(block.localId, "data", e.target.value)}
            placeholder="Hoặc dán URL ảnh tại đây"
            className="w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]"
          />

          {!!block.data && (
            <div className="overflow-hidden rounded-2xl border border-[#ECE7DF] bg-[#FAFBFD]">
              <img
                src={block.data}
                alt="preview"
                className="max-h-72 w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      )}

      {block.type === 5 && (
        <textarea
          rows={4}
          value={block.data}
          onChange={(e) => onChange(block.localId, "data", e.target.value)}
          placeholder="Nhập câu trích dẫn"
          className="w-full rounded-xl border border-[#DCE6F7] bg-[#FFFDF8] px-4 py-3 text-base italic leading-7 outline-none focus:border-[#7CA3FF]"
        />
      )}
    </div>
  );
}

function PostPreview({ form, blocks, coverImage = "" }) {
  const sortedBlocks = [...blocks].sort(
    (a, b) => Number(a.position || 0) - Number(b.position || 0),
  );

  return (
    <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[#ECE7DF] bg-white p-6 md:p-8 shadow-sm">
      <div className="border-b border-[#F1E7DA] pb-5">
        <div className="mb-3 inline-flex rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#2F3A67]">
          {form.status === "Published" ? "Đã xuất bản" : "Bản nháp"}
        </div>

        <h1 className="text-3xl font-bold leading-tight text-[#2E6418]">
          {form.title || "Tiêu đề bài viết sẽ hiện ở đây"}
        </h1>

        <p className="mt-3 text-base leading-7 text-[#5B6780]">
          {form.excerpt || "Mô tả ngắn của bài viết sẽ hiện ở đây."}
        </p>
      </div>

      {coverImage ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-[#ECE7DF] bg-[#FAFBFD]">
          <img
            src={coverImage}
            alt="cover-preview"
            className="h-64 w-full object-cover md:h-72"
          />
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        {sortedBlocks.map((block) => {
          if (!String(block.data || "").trim()) return null;

          if (block.type === 1) {
            return (
              <h2
                key={block.localId}
                className="text-2xl font-bold leading-tight text-[#2F3A67]"
              >
                {block.data}
              </h2>
            );
          }

          if (block.type === 2) {
            return (
              <h3
                key={block.localId}
                className="text-xl font-semibold leading-tight text-[#2F3A67]"
              >
                {block.data}
              </h3>
            );
          }

          if (block.type === 3) {
            return (
              <p
                key={block.localId}
                className="whitespace-pre-wrap text-[15px] leading-8 text-[#374151]"
              >
                {block.data}
              </p>
            );
          }

          if (block.type === 4) {
            return (
              <div
                key={block.localId}
                className="overflow-hidden rounded-2xl border border-[#ECE7DF] bg-[#FAFBFD]"
              >
                <img
                  src={block.data}
                  alt="blog-content"
                  className="max-h-[460px] w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            );
          }

          if (block.type === 5) {
            return (
              <blockquote
                key={block.localId}
                className="rounded-2xl border-l-4 border-[#E8712E] bg-[#FFF8F2] px-5 py-4 text-lg italic leading-8 text-[#5B6780]"
              >
                “{block.data}”
              </blockquote>
            );
          }

          return null;
        })}

        {sortedBlocks.every((block) => !String(block.data || "").trim()) && (
          <div className="rounded-2xl border border-dashed border-[#D6DFEF] bg-[#FAFBFD] px-5 py-10 text-center text-sm text-[#8DA1C1]">
            Nội dung bài viết sẽ hiển thị ở đây khi bạn nhập block.
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-[#2F3A67]">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </div>
      {children}
    </label>
  );
}

function StatusBadge({ status }) {
  const normalized = normalizePostStatus(status);
  const map = {
    Published: {
      className: "bg-[#DCFCE7] text-[#15803D]",
      label: "Đã xuất bản",
    },
    Draft: {
      className: "bg-[#FEF3C7] text-[#B45309]",
      label: "Bản nháp",
    },
  };

  const statusMeta = map[normalized] || map.Draft;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
    >
      {statusMeta.label}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "--/--/----";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--/--/----";
  return date.toLocaleString("vi-VN");
}
