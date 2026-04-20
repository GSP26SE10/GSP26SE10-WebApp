import React from "react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import API_URL from "@/config/api";
import cities from "@/assets/city.json";
import {
  Users,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Search,
  FolderKanban,
  Crown,
  UserRound,
} from "lucide-react";

const EMPTY_USER_FORM = {
  UserName: "",
  Password: "",
  FullName: "",
  Email: "",
  Address: "",
  StreetAddress: "",
  CityCode: "",
  WardCode: "",
  Phone: "",
  RoleId: "",
  AvatarFile: null,
  CurrentAvatarUrl: null,
  removeAvatar: false,
};

const EMPTY_GROUP_FORM = {
  staffGroupName: "",
  leaderId: "",
  memberIds: [],
};

const TAB_ITEMS = [
  { key: "staff", label: "Nhân viên", icon: <Users className="h-4 w-4" /> },
  {
    key: "customers",
    label: "Khách hàng",
    icon: <UserRound className="h-4 w-4" />,
  },
  {
    key: "groups",
    label: "Nhóm nhân viên",
    icon: <FolderKanban className="h-4 w-4" />,
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

  const [userModalMode, setUserModalMode] = React.useState("create");
  const [groupModalMode, setGroupModalMode] = React.useState("create");

  const [editingUserId, setEditingUserId] = React.useState(null);
  const [editingGroupId, setEditingGroupId] = React.useState(null);
  const [originalGroupData, setOriginalGroupData] = React.useState(null);

  const [userForm, setUserForm] = React.useState(EMPTY_USER_FORM);
  const [groupForm, setGroupForm] = React.useState(EMPTY_GROUP_FORM);

  const [submittingUser, setSubmittingUser] = React.useState(false);
  const [submittingGroup, setSubmittingGroup] = React.useState(false);
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

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải danh sách người dùng");
      }

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

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải danh sách vai trò");
      }

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

      if (!res.ok) {
        throw new Error(data?.message || "Không thể tải danh sách nhóm");
      }

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

      if (!res.ok) {
        throw new Error(
          data?.message || "Không thể tải danh sách phân công nhóm",
        );
      }

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

  const employeeUsers = React.useMemo(() => {
    return users.filter((item) =>
      ["GROUP_LEADER", "STAFF"].includes(
        String(item.roleName || roleMap[item.roleId] || "").toUpperCase(),
      ),
    );
  }, [users, roleMap]);

  const customerUsers = React.useMemo(() => {
    return users.filter(
      (item) =>
        String(item.roleName || roleMap[item.roleId] || "").toUpperCase() ===
        "USER",
    );
  }, [users, roleMap]);

  const leaderCandidates = React.useMemo(
    () =>
      users.filter(
        (item) =>
          String(item.roleName || roleMap[item.roleId] || "").toUpperCase() ===
          "GROUP_LEADER",
      ),
    [users, roleMap],
  );

  const staffCandidates = React.useMemo(
    () =>
      users.filter(
        (item) =>
          String(item.roleName || roleMap[item.roleId] || "").toUpperCase() ===
          "STAFF",
      ),
    [users, roleMap],
  );

  const filteredEmployees = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return employeeUsers;

    return employeeUsers.filter((item) => {
      return (
        String(item.userId).includes(keyword) ||
        String(item.userName || item.userName || "")
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
  }, [employeeUsers, search]);

  const filteredCustomers = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return customerUsers;

    return customerUsers.filter((item) => {
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
          .includes(keyword)
      );
    });
  }, [customerUsers, search]);

  const filteredGroups = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const groupsWithMemberCount = groups.map((group) => ({
      ...group,
      memberCount: members.filter(
        (m) => Number(m.staffGroupId) === Number(group.staffGroupId),
      ).length,
    }));

    if (!keyword) return groupsWithMemberCount;

    return groupsWithMemberCount.filter((item) => {
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
  }, [groups, members, search]);

  const stats = React.useMemo(
    () => [
      {
        title: "Nhân viên",
        value: employeeUsers.length,
        icon: <Users className="h-5 w-5" />,
        bg: "bg-blue-100",
        text: "text-blue-600",
      },
      {
        title: "Khách hàng",
        value: customerUsers.length,
        icon: <UserRound className="h-5 w-5" />,
        bg: "bg-purple-100",
        text: "text-purple-600",
      },
      {
        title: "Nhóm nhân viên",
        value: groups.length,
        icon: <FolderKanban className="h-5 w-5" />,
        bg: "bg-emerald-100",
        text: "text-emerald-600",
      },
    ],
    [employeeUsers, customerUsers, groups],
  );

  const selectedCity = React.useMemo(
    () =>
      cities.find((item) => String(item.code) === String(userForm.CityCode)),
    [userForm.CityCode],
  );

  const wardOptions = React.useMemo(
    () => selectedCity?.wards || [],
    [selectedCity],
  );

  const previewAddress = React.useMemo(
    () =>
      buildFullAddress(
        userForm.StreetAddress,
        userForm.CityCode,
        userForm.WardCode,
      ),
    [userForm.StreetAddress, userForm.CityCode, userForm.WardCode],
  );

  const resetUserForm = () => {
    setUserForm(EMPTY_USER_FORM);
    setEditingUserId(null);
  };

  const resetGroupForm = () => {
    setGroupForm(EMPTY_GROUP_FORM);
    setEditingGroupId(null);
    setOriginalGroupData(null);
  };

  const openCreateUserModal = () => {
    setUserModalMode("create");
    resetUserForm();
    setUserModalOpen(true);
  };

  const openEditUserModal = (item) => {
    const parsedAddress = parseAddressToForm(item.address || "");

    setUserModalMode("edit");
    setEditingUserId(item.userId);
    setUserForm({
      UserName: item.userName || "",
      Password: "",
      FullName: item.fullName || "",
      Email: item.email || "",
      Address: item.address || "",
      StreetAddress: parsedAddress.StreetAddress,
      CityCode: parsedAddress.CityCode,
      WardCode: parsedAddress.WardCode,
      Phone: item.phone || "",
      RoleId: String(resolveRoleId(item, roles) || ""),
      AvatarFile: null,
      CurrentAvatarUrl: item.avatar || item.avatarUrl || null,
      removeAvatar: false,
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

    const groupMembers = members
      .filter((m) => Number(m.staffGroupId) === Number(item.staffGroupId))
      .map((m) => String(m.staffId));

    const groupData = {
      staffGroupName: item.staffGroupName || "",
      leaderId: String(item.leaderId || ""),
      memberIds: groupMembers,
    };

    setGroupForm(groupData);
    setOriginalGroupData(groupData);
    setGroupModalOpen(true);
  };

  const closeUserModal = () => {
    setUserModalOpen(false);
    resetUserForm();
  };

  const closeGroupModal = () => {
    setGroupModalOpen(false);
    resetGroupForm();
  };

  const validateUserForm = () => {
    if (!userForm.UserName.trim()) return "Vui lòng nhập username.";
    if (userModalMode === "create" && !userForm.Password.trim()) {
      return "Vui lòng nhập mật khẩu.";
    }
    if (!userForm.FullName.trim()) return "Vui lòng nhập họ tên.";
    if (!userForm.Email.trim()) return "Vui lòng nhập email.";
    if (!userForm.StreetAddress.trim())
      return "Vui lòng nhập số nhà, tên đường.";
    if (!userForm.CityCode) return "Vui lòng chọn tỉnh/thành.";
    if (!userForm.WardCode) return "Vui lòng chọn phường/xã.";
    if (!userForm.Phone.trim()) return "Vui lòng nhập số điện thoại.";
    if (!userForm.RoleId) return "Vui lòng chọn vai trò.";
    return "";
  };

  const validateGroupForm = () => {
    if (!groupForm.staffGroupName.trim()) return "Vui lòng nhập tên nhóm.";
    if (!groupForm.leaderId) return "Vui lòng chọn group leader.";
    return "";
  };

  const buildUserFormData = () => {
    const formData = new FormData();

    const fullAddress = buildFullAddress(
      userForm.StreetAddress,
      userForm.CityCode,
      userForm.WardCode,
    );

    formData.append("UserName", userForm.UserName.trim());
    if (userForm.Password.trim()) {
      formData.append("Password", userForm.Password.trim());
    }
    formData.append("FullName", userForm.FullName.trim());
    formData.append("Email", userForm.Email.trim());
    formData.append("Address", fullAddress);
    formData.append("Phone", userForm.Phone.trim());
    formData.append("RoleId", String(Number(userForm.RoleId)));

    if (userForm.AvatarFile instanceof File) {
      formData.append("AvatarFile", userForm.AvatarFile);
    }

    if (userForm.removeAvatar) {
      formData.append("RemoveAvatar", "true");
    }

    return formData;
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

      const formData = buildUserFormData();

      const res = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message ||
            (userModalMode === "create"
              ? "Tạo nhân viên thất bại"
              : "Cập nhật tài khoản thất bại"),
        );
      }

      toast.success(
        userModalMode === "create"
          ? "Tạo tài khoản thành công"
          : "Cập nhật tài khoản thành công",
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
      const isLeaderChanged =
        groupModalMode === "create" ||
        originalGroupData?.leaderId !== groupForm.leaderId;

      let groupId = Number(editingGroupId);

      if (groupModalMode === "create" || isLeaderChanged) {
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

        if (groupModalMode === "create") {
          groupId = Number(data?.staffGroupId || data?.item?.staffGroupId || 0);
          toast.success("Tạo nhóm nhân viên thành công");
        } else {
          toast.success("Cập nhật nhóm nhân viên thành công");
        }
      } else {
        if (groupModalMode === "edit") {
          toast.success("Cập nhật nhóm nhân viên thành công");
        }
      }

      if (!groupId) {
        throw new Error("Không xác định được ID nhóm sau khi lưu");
      }

      const existingMembers = members.filter(
        (m) => Number(m.staffGroupId) === Number(groupId),
      );

      const selectedIds = Array.isArray(groupForm.memberIds)
        ? groupForm.memberIds.map((id) => Number(id))
        : [];

      const addIds = selectedIds.filter(
        (id) => !existingMembers.some((m) => Number(m.staffId) === id),
      );

      const removeMembers = existingMembers.filter(
        (m) => !selectedIds.includes(Number(m.staffId)),
      );

      await Promise.all(
        addIds.map((staffId) =>
          fetch(`${API_URL}/api/staff-group-member`, {
            method: "POST",
            headers: {
              ...authHeaders,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              staffGroupId: Number(groupId),
              staffId: Number(staffId),
            }),
          }),
        ),
      );

      await Promise.all(
        removeMembers.map((item) =>
          fetch(
            `${API_URL}/api/staff-group-member/${item.staffGroupMemberId}`,
            {
              method: "DELETE",
              headers: authHeaders,
            },
          ),
        ),
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

  const handleToggleUserStatus = async (item) => {
    const isActive = Number(item.status) === 1;
    const confirmed = window.confirm(
      `Bạn có chắc muốn ${isActive ? "khóa" : "mở khóa"} tài khoản ${item.userName} không?`,
    );
    if (!confirmed) return;

    setDeletingKey(`user-${item.userId}`);

    try {
      const res = await fetch(`${API_URL}/api/user/${item.userId}`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: isActive ? 0 : 1,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message || "Cập nhật trạng thái người dùng thất bại",
        );
      }

      toast.success(
        isActive ? "Người dùng đã bị khóa" : "Người dùng đã được mở khóa",
      );

      await fetchUsers();
    } catch (err) {
      toast.error(err.message || "Cập nhật trạng thái người dùng thất bại");
    } finally {
      setDeletingKey("");
    }
  };

  const handleDelete = async ({ type, id, name }) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa "${name}" không?`);
    if (!confirmed) return;

    setDeletingKey(`${type}-${id}`);

    try {
      const endpointMap = {
        user: `${API_URL}/api/user/${id}`,
        group: `${API_URL}/api/staff-group/${id}`,
      };

      const res = await fetch(endpointMap[type], {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Xóa thất bại");
      }

      toast.success("Xóa thành công");

      if (type === "user") {
        await fetchUsers();
      }

      if (type === "group") {
        await fetchGroups();
        await fetchMembers();
      }
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
        className={`min-h-screen transition-[margin] duration-300 ease-in-out ${
          sbExpanded ? "ml-72" : "ml-20"
        }`}
      >
        <Topbar
          breadcrumb={
            <>
              <span className="text-gray-400">QUẢN LÝ</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-[#2F3A67] font-bold">NHÂN SỰ</span>
            </>
          }
          showSearch
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm "
        />

        <main className="px-7 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
              Quản lý nhân viên, khách hàng và nhóm
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              {activeTab === "staff" ? (
                <button
                  type="button"
                  onClick={openCreateUserModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2F3A67] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  <UserPlus className="h-4 w-4" />
                  Tạo nhân viên
                </button>
              ) : null}

              {activeTab === "groups" ? (
                <button
                  type="button"
                  onClick={openCreateGroupModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Tạo nhóm
                </button>
              ) : null}
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
                    : activeTab === "customers"
                      ? "Danh sách khách hàng"
                      : "Danh sách nhóm nhân viên"}
                </h2>
                <div className="mt-1 text-sm text-[#8DA1C1]">
                  {activeTab === "staff"
                    ? "Quản lý tài khoản group leader và staff."
                    : activeTab === "customers"
                      ? "Theo dõi và quản lý danh sách khách hàng trong hệ thống."
                      : "Tạo nhóm nhân viên và phân công group leader quản lý nhóm."}
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-4 py-2 text-sm font-medium text-[#8DA1C1]">
                <Search className="h-4 w-4" />
                {search ? `Kết quả cho “${search}”` : "Tất cả dữ liệu"}
              </div>
            </div>

            {activeTab === "staff" ? (
              <UserTable
                items={filteredEmployees}
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
                onToggleStatus={handleToggleUserStatus}
              />
            ) : null}

            {activeTab === "customers" ? (
              <CustomerTable
                items={filteredCustomers}
                loading={loadingUsers}
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
                onToggleStatus={handleToggleUserStatus}
              />
            ) : null}

            {activeTab === "groups" ? (
              <GroupTable
                items={filteredGroups}
                loading={loadingGroups || loadingMembers}
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
          </div>
        </main>
      </div>

      {userModalOpen ? (
        <ModalShell
          title={
            userModalMode === "create" ? "Tạo nhân viên" : "Cập nhật tài khoản"
          }
          onClose={closeUserModal}
        >
          <form onSubmit={handleSubmitUser} className="space-y-5">
            <FormField label="Ảnh đại diện">
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setUserForm((prev) => ({
                        ...prev,
                        AvatarFile: file,
                        removeAvatar: false,
                      }));
                    }}
                    className="hidden"
                    id="avatarFileInput"
                  />
                  <label
                    htmlFor="avatarFileInput"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm font-medium text-[#2F3A67] cursor-pointer hover:bg-[#F7F9FC]"
                  >
                    {userForm.AvatarFile
                      ? `✓ ${userForm.AvatarFile.name}`
                      : "Chọn ảnh"}
                  </label>
                </div>
                <div className="flex flex-col items-center">
                  {userForm.AvatarFile ? (
                    <div className="rounded-xl border border-[#DCE6F7] bg-[#F7F9FC] p-6">
                      <p className="mb-4 text-xs font-medium text-center text-[#2F3A67]">
                        Xem trước ảnh mới:
                      </p>
                      <img
                        src={URL.createObjectURL(userForm.AvatarFile)}
                        alt="Preview"
                        className="w-32 h-32 rounded-full border-4 border-[#2F3A67] object-cover"
                      />
                    </div>
                  ) : userForm.CurrentAvatarUrl ? (
                    <div className="relative rounded-xl border border-[#DCE6F7] bg-[#F7F9FC] p-6">
                      <button
                        type="button"
                        onClick={() =>
                          setUserForm((prev) => ({
                            ...prev,
                            AvatarFile: null,
                            CurrentAvatarUrl: null,
                            removeAvatar: true,
                          }))
                        }
                        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F87171] text-white hover:bg-[#EF4444]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="mb-4 text-xs font-medium text-center text-[#2F3A67]">
                        Ảnh hiện tại:
                      </p>
                      <img
                        src={
                          userForm.CurrentAvatarUrl.startsWith("http")
                            ? userForm.CurrentAvatarUrl
                            : `${API_URL}${userForm.CurrentAvatarUrl}`
                        }
                        alt="Current Avatar"
                        className="w-32 h-32 rounded-full border-4 border-[#8DA1C1] object-cover"
                      />
                    </div>
                  ) : null}
                </div>
                <p className="text-xs text-[#8DA1C1] text-center">
                  Để trống nếu không muốn chọn ảnh.
                </p>
              </div>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="UserName" required>
                <input
                  type="text"
                  value={userForm.UserName}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      UserName: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="staff01"
                />
              </FormField>

              <FormField
                label={userModalMode === "create" ? "Password" : "Password mới"}
                required={userModalMode === "create"}
              >
                <input
                  type="password"
                  value={userForm.Password}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      Password: e.target.value,
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
              <FormField label="FullName" required>
                <input
                  type="text"
                  value={userForm.FullName}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      FullName: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="Nguyen Van A"
                />
              </FormField>

              <FormField label="Email" required>
                <input
                  type="email"
                  value={userForm.Email}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      Email: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="staff@buffet.vn"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Phone" required>
                <input
                  type="text"
                  value={userForm.Phone}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      Phone: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="0908854016"
                />
              </FormField>

              <FormField label="RoleId" required>
                <select
                  value={userForm.RoleId}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      RoleId: e.target.value,
                    }))
                  }
                  className={inputClass}
                  disabled={
                    userModalMode === "edit" &&
                    String(roleMap[userForm.RoleId] || "").toUpperCase() ===
                      "USER"
                  }
                >
                  <option value="">Chọn vai trò</option>
                  {roles
                    .filter((item) =>
                      ["GROUP_LEADER", "STAFF"].includes(
                        String(item.roleName || "").toUpperCase(),
                      ),
                    )
                    .map((item) => (
                      <option key={item.roleId} value={item.roleId}>
                        {item.roleName}
                      </option>
                    ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <FormField label="Số nhà, tên đường" required>
                <input
                  type="text"
                  value={userForm.StreetAddress}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      StreetAddress: e.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="123 Nguyễn Trãi"
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Tỉnh / Thành" required>
                  <select
                    value={userForm.CityCode}
                    onChange={(e) =>
                      setUserForm((prev) => ({
                        ...prev,
                        CityCode: e.target.value,
                        WardCode: "",
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Chọn tỉnh / thành</option>
                    {cities.map((city) => (
                      <option key={city.code} value={city.code}>
                        {city.fullName || city.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Phường / Xã" required>
                  <select
                    value={userForm.WardCode}
                    onChange={(e) =>
                      setUserForm((prev) => ({
                        ...prev,
                        WardCode: e.target.value,
                      }))
                    }
                    className={inputClass}
                    disabled={!userForm.CityCode}
                  >
                    <option value="">Chọn phường / xã</option>
                    {wardOptions.map((ward) => (
                      <option key={ward.code} value={ward.code}>
                        {ward.fullName || ward.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="rounded-xl border border-[#DCE6F7] bg-[#F7F9FC] px-4 py-3">
                <div className="text-xs font-medium text-[#8DA1C1]">
                  Địa chỉ hoàn chỉnh
                </div>
                <div className="mt-1 text-sm text-[#2F3A67]">
                  {previewAddress || "Chưa chọn đầy đủ địa chỉ"}
                </div>
              </div>
            </div>

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
          description="Chọn group leader và các staff thuộc nhóm."
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

            <FormField label="Thành viên nhóm">
              <div className="space-y-2 max-h-64 overflow-y-auto border border-[#DCE6F7] rounded-xl p-4 bg-white">
                {staffCandidates.length === 0 ? (
                  <p className="text-sm text-[#8DA1C1]">
                    Không có nhân viên khả dụng.
                  </p>
                ) : (
                  staffCandidates.map((item) => {
                    const isSelected = groupForm.memberIds.includes(
                      String(item.userId),
                    );
                    return (
                      <label
                        key={item.userId}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F7F9FC] cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGroupForm((prev) => ({
                                ...prev,
                                memberIds: [
                                  ...prev.memberIds,
                                  String(item.userId),
                                ],
                              }));
                            } else {
                              setGroupForm((prev) => ({
                                ...prev,
                                memberIds: prev.memberIds.filter(
                                  (id) => id !== String(item.userId),
                                ),
                              }));
                            }
                          }}
                          className="w-4 h-4 rounded border-[#DCE6F7] accent-[#2F3A67]"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#2F3A67]">
                            {item.fullName}
                          </div>
                          <div className="text-xs text-[#8DA1C1]">
                            {item.email}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              {groupForm.memberIds.length > 0 && (
                <div className="mt-4 p-4 bg-[#F7F9FC] rounded-xl border border-[#DCE6F7]">
                  <div className="text-sm font-medium text-[#2F3A67] mb-2">
                    Đã chọn ({groupForm.memberIds.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupForm.memberIds.map((memberId) => {
                      const member = staffCandidates.find(
                        (u) => String(u.userId) === String(memberId),
                      );
                      return member ? (
                        <span
                          key={memberId}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#2F3A67] px-3 py-1 text-xs font-medium text-white"
                        >
                          {member.fullName}
                          <button
                            type="button"
                            onClick={() => {
                              setGroupForm((prev) => ({
                                ...prev,
                                memberIds: prev.memberIds.filter(
                                  (id) => id !== memberId,
                                ),
                              }));
                            }}
                            className="hover:opacity-70"
                          >
                            ✕
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
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
    </div>
  );
}

function UserTable({
  items,
  loading,
  roleMap,
  deletingKey,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
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
                  {item.userName || "--"}
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
                  onToggleStatus={onToggleStatus}
                  item={item}
                />
              </BodyCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerTable({
  items,
  loading,
  deletingKey,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  if (loading) {
    return <EmptyState text="Đang tải danh sách khách hàng..." />;
  }

  if (items.length === 0) {
    return <EmptyState text="Không có khách hàng phù hợp." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr>
            <HeaderCell>Khách hàng</HeaderCell>
            <HeaderCell>Liên hệ</HeaderCell>
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
                  {item.userName || "--"}
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
                  onToggleStatus={onToggleStatus}
                  item={item}
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
  if (loading) {
    return <EmptyState text="Đang tải danh sách nhóm..." />;
  }

  if (items.length === 0) {
    return <EmptyState text="Không có nhóm nhân viên phù hợp." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr>
            <HeaderCell>Tên nhóm</HeaderCell>
            <HeaderCell>Group leader</HeaderCell>
            <HeaderCell>Thành viên</HeaderCell>
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
                  {item.staffGroupName || "--"}
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
                <div className="text-sm text-[#42526B]">
                  {item.memberCount || 0} nhân viên
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

function ModalShell({ title, description, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 ">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#EEF2F7] px-6 py-5">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 hide-scrollbar">
          {children}
        </div>
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        colorMap[label] || "bg-[#F3F4F6] text-[#374151]"
      }`}
    >
      {label}
    </span>
  );
}

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F3F4F6] text-[#6B7280]"
      }`}
    >
      {active ? "Đang hoạt động" : "Ngừng hoạt động"}
    </span>
  );
}

function ActionButtons({ deleting, onEdit, onDelete, onToggleStatus, item }) {
  return (
    <div className="flex items-center gap-2">
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D6DFEF] bg-white px-3 py-2 text-sm font-medium text-[#2F3A67] hover:bg-[#F7F9FC]"
        >
          <Pencil className="h-4 w-4" />
          Sửa
        </button>
      ) : null}

      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="inline-flex items-center gap-2 rounded-xl border border-[#F6D7D7] bg-white px-3 py-2 text-sm font-medium text-[#C24141] hover:bg-[#FFF5F5] disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
        {deleting ? "Đang xóa..." : "Xóa"}
      </button>

      {onToggleStatus && item ? (
        <button
          type="button"
          onClick={() => onToggleStatus(item)}
          className="inline-flex items-center justify-center rounded-xl border border-[#D6DFEF] bg-white px-3 py-2 text-sm font-medium text-[#1F3A67] hover:bg-[#F7F9FC]"
        >
          {Number(item.status) === 1 ? "Khóa" : "Mở khóa"}
        </button>
      ) : null}
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

const fileInputClass =
  "w-full rounded-xl border border-[#DCE6F7] bg-white px-4 py-3 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[#EEF2FF] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#2F3A67]";
function buildFullAddress(streetAddress, cityCode, wardCode) {
  const city = cities.find((item) => String(item.code) === String(cityCode));
  const ward = city?.wards?.find(
    (item) => String(item.code) === String(wardCode),
  );

  return [streetAddress?.trim(), ward?.name, city?.name]
    .filter(Boolean)
    .join(", ");
}

function parseAddressToForm(address) {
  const raw = String(address || "").trim();
  if (!raw) {
    return {
      StreetAddress: "",
      CityCode: "",
      WardCode: "",
      Address: "",
    };
  }

  const matchedCity = cities.find((city) =>
    raw.toLowerCase().includes(String(city.name || "").toLowerCase()),
  );

  const matchedWard = matchedCity?.wards?.find((ward) =>
    raw.toLowerCase().includes(String(ward.name || "").toLowerCase()),
  );

  let streetAddress = raw;

  if (matchedWard?.name) {
    streetAddress = streetAddress.replace(
      new RegExp(matchedWard.name, "i"),
      "",
    );
  }

  if (matchedCity?.name) {
    streetAddress = streetAddress.replace(
      new RegExp(matchedCity.name, "i"),
      "",
    );
  }

  streetAddress = streetAddress
    .replace(/,\s*,/g, ",")
    .replace(/^,\s*|\s*,$/g, "")
    .trim();

  return {
    StreetAddress: streetAddress,
    CityCode: matchedCity?.code ? String(matchedCity.code) : "",
    WardCode: matchedWard?.code ? String(matchedWard.code) : "",
    Address: raw,
  };
}
