import React from "react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import {
  Users,
  UserPlus,
  Shield,
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Search,
  FolderKanban,
  Crown,
  UserRound,
  Link2,
} from "lucide-react";

const EMPTY_USER_FORM = {
  userName: "",
  password: "",
  fullName: "",
  email: "",
  address: "",
  phone: "",
  roleId: "",
};

const EMPTY_GROUP_FORM = {
  staffGroupName: "",
  leaderId: "",
};

const EMPTY_MEMBER_FORM = {
  staffGroupId: "",
  staffId: "",
};

const TAB_ITEMS = [
  { key: "staff", label: "Nhân viên", icon: <Users className="h-4 w-4" /> },
  {
    key: "groups",
    label: "Nhóm nhân viên",
    icon: <FolderKanban className="h-4 w-4" />,
  },
  {
    key: "members",
    label: "Phân công nhóm",
    icon: <Link2 className="h-4 w-4" />,
  },
];

export default function OwnerStaffManagement() {
  const [sbExpanded, setSbExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("staff");

  const [users, setUsers] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [members, setMembers] = React.useState([]);

  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [loadingRoles, setLoadingRoles] = React.useState(true);
  const [loadingGroups, setLoadingGroups] = React.useState(true);
  const [loadingMembers, setLoadingMembers] = React.useState(true);

  const [search, setSearch] = React.useState("");

  const [userModalOpen, setUserModalOpen] = React.useState(false);
  const [groupModalOpen, setGroupModalOpen] = React.useState(false);
  const [memberModalOpen, setMemberModalOpen] = React.useState(false);

  const [userModalMode, setUserModalMode] = React.useState("create");
  const [groupModalMode, setGroupModalMode] = React.useState("create");
  const [memberModalMode, setMemberModalMode] = React.useState("create");

  const [editingUserId, setEditingUserId] = React.useState(null);
  const [editingGroupId, setEditingGroupId] = React.useState(null);
  const [editingMemberId, setEditingMemberId] = React.useState(null);

  const [userForm, setUserForm] = React.useState(EMPTY_USER_FORM);
  const [groupForm, setGroupForm] = React.useState(EMPTY_GROUP_FORM);
  const [memberForm, setMemberForm] = React.useState(EMPTY_MEMBER_FORM);

  const [submittingUser, setSubmittingUser] = React.useState(false);
  const [submittingGroup, setSubmittingGroup] = React.useState(false);
  const [submittingMember, setSubmittingMember] = React.useState(false);
  const [deletingKey, setDeletingKey] = React.useState("");

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const authHeaders = React.useMemo(
    () => ({
      accept: "*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const fetchUsers = React.useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/api/user`, { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Không thể tải danh sách người dùng");
      setUsers(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoadingUsers(false);
    }
  }, [authHeaders]);

  const fetchRoles = React.useCallback(async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch(`${API_URL}/api/role`, { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Không thể tải danh sách vai trò");
      setRoles(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err.message || "Không thể tải danh sách vai trò");
    } finally {
      setLoadingRoles(false);
    }
  }, [authHeaders]);

  const fetchGroups = React.useCallback(async () => {
    setLoadingGroups(true);
    try {
      const res = await fetch(`${API_URL}/api/staff-group`, {
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || "Không thể tải danh sách nhóm");
      setGroups(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err.message || "Không thể tải danh sách nhóm");
    } finally {
      setLoadingGroups(false);
    }
  }, [authHeaders]);

  const fetchMembers = React.useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`${API_URL}/api/staff-group-member`, {
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          data?.message || "Không thể tải danh sách phân công nhóm",
        );
      setMembers(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      toast.error(err.message || "Không thể tải danh sách phân công nhóm");
    } finally {
      setLoadingMembers(false);
    }
  }, [authHeaders]);

  React.useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchGroups();
    fetchMembers();
  }, [fetchUsers, fetchRoles, fetchGroups, fetchMembers]);

  const roleMap = React.useMemo(() => {
    return roles.reduce((acc, item) => {
      acc[item.roleId] = item.roleName;
      return acc;
    }, {});
  }, [roles]);

  const leaderCandidates = React.useMemo(
    () =>
      users.filter(
        (item) => item.roleName === "GROUP_LEADER" || Number(item.roleId) === 2,
      ),
    [users],
  );

  const staffCandidates = React.useMemo(
    () =>
      users.filter(
        (item) => item.roleName === "STAFF" || Number(item.roleId) === 3,
      ),
    [users],
  );

  const filteredUsers = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((item) => {
      return (
        String(item.userId).includes(keyword) ||
        String(item.userName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.fullName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.email || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.phone || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.roleName || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [users, search]);

  const filteredGroups = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return groups;
    return groups.filter((item) => {
      return (
        String(item.staffGroupId).includes(keyword) ||
        String(item.staffGroupName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.leaderName || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [groups, search]);

  const filteredMembers = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter((item) => {
      return (
        String(item.staffGroupMemberId).includes(keyword) ||
        String(item.staffName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.staffGroupName || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [members, search]);

  const stats = React.useMemo(
    () => [
      {
        title: "Tổng người dùng",
        value: users.length,
        icon: <Users className="h-5 w-5" />,
        bg: "bg-blue-100",
        text: "text-blue-600",
      },
      {
        title: "Group leader",
        value: users.filter((item) => item.roleName === "GROUP_LEADER").length,
        icon: <Crown className="h-5 w-5" />,
        bg: "bg-amber-100",
        text: "text-amber-600",
      },
      {
        title: "Nhóm nhân viên",
        value: groups.length,
        icon: <FolderKanban className="h-5 w-5" />,
        bg: "bg-emerald-100",
        text: "text-emerald-600",
      },
      {
        title: "Phân công nhóm",
        value: members.length,
        icon: <Link2 className="h-5 w-5" />,
        bg: "bg-violet-100",
        text: "text-violet-600",
      },
    ],
    [users, groups, members],
  );

  const resetUserForm = () => {
    setUserForm(EMPTY_USER_FORM);
    setEditingUserId(null);
  };

  const resetGroupForm = () => {
    setGroupForm(EMPTY_GROUP_FORM);
    setEditingGroupId(null);
  };

  const resetMemberForm = () => {
    setMemberForm(EMPTY_MEMBER_FORM);
    setEditingMemberId(null);
  };

  const openCreateUserModal = () => {
    setUserModalMode("create");
    resetUserForm();
    setUserModalOpen(true);
  };

  const openEditUserModal = (item) => {
    setUserModalMode("edit");
    setEditingUserId(item.userId);
    setUserForm({
      userName: item.userName || "",
      password: "",
      fullName: item.fullName || "",
      email: item.email || "",
      address: item.address || "",
      phone: item.phone || "",
      roleId: String(resolveRoleId(item, roles) || ""),
    });
    setUserModalOpen(true);
  };

  const openCreateGroupModal = () => {
    setGroupModalMode("create");
    resetGroupForm();
    setGroupModalOpen(true);
  };

  const openEditGroupModal = (item) => {
    setGroupModalMode("edit");
    setEditingGroupId(item.staffGroupId);
    setGroupForm({
      staffGroupName: item.staffGroupName || "",
      leaderId: String(item.leaderId || ""),
    });
    setGroupModalOpen(true);
  };

  const openCreateMemberModal = () => {
    setMemberModalMode("create");
    resetMemberForm();
    setMemberModalOpen(true);
  };

  const openEditMemberModal = (item) => {
    setMemberModalMode("edit");
    setEditingMemberId(item.staffGroupMemberId);
    setMemberForm({
      staffGroupId: String(item.staffGroupId || ""),
      staffId: String(item.staffId || ""),
    });
    setMemberModalOpen(true);
  };

  const closeUserModal = () => {
    setUserModalOpen(false);
    resetUserForm();
  };

  const closeGroupModal = () => {
    setGroupModalOpen(false);
    resetGroupForm();
  };

  const closeMemberModal = () => {
    setMemberModalOpen(false);
    resetMemberForm();
  };

  const validateUserForm = () => {
    if (!userForm.userName.trim()) return "Vui lòng nhập username.";
    if (userModalMode === "create" && !userForm.password.trim())
      return "Vui lòng nhập mật khẩu.";
    if (!userForm.fullName.trim()) return "Vui lòng nhập họ tên.";
    if (!userForm.email.trim()) return "Vui lòng nhập email.";
    if (!userForm.address.trim()) return "Vui lòng nhập địa chỉ.";
    if (!userForm.phone.trim()) return "Vui lòng nhập số điện thoại.";
    if (!userForm.roleId) return "Vui lòng chọn vai trò.";
    return "";
  };

  const validateGroupForm = () => {
    if (!groupForm.staffGroupName.trim()) return "Vui lòng nhập tên nhóm.";
    if (!groupForm.leaderId) return "Vui lòng chọn group leader.";
    return "";
  };

  const validateMemberForm = () => {
    if (!memberForm.staffGroupId) return "Vui lòng chọn nhóm nhân viên.";
    if (!memberForm.staffId) return "Vui lòng chọn nhân viên.";
    return "";
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    const validationError = validateUserForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmittingUser(true);
    try {
      const url =
        userModalMode === "create"
          ? `${API_URL}/api/user`
          : `${API_URL}/api/user/${editingUserId}`;

      const method = userModalMode === "create" ? "POST" : "PUT";

      const payload = {
        userName: userForm.userName.trim(),
        ...(userForm.password.trim()
          ? { password: userForm.password.trim() }
          : {}),
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        address: userForm.address.trim(),
        phone: userForm.phone.trim(),
        roleId: Number(userForm.roleId),
      };

      const res = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            (userModalMode === "create"
              ? "Tạo nhân viên thất bại"
              : "Cập nhật nhân viên thất bại"),
        );
      }

      toast.success(
        userModalMode === "create"
          ? "Tạo nhân viên thành công"
          : "Cập nhật nhân viên thành công",
      );
      closeUserModal();
      await fetchUsers();
    } catch (err) {
      toast.error(err.message || "Thao tác thất bại");
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleSubmitGroup = async (e) => {
    e.preventDefault();
    const validationError = validateGroupForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmittingGroup(true);
    try {
      const url =
        groupModalMode === "create"
          ? `${API_URL}/api/staff-group`
          : `${API_URL}/api/staff-group/${editingGroupId}`;

      const method = groupModalMode === "create" ? "POST" : "PUT";

      const payload = {
        staffGroupName: groupForm.staffGroupName.trim(),
        leaderId: Number(groupForm.leaderId),
      };

      const res = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            (groupModalMode === "create"
              ? "Tạo nhóm thất bại"
              : "Cập nhật nhóm thất bại"),
        );
      }

      toast.success(
        groupModalMode === "create"
          ? "Tạo nhóm nhân viên thành công"
          : "Cập nhật nhóm nhân viên thành công",
      );
      closeGroupModal();
      await fetchGroups();
      await fetchMembers();
    } catch (err) {
      toast.error(err.message || "Thao tác thất bại");
    } finally {
      setSubmittingGroup(false);
    }
  };

  const handleSubmitMember = async (e) => {
    e.preventDefault();
    const validationError = validateMemberForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmittingMember(true);
    try {
      const url =
        memberModalMode === "create"
          ? `${API_URL}/api/staff-group-member`
          : `${API_URL}/api/staff-group-member/${editingMemberId}`;

      const method = memberModalMode === "create" ? "POST" : "PUT";

      const payload = {
        staffGroupId: Number(memberForm.staffGroupId),
        staffId: Number(memberForm.staffId),
      };

      const res = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            (memberModalMode === "create"
              ? "Phân công nhóm thất bại"
              : "Cập nhật phân công thất bại"),
        );
      }

      toast.success(
        memberModalMode === "create"
          ? "Phân công nhân viên vào nhóm thành công"
          : "Cập nhật phân công nhóm thành công",
      );
      closeMemberModal();
      await fetchMembers();
    } catch (err) {
      toast.error(err.message || "Thao tác thất bại");
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleDelete = async ({ type, id, name }) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa \"${name}\" không?`);
    if (!confirmed) return;

    setDeletingKey(`${type}-${id}`);
    try {
      const endpointMap = {
        user: `${API_URL}/api/user/${id}`,
        group: `${API_URL}/api/staff-group/${id}`,
        member: `${API_URL}/api/staff-group-member/${id}`,
      };

      const res = await fetch(endpointMap[type], {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Xóa thất bại");

      toast.success("Xóa thành công");
      if (type === "user") await fetchUsers();
      if (type === "group") {
        await fetchGroups();
        await fetchMembers();
      }
      if (type === "member") await fetchMembers();
    } catch (err) {
      toast.error(err.message || "Xóa thất bại");
    } finally {
      setDeletingKey("");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2EA] font-main">
      <Sidebar onExpandChange={setSbExpanded} />

      <div
        className={`min-h-screen transition-[margin] duration-300 ease-in-out ${sbExpanded ? "ml-72" : "ml-20"}`}
      >
        <Topbar
          breadcrumb={
            <>
              <span className="text-gray-400">QUẢN LÝ</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-[#2F3A67] font-bold">NHÂN VIÊN</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm nhân viên, nhóm, phân công"
        />

        <main className="px-7 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {stats.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white px-6 py-5 flex items-center gap-4"
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
              Quản lý nhân viên và nhóm
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openCreateUserModal}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <UserPlus className="h-4 w-4" />
                Tạo nhân viên
              </button>

              <button
                type="button"
                onClick={openCreateGroupModal}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Tạo nhóm
              </button>

              <button
                type="button"
                onClick={openCreateMemberModal}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <Shield className="h-4 w-4" />
                Phân công nhóm
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {TAB_ITEMS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[#2F3A67] text-white"
                      : "bg-white text-[#2F3A67] hover:bg-[#EEF2F7]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[24px] font-bold text-[#2F3A67]">
                  {activeTab === "staff"
                    ? "Danh sách nhân viên"
                    : activeTab === "groups"
                      ? "Danh sách nhóm nhân viên"
                      : "Danh sách phân công nhóm"}
                </h2>
                <div className="mt-1 text-sm text-[#8DA1C1]">
                  {activeTab === "staff"
                    ? "Tạo nhân viên, gán vai trò admin, group leader, staff, user."
                    : activeTab === "groups"
                      ? "Tạo nhóm nhân viên và phân công group leader quản lý nhóm."
                      : "Gán staff vào từng nhóm nhân viên."}
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#8DA1C1]">
                <Search className="h-4 w-4" />
                {search ? `Kết quả cho “${search}”` : "Tất cả dữ liệu"}
              </div>
            </div>

            {activeTab === "staff" ? (
              <UserTable
                items={filteredUsers}
                loading={loadingUsers || loadingRoles}
                roleMap={roleMap}
                deletingKey={deletingKey}
                onEdit={openEditUserModal}
                onDelete={(item) =>
                  handleDelete({
                    type: "user",
                    id: item.userId,
                    name:
                      item.fullName || item.userName || `User #${item.userId}`,
                  })
                }
              />
            ) : null}

            {activeTab === "groups" ? (
              <GroupTable
                items={filteredGroups}
                loading={loadingGroups}
                deletingKey={deletingKey}
                onEdit={openEditGroupModal}
                onDelete={(item) =>
                  handleDelete({
                    type: "group",
                    id: item.staffGroupId,
                    name: item.staffGroupName || `Nhóm #${item.staffGroupId}`,
                  })
                }
              />
            ) : null}

            {activeTab === "members" ? (
              <MemberTable
                items={filteredMembers}
                loading={loadingMembers}
                deletingKey={deletingKey}
                onEdit={openEditMemberModal}
                onDelete={(item) =>
                  handleDelete({
                    type: "member",
                    id: item.staffGroupMemberId,
                    name: `${item.staffName} - ${item.staffGroupName}`,
                  })
                }
              />
            ) : null}
          </div>
        </main>
      </div>

      {userModalOpen ? (
        <ModalShell
          title={
            userModalMode === "create" ? "Tạo nhân viên" : "Cập nhật nhân viên"
          }
          description="Quản lý tài khoản nhân viên, group leader hoặc user."
          onClose={closeUserModal}
        >
          <form onSubmit={handleSubmitUser} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Username" required>
                <input
                  type="text"
                  value={userForm.userName}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      userName: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="admin"
                />
              </FormField>

              <FormField
                label={userModalMode === "create" ? "Mật khẩu" : "Mật khẩu mới"}
                required={userModalMode === "create"}
              >
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder={
                    userModalMode === "create"
                      ? "Nhập mật khẩu"
                      : "Bỏ trống nếu không đổi"
                  }
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Họ tên" required>
                <input
                  type="text"
                  value={userForm.fullName}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Team Leader Nguyen"
                />
              </FormField>

              <FormField label="Email" required>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="leader@buffet.vn"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Số điện thoại" required>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="0901234567"
                />
              </FormField>

              <FormField label="Vai trò" required>
                <select
                  value={userForm.roleId}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, roleId: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="">Chọn vai trò</option>
                  {roles.map((item) => (
                    <option key={item.roleId} value={item.roleId}>
                      {item.roleName}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Địa chỉ" required>
              <input
                type="text"
                value={userForm.address}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, address: e.target.value }))
                }
                className={inputClass}
                placeholder="123 Admin St"
              />
            </FormField>

            <ModalActions
              submitting={submittingUser}
              submitLabel={
                userModalMode === "create" ? "Tạo nhân viên" : "Lưu thay đổi"
              }
              onCancel={closeUserModal}
            />
          </form>
        </ModalShell>
      ) : null}

      {groupModalOpen ? (
        <ModalShell
          title={
            groupModalMode === "create"
              ? "Tạo nhóm nhân viên"
              : "Cập nhật nhóm nhân viên"
          }
          description="Chọn group leader phụ trách nhóm ngay khi tạo nhóm."
          onClose={closeGroupModal}
        >
          <form onSubmit={handleSubmitGroup} className="space-y-5">
            <FormField label="Tên nhóm" required>
              <input
                type="text"
                value={groupForm.staffGroupName}
                onChange={(e) =>
                  setGroupForm((prev) => ({
                    ...prev,
                    staffGroupName: e.target.value,
                  }))
                }
                className={inputClass}
                placeholder="Service Team A"
              />
            </FormField>

            <FormField label="Group leader" required>
              <select
                value={groupForm.leaderId}
                onChange={(e) =>
                  setGroupForm((prev) => ({
                    ...prev,
                    leaderId: e.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Chọn group leader</option>
                {leaderCandidates.map((item) => (
                  <option key={item.userId} value={item.userId}>
                    {item.fullName} - {item.email}
                  </option>
                ))}
              </select>
            </FormField>

            <ModalActions
              submitting={submittingGroup}
              submitLabel={
                groupModalMode === "create" ? "Tạo nhóm" : "Lưu thay đổi"
              }
              onCancel={closeGroupModal}
            />
          </form>
        </ModalShell>
      ) : null}

      {memberModalOpen ? (
        <ModalShell
          title={
            memberModalMode === "create"
              ? "Phân công nhóm"
              : "Cập nhật phân công nhóm"
          }
          description="Gán staff vào nhóm nhân viên phù hợp."
          onClose={closeMemberModal}
        >
          <form onSubmit={handleSubmitMember} className="space-y-5">
            <FormField label="Nhóm nhân viên" required>
              <select
                value={memberForm.staffGroupId}
                onChange={(e) =>
                  setMemberForm((prev) => ({
                    ...prev,
                    staffGroupId: e.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Chọn nhóm</option>
                {groups.map((item) => (
                  <option key={item.staffGroupId} value={item.staffGroupId}>
                    {item.staffGroupName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Nhân viên" required>
              <select
                value={memberForm.staffId}
                onChange={(e) =>
                  setMemberForm((prev) => ({
                    ...prev,
                    staffId: e.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Chọn staff</option>
                {staffCandidates.map((item) => (
                  <option key={item.userId} value={item.userId}>
                    {item.fullName} - {item.email}
                  </option>
                ))}
              </select>
            </FormField>

            <ModalActions
              submitting={submittingMember}
              submitLabel={
                memberModalMode === "create" ? "Phân công" : "Lưu thay đổi"
              }
              onCancel={closeMemberModal}
            />
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}

function UserTable({ items, loading, roleMap, deletingKey, onEdit, onDelete }) {
  if (loading) {
    return <EmptyState text="Đang tải danh sách nhân viên..." />;
  }

  if (items.length === 0) {
    return <EmptyState text="Không có nhân viên phù hợp." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr>
            <HeaderCell>Tài khoản</HeaderCell>
            <HeaderCell>Liên hệ</HeaderCell>
            <HeaderCell>Vai trò</HeaderCell>
            <HeaderCell>Địa chỉ</HeaderCell>
            <HeaderCell>Trạng thái</HeaderCell>
            <HeaderCell>Thao tác</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.userId}
              className="overflow-hidden rounded-2xl bg-[#FAFBFD]"
            >
              <BodyCell>
                <div className="font-semibold text-[#2F3A67]">
                  {item.fullName || "--"}
                </div>
                <div className="mt-1 text-xs text-[#8DA1C1]">
                  @{item.userName} • ID #{item.userId}
                </div>
              </BodyCell>
              <BodyCell>
                <div className="text-sm text-[#42526B]">
                  {item.email || "--"}
                </div>
                <div className="mt-1 text-xs text-[#8DA1C1]">
                  {item.phone || "--"}
                </div>
              </BodyCell>
              <BodyCell>
                <RolePill
                  label={item.roleName || roleMap[item.roleId] || "--"}
                />
              </BodyCell>
              <BodyCell>
                <div className="max-w-[260px] text-sm leading-6 text-[#42526B] line-clamp-2">
                  {item.address || "--"}
                </div>
              </BodyCell>
              <BodyCell>
                <StatusPill active={Number(item.status) === 1} />
              </BodyCell>
              <BodyCell>
                <ActionButtons
                  deleting={deletingKey === `user-${item.userId}`}
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item)}
                />
              </BodyCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupTable({ items, loading, deletingKey, onEdit, onDelete }) {
  if (loading) return <EmptyState text="Đang tải danh sách nhóm..." />;
  if (items.length === 0)
    return <EmptyState text="Không có nhóm nhân viên phù hợp." />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr>
            <HeaderCell>Tên nhóm</HeaderCell>
            <HeaderCell>Group leader</HeaderCell>
            <HeaderCell>Trạng thái</HeaderCell>
            <HeaderCell>Thao tác</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.staffGroupId}
              className="overflow-hidden rounded-2xl bg-[#FAFBFD]"
            >
              <BodyCell>
                <div className="font-semibold text-[#2F3A67]">
                  {item.staffGroupName}
                </div>
                <div className="mt-1 text-xs text-[#8DA1C1]">
                  Nhóm #{item.staffGroupId}
                </div>
              </BodyCell>
              <BodyCell>
                <div className="inline-flex items-center gap-2 rounded-xl bg-[#FFF8E8] px-3 py-2 text-sm font-medium text-[#A16207]">
                  <Crown className="h-4 w-4" />
                  {item.leaderName || "--"}
                </div>
              </BodyCell>
              <BodyCell>
                <StatusPill active={Number(item.status) === 1} />
              </BodyCell>
              <BodyCell>
                <ActionButtons
                  deleting={deletingKey === `group-${item.staffGroupId}`}
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item)}
                />
              </BodyCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MemberTable({ items, loading, deletingKey, onEdit, onDelete }) {
  if (loading)
    return <EmptyState text="Đang tải danh sách phân công nhóm..." />;
  if (items.length === 0)
    return <EmptyState text="Không có dữ liệu phân công nhóm." />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr>
            <HeaderCell>Nhân viên</HeaderCell>
            <HeaderCell>Nhóm</HeaderCell>
            <HeaderCell>Trạng thái</HeaderCell>
            <HeaderCell>Thao tác</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.staffGroupMemberId}
              className="overflow-hidden rounded-2xl bg-[#FAFBFD]"
            >
              <BodyCell>
                <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-[#EEF2F7] text-sm font-medium text-[#2F3A67]">
                  <UserRound className="h-4 w-4" />
                  {item.staffName || "--"}
                </div>
              </BodyCell>
              <BodyCell>
                <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-[#EEF2F7] text-sm font-medium text-[#2F3A67]">
                  <FolderKanban className="h-4 w-4" />
                  {item.staffGroupName || "--"}
                </div>
              </BodyCell>
              <BodyCell>
                <StatusPill active={Number(item.status) === 1} />
              </BodyCell>
              <BodyCell>
                <ActionButtons
                  deleting={deletingKey === `member-${item.staffGroupMemberId}`}
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item)}
                />
              </BodyCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModalShell({ title, description, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-[#2F3A67]">{title}</h3>
            <p className="mt-1 text-sm text-[#8DA1C1]">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F7FB] text-[#6B7280] hover:bg-[#EEF2F7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ submitting, submitLabel, onCancel }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
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
        {submitting ? "Đang xử lý..." : submitLabel}
      </button>
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

function HeaderCell({ children }) {
  return (
    <th className="px-4 text-left text-xs font-semibold uppercase tracking-wide text-[#8DA1C1]">
      {children}
    </th>
  );
}

function BodyCell({ children }) {
  return <td className="px-4 py-4 align-middle">{children}</td>;
}

function RolePill({ label }) {
  const colorMap = {
    ADMIN: "bg-[#FDE68A] text-[#92400E]",
    GROUP_LEADER: "bg-[#FCE7F3] text-[#9D174D]",
    STAFF: "bg-[#DBEAFE] text-[#1D4ED8]",
    USER: "bg-[#E5E7EB] text-[#374151]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colorMap[label] || "bg-[#F3F4F6] text-[#374151]"}`}
    >
      {label}
    </span>
  );
}

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F3F4F6] text-[#6B7280]"}`}
    >
      {active ? "Đang hoạt động" : "Ngừng hoạt động"}
    </span>
  );
}

function ActionButtons({ deleting, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-3 py-2 text-sm font-medium text-[#2F3A67] hover:bg-[#F7F9FC]"
      >
        <Pencil className="h-4 w-4" />
        Sửa
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="inline-flex items-center gap-2 rounded-xl border border-[#F6D7D7] bg-white px-3 py-2 text-sm font-medium text-[#C24141] hover:bg-[#FFF5F5] disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
        {deleting ? "Đang xóa..." : "Xóa"}
      </button>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl bg-[#FAFBFD] p-6 text-sm text-gray-500">
      {text}
    </div>
  );
}

function resolveRoleId(user, roles) {
  if (user.roleId) return user.roleId;
  const matchedRole = roles.find((item) => item.roleName === user.roleName);
  return matchedRole?.roleId || null;
}

const inputClass =
  "w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none focus:border-[#7CA3FF]";
