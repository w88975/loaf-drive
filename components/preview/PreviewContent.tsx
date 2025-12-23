
import React, { useState } from 'react';
import { DriveItem } from '../../types';
import { getFileCategory, FileCategory } from '../../utils';
import { ImageViewer } from './ImageViewer';
import { VideoViewer } from './VideoViewer';
import { AudioViewer } from './AudioViewer';
import { TextViewer } from './TextViewer';
import { UnsupportedViewer } from './UnsupportedViewer';

interface PreviewContentProps {
  item: DriveItem;
}

export const PreviewContent: React.FC<PreviewContentProps> = ({ item }) => {
  const [forcedCategory, setForcedCategory] = useState<FileCategory | null>(null);
  const category = forcedCategory || getFileCategory(item.extension);

  switch (category) {
    case 'image':
      return <ImageViewer item={item} />;
    case 'video':
      return <VideoViewer item={item} />;
    case 'audio':
      return <AudioViewer item={item} />;
    case 'text':
      return <TextViewer item={item} />;
    default:
      return <UnsupportedViewer item={item} onOpenAsText={() => setForcedCategory('text')} />;
  }
};
