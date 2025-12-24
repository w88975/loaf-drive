/**
 * PreviewModal.tsx
 */

import React, { useState } from "react";
import { Icons } from "../../constants";
import { DriveItem } from "../../types";
import { formatSize, formatDate } from "../../utils";
import { PreviewContent } from "../preview/PreviewContent";
import { ShareModal, ShareResultModal } from "./Modals";
import { useCreateShare } from "../../hooks/useDriveQueries";
import { MessageBox, useMessageBox } from "./MessageBox";

interface PreviewModalProps {
  item: DriveItem;
  onClose: () => void;
  isReadOnly?: boolean;
  onDownload?: (fileId: string, filename: string) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  item,
  onClose,
  isReadOnly = false,
  onDownload,
}) => {
  const [showShare, setShowShare] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const createShare = useCreateShare();
  const messageBox = useMessageBox();

  const handleDownload = () => {
    if (onDownload) {
      onDownload(item.id, item.name);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white border-4 border-black w-full max-w-5xl h-[90vh] flex flex-col shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b-2 border-black flex items-center justify-between bg-yellow-400">
          <h2 className="font-bold uppercase tracking-tight truncate flex-1 mr-4 italic text-sm md:text-base">
            {item.name}
          </h2>
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* 复制链接 */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(item.url);
                messageBox.success("Link copied to clipboard", 1000);
              }}
              className="p-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-colors"
              title="COPY LINK"
            >
              <Icons.Copy className="w-5 h-5" />
            </button>
            {!isReadOnly && (
              <button
                onClick={() => setShowShare(true)}
                className="p-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-colors"
                title="SHARE"
              >
                <Icons.Share className="w-5 h-5" />
              </button>
            )}
            {onDownload ? (
              <button
                onClick={handleDownload}
                className="p-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-colors"
              >
                <Icons.Download className="w-5 h-5" />
              </button>
            ) : (
              <a
                href={item.url}
                download
                className="p-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-colors"
              >
                <Icons.Download className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-black text-white hover:bg-red-500 border-2 border-black transition-colors"
            >
              <Icons.Close className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative bg-gray-100">
          <PreviewContent item={item} />
        </div>

        <div className="p-3 border-t-2 border-black text-[9px] font-bold uppercase grid grid-cols-3 bg-white">
          <div>
            <span className="text-gray-400">SIZE:</span>{" "}
            {formatSize(item.size || 0)}
          </div>
          <div className="text-center">
            <span className="text-gray-400">TYPE:</span>{" "}
            {item.extension?.toUpperCase() || "FILE"}
          </div>
          <div className="text-right">
            <span className="text-gray-400">MODIFIED:</span>{" "}
            {formatDate(item.modifiedAt)}
          </div>
        </div>
      </div>
      {!isReadOnly && showShare && (
        <ShareModal
          item={item}
          onClose={() => setShowShare(false)}
          onConfirm={(data) =>
            createShare.mutate(data, {
              onSuccess: (res) => {
                setShareCode(res.data.code);
                setShowShare(false);
              },
            })
          }
        />
      )}
      {!isReadOnly && shareCode && (
        <ShareResultModal code={shareCode} onClose={() => setShareCode(null)} />
      )}
      {/* 消息提示 */}
      <MessageBox
        messages={messageBox.messages}
        onClose={messageBox.closeMessage}
      />
    </div>
  );
};
