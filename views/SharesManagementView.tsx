/**
 * SharesManagementView.tsx
 *
 * 【分享管理视图】
 *
 * 功能：管理所有创建的分享链接
 * 核心特性：
 * 1. 查看所有分享 - 显示分享列表和详细信息
 * 2. 取消分享 - 删除分享链接
 * 3. 复制链接 - 快速复制分享URL
 * 4. 分页加载 - 支持大量分享的分页展示
 */

import React, { useState } from "react";
import { Icons } from "../constants";
import { useAllShares, useShareMutations } from "../hooks/useDriveQueries";
import { DeleteModal } from "../components/overlays/Modals";
import { CONFIG } from "../config";

interface SharesManagementViewProps {
  searchQuery: string;
}

export const SharesManagementView: React.FC<SharesManagementViewProps> = ({
  searchQuery,
}) => {
  const [page, setPage] = useState(1);
  const [selectedShare, setSelectedShare] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<"delete" | null>(null);

  const { data, isLoading } = useAllShares(page, 50);
  const { deleteShare } = useShareMutations();

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
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                      <span>Code: {share.code}</span>
                      <span>•</span>
                      <span>
                        Views: {share.views}
                        {share.maxViews ? `/${share.maxViews}` : ""}
                      </span>
                      {share.expiresAt && (
                        <>
                          <span>•</span>
                          <span>Expires: {formatDate(share.expiresAt)}</span>
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
                      <Icons.Share className="w-4 h-4" />
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
