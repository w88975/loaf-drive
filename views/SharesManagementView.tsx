/**
 * SharesManagementView.tsx
 *
 * 【分享管理视图】
 *
 * 功能：管理所有创建的分享链接
 * 核心特性：
 * 1. 查看所有分享 - 显示分享列表和详细信息
 * 2. 编辑分享 - 修改密码、过期时间、访问次数限制
 * 3. 取消分享 - 删除分享链接
 * 4. 复制链接 - 快速复制分享URL
 * 5. 分页加载 - 支持大量分享的分页展示
 */

import React, { useState } from "react";
import { Icons } from "../constants";
import { useAllShares, useShareMutations } from "../hooks/useDriveQueries";
import { DeleteModal } from "../components/overlays/Modals";
import { CONFIG } from "../config";

interface SharesManagementViewProps {
  searchQuery: string;
}

interface EditShareModalProps {
  share: any;
  onClose: () => void;
  onConfirm: (data: {
    password?: string | null;
    expiresAt?: string | null;
    maxViews?: number | null;
  }) => void;
}

const EditShareModal: React.FC<EditShareModalProps> = ({
  share,
  onClose,
  onConfirm,
}) => {
  const [password, setPassword] = useState(share.hasPassword ? "••••••" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [expiresAt, setExpiresAt] = useState(
    share.expiresAt
      ? new Date(share.expiresAt).toISOString().slice(0, 16)
      : ""
  );
  const [maxViews, setMaxViews] = useState(share.maxViews?.toString() || "");
  const [removePassword, setRemovePassword] = useState(false);
  const [removeExpiry, setRemoveExpiry] = useState(false);
  const [removeMaxViews, setRemoveMaxViews] = useState(false);

  const handleSubmit = () => {
    const data: any = {};

    // 密码处理
    if (removePassword) {
      data.password = null;
    } else if (passwordChanged && password && password !== "••••••") {
      data.password = password;
    }

    // 过期时间处理
    if (removeExpiry) {
      data.expiresAt = null;
    } else if (expiresAt) {
      data.expiresAt = new Date(expiresAt).toISOString();
    }

    // 访问次数处理
    if (removeMaxViews) {
      data.maxViews = null;
    } else if (maxViews) {
      data.maxViews = parseInt(maxViews, 10);
    }

    onConfirm(data);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white border-4 border-black w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-black bg-black text-yellow-400">
          <h2 className="text-lg font-bold uppercase italic">Edit Share</h2>
          <p className="text-xs uppercase tracking-wider mt-1 text-white">
            Code: {share.code}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2">
              Password
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordChanged(true);
                    setRemovePassword(false);
                  }}
                  onFocus={() => {
                    if (password === "••••••") {
                      setPassword("");
                      setPasswordChanged(true);
                    }
                  }}
                  className="w-full border-2 border-black p-2 outline-none focus:bg-yellow-50 text-xs font-bold uppercase"
                  placeholder="Enter password..."
                  disabled={removePassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-yellow-600"
                  disabled={removePassword}
                >
                  {showPassword ? (
                    <Icons.EyeOff className="w-4 h-4" />
                  ) : (
                    <Icons.Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <button
                onClick={() => setRemovePassword(!removePassword)}
                className={`px-3 py-2 border-2 border-black text-xs font-bold uppercase transition-colors ${
                  removePassword
                    ? "bg-red-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
                title={removePassword ? "Keep password" : "Remove password"}
              >
                {removePassword ? <Icons.Check className="w-4 h-4" /> : <Icons.Close className="w-4 h-4" />}
              </button>
            </div>
            {removePassword && (
              <p className="text-[10px] text-red-600 font-bold uppercase mt-1">
                Password will be removed
              </p>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2">
              Expires At
            </label>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => {
                  setExpiresAt(e.target.value);
                  setRemoveExpiry(false);
                }}
                className="flex-1 border-2 border-black p-2 outline-none focus:bg-yellow-50 text-xs font-bold uppercase"
                disabled={removeExpiry}
              />
              <button
                onClick={() => setRemoveExpiry(!removeExpiry)}
                className={`px-3 py-2 border-2 border-black text-xs font-bold uppercase transition-colors ${
                  removeExpiry
                    ? "bg-red-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
                title={removeExpiry ? "Keep expiry" : "Remove expiry"}
              >
                {removeExpiry ? <Icons.Check className="w-4 h-4" /> : <Icons.Close className="w-4 h-4" />}
              </button>
            </div>
            {removeExpiry && (
              <p className="text-[10px] text-red-600 font-bold uppercase mt-1">
                Expiry will be removed (never expires)
              </p>
            )}
          </div>

          {/* Max Views */}
          <div>
            <label className="block text-xs font-bold uppercase mb-2">
              Max Views
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={maxViews}
                onChange={(e) => {
                  setMaxViews(e.target.value);
                  setRemoveMaxViews(false);
                }}
                className="flex-1 border-2 border-black p-2 outline-none focus:bg-yellow-50 text-xs font-bold uppercase"
                placeholder="Unlimited"
                min="1"
                disabled={removeMaxViews}
              />
              <button
                onClick={() => setRemoveMaxViews(!removeMaxViews)}
                className={`px-3 py-2 border-2 border-black text-xs font-bold uppercase transition-colors ${
                  removeMaxViews
                    ? "bg-red-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
                title={removeMaxViews ? "Keep limit" : "Remove limit"}
              >
                {removeMaxViews ? <Icons.Check className="w-4 h-4" /> : <Icons.Close className="w-4 h-4" />}
              </button>
            </div>
            {removeMaxViews && (
              <p className="text-[10px] text-red-600 font-bold uppercase mt-1">
                View limit will be removed (unlimited)
              </p>
            )}
          </div>

          {/* Current Stats */}
          <div className="border-t-2 border-black pt-3">
            <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">
              Current Stats
            </p>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase">
              <span>Views: {share.views}</span>
              <span>•</span>
              <span>
                Created: {new Date(share.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-black flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-black p-2 font-bold uppercase hover:bg-gray-100 text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-black text-white p-2 font-bold uppercase hover:bg-yellow-400 hover:text-black border-2 border-black text-xs"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export const SharesManagementView: React.FC<SharesManagementViewProps> = ({
  searchQuery,
}) => {
  const [page, setPage] = useState(1);
  const [selectedShare, setSelectedShare] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<"delete" | "edit" | null>(
    null
  );

  const { data, isLoading } = useAllShares(page, 50);
  const { deleteShare, updateShare } = useShareMutations();

  const shares = data?.items || [];
  const pagination = data?.pagination;

  // 复制分享链接
  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/#/share/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Share link copied to clipboard!");
    });
  };

  // 删除分享确认
  const handleConfirmDelete = () => {
    if (!selectedShare) return;
    deleteShare.mutate(selectedShare.code, {
      onSuccess: () => {
        setSelectedShare(null);
        setActiveModal(null);
      },
    });
  };

  // 编辑分享确认
  const handleConfirmEdit = (data: any) => {
    if (!selectedShare) return;
    updateShare.mutate(
      { code: selectedShare.code, data },
      {
        onSuccess: () => {
          setSelectedShare(null);
          setActiveModal(null);
        },
      }
    );
  };

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 标题栏 */}
      <div className="p-4 md:p-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">
            Share Management
          </h1>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {shares.length} Share{shares.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* 分享列表 */}
      <div className="flex-1 overflow-auto px-4 md:px-6">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Icons.Grid className="w-8 h-8 animate-spin" />
          </div>
        ) : shares.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Icons.Archive className="w-16 h-16 opacity-10 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              {searchQuery ? "No shares found" : "No shares created yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            {shares.map((share: any) => (
              <div
                key={share.id}
                className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* 左侧：文件信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Icons.Folder className="w-5 h-5 flex-shrink-0" />
                      <h3 className="font-bold text-sm truncate">
                        {share.file?.filename || "Unknown File"}
                      </h3>
                      {share.hasPassword && (
                        <span className="px-2 py-0.5 bg-yellow-400 border border-black text-[10px] font-bold uppercase">
                          🔒
                        </span>
                      )}
                    </div>

                    {/* 分享码和统计 */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                      <span className="bg-gray-100 px-2 py-1 border border-gray-300">
                        {share.code}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Icons.Eye className="w-3 h-3" />
                        {share.views}
                        {share.maxViews ? `/${share.maxViews}` : "/∞"}
                      </span>
                      {share.expiresAt && (
                        <>
                          <span>•</span>
                          <span
                            className={`flex items-center gap-1 ${
                              new Date(share.expiresAt) < new Date()
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            <Icons.Alert className="w-3 h-3" />
                            {formatDate(share.expiresAt)}
                          </span>
                        </>
                      )}
                      {!share.expiresAt && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">Never Expires</span>
                        </>
                      )}
                    </div>

                    {/* 创建日期 */}
                    <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      Created: {formatDate(share.createdAt)}
                    </div>
                  </div>

                  {/* 右侧：操作按钮 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(share.code)}
                      className="p-2 border-2 border-black bg-white hover:bg-yellow-400 transition-colors"
                      title="Copy Link"
                    >
                      <Icons.Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedShare(share);
                        setActiveModal("edit");
                      }}
                      className="p-2 border-2 border-black bg-white hover:bg-blue-500 hover:text-white transition-colors"
                      title="Edit Share"
                    >
                      <Icons.Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedShare(share);
                        setActiveModal("delete");
                      }}
                      className="p-2 border-2 border-black bg-white hover:bg-red-500 hover:text-white transition-colors"
                      title="Delete Share"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pb-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border-2 border-black font-bold uppercase text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 border-2 border-black font-bold text-xs bg-yellow-400">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="px-4 py-2 border-2 border-black font-bold uppercase text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* 编辑模态框 */}
      {activeModal === "edit" && selectedShare && (
        <EditShareModal
          share={selectedShare}
          onClose={() => {
            setActiveModal(null);
            setSelectedShare(null);
          }}
          onConfirm={handleConfirmEdit}
        />
      )}

      {/* 删除确认模态框 */}
      {activeModal === "delete" && selectedShare && (
        <DeleteModal
          title="Cancel Share?"
          count={1}
          isPermanent={false}
          onClose={() => {
            setActiveModal(null);
            setSelectedShare(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};
