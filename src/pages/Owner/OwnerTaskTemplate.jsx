import React from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TASK_TEMPLATE_ENDPOINT = `${API_URL}/api/task-template`;
const PAGE_SIZE = 100;

export default function OwnerTaskTemplate() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const [taskTemplates, setTaskTemplates] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openDeleteModal, setOpenDeleteModal] = React.useState(false);

  const [selectedTask, setSelectedTask] = React.useState(null);

  const [submittingCreate, setSubmittingCreate] = React.useState(false);
  const [submittingEdit, setSubmittingEdit] = React.useState(false);
  const [submittingDelete, setSubmittingDelete] = React.useState(false);

  const [createForm, setCreateForm] = React.useState({
    taskName: "",
    isActive: true,
  });

  const [editForm, setEditForm] = React.useState({
    taskName: "",
    isActive: true,
  });

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const fetchAllTaskTemplates = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let page = 1;
      let allItems = [];
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(
          `${TASK_TEMPLATE_ENDPOINT}?page=${page}&pageSize=${PAGE_SIZE}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              accept: "*/*",
            },
          },
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.message || "Không thể tải task mẫu");
        }

        const items = Array.isArray(data?.items) ? data.items : [];
        allItems = [...allItems, ...items];

        const totalPages = Number(data?.totalPages || 1);
        if (page >= totalPages || items.length === 0) {
          hasMore = false;
        } else {
          page += 1;
        }
      }

      allItems.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0),
      );

      setTaskTemplates(allItems);
    } catch (err) {
      const message = err.message || "Đã có lỗi xảy ra";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAllTaskTemplates();
  }, [fetchAllTaskTemplates]);

  const filteredTasks = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return taskTemplates;

    return taskTemplates.filter((item) => {
      return (
        item.taskName?.toLowerCase().includes(keyword) ||
        String(item.taskTemplateId || "").includes(keyword) ||
        renderTaskStatus(item.isActive).toLowerCase().includes(keyword)
      );
    });
  }, [taskTemplates, search]);

  const resetCreateForm = () => {
    setCreateForm({
      taskName: "",
      isActive: true,
    });
  };

  const resetEditForm = () => {
    setEditForm({
      taskName: "",
      isActive: true,
    });
  };

  const closeCreateModal = () => {
    setOpenCreateModal(false);
    resetCreateForm();
  };

  const closeEditModal = () => {
    setOpenEditModal(false);
    setSelectedTask(null);
    resetEditForm();
  };

  const closeDeleteModal = () => {
    setOpenDeleteModal(false);
    setSelectedTask(null);
  };

  const openCreateTaskModal = () => {
    resetCreateForm();
    setOpenCreateModal(true);
  };

  const openEditTaskModal = (task) => {
    setSelectedTask(task);
    setEditForm({
      taskName: task.taskName || "",
      isActive: Boolean(task.isActive),
    });
    setOpenEditModal(true);
  };

  const openDeleteTaskModal = (task) => {
    setSelectedTask(task);
    setOpenDeleteModal(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmittingCreate(true);

    try {
      const payload = {
        taskName: createForm.taskName.trim(),
        isActive: Boolean(createForm.isActive),
      };

      if (!payload.taskName) {
        toast.warning("Vui lòng nhập tên task mẫu.");
        setSubmittingCreate(false);
        return;
      }

      const res = await fetch(TASK_TEMPLATE_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Thêm task mẫu thất bại");
      }

      toast.success("Thêm task mẫu thành công");
      closeCreateModal();
      await fetchAllTaskTemplates();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();

    if (!selectedTask?.taskTemplateId) return;
    setSubmittingEdit(true);

    try {
      const payload = {
        taskName: editForm.taskName.trim(),
        isActive: Boolean(editForm.isActive),
      };

      if (!payload.taskName) {
        toast.warning("Vui lòng nhập tên task mẫu.");
        setSubmittingEdit(false);
        return;
      }

      const res = await fetch(
        `${TASK_TEMPLATE_ENDPOINT}/${selectedTask.taskTemplateId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "*/*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Cập nhật task mẫu thất bại");
      }

      toast.success("Cập nhật task mẫu thành công");
      closeEditModal();
      await fetchAllTaskTemplates();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask?.taskTemplateId) return;
    setSubmittingDelete(true);

    try {
      const res = await fetch(
        `${TASK_TEMPLATE_ENDPOINT}/${selectedTask.taskTemplateId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "*/*",
          },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa task mẫu thất bại");
      }

      toast.success("Xóa task mẫu thành công");
      closeDeleteModal();
      await fetchAllTaskTemplates();
    } catch (err) {
      toast.error(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0] font-main">
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
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900">TASK MẪU</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm task mẫu"
        />

        <main className="px-7 py-6 pb-10">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-[20px] font-bold text-[#E54B2D]">
              Tất cả task mẫu
            </h1>

            <button
              type="button"
              onClick={openCreateTaskModal}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#E8712E] px-4 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Thêm task mẫu
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-sm text-gray-500">
              Không có task mẫu phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {filteredTasks.map((task) => (
                <TaskTemplateCard
                  key={task.taskTemplateId}
                  task={task}
                  onEdit={() => openEditTaskModal(task)}
                  onDelete={() => openDeleteTaskModal(task)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {openCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Thêm task mẫu mới
              </h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 p-6">
              <Field
                label="Tên task mẫu"
                value={createForm.taskName}
                onChange={(v) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    taskName: v,
                  }))
                }
                required
              />

              <SwitchField
                label="Hoạt động"
                checked={createForm.isActive}
                onChange={(checked) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    isActive: checked,
                  }))
                }
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="h-10 rounded-lg bg-[#E8712E] px-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {submittingCreate ? "Đang thêm..." : "Lưu task mẫu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openEditModal && selectedTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Cập nhật task mẫu
              </h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleEditTask} className="space-y-4 p-6">
              <Field
                label="Tên task mẫu"
                value={editForm.taskName}
                onChange={(v) =>
                  setEditForm((prev) => ({
                    ...prev,
                    taskName: v,
                  }))
                }
                required
              />

              <SwitchField
                label="Hoạt động"
                checked={editForm.isActive}
                onChange={(checked) =>
                  setEditForm((prev) => ({
                    ...prev,
                    isActive: checked,
                  }))
                }
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="h-10 rounded-lg bg-[#E8712E] px-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {submittingEdit ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openDeleteModal && selectedTask && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Xác nhận xóa task mẫu
              </h2>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-gray-600">
                Bạn có chắc muốn xóa task mẫu{" "}
                <span className="font-semibold text-gray-900">
                  "{selectedTask.taskName}"
                </span>{" "}
                không?
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="h-10 rounded-lg border border-gray-300 px-4 text-gray-700 transition hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={submittingDelete}
                className="h-10 rounded-lg bg-red-600 px-4 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {submittingDelete ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskTemplateCard({ task, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-[#F1E3D8] bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[18px] font-bold text-[#2D9C3C]">
          {task.taskName || "Không có tên"}
        </h3>

        <span className="rounded-full bg-[#FFF3EA] px-2 py-1 text-xs font-semibold text-[#E8712E]">
          #{task.taskTemplateId}
        </span>
      </div>

      <div className="mt-3">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            task.isActive
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {task.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
        </span>
      </div>

      <div className="mt-4 space-y-1 text-xs text-gray-400">
        <div>Tạo: {formatDateTime(task.createdAt)}</div>
        <div>Cập nhật: {formatDateTime(task.updatedAt)}</div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-9 items-center gap-2 rounded-lg border border-[#F2B9A5] bg-[#FFFAF0] px-3 text-sm font-semibold text-[#E8712E] transition hover:bg-[#FFF3EA]"
        >
          <Pencil className="h-4 w-4" />
          Sửa
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 items-center gap-2 rounded-lg bg-red-50 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
          Xóa
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required = false, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#E8712E]"
      />
    </div>
  );
}

function SwitchField({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
      <span className="text-sm font-medium text-gray-700">{label}</span>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-[#E8712E]" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </label>
  );
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function renderTaskStatus(isActive) {
  return isActive ? "Đang hoạt động" : "Ngưng hoạt động";
}
